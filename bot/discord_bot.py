import os
import discord
from discord.ext import commands
from config import DISCORD_BOT_TOKEN
from firebase_service import setup_order_listener
from utils import format_order_message

# Configuração do bot
intents = discord.Intents.default()
intents.message_content = True
bot = commands.Bot(command_prefix='!', intents=intents)

async def handle_new_order(order):
    """Manipula novos pedidos recebidos do Firebase"""
    try:
        user = await bot.fetch_user(order['discord'])
        if user:
            message = format_order_message(order)
            await user.send(message)
            print(f"Mensagem enviada para {user.name}")
    except Exception as e:
        print(f"Erro ao enviar mensagem: {e}")

@bot.event
async def on_ready():
    print(f'Bot conectado como {bot.user}')
    # Configura o listener do Firebase
    setup_order_listener(handle_new_order)

# Inicia o bot
bot.run(DISCORD_BOT_TOKEN) 