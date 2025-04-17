# Site de Vendas FFXIV

Este é um site de vendas para produtos de Final Fantasy XIV, como clears de raids e outros serviços.

## Funcionalidades

- Sistema de autenticação de usuários
- Área administrativa para gerenciamento de produtos
- Catálogo de produtos
- Página de detalhes do produto
- Perfil do usuário com histórico de compras
- Interface responsiva e moderna

## Tecnologias Utilizadas

- React
- Material-UI
- Firebase (Authentication e Firestore)
- React Router
- React Hook Form

## Configuração do Ambiente

1. Clone o repositório:
```bash
git clone [URL_DO_REPOSITÓRIO]
cd site-vendas-ffxiv
```

2. Instale as dependências:
```bash
npm install
```

3. Configure o Firebase:
   - Crie um projeto no Firebase Console
   - Habilite a autenticação por email/senha
   - Crie um banco de dados Firestore
   - Copie as credenciais do Firebase para o arquivo `src/services/firebase.js`

4. Inicie o servidor de desenvolvimento:
```bash
npm run dev
```

## Estrutura do Projeto

```
src/
  ├── components/     # Componentes reutilizáveis
  ├── pages/         # Páginas da aplicação
  ├── contexts/      # Contextos React
  ├── services/      # Serviços (Firebase, etc)
  ├── utils/         # Funções utilitárias
  └── assets/        # Imagens e outros recursos
```

## Configuração do Firebase

1. Crie um projeto no [Firebase Console](https://console.firebase.google.com/)
2. Habilite a autenticação por email/senha
3. Crie um banco de dados Firestore
4. Copie as credenciais do projeto para o arquivo `src/services/firebase.js`

## Deploy

Para fazer o deploy da aplicação, você pode usar o Firebase Hosting:

```bash
npm run build
firebase deploy
```

## Contribuição

1. Faça um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/nova-feature`)
3. Commit suas mudanças (`git commit -m 'Adiciona nova feature'`)
4. Push para a branch (`git push origin feature/nova-feature`)
5. Abra um Pull Request

## Licença

Este projeto está sob a licença MIT.
