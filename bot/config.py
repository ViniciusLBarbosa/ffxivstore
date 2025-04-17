import os
from dotenv import load_dotenv

# Carrega as variáveis de ambiente do arquivo .env
load_dotenv()

# Configurações do Discord
DISCORD_BOT_TOKEN = os.getenv('DISCORD_BOT_TOKEN')
DISCORD_GUILD_ID = int(os.getenv('DISCORD_GUILD_ID', 0))
DISCORD_ADMIN_ROLE_ID = int(os.getenv('DISCORD_ADMIN_ROLE_ID', 0))
DISCORD_ADMIN_CHANNEL_ID = int(os.getenv('DISCORD_ADMIN_CHANNEL_ID', 0))  # ID do canal de pedidos

# Configurações do Firebase
FIREBASE_CREDENTIALS_PATH = 'firebase-credentials.json'
GOOGLE_APPLICATION_CREDENTIALS = os.path.abspath(FIREBASE_CREDENTIALS_PATH) 