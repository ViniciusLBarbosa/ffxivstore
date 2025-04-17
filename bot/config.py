import os
from dotenv import load_dotenv

# Carrega as variáveis de ambiente do arquivo .env
load_dotenv()

# Configurações do Discord
DISCORD_BOT_TOKEN = os.getenv('DISCORD_BOT_TOKEN')

# Configurações do Firebase
FIREBASE_CREDENTIALS_PATH = 'firebase-credentials.json' 