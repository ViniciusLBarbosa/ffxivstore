# FFXIV Sales Site

A sales website for Final Fantasy XIV products, such as raid clears and other services.

## Features

- User authentication system
- Administrative area for product management
- Product catalog
- Product details page
- User profile with purchase history
- Responsive and modern interface

## Technologies Used

- React
- Material-UI
- Firebase (Authentication and Firestore)
- React Router
- React Hook Form

## Environment Setup

1. Clone the repository:
```bash
git clone [REPOSITORY_URL]
cd site-vendas-ffxiv
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment variables:
   - Copy `.env.example` to `.env`
   - Fill in the environment variables with your Firebase credentials
   - NEVER share or commit the `.env` file

4. Configure Firebase:
   - Create a project in Firebase Console
   - Enable email/password authentication
   - Create a Firestore database
   - Configure Firestore security rules

5. Start the development server:
```bash
npm run dev
```

## Project Structure

```
src/
  ├── components/     # Reusable components
  ├── pages/         # Application pages
  ├── contexts/      # React contexts
  ├── services/      # Services (Firebase, etc)
  ├── utils/         # Utility functions
  └── assets/        # Images and other resources
```

## Firebase Configuration

1. Create a project in [Firebase Console](https://console.firebase.google.com/)
2. Enable email/password authentication
3. Create a Firestore database
4. Configure Firestore security rules to protect your data
5. Copy project credentials to `.env` file

## Security

- Never commit `.env` files or files containing credentials
- Keep your API keys and tokens secure
- Use appropriate security rules in Firebase
- Do not expose sensitive information in code

## Deployment

To deploy the application, you can use Firebase Hosting:

```bash
npm run build
firebase deploy
```

## Contributing

1. Fork the project
2. Create a feature branch (`git checkout -b feature/new-feature`)
3. Commit your changes (`git commit -m 'Add new feature'`)
4. Push to the branch (`git push origin feature/new-feature`)
5. Open a Pull Request

## License

This project is under the MIT license.
