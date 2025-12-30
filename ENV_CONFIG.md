# Environment Configuration Guide

This project uses a **unified `.env` file** at the root level to configure both the backend and frontend applications.

## 📋 Setup

1. Copy the example file:
   ```bash
   cp .env.example .env
   ```

2. Edit `.env` with your configuration values

3. The `.env` file is automatically loaded by:
   - **Backend**: via `dotenv` in `packages/backend/src/server.js`
   - **Frontend**: via Nuxt's `runtimeConfig` in `packages/mobile-app/nuxt.config.ts`

## 🔧 Configuration Sections

### Backend Configuration

```env
# Server Configuration
PORT=3001                    # Backend server port
NODE_ENV=development         # Environment: development, production

# CORS Settings
CORS_ORIGIN=*               # Allowed origins (* for all, or comma-separated list)

# Database Configuration (MySQL/MariaDB)
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=                # Leave empty for local dev, required in production
DB_NAME=puzzle_minigames

# Socket.io Configuration
SOCKET_PING_TIMEOUT=60000   # Timeout in milliseconds
SOCKET_PING_INTERVAL=25000  # Ping interval in milliseconds
```

### Frontend Configuration

All frontend environment variables are prefixed with `VITE_`:

```env
# API Base URL - Backend API endpoint
VITE_API_BASE_URL=http://localhost:3001/api

# Socket.io Server URL
VITE_SOCKET_URL=http://localhost:3001

# App Configuration
VITE_APP_NAME=اینفرنال
VITE_APP_VERSION=1.0.0

# Feature Flags
VITE_ENABLE_SOCKET=true     # Enable Socket.io real-time features
VITE_ENABLE_PWA=true        # Enable Progressive Web App features
```

### Deployment Configuration

```env
# Base URL for QR code generation
QR_BASE_URL=http://localhost:3000/minigame-access
```

## 🌍 Environment-Specific Configuration

### Development

```env
NODE_ENV=development
VITE_API_BASE_URL=http://localhost:3001/api
VITE_SOCKET_URL=http://localhost:3001
CORS_ORIGIN=*
```

### Production

```env
NODE_ENV=production
VITE_API_BASE_URL=https://api.yourdomain.com/api
VITE_SOCKET_URL=https://api.yourdomain.com
CORS_ORIGIN=https://yourdomain.com,https://app.yourdomain.com
DB_PASSWORD=your_secure_password
QR_BASE_URL=https://yourdomain.com/minigame-access
```

## 🔒 Security Best Practices

1. **Never commit `.env` files** - They're in `.gitignore` by default
2. **Use strong passwords** in production for `DB_PASSWORD`
3. **Limit CORS origins** in production (don't use `*`)
4. **Use HTTPS** in production for all URLs
5. **Rotate secrets** regularly in production environments

## 🔄 Loading Order

### Backend
1. Backend server loads `.env` from root: `packages/backend/src/server.js`
2. Database config also loads the same `.env`: `packages/backend/src/config/database.js`

### Frontend
1. Nuxt loads environment variables automatically from root `.env`
2. Variables prefixed with `VITE_` are exposed to the client
3. Access in components via `useRuntimeConfig().public.apiBaseUrl`

## 📝 Accessing Environment Variables

### In Backend (Node.js)

```javascript
// Access directly via process.env
const port = process.env.PORT || 3001;
const dbHost = process.env.DB_HOST || 'localhost';
```

### In Frontend (Nuxt/Vue)

```vue
<script setup>
// Use Nuxt's runtime config
const config = useRuntimeConfig();
const apiUrl = config.public.apiBaseUrl;
const socketUrl = config.public.socketUrl;
</script>
```

Or in legacy JavaScript files:

```javascript
// For files that use import.meta.env (Vite)
const apiUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';
```

## 🚨 Common Issues

### Backend can't connect to database
- Check `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`
- Ensure MySQL/MariaDB is running
- Verify database exists: `CREATE DATABASE puzzle_minigames;`

### Frontend can't connect to backend
- Check `VITE_API_BASE_URL` matches backend `PORT`
- Check `CORS_ORIGIN` allows frontend domain
- Ensure backend server is running

### Socket.io connection fails
- Check `VITE_SOCKET_URL` matches backend server URL
- Verify `SOCKET_PING_TIMEOUT` and `SOCKET_PING_INTERVAL` values
- Check firewall/proxy settings

## 📚 Related Documentation

- [Backend README](./packages/backend/README.md) - Backend setup
- [Mobile App README](./packages/mobile-app/README.md) - Frontend setup
- [Deployment Guide](./packages/mobile-app/docs/deployment-guide.md) - Production deployment
- [Testing Guide](./packages/mobile-app/docs/testing.md) - Testing setup
