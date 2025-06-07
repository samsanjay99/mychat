# MyChat - Real-time Chat Application
live demo🔥
https://onlymychat.onrender.com/

A full-stack real-time chat application built with React, Express, WebSockets, and PostgreSQL.

## Features

- Real-time messaging using WebSockets
- User authentication with JWT
- User search functionality
- Online status indicators
- Typing indicators
- Message read receipts
- Responsive design

## Tech Stack

- **Frontend**: React, TailwindCSS, Shadcn UI
- **Backend**: Express.js, Node.js
- **Database**: PostgreSQL (using Neon DB)
- **ORM**: Drizzle ORM
- **Real-time Communication**: WebSockets (ws)
- **Authentication**: JWT

## Getting Started

### Prerequisites

- Node.js (v16+)
- PostgreSQL database (or Neon DB account)

### Installation

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/mychat.git
   cd mychat
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Set up environment variables:
   ```
   cp .env.example .env
   ```
   Then edit the `.env` file with your database credentials and other settings.

4. Set up the database:
   ```
   node migrations.js
   ```

5. Start the development server:
   ```
   npm run dev
   ```

## Deployment

### Deploying to Render

1. Create a new Web Service on Render
2. Connect your GitHub repository
3. Configure the following settings:
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Environment Variables**: Add all variables from your `.env` file

### Deploying to Railway

1. Create a new project on Railway
2. Connect your GitHub repository
3. Add a PostgreSQL database from the Railway dashboard
4. Configure environment variables in the Railway dashboard
5. Deploy your application

### Deploying to Heroku

1. Create a Heroku account and install the Heroku CLI
2. Login to Heroku:
   ```
   heroku login
   ```
3. Create a new Heroku app:
   ```
   heroku create mychat-app
   ```
4. Add PostgreSQL addon:
   ```
   heroku addons:create heroku-postgresql:hobby-dev
   ```
5. Set environment variables:
   ```
   heroku config:set JWT_SECRET=your_jwt_secret_here
   heroku config:set JWT_EXPIRY=7d
   heroku config:set NODE_ENV=production
   ```
6. Push to Heroku:
   ```
   git push heroku main
   ```

## License

MIT 
