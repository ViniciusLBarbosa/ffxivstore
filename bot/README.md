# FFXIV Discord Bot

Discord bot for managing Final Fantasy XIV sales and services.

## Features

- Integration with the sales website
- Administrative commands
- Order management
- Automatic notifications

## Requirements

- Python 3.8 or higher
- pip (Python package manager)
- Discord Developer Account
- Firebase project configured

## Setup

1. Clone the repository and navigate to the bot folder:
```bash
cd bot
```

2. Create and activate a virtual environment:
```bash
python -m venv .venv
# On Windows
.venv\Scripts\activate
# On Linux/Mac
source .venv/bin/activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Configure environment variables:
   - Copy `.env.example` to `.env`
   - Fill in the variables with your Discord and Firebase credentials
   - NEVER share or commit the `.env` file

5. Configure Firebase:
   - Create a project in Firebase Console
   - Generate a service account private key
   - Configure Firestore security rules

## Project Structure

```
bot/
  ├── discord_bot.py     # Main bot code
  ├── firebase_service.py # Firebase integration service
  ├── utils.py           # Utility functions
  ├── config.py          # Bot configuration
  └── requirements.txt   # Project dependencies
```

## Security

- Never commit `.env` files or files containing credentials
- Keep your API keys and tokens secure
- Use appropriate security rules in Firebase
- Do not expose sensitive information in code
- Keep your Discord bot token secret

## Running the Bot

```bash
python discord_bot.py
```

## Deployment

To deploy the bot, you can use Discloud or another hosting service:

1. Configure the `discloud.config` file with your credentials
2. Upload the bot to the hosting service
3. Configure environment variables in the hosting service

## Contributing

1. Fork the project
2. Create a feature branch (`git checkout -b feature/new-feature`)
3. Commit your changes (`git commit -m 'Add new feature'`)
4. Push to the branch (`git push origin feature/new-feature`)
5. Open a Pull Request

## License

This project is under the MIT license. 