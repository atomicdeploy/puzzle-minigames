# Backend - AdonisJS API Server 🚀

Complete backend API server for Puzzle Minigames built with AdonisJS 6.

## 🏗️ Technology Stack

- **Framework**: AdonisJS 6 (TypeScript)
- **Database**: MySQL/MariaDB with Lucid ORM
- **Authentication**: Session-based
- **Real-time**: Socket.io
- **SMS Service**: Melipayamak
- **Testing**: Japa

## 📦 Installation

```bash
npm install
cp .env.example .env
# Edit .env configuration
npm run db:migrate
npm run db:seed
```

## 🚀 Running

```bash
# Development
npm run dev

# Production
npm run build && npm start
```

## 🛠️ CLI Commands

```bash
node ace user:create email@example.com
node ace stats:show
node ace answer:list
node ace answer:verify --list
node ace sms:test --phone=09123456789
```

## 📡 API Endpoints

- **Auth**: `/api/auth/*` - Registration, login, OTP
- **Users**: `/api/users/*` - Profile management
- **Games**: `/api/games/*` - Game information  
- **Progress**: `/api/players/progress` - Player progress
- **Answers**: `/api/minigames/answers/*` - Submit and verify answers
- **Sessions**: `/api/sessions/*` - Session tracking

## 🧪 Testing

```bash
npm test
```

See full documentation in README for complete details.
