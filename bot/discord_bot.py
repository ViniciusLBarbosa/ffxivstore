import os
import discord
from discord.ext import commands, tasks
from datetime import datetime, timedelta, timezone
from config import DISCORD_BOT_TOKEN, DISCORD_GUILD_ID, DISCORD_ADMIN_ROLE_ID, DISCORD_ADMIN_CHANNEL_ID
from firebase_service import setup_order_listener, get_pending_orders, update_order_status
from utils import format_order_message
import asyncio

# Configuração do bot
intents = discord.Intents.default()
intents.message_content = True
intents.members = True
intents.guilds = True  # Adiciona intent para acessar membros do servidor
intents.reactions = True  # Adiciona intent para reações

# Cria o bot com intents específicos
bot = commands.Bot(command_prefix='!', intents=intents)

# Desabilita o sistema de áudio
discord.VoiceClient.warn_nacl = False

# Cache para evitar duplicação de mensagens
processed_orders = set()

# Variável para armazenar o listener do Firestore
firestore_listener = None

# Emojis para reações
APPROVE_EMOJI = "✅"
REJECT_EMOJI = "❌"

# Cache para armazenar informações dos pedidos
order_messages = {}  # Mapeia message_id -> (order_data, user) - Para aprovação inicial do pedido
payment_confirmation_messages = {}  # Mapeia message_id -> (order_data, user, admin_message) - Para confirmação de pagamento
payment_verification_messages = {}  # Mapeia message_id -> (order_data, user, original_message) - Para verificação do pagamento pelos admins

# Armazena o momento em que o bot iniciou
bot_start_time = None

def format_payment_method(method):
    """Formata o método de pagamento para exibição"""
    payment_methods = {
        'credit': 'Cartão de Crédito',
        'boleto': 'Boleto',
        'pix': 'Pix'
    }
    return payment_methods.get(method.lower(), method)

def create_order_embed(order):
    """Cria um embed para o pedido"""
    # Define o símbolo da moeda baseado na currency do pedido
    currency = order.get('currency', 'BRL')
    currency_symbol = '$' if currency == 'USD' else 'R$'
    
    embed = discord.Embed(
        title="🎉 Novo Pedido Confirmado!",
        color=discord.Color.blue(),
        timestamp=order.get('createdAt', datetime.now(timezone.utc))
    )
    
    # Número do Pedido
    embed.add_field(
        name="📦 Número do Pedido:",
        value=f"#{order['id'][-6:]}",
        inline=False
    )
    
    # Detalhes do Pedido
    embed.add_field(
        name="Detalhes do Pedido:",
        value="",
        inline=False
    )
    
    # Items
    items_text = ""
    for item in order.get('items', []):
        items_text += f"🎯 {item.get('name', 'Item')}\n"
        items_text += f"• Quantidade: {item.get('quantity', 1)}x\n"
        # Formata o preço de acordo com a moeda
        item_price = item.get('price', 0)
        items_text += f"• Preço: {currency_symbol} {item_price:.2f}\n"
    
    embed.add_field(
        name="",
        value=items_text or "Nenhum item encontrado",
        inline=False
    )
    
    # Resumo do Pagamento
    payment = order.get('payment', {})
    payment_method = format_payment_method(payment.get('method', 'N/A'))
    payment_text = (
        "💰 Resumo do Pagamento:\n"
        f"• Método: {payment_method}\n"
        f"• Total: {currency_symbol} {order['total']:.2f}"
    )
    embed.add_field(
        name="",
        value=payment_text,
        inline=False
    )
    
    # Próximos Passos
    next_steps = (
        "📝 Próximos Passos:\n"
        "1. Em breve enviaremos as instruções de pagamento\n"
        "2. Após a confirmação do pagamento, iniciaremos seu pedido\n"
        "3. Mantenha seu Discord ativo para comunicação"
    )
    embed.add_field(
        name="",
        value=next_steps,
        inline=False
    )
    
    # Precisa de Ajuda
    help_text = (
        "❓ Precisa de Ajuda?\n"
        "Entre em contato conosco pelo Discord se tiver alguma dúvida!"
    )
    embed.add_field(
        name="",
        value=help_text,
        inline=False
    )
    
    return embed

async def find_discord_user(username):
    """Busca um usuário do Discord pelo nome global da conta"""
    try:
        # Busca todos os usuários visíveis pelo bot com esse nome
        matching_users = [user for user in bot.users if user.name.lower() == username.lower()]
        
        if matching_users:
            # Se encontrar mais de um, usa o primeiro
            return matching_users[0]
            
        # Se não encontrar, tenta buscar no servidor específico
        guild = bot.get_guild(DISCORD_GUILD_ID)
        if guild:
            for member in guild.members:
                if member.name.lower() == username.lower():
                    return member
        
        return None
    except Exception as e:
        print(f"Erro ao buscar usuário '{username}': {e}")
        return None

async def send_admin_notification(order, user=None):
    """Envia notificação para o canal de administração"""
    try:
        # Busca o canal de administração pelo ID
        admin_channel = bot.get_channel(DISCORD_ADMIN_CHANNEL_ID)
        if not admin_channel:
            print(f"Canal de administração não encontrado (ID: {DISCORD_ADMIN_CHANNEL_ID})")
            return

        # Define o símbolo da moeda para a notificação do admin
        currency = order.get('currency', 'BRL')
        currency_symbol = '$' if currency == 'USD' else 'R$'
        
        # Cria um embed mais detalhado para os administradores
        admin_embed = discord.Embed(
            title="🆕 Novo Pedido Recebido!",
            description="🔗 [Acessar Painel Admin](https://site-vendas-ffxiv.vercel.app/admin)",
            color=discord.Color.green(),
            timestamp=datetime.now(timezone.utc)
        )

        # Informações do Cliente
        discord_username = order.get('discordId') or order.get('discordUsername')
        user_email = order.get('userEmail', 'N/A')
        
        if user:
            client_info = f"Nome: {user.name}\nID: {discord_username}"
            admin_embed.color = discord.Color.green()
        else:
            client_info = (
                f"❌ Usuário do Discord não encontrado\n"
                f"ID/Username: {discord_username}\n"
                f"📧 Email: {user_email}"
            )
            admin_embed.color = discord.Color.red()
        
        admin_embed.add_field(
            name="👤 Cliente",
            value=client_info,
            inline=True
        )

        # Informações do Pedido
        admin_embed.add_field(
            name="📦 Pedido",
            value=f"#{order['id'][-6:]}",
            inline=True
        )

        # Informações de Pagamento
        payment = order.get('payment', {})
        payment_method = format_payment_method(payment.get('method', 'N/A'))
        admin_embed.add_field(
            name="💰 Pagamento",
            value=f"Método: {payment_method}\nTotal: {currency_symbol} {order['total']:.2f}",
            inline=True
        )

        # Lista de Itens
        items_text = ""
        for item in order.get('items', []):
            items_text += f"• {item.get('name', 'Item')} (x{item.get('quantity', 1)})\n"
        
        admin_embed.add_field(
            name="🛍️ Itens",
            value=items_text or "Nenhum item",
            inline=False
        )

        # Adiciona footer com timestamp e link
        admin_embed.set_footer(text="Pedido recebido em")
        
        # Menciona o cargo de admin se existir
        guild = bot.get_guild(DISCORD_GUILD_ID)
        mention_text = ""
        if guild:
            admin_role = guild.get_role(DISCORD_ADMIN_ROLE_ID)
            if admin_role:
                mention_text = admin_role.mention

        # Envia a mensagem no canal de administração
        message = await admin_channel.send(
            content=mention_text,
            embed=admin_embed
        )

        # Só adiciona reações se o usuário foi encontrado
        if user:
            await message.add_reaction(APPROVE_EMOJI)
            await message.add_reaction(REJECT_EMOJI)
            # Armazena as informações do pedido no cache
            order_messages[message.id] = (order, user)

        print(f"Notificação enviada para o canal de administração")

    except Exception as e:
        print(f"Erro ao enviar notificação para administradores: {e}")

async def handle_new_order(order):
    """Manipula novos pedidos recebidos do Firebase"""
    try:
        # Verifica se o pedido já foi processado
        if order['id'] in processed_orders:
            return

        # Verifica se o pedido é novo (criado após o início do bot)
        order_time = order.get('createdAt')
        if not order_time or order_time < bot_start_time:
            # Adiciona ao cache de processados e ignora
            processed_orders.add(order['id'])
            return
            
        # Tenta encontrar o usuário pelo nome do Discord
        user = None
        discord_username = order.get('discordId') or order.get('discordUsername')
        
        if discord_username:
            print(f"Buscando usuário: {discord_username}")
            user = await find_discord_user(discord_username)
            
            if not user:
                print(f"Usuário não encontrado: {discord_username}")
                # Tenta como ID numérico (compatibilidade)
                try:
                    user = await bot.fetch_user(int(discord_username))
                except (ValueError, discord.NotFound):
                    print(f"Usuário também não encontrado por ID: {discord_username}")
                    # Mesmo sem encontrar o usuário, notifica os administradores
                    await send_admin_notification(order)
                    processed_orders.add(order['id'])
                    return

            print(f"Usuário encontrado: {user.name} (ID: {user.id})")

        if user:
            try:
                # Cria e envia o embed do pedido para o usuário
                embed = create_order_embed(order)
                await user.send(embed=embed)
                print(f"Mensagem enviada para {user.name}")
                
                # Aguarda 2 segundos antes de continuar
                await asyncio.sleep(2)

                # Notifica os administradores
                await send_admin_notification(order, user)

                # Adiciona ao cache de pedidos processados
                processed_orders.add(order['id'])
                
            except discord.errors.HTTPException as e:
                if e.code == 40003:  # Rate limit error
                    print(f"Rate limit atingido, aguardando 5 segundos...")
                    await asyncio.sleep(5)
                    # Tenta enviar novamente
                    await user.send(embed=embed)
                else:
                    raise e

    except Exception as e:
        print(f"Erro ao processar pedido {order['id']}: {e}")

@bot.event
async def on_ready():
    """Evento disparado quando o bot está pronto"""
    global bot_start_time
    bot_start_time = datetime.now(timezone.utc)
    
    print(f'Bot conectado como {bot.user}')
    print(f'Membros visíveis: {len(bot.users)}')
    print(f'Servidores: {len(bot.guilds)}')
    print(f'Iniciado em: {bot_start_time}')
    
    # Configura o listener do Firebase com o event loop principal
    global firestore_listener
    firestore_listener = setup_order_listener(handle_new_order, asyncio.get_event_loop())
    
    # Inicia o loop de verificação de pedidos pendentes
    check_pending_orders.start()

@tasks.loop(minutes=30)
async def check_pending_orders():
    """Verifica pedidos pendentes periodicamente"""
    try:
        pending_orders = await get_pending_orders()
        now = datetime.now(timezone.utc)
        
        for order in pending_orders:
            # Verifica se o pedido está pendente há mais de 24 horas
            created_at = order.get('createdAt')
            if created_at and (now - created_at) > timedelta(hours=24):
                try:
                    discord_username = order.get('discordId') or order.get('discordUsername')
                    user = await find_discord_user(discord_username)
                    
                    if user:
                        reminder_embed = discord.Embed(
                            title="⚠️ Lembrete de Pagamento",
                            description=f"Seu pedido #{order['id'][-6:]} ainda está pendente de pagamento.\nPor favor, efetue o pagamento ou entre em contato conosco se precisar de ajuda.",
                            color=discord.Color.yellow()
                        )
                        await user.send(embed=reminder_embed)
                        # Aguarda 2 segundos entre cada mensagem
                        await asyncio.sleep(2)
                except Exception as e:
                    print(f"Erro ao enviar lembrete para o pedido {order['id']}: {e}")

    except Exception as e:
        print(f"Erro ao verificar pedidos pendentes: {e}")

@bot.command()
@commands.has_role(DISCORD_ADMIN_ROLE_ID)
async def status(ctx, order_id: str, new_status: str):
    """Atualiza o status de um pedido"""
    try:
        valid_statuses = [
            'pending',
            'awaiting_payment',
            'payment_confirmed',
            'processing',
            'completed',
            'cancelled'
        ]
        if new_status not in valid_statuses:
            await ctx.send(f"Status inválido. Use um dos seguintes: {', '.join(valid_statuses)}")
            return

        success = await update_order_status(order_id, new_status)
        if success:
            await ctx.send(f"Status do pedido #{order_id[-6:]} atualizado para: {new_status}")
        else:
            await ctx.send("Erro ao atualizar o status do pedido.")
    except Exception as e:
        await ctx.send(f"Erro: {str(e)}")

@bot.event
async def on_command_error(ctx, error):
    """Tratamento global de erros de comandos"""
    if isinstance(error, commands.MissingRole):
        await ctx.send("Você não tem permissão para usar este comando.")
    else:
        await ctx.send(f"Erro ao executar o comando: {str(error)}")

# Cleanup ao fechar o bot
@bot.event
async def on_close():
    """Evento disparado quando o bot é fechado"""
    global firestore_listener
    if firestore_listener:
        firestore_listener.unsubscribe()

@bot.event
async def on_raw_reaction_add(payload):
    """Manipula reações adicionadas às mensagens"""
    # Ignora reações do próprio bot
    if payload.user_id == bot.user.id:
        return

    # Verifica se é uma mensagem de aprovação inicial do pedido
    if payload.message_id in order_messages:
        await handle_admin_reaction(payload)
    # Verifica se é uma mensagem de confirmação de pagamento do cliente
    elif payload.message_id in payment_confirmation_messages:
        order, user, admin_message = payment_confirmation_messages[payload.message_id]
        if payload.user_id == user.id:
            await handle_payment_reaction(payload)
    # Verifica se é uma mensagem de verificação de pagamento dos admins
    elif payload.message_id in payment_verification_messages:
        await handle_payment_verification(payload)

async def handle_admin_reaction(payload):
    """Manipula reações dos administradores nos pedidos"""
    order, user = order_messages[payload.message_id]
    
    # Busca o membro que reagiu
    guild = bot.get_guild(payload.guild_id)
    if not guild:
        return
    
    admin = guild.get_member(payload.user_id)
    if not admin or not discord.utils.get(admin.roles, id=DISCORD_ADMIN_ROLE_ID):
        return

    # Processa a reação
    if str(payload.emoji) == APPROVE_EMOJI:
        if user:
            # Atualiza o status para aguardando pagamento antes de enviar as instruções
            await update_order_status(order['id'], 'awaiting_payment')
            await send_payment_instructions(user, order, payload.message_id)
        else:
            await admin.send("❌ Não foi possível enviar as instruções de pagamento pois o usuário não foi encontrado.")

    elif str(payload.emoji) == REJECT_EMOJI:
        await handle_order_rejection(order, user, admin)

async def handle_payment_reaction(payload):
    """Manipula reações dos clientes nas mensagens de pagamento"""
    if payload.message_id not in payment_confirmation_messages:
        return

    order, user, admin_message = payment_confirmation_messages[payload.message_id]
    
    # Verifica se quem reagiu é o cliente
    if payload.user_id != user.id:
        return

    if str(payload.emoji) == APPROVE_EMOJI:
        # Cliente confirmou o pagamento
        await notify_payment_confirmation(order, user)
        await update_order_status(order['id'], 'payment_confirmed')
        
        # Envia confirmação para o cliente
        confirm_embed = discord.Embed(
            title="✅ Confirmação Recebida",
            description="Recebemos sua confirmação de pagamento! Nossa equipe irá verificar e processar seu pedido em breve.",
            color=discord.Color.green()
        )
        await user.send(embed=confirm_embed)

    elif str(payload.emoji) == REJECT_EMOJI:
        # Cliente solicitou cancelamento
        await handle_payment_cancellation(order, user)

async def notify_payment_confirmation(order, user):
    """Notifica os administradores sobre a confirmação de pagamento do cliente"""
    try:
        admin_channel = bot.get_channel(DISCORD_ADMIN_CHANNEL_ID)
        if not admin_channel:
            return

        confirm_embed = discord.Embed(
            title="💰 Pagamento Confirmado pelo Cliente",
            description=f"O cliente informou que realizou o pagamento do pedido #{order['id'][-6:]}",
            color=discord.Color.gold(),
            timestamp=datetime.now(timezone.utc)
        )

        confirm_embed.add_field(
            name="👤 Cliente",
            value=f"Nome: {user.name}\nID: {user.id}",
            inline=True
        )

        confirm_embed.add_field(
            name="💳 Pagamento",
            value=f"Método: {format_payment_method(order.get('payment', {}).get('method', 'N/A'))}",
            inline=True
        )

        # Menciona o cargo de admin
        guild = bot.get_guild(DISCORD_GUILD_ID)
        mention_text = ""
        if guild:
            admin_role = guild.get_role(DISCORD_ADMIN_ROLE_ID)
            if admin_role:
                mention_text = admin_role.mention

        # Envia a mensagem e adiciona as reações
        message = await admin_channel.send(
            content=mention_text,
            embed=confirm_embed
        )
        
        # Adiciona as reações de confirmação
        await message.add_reaction(APPROVE_EMOJI)  # ✅
        await message.add_reaction(REJECT_EMOJI)   # ❌
        
        # Armazena a mensagem no cache para verificação de pagamento
        payment_verification_messages[message.id] = (order, user, message)

        print(f"Notificação de pagamento enviada para administradores")

    except Exception as e:
        print(f"Erro ao notificar confirmação de pagamento: {e}")

async def handle_payment_verification(payload):
    """Manipula reações dos administradores na confirmação de pagamento"""
    if payload.message_id not in payment_verification_messages:
        return

    order, user, message = payment_verification_messages[payload.message_id]
    
    # Busca o membro que reagiu
    guild = bot.get_guild(payload.guild_id)
    if not guild:
        return
    
    admin = guild.get_member(payload.user_id)
    if not admin or not discord.utils.get(admin.roles, id=DISCORD_ADMIN_ROLE_ID):
        return

    # Processa a reação
    if str(payload.emoji) == APPROVE_EMOJI:
        # Admin confirmou o pagamento
        await update_order_status(order['id'], 'processing')
        
        # Notifica o cliente
        confirm_embed = discord.Embed(
            title="✅ Pagamento Verificado!",
            description="Seu pagamento foi confirmado por nossa equipe! O pedido está em processamento.",
            color=discord.Color.green()
        )
        await user.send(embed=confirm_embed)
        
        # Notifica os admins
        admin_embed = discord.Embed(
            title="✅ Pagamento Verificado",
            description=f"O pagamento do pedido #{order['id'][-6:]} foi confirmado por {admin.name}",
            color=discord.Color.green()
        )
        await message.reply(embed=admin_embed)

    elif str(payload.emoji) == REJECT_EMOJI:
        # Admin rejeitou o pagamento
        await update_order_status(order['id'], 'awaiting_payment')
        
        # Notifica o cliente
        reject_embed = discord.Embed(
            title="❌ Pagamento Não Confirmado",
            description="Nossa equipe não conseguiu confirmar seu pagamento. Por favor, verifique se o pagamento foi realizado corretamente e entre em contato conosco se precisar de ajuda.",
            color=discord.Color.red()
        )
        await user.send(embed=reject_embed)
        
        # Notifica os admins
        admin_embed = discord.Embed(
            title="❌ Pagamento Rejeitado",
            description=f"O pagamento do pedido #{order['id'][-6:]} foi rejeitado por {admin.name}",
            color=discord.Color.red()
        )
        await message.reply(embed=admin_embed)

async def handle_payment_cancellation(order, user):
    """Manipula o cancelamento de pagamento solicitado pelo cliente"""
    try:
        # Envia mensagem para o cliente pedindo o motivo
        cancel_request = discord.Embed(
            title="❌ Cancelamento de Pedido",
            description="Por favor, nos informe o motivo do cancelamento para que possamos melhorar nossos serviços:",
            color=discord.Color.red()
        )
        await user.send(embed=cancel_request)

        # Espera pela resposta do cliente
        def check(m):
            return m.author.id == user.id and isinstance(m.channel, discord.DMChannel)

        try:
            reason_msg = await bot.wait_for('message', timeout=300.0, check=check)
            
            # Notifica os administradores
            admin_channel = bot.get_channel(DISCORD_ADMIN_CHANNEL_ID)
            if admin_channel:
                cancel_embed = discord.Embed(
                    title="❌ Cancelamento Solicitado pelo Cliente",
                    description=f"O cliente solicitou o cancelamento do pedido #{order['id'][-6:]}",
                    color=discord.Color.red(),
                    timestamp=datetime.now(timezone.utc)
                )
                
                cancel_embed.add_field(
                    name="👤 Cliente",
                    value=f"Nome: {user.name}\nID: {user.id}",
                    inline=True
                )
                
                cancel_embed.add_field(
                    name="📝 Motivo",
                    value=reason_msg.content,
                    inline=False
                )

                # Menciona o cargo de admin
                guild = bot.get_guild(DISCORD_GUILD_ID)
                mention_text = ""
                if guild:
                    admin_role = guild.get_role(DISCORD_ADMIN_ROLE_ID)
                    if admin_role:
                        mention_text = admin_role.mention

                await admin_channel.send(
                    content=mention_text,
                    embed=cancel_embed
                )

            # Confirma o recebimento para o cliente
            confirm_embed = discord.Embed(
                title="✅ Solicitação Recebida",
                description="Recebemos sua solicitação de cancelamento. Nossa equipe irá analisar e retornar em breve.",
                color=discord.Color.blue()
            )
            await user.send(embed=confirm_embed)

        except asyncio.TimeoutError:
            timeout_embed = discord.Embed(
                title="⚠️ Tempo Esgotado",
                description="O tempo para informar o motivo do cancelamento expirou. Se ainda deseja cancelar, por favor solicite novamente.",
                color=discord.Color.orange()
            )
            await user.send(embed=timeout_embed)

    except Exception as e:
        print(f"Erro ao processar cancelamento do cliente: {e}")

async def send_payment_instructions(user, order, admin_message=None):
    """Envia instruções de pagamento para o usuário"""
    try:
        payment_embed = discord.Embed(
            title="💳 Instruções de Pagamento",
            description="Seu pedido foi aprovado! Siga as instruções abaixo para realizar o pagamento:",
            color=discord.Color.green()
        )

        # Adiciona informações do pedido
        payment_embed.add_field(
            name="📦 Pedido",
            value=f"#{order['id'][-6:]}",
            inline=True
        )

        # Adiciona valor
        currency = order.get('currency', 'BRL')
        currency_symbol = '$' if currency == 'USD' else 'R$'
        payment_embed.add_field(
            name="💰 Valor",
            value=f"{currency_symbol} {order['total']:.2f}",
            inline=True
        )

        # Adiciona método de pagamento
        payment = order.get('payment', {})
        payment_method = format_payment_method(payment.get('method', 'N/A'))
        payment_embed.add_field(
            name="💳 Método",
            value=payment_method,
            inline=True
        )

        # Instruções específicas baseadas no método de pagamento
        instructions = ""
        if payment.get('method') == 'pix':
            instructions = (
                "**Instruções para PIX:**\n"
                "1. Abra seu aplicativo do banco\n"
                "2. Selecione a opção PIX\n"
                "3. Copie e cole a chave PIX abaixo:\n"
                "`chave-pix-exemplo@email.com`"
            )
        elif payment.get('method') == 'credit':
            instructions = (
                "**Instruções para Cartão de Crédito:**\n"
                "1. Clique no link de pagamento abaixo\n"
                "2. Preencha os dados do seu cartão\n"
                "3. Confirme o pagamento"
            )
        elif payment.get('method') == 'boleto':
            instructions = (
                "**Instruções para Boleto:**\n"
                "1. Clique no link abaixo para gerar seu boleto\n"
                "2. O boleto pode levar até 3 dias úteis para ser compensado\n"
                "3. Após o pagamento, enviaremos a confirmação"
            )

        payment_embed.add_field(
            name="📝 Instruções",
            value=instructions,
            inline=False
        )

        # Link de pagamento
        payment_embed.add_field(
            name="🔗 Link de Pagamento",
            value=f"https://pagamento-ficticio.com/pay/{order['id'][-6:]}",
            inline=False
        )

        # Adiciona observações importantes
        payment_embed.add_field(
            name="⚠️ Observações",
            value=(
                "• O link de pagamento expira em 24 horas\n"
                "• Após o pagamento, você receberá uma confirmação\n"
                "• Em caso de dúvidas, entre em contato conosco"
            ),
            inline=False
        )

        # Adiciona timestamp
        payment_embed.set_footer(text="Pedido aprovado em")
        payment_embed.timestamp = datetime.now(timezone.utc)

        # Cria um segundo embed explicando as reações
        reactions_embed = discord.Embed(
            title="🔄 Ações Disponíveis",
            description=(
                "Use as reações abaixo para interagir com seu pedido:\n\n"
                f"{APPROVE_EMOJI} **Confirmar Pagamento**\n"
                "• Clique aqui quando finalizar o pagamento\n"
                "• Nossa equipe será notificada para verificar\n"
                "• Você receberá uma confirmação quando aprovado\n\n"
                f"{REJECT_EMOJI} **Solicitar Cancelamento**\n"
                "• Use se precisar cancelar o pedido\n"
                "• Você poderá informar o motivo\n"
                "• Nossa equipe analisará sua solicitação"
            ),
            color=discord.Color.blue()
        )
        
        reactions_embed.set_footer(text="Reaja a esta mensagem para prosseguir")

        # Envia as mensagens e adiciona as reações
        payment_message = await user.send(embeds=[payment_embed, reactions_embed])
        await payment_message.add_reaction(APPROVE_EMOJI)
        await payment_message.add_reaction(REJECT_EMOJI)

        # Armazena a mensagem no cache de confirmação de pagamento
        payment_confirmation_messages[payment_message.id] = (order, user, admin_message)

        print(f"Instruções de pagamento enviadas para {user.name}")

    except Exception as e:
        print(f"Erro ao enviar instruções de pagamento: {e}")

# Inicia o bot
bot.run(DISCORD_BOT_TOKEN) 