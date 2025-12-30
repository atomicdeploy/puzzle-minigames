# 🚀 Installation Guide

This guide provides comprehensive instructions for installing and setting up the Infernal Puzzle Minigames project.

## 📋 Prerequisites

Before running the installation script, ensure you have:

- **Node.js** v18 or higher
- **npm** or **yarn**
- **MySQL** or **MariaDB** server installed and running
- **Git** (for cloning the repository)

## 🎯 Quick Installation

### One-Command Installation

Run the automated installation script:

```bash
./install.sh
```

This script will:
- ✅ Check system dependencies
- ✅ Create and configure `.env` file
- ✅ Install all dependencies (root, backend, frontend)
- ✅ Create the database
- ✅ Run database migrations
- ✅ Set up initial data
- ✅ Start the services

### Manual Installation

If you prefer to install manually:

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd puzzle-minigames
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up environment:**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Create database:**
   ```bash
   mysql -u root -p
   CREATE DATABASE puzzle_minigames CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   exit
   ```

5. **Run migrations:**
   ```bash
   cd packages/backend
   npm run db:migrate
   cd ../..
   ```

6. **Start services:**
   ```bash
   npm run dev
   ```

## ⚙️ Environment Configuration

The `.env` file contains all configuration for both backend and frontend. Key variables:

### Backend Configuration

```env
# Server
PORT=3001
NODE_ENV=development
HOST=0.0.0.0

# Database
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=puzzle_minigames

# Security
APP_KEY=your_32_character_app_key_here

# CORS
CORS_ORIGIN=*
```

### Frontend Configuration

```env
# API Endpoints
VITE_API_BASE_URL=http://localhost:3001/api
VITE_SOCKET_URL=http://localhost:3001

# App Info
VITE_APP_NAME=اینفرنال
VITE_APP_VERSION=1.0.0
```

## 🔧 Environment Variable Utilities

The installation script includes helper functions for managing environment variables:

### Get Environment Variable

```bash
# In shell scripts
value=$(get_env "KEY_NAME")
```

### Set Environment Variable

```bash
# In shell scripts
set_env "KEY_NAME" "value"
```

These functions handle:
- Creating `.env` if it doesn't exist
- Updating existing keys
- Adding new keys
- Preserving file formatting

## 🗄️ Database Setup

### Automatic Setup (via script)

The installation script automatically:
1. Creates the database with proper charset and collation
2. Runs all migrations to create tables
3. Seeds initial data (if seeders exist)

### Manual Database Setup

If you need to set up the database manually:

```bash
# Create database
mysql -u root -p
CREATE DATABASE puzzle_minigames CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
exit

# Run migrations
cd packages/backend
npm run db:migrate

# Optional: Seed data
npm run db:seed
```

### Database Tables

The following tables will be created:

- `users` - User accounts
- `games` - Available games
- `player_progress` - Player game progress
- `user_sessions` - User session tracking
- `page_visits` - Page visit analytics
- `minigame_answers` - Minigame correct answers
- `answer_submissions` - Player answer submissions
- `otps` - OTP verification codes
- `settings` - Application settings and configuration

## 🧪 Running Tests

### Run All Tests

```bash
cd packages/backend
npm run test
```

### Run Specific Test Files

```bash
cd packages/backend
npm run test -- tests/functional/auth.spec.ts
npm run test -- tests/functional/settings.spec.ts
npm run test -- tests/functional/integration.spec.ts
```

### Test Coverage

The test suite includes:
- **Authentication Tests**: User registration, login, logout
- **Settings Tests**: CRUD operations for settings
- **Integration Tests**: Full user flow with multiple users
- **API Tests**: All API endpoints
- **Database Tests**: Model operations and queries

## 🚀 Starting the Application

### Development Mode

Start both backend and frontend:
```bash
npm run dev
```

Start backend only:
```bash
npm run backend:dev
```

Start mobile-app only:
```bash
npm run mobile:dev
```

### Production Mode

Build for production:
```bash
npm run build
```

Start production server:
```bash
npm run backend:start
```

## 📱 Application URLs

Once running, access the application at:

- **Mobile App**: http://localhost:3000
- **Backend API**: http://localhost:3001
- **API Documentation**: http://localhost:3001/api
- **Health Check**: http://localhost:3001/health

## 🔒 Settings Management

The application includes a settings table for storing:
- Application configuration
- API credentials
- Feature flags
- Public/private settings
- Encrypted values

### Settings API Endpoints

- `GET /api/settings` - Get all public settings
- `GET /api/settings/:key` - Get specific setting
- `GET /api/settings/all` - Get all settings (authenticated)
- `POST /api/settings/upsert` - Create/update setting (authenticated)
- `DELETE /api/settings/:key` - Delete setting (authenticated)

### Example: Creating a Setting

```javascript
// Via API
POST /api/settings/upsert
{
  "key": "max_players",
  "value": 100,
  "type": "number",
  "description": "Maximum number of players",
  "isPublic": true
}
```

## 🐛 Troubleshooting

### Port Already in Use

If ports 3000 or 3001 are already in use:

```bash
# Change ports in .env
set_env "PORT" "3002"
set_env "VITE_API_BASE_URL" "http://localhost:3002/api"
```

### Database Connection Failed

1. Verify MySQL/MariaDB is running
2. Check credentials in `.env`
3. Ensure database exists
4. Check firewall settings

### Migration Errors

Reset and rerun migrations:

```bash
cd packages/backend
npm run db:rollback
npm run db:migrate
```

### Permission Denied

Make the install script executable:

```bash
chmod +x install.sh
```

## 📚 Additional Resources

- [Main README](./README.md) - Project overview
- [Environment Configuration](./ENV_CONFIG.md) - Detailed config guide
- [Backend Documentation](./packages/backend/README.md) - Backend API
- [Mobile App Documentation](./packages/mobile-app/README.md) - Frontend docs

## 💡 Tips

1. **Use the installation script** - It handles all configuration automatically
2. **Keep .env secure** - Never commit it to version control
3. **Run tests regularly** - Ensure everything works after changes
4. **Check logs** - Use `npm run backend:dev` to see detailed logs
5. **Database backups** - Regularly backup your MySQL database

## 🤝 Support

If you encounter any issues:
1. Check the troubleshooting section
2. Review the logs for error messages
3. Ensure all prerequisites are installed
4. Verify database credentials
5. Check that ports are available

---

**Happy coding! 🎮✨**
