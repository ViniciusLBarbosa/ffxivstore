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
WORKER_EMOJI = "👥"  # Emoji para enviar aos funcionários
ADMIN_EMOJI = "👨‍💼"  # Emoji para admin fazer o serviço

# Cache para armazenar informações dos pedidos
order_messages = {}  # Mapeia message_id -> (order_data, user) - Para aprovação inicial do pedido
payment_confirmation_messages = {}  # Mapeia message_id -> (order_data, user, admin_message) - Para confirmação de pagamento
payment_verification_messages = {}  # Mapeia message_id -> (order_data, user, original_message) - Para verificação do pagamento pelos admins

# Cache para mensagens de decisão do admin
admin_decision_messages = {}  # Mapeia message_id -> (order_data, user, original_message)

# Armazena o momento em que o bot iniciou
bot_start_time = None

# Adiciona nova constante para o canal dos funcionários
DISCORD_WORKERS_CHANNEL_ID = int(os.getenv('DISCORD_WORKERS_CHANNEL_ID', 0))

# Cache para mensagens de trabalho
work_messages = {}  # Mapeia message_id -> (order_data, user, worker)

# Cache para threads de trabalho
work_threads = {}  # Mapeia order_id -> thread_id

# Cache para confirmações de conclusão
completion_confirmations = {}  # Mapeia order_id -> {"client": bool, "worker": bool, "message_id": message_id}

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
    
    # Items com detalhes específicos
    items_text = ""
    for item in order.get('items', []):
        items_text += f"🎯 {item.get('name', 'Item')}\n"
        
        # Adiciona detalhes específicos baseado na categoria do item
        if item.get('category') == 'leveling':
            items_text += f"• Job: {item.get('selectedJob', 'N/A')}\n"
            items_text += f"• Level: {item.get('startLevel', 'N/A')} → {item.get('endLevel', 'N/A')}\n"
        elif item.get('category') == 'gil':
            items_text += f"• Quantidade: {item.get('gilAmount', 0)} milhões de Gil\n"
        
        items_text += f"• Quantidade: {item.get('quantity', 1)}x\n"
        # Formata o preço de acordo com a moeda
        item_price = item.get('price', 0)
        items_text += f"• Preço: {currency_symbol} {item_price:.2f}\n\n"
    
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

        # Lista de Itens com detalhes específicos
        items_text = ""
        for item in order.get('items', []):
            items_text += f"• {item.get('name', 'Item')} (x{item.get('quantity', 1)})\n"
            if item.get('category') == 'leveling':
                items_text += f"  - Job: {item.get('selectedJob', 'N/A')}\n"
                items_text += f"  - Level: {item.get('startLevel', 'N/A')} → {item.get('endLevel', 'N/A')}\n"
            elif item.get('category') == 'gil':
                items_text += f"  - Quantidade: {item.get('gilAmount', 0)} milhões de Gil\n"
        
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
            
            # Se o pedido foi concluído ou cancelado, exclui o canal
            if new_status in ['completed', 'cancelled']:
                await delete_work_thread(order_id)
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
    # Verifica se é uma mensagem de decisão do admin
    elif payload.message_id in admin_decision_messages:
        await handle_admin_decision(payload)
    # Verifica se é uma mensagem de trabalho disponível
    elif payload.message_id in work_messages:
        await handle_work_reaction(payload)
    # Verifica se é uma confirmação de conclusão
    else:
        await handle_completion_confirmation(payload)

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

async def handle_order_rejection(order, user, admin):
    """Manipula a rejeição de pedidos pelos administradores"""
    try:
        # Atualiza o status do pedido para cancelled
        await update_order_status(order['id'], 'cancelled')
        
        # Notifica o cliente se ele existir
        if user:
            reject_embed = discord.Embed(
                title="❌ Pedido Rejeitado",
                description=(
                    f"Seu pedido #{order['id'][-6:]} foi rejeitado por um administrador.\n"
                    "Se tiver dúvidas, entre em contato conosco."
                ),
                color=discord.Color.red()
            )
            await user.send(embed=reject_embed)
        
        # Notifica os administradores
        admin_channel = bot.get_channel(DISCORD_ADMIN_CHANNEL_ID)
        if admin_channel:
            admin_embed = discord.Embed(
                title="❌ Pedido Rejeitado",
                description=f"O pedido #{order['id'][-6:]} foi rejeitado por {admin.name}",
                color=discord.Color.red(),
                timestamp=datetime.now(timezone.utc)
            )
            
            if user:
                admin_embed.add_field(
                    name="👤 Cliente",
                    value=f"Nome: {user.name}\nID: {user.id}",
                    inline=True
                )
            
            await admin_channel.send(embed=admin_embed)
            
            # Apaga as mensagens relacionadas ao pedido
            await delete_order_messages(order['id'])
            
            print(f"Pedido {order['id']} rejeitado por {admin.name}")
            
    except Exception as e:
        print(f"Erro ao processar rejeição do pedido: {e}")
        error_embed = discord.Embed(
            title="❌ Erro ao Rejeitar",
            description="Ocorreu um erro ao processar a rejeição do pedido.",
            color=discord.Color.red()
        )
        await admin.send(embed=error_embed)

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
        # Não atualiza o status aqui, apenas notifica os admins
        
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

async def send_admin_decision_request(order, user, original_message):
    """Envia mensagem para o admin decidir se envia para funcionários ou faz o serviço"""
    try:
        admin_channel = bot.get_channel(DISCORD_ADMIN_CHANNEL_ID)
        if not admin_channel:
            return

        decision_embed = discord.Embed(
            title="🤔 Decisão Necessária",
            description=f"Como você deseja proceder com o pedido #{order['id'][-6:]}?",
            color=discord.Color.gold()
        )

        # Adiciona detalhes do pedido
        items_text = ""
        for item in order.get('items', []):
            items_text += f"• {item.get('name', 'Item')}\n"
            if item.get('category') == 'leveling':
                items_text += f"  - Level: {item.get('startLevel')} → {item.get('endLevel')}\n"
                items_text += f"  - Job: {item.get('selectedJob')}\n"
            elif item.get('category') == 'gil':
                items_text += f"  - Gil: {item.get('gilAmount')} milhões\n"

        decision_embed.add_field(
            name="📦 Detalhes do Pedido",
            value=items_text or "Nenhum item",
            inline=False
        )

        decision_embed.add_field(
            name="👤 Cliente",
            value=f"Discord: {user.name}\nID: {user.id}",
            inline=True
        )

        decision_embed.add_field(
            name="🎯 Opções",
            value=(
                f"{WORKER_EMOJI} - Enviar para os funcionários\n"
                f"{ADMIN_EMOJI} - Realizar o serviço você mesmo"
            ),
            inline=False
        )

        # Envia a mensagem e adiciona as reações
        message = await admin_channel.send(embed=decision_embed)
        await message.add_reaction(WORKER_EMOJI)
        await message.add_reaction(ADMIN_EMOJI)

        # Armazena no cache
        admin_decision_messages[message.id] = (order, user, original_message)

    except Exception as e:
        print(f"Erro ao enviar solicitação de decisão: {e}")

async def handle_admin_decision(payload):
    """Manipula a decisão do admin sobre o destino do pedido"""
    if payload.message_id not in admin_decision_messages:
        return

    order, user, original_message = admin_decision_messages[payload.message_id]
    
    # Busca o membro que reagiu
    guild = bot.get_guild(payload.guild_id)
    if not guild:
        return
    
    admin = guild.get_member(payload.user_id)
    if not admin or not discord.utils.get(admin.roles, id=DISCORD_ADMIN_ROLE_ID):
        return

    channel = original_message.channel

    if str(payload.emoji) == WORKER_EMOJI:
        # Admin decidiu enviar para os funcionários
        await send_work_notification(order, user)
        
        # Notifica a decisão
        decision_notification = discord.Embed(
            title="👥 Pedido Enviado aos Funcionários",
            description=f"O pedido #{order['id'][-6:]} foi enviado para o canal dos funcionários.",
            color=discord.Color.blue()
        )
        await original_message.reply(embed=decision_notification)

    elif str(payload.emoji) == ADMIN_EMOJI:
        # Admin decidiu fazer o serviço
        try:
            # Atualiza o status do pedido para processing
            await update_order_status(order['id'], 'processing')
            
            # Cria thread privada para o admin e o cliente
            work_thread = await create_work_thread(order, user, admin, channel)
            
            if work_thread:
                # Notifica o cliente
                client_embed = discord.Embed(
                    title="🎮 Seu pedido foi iniciado!",
                    description=(
                        f"Um administrador irá realizar seu pedido.\n"
                        f"Uma thread privada foi criada para comunicação: {work_thread.mention}"
                    ),
                    color=discord.Color.green()
                )
                await user.send(embed=client_embed)
                
                # Notifica no canal de admins
                admin_notification = discord.Embed(
                    title="👨‍💼 Pedido Assumido",
                    description=f"O administrador {admin.name} assumiu o pedido #{order['id'][-6:]}",
                    color=discord.Color.green()
                )
                await original_message.reply(embed=admin_notification)

        except Exception as e:
            print(f"Erro ao processar decisão do admin: {e}")

    # Remove a mensagem de decisão do cache
    del admin_decision_messages[payload.message_id]

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

async def send_work_notification(order, user):
    """Envia notificação de trabalho disponível para os funcionários"""
    try:
        workers_channel = bot.get_channel(DISCORD_WORKERS_CHANNEL_ID)
        if not workers_channel:
            print(f"Canal dos funcionários não encontrado (ID: {DISCORD_WORKERS_CHANNEL_ID})")
            return

        # Cria o embed para o trabalho
        work_embed = discord.Embed(
            title="🛠️ Novo Trabalho Disponível!",
            description=f"Pedido #{order['id'][-6:]} está pronto para ser iniciado.",
            color=discord.Color.blue(),
            timestamp=datetime.now(timezone.utc)
        )

        # Adiciona os detalhes do pedido com informações específicas
        items_text = ""
        for item in order.get('items', []):
            items_text += f"• {item.get('name', 'Item')}\n"
            if item.get('category') == 'leveling':
                items_text += f"  - Job: {item.get('selectedJob', 'N/A')}\n"
                items_text += f"  - Level: {item.get('startLevel', 'N/A')} → {item.get('endLevel', 'N/A')}\n"
            elif item.get('category') == 'gil':
                items_text += f"  - Quantidade: {item.get('gilAmount', 0)} milhões de Gil\n"
            items_text += f"  - Quantidade: {item.get('quantity', 1)}x\n\n"

        work_embed.add_field(
            name="📦 Itens do Pedido",
            value=items_text or "Nenhum item",
            inline=False
        )

        work_embed.add_field(
            name="👤 Cliente",
            value=f"Discord: {user.name}\nID: {user.id}",
            inline=True
        )

        # Adiciona instruções para os funcionários
        work_embed.add_field(
            name="📝 Instruções",
            value=(
                "Reaja com ✅ para aceitar este trabalho.\n"
                "Ao aceitar, você será responsável por:\n"
                "1. Entrar em contato com o cliente\n"
                "2. Realizar o serviço conforme especificado\n"
                "3. Confirmar a conclusão do trabalho"
            ),
            inline=False
        )

        # Envia a mensagem e adiciona a reação
        message = await workers_channel.send(embed=work_embed)
        await message.add_reaction(APPROVE_EMOJI)  # ✅

        # Armazena a mensagem no cache
        work_messages[message.id] = (order, user, None)
        
        print(f"Notificação de trabalho enviada para o canal dos funcionários")

    except Exception as e:
        print(f"Erro ao enviar notificação de trabalho: {e}")

async def handle_work_reaction(payload):
    """Manipula reações dos funcionários nos trabalhos disponíveis"""
    if payload.message_id not in work_messages:
        return

    order, user, current_worker = work_messages[payload.message_id]
    
    # Busca o membro que reagiu
    guild = bot.get_guild(payload.guild_id)
    if not guild:
        return
    
    worker = guild.get_member(payload.user_id)
    if not worker or worker.bot:
        return

    # Verifica se já tem um funcionário designado
    if current_worker:
        # Remove a reação se não for o funcionário designado
        if worker.id != current_worker.id:
            message = await bot.get_channel(payload.channel_id).fetch_message(payload.message_id)
            await message.remove_reaction(payload.emoji, worker)
        return

    if str(payload.emoji) == APPROVE_EMOJI:
        try:
            # Atualiza o status do pedido para processing
            await update_order_status(order['id'], 'processing')
            
            # Atualiza o cache com o funcionário designado
            work_messages[payload.message_id] = (order, user, worker)
            
            # Atualiza o embed com as informações do funcionário
            message = await bot.get_channel(payload.channel_id).fetch_message(payload.message_id)
            embed = message.embeds[0]
            
            # Adiciona campo com informações do funcionário
            embed.add_field(
                name="👷 Funcionário Designado",
                value=f"{worker.name}",
                inline=True
            )
            
            embed.color = discord.Color.green()
            await message.edit(embed=embed)
            
            # Cria a thread privada
            work_thread = await create_work_thread(order, user, worker, message.channel)
            
            if work_thread:
                # Notifica o cliente
                client_embed = discord.Embed(
                    title="🎮 Seu pedido foi iniciado!",
                    description=(
                        f"O funcionário {worker.name} foi designado para seu pedido.\n"
                        f"Uma thread privada foi criada para comunicação: {work_thread.mention}"
                    ),
                    color=discord.Color.green()
                )
                await user.send(embed=client_embed)
                
                # Notifica o funcionário por DM
                worker_embed = discord.Embed(
                    title="✅ Trabalho Aceito",
                    description=(
                        f"Você aceitou o pedido #{order['id'][-6:]}\n"
                        f"Thread de comunicação: {work_thread.mention}"
                    ),
                    color=discord.Color.green()
                )
                worker_embed.add_field(
                    name="📝 Próximos Passos",
                    value=(
                        "1. Utilize a thread criada para comunicação com o cliente\n"
                        "2. Realize o serviço conforme especificado\n"
                        "3. Confirme a conclusão do trabalho quando finalizar"
                    ),
                    inline=False
                )
                await worker.send(embed=worker_embed)

        except Exception as e:
            print(f"Erro ao processar aceitação do trabalho: {e}")

async def create_work_thread(order, user, worker, channel):
    """Cria uma thread privada para comunicação entre cliente e funcionário"""
    try:
        # Cria a thread com nome baseado no ID do pedido
        thread_name = f"pedido-{order['id'][-6:]}"
        
        # Cria a thread
        thread = await channel.create_thread(
            name=thread_name,
            type=discord.ChannelType.private_thread,
            auto_archive_duration=1440  # 24 horas
        )

        # Adiciona os participantes
        await thread.add_user(user)
        await thread.add_user(worker)

        # Armazena a thread no cache
        work_threads[order['id']] = thread.id

        # Cria o embed de boas-vindas
        welcome_embed = discord.Embed(
            title="🤝 Thread de Comunicação",
            description=(
                "Esta é uma thread privada para comunicação entre cliente e funcionário.\n"
                "Por favor, utilizem este espaço para trocar informações necessárias para o serviço."
            ),
            color=discord.Color.blue()
        )

        welcome_embed.add_field(
            name="📦 Detalhes do Pedido",
            value=f"Pedido #{order['id'][-6:]}\n",
            inline=False
        )

        welcome_embed.add_field(
            name="👥 Participantes",
            value=(
                f"**Cliente:** {user.mention}\n"
                f"**Funcionário:** {worker.mention}"
            ),
            inline=False
        )

        welcome_embed.add_field(
            name="⚠️ Importante",
            value=(
                "• Esta thread será arquivada quando o serviço for concluído\n"
                "• Mantenham uma comunicação clara e profissional\n"
                "• Em caso de problemas, contactem a administração"
            ),
            inline=False
        )

        # Cria o embed de ações
        actions_embed = discord.Embed(
            title="🎮 Ações Disponíveis",
            description=(
                "Use as reações abaixo para gerenciar este atendimento:\n\n"
                f"{APPROVE_EMOJI} **Concluir Atendimento**\n"
                "• Use quando o serviço estiver finalizado\n"
                "• Requer confirmação do cliente e funcionário\n\n"
                "❌ **Cancelar Atendimento**\n"
                "• Use em caso de problemas ou desistência\n"
                "• Requer confirmação do cliente e funcionário"
            ),
            color=discord.Color.gold()
        )

        actions_embed.add_field(
            name="👥 Status das Confirmações",
            value=(
                f"**Cliente:** {user.mention} - ❌\n"
                f"**Funcionário:** {worker.mention} - ❌"
            ),
            inline=False
        )

        # Envia as mensagens
        await thread.send(
            content=f"Bem-vindos {user.mention} e {worker.mention}!",
            embed=welcome_embed
        )
        
        actions_msg = await thread.send(embed=actions_embed)
        await actions_msg.add_reaction(APPROVE_EMOJI)  # ✅
        await actions_msg.add_reaction(REJECT_EMOJI)   # ❌

        # Armazena a mensagem de ações no cache
        completion_confirmations[order['id']] = {
            "client_confirmed": False,
            "worker_confirmed": False,
            "message_id": actions_msg.id,
            "message": actions_msg,
            "channel": thread,
            "client_user": user,
            "worker_user": worker,
            "type": None  # Será 'complete' ou 'cancel' dependendo da reação
        }

        return thread

    except Exception as e:
        print(f"Erro ao criar thread de trabalho: {e}")
        return None

async def archive_work_thread(order_id):
    """Arquiva a thread de trabalho"""
    try:
        thread_id = work_threads.get(order_id)
        if thread_id:
            thread = bot.get_channel(thread_id)
            if thread:
                await thread.archive(locked=True)  # Arquiva e tranca a thread
                del work_threads[order_id]
                print(f"Thread do pedido {order_id[-6:]} arquivada com sucesso")
    except Exception as e:
        print(f"Erro ao arquivar thread de trabalho: {e}")

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
        await update_order_status(order['id'], 'payment_confirmed')
        
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

        # Envia solicitação de decisão para o admin
        await send_admin_decision_request(order, user, message)

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

@bot.command()
async def concluir(ctx):
    """Marca um pedido como concluído no canal privado após confirmação do cliente e funcionário"""
    try:
        # Verifica se o comando foi usado em um canal privado de pedido
        channel_name = ctx.channel.name
        if not channel_name.startswith('pedido-'):
            return

        # Encontra o ID do pedido pelo nome do canal
        order_id = None
        for oid, thread_id in work_threads.items():
            if thread_id == ctx.channel.id:
                order_id = oid
                break

        if not order_id:
            await ctx.send("❌ Não foi possível identificar o pedido associado a este canal.")
            return

        # Busca o cliente e o funcionário nos caches
        client = worker = None
        thread = ctx.channel
        
        # Busca o pedido nos work_messages
        for msg_id, (order, user, assigned_worker) in work_messages.items():
            if order['id'] == order_id:
                client = user
                worker = assigned_worker
                break

        # Se não encontrou no cache, busca nos membros da thread
        if not client or not worker:
            try:
                thread_members = thread.members  # Lista de membros atual da thread
                for member in thread_members:
                    if member.id != bot.user.id:  # Ignora o bot
                        # Verifica se é admin/funcionário
                        is_admin = discord.utils.get(member.roles, id=DISCORD_ADMIN_ROLE_ID)
                        if is_admin:
                            worker = member
                        else:
                            client = member
            except Exception as e:
                print(f"Erro ao buscar membros da thread: {e}")

        if not client or not worker:
            await ctx.send("❌ Não foi possível identificar o cliente e funcionário deste pedido.")
            return

        # Verifica se quem usou o comando é um admin, o funcionário designado ou o cliente
        member = ctx.author
        is_admin = discord.utils.get(member.roles, id=DISCORD_ADMIN_ROLE_ID) is not None
        is_worker = member.id == worker.id
        is_client = member.id == client.id

        if not (is_admin or is_worker or is_client):
            await ctx.send("❌ Apenas participantes do pedido podem iniciar a conclusão.")
            return

        # Cria o embed de confirmação
        confirm_embed = discord.Embed(
            title="🎮 Confirmação de Conclusão",
            description=(
                f"O pedido #{order_id[-6:]} está sendo marcado como concluído.\n"
                "**Para concluir o pedido, tanto o cliente quanto o funcionário precisam reagir com ✅**"
            ),
            color=discord.Color.blue()
        )

        confirm_embed.add_field(
            name="👥 Participantes",
            value=(
                f"**Cliente:** {client.mention} - ❌\n"
                f"**Funcionário:** {worker.mention} - ❌"
            ),
            inline=False
        )

        confirm_embed.add_field(
            name="📝 Instruções",
            value=(
                "• Reaja com ✅ para confirmar a conclusão do serviço\n"
                "• O pedido será concluído quando ambos confirmarem\n"
                "• A thread será arquivada 5 minutos após a conclusão"
            ),
            inline=False
        )

        # Envia a mensagem de confirmação
        confirm_msg = await ctx.send(embed=confirm_embed)
        await confirm_msg.add_reaction(APPROVE_EMOJI)

        # Armazena no cache de confirmações
        completion_confirmations[order_id] = {
            "client_confirmed": False,
            "worker_confirmed": False,
            "message_id": confirm_msg.id,
            "message": confirm_msg,
            "channel": ctx.channel,
            "client_user": client,
            "worker_user": worker
        }

    except Exception as e:
        error_embed = discord.Embed(
            title="❌ Erro",
            description=f"Ocorreu um erro ao processar o comando: {str(e)}",
            color=discord.Color.red()
        )
        await ctx.send(embed=error_embed)
        print(f"Erro ao concluir pedido: {e}")

async def handle_completion_confirmation(payload):
    """Manipula as reações de confirmação de conclusão ou cancelamento"""
    # Verifica se a mensagem é uma confirmação
    order_id = None
    for oid, data in completion_confirmations.items():
        if payload.message_id == data["message_id"]:
            order_id = oid
            break

    if not order_id:
        return

    data = completion_confirmations[order_id]
    
    # Verifica se é uma reação válida
    if str(payload.emoji) not in [APPROVE_EMOJI, REJECT_EMOJI]:
        return

    # Identifica se é o cliente ou funcionário
    is_client = payload.user_id == data["client_user"].id
    is_worker = payload.user_id == data["worker_user"].id
    
    if not (is_client or is_worker):
        return

    # Define o tipo de ação se ainda não foi definido
    if data["type"] is None:
        data["type"] = 'complete' if str(payload.emoji) == APPROVE_EMOJI else 'cancel'
    elif data["type"] == 'complete' and str(payload.emoji) == REJECT_EMOJI:
        return  # Ignora reação de cancelamento se já está em modo de conclusão
    elif data["type"] == 'cancel' and str(payload.emoji) == APPROVE_EMOJI:
        return  # Ignora reação de conclusão se já está em modo de cancelamento

    # Atualiza o status de confirmação
    if is_client:
        data["client_confirmed"] = True
    elif is_worker:
        data["worker_confirmed"] = True

    # Atualiza o embed com as confirmações
    embed = data["message"].embeds[0]
    status_field = embed.fields[0]
    new_value = (
        f"**Cliente:** {data['client_user'].mention} - {'✅' if data['client_confirmed'] else '❌'}\n"
        f"**Funcionário:** {data['worker_user'].mention} - {'✅' if data['worker_confirmed'] else '❌'}"
    )
    embed.set_field_at(0, name=status_field.name, value=new_value, inline=False)
    await data["message"].edit(embed=embed)

    # Verifica se ambos confirmaram
    if data["client_confirmed"] and data["worker_confirmed"]:
        try:
            if data["type"] == 'complete':
                # Atualiza o status do pedido para completed
                await update_order_status(order_id, 'completed')
                
                # Atualiza o embed para mostrar conclusão
                embed.color = discord.Color.green()
                embed.title = "🎉 Pedido Concluído!"
                embed.description = "O pedido foi concluído com sucesso! Cliente e funcionário confirmaram a conclusão."
                await data["message"].edit(embed=embed)

                # Notifica o cliente
                await data["client_user"].send(
                    embed=discord.Embed(
                        title="🎉 Pedido Concluído!",
                        description=(
                            f"Seu pedido #{order_id[-6:]} foi concluído com sucesso!\n"
                            "Agradecemos a preferência!"
                        ),
                        color=discord.Color.green()
                    )
                )

                # Notifica o funcionário
                await data["worker_user"].send(
                    embed=discord.Embed(
                        title="🎉 Pedido Concluído!",
                        description=(
                            f"O pedido #{order_id[-6:]} foi concluído com sucesso!\n"
                            "Obrigado pelo trabalho!"
                        ),
                        color=discord.Color.green()
                    )
                )

                # Apaga as mensagens relacionadas ao pedido
                await delete_order_messages(order_id)

            else:  # cancelamento
                # Atualiza o status do pedido para cancelled
                await update_order_status(order_id, 'cancelled')
                
                # Atualiza o embed para mostrar cancelamento
                embed.color = discord.Color.red()
                embed.title = "❌ Pedido Cancelado"
                embed.description = "O pedido foi cancelado por acordo mútuo entre cliente e funcionário."
                await data["message"].edit(embed=embed)

                # Notifica o cliente
                await data["client_user"].send(
                    embed=discord.Embed(
                        title="❌ Pedido Cancelado",
                        description=f"Seu pedido #{order_id[-6:]} foi cancelado conforme solicitado.",
                        color=discord.Color.red()
                    )
                )

                # Notifica o funcionário
                await data["worker_user"].send(
                    embed=discord.Embed(
                        title="❌ Pedido Cancelado",
                        description=f"O pedido #{order_id[-6:]} foi cancelado conforme solicitado.",
                        color=discord.Color.red()
                    )
                )

                # Apaga as mensagens relacionadas ao pedido
                await delete_order_messages(order_id)

            # Notifica no canal de admins
            admin_channel = bot.get_channel(DISCORD_ADMIN_CHANNEL_ID)
            if admin_channel:
                status_text = "concluído" if data["type"] == 'complete' else "cancelado"
                await admin_channel.send(
                    embed=discord.Embed(
                        title=f"{'✅' if data['type'] == 'complete' else '❌'} Pedido {status_text.title()}",
                        description=(
                            f"O pedido #{order_id[-6:]} foi {status_text}.\n"
                            "Cliente e funcionário confirmaram a ação."
                        ),
                        color=discord.Color.green() if data["type"] == 'complete' else discord.Color.red()
                    )
                )

            # Avisa que a thread será arquivada
            await data["channel"].send(
                embed=discord.Embed(
                    title="⚠️ Aviso",
                    description="Esta thread será arquivada em 5 minutos.",
                    color=discord.Color.orange()
                )
            )

            # Remove do cache de confirmações
            del completion_confirmations[order_id]

            # Agenda o arquivamento da thread
            await asyncio.sleep(300)  # 5 minutos
            await archive_work_thread(order_id)

        except Exception as e:
            print(f"Erro ao finalizar pedido: {e}")
            await data["channel"].send(
                embed=discord.Embed(
                    title="❌ Erro",
                    description="Ocorreu um erro ao processar a ação. Por favor, tente novamente.",
                    color=discord.Color.red()
                )
            )

async def delete_order_messages(order_id):
    """Apaga todas as mensagens relacionadas ao pedido"""
    try:
        # Apaga mensagem do canal de admin
        admin_channel = bot.get_channel(DISCORD_ADMIN_CHANNEL_ID)
        if admin_channel:
            # Procura e apaga mensagens relacionadas ao pedido no canal de admin
            async for message in admin_channel.history(limit=100):
                if message.embeds:
                    for embed in message.embeds:
                        # Verifica se o ID do pedido está no título ou descrição
                        if f"#{order_id[-6:]}" in (embed.title or '') or f"#{order_id[-6:]}" in (embed.description or ''):
                            await message.delete()
                            await asyncio.sleep(0.5)  # Pequeno delay para evitar rate limits

        # Apaga mensagem do canal de funcionários
        workers_channel = bot.get_channel(DISCORD_WORKERS_CHANNEL_ID)
        if workers_channel:
            # Procura e apaga mensagens relacionadas ao pedido no canal de funcionários
            async for message in workers_channel.history(limit=100):
                if message.embeds:
                    for embed in message.embeds:
                        # Verifica se o ID do pedido está no título ou descrição
                        if f"#{order_id[-6:]}" in (embed.title or '') or f"#{order_id[-6:]}" in (embed.description or ''):
                            await message.delete()
                            await asyncio.sleep(0.5)  # Pequeno delay para evitar rate limits

    except Exception as e:
        print(f"Erro ao apagar mensagens do pedido {order_id}: {e}")

async def handle_payment_cancellation(order, user):
    """Manipula o cancelamento de pedido solicitado pelo cliente"""
    try:
        # Atualiza o status do pedido para cancelled
        await update_order_status(order['id'], 'cancelled')
        
        # Notifica o cliente
        cancel_embed = discord.Embed(
            title="❌ Pedido Cancelado",
            description=f"Seu pedido #{order['id'][-6:]} foi cancelado conforme solicitado.",
            color=discord.Color.red()
        )
        await user.send(embed=cancel_embed)
        
        # Notifica os administradores
        admin_channel = bot.get_channel(DISCORD_ADMIN_CHANNEL_ID)
        if admin_channel:
            admin_embed = discord.Embed(
                title="❌ Pedido Cancelado pelo Cliente",
                description=f"O cliente cancelou o pedido #{order['id'][-6:]}",
                color=discord.Color.red(),
                timestamp=datetime.now(timezone.utc)
            )
            
            admin_embed.add_field(
                name="👤 Cliente",
                value=f"Nome: {user.name}\nID: {user.id}",
                inline=True
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
                embed=admin_embed
            )
            
            # Apaga as mensagens relacionadas ao pedido
            await delete_order_messages(order['id'])
            
            print(f"Pedido {order['id']} cancelado pelo cliente")
            
    except Exception as e:
        print(f"Erro ao processar cancelamento do pedido: {e}")
        # Notifica o cliente sobre o erro
        error_embed = discord.Embed(
            title="❌ Erro ao Cancelar",
            description="Ocorreu um erro ao processar o cancelamento. Por favor, tente novamente ou entre em contato com o suporte.",
            color=discord.Color.red()
        )
        await user.send(embed=error_embed)

# Inicia o bot
bot.run(DISCORD_BOT_TOKEN) 