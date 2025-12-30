# 🚀 Build and Deployment Guide

## Overview

This guide explains how to build the Infernal Puzzle Minigames project for production deployment and create a compressed deployment package.

## Build Script

The `build.sh` script automates the entire build and packaging process with the following features:

- ✅ **Environment Validation**: Checks all required configuration
- ✅ **Dependency Management**: Installs all necessary packages
- ✅ **Project Building**: Builds both backend and frontend
- ✅ **Compression**: Creates highly compressed tar.gz package (maximum compression level 9)
- ✅ **Checksums**: Generates SHA256 and MD5 verification files
- ✅ **Documentation**: Includes deployment instructions

## Prerequisites

Before running the build script, ensure:

1. **Node.js 18+** is installed
2. **npm** is available
3. **.env file** is configured (copy from .env.example)
4. All **required environment variables** are set

## Quick Build

### Using the Script Directly

```bash
./build.sh
```

### Using npm

```bash
npm run build:deploy
```

## Environment Validation

The build script validates the following:

### Required Environment Variables

**Backend:**
- `NODE_ENV` - Should be "production" for deployment
- `PORT` - Backend server port (e.g., 3001)
- `APP_KEY` - 32+ character secure key
- `HOST` - Server host (e.g., 0.0.0.0)
- `DB_HOST` - Database host
- `DB_PORT` - Database port
- `DB_USER` - Database user
- `DB_NAME` - Database name

**Frontend:**
- `VITE_API_BASE_URL` - API endpoint URL
- `VITE_SOCKET_URL` - WebSocket server URL

### Configuration Example

For production, your `.env` should look like:

```env
NODE_ENV=production
PORT=3001
APP_KEY=your_secure_32_character_key_here
HOST=0.0.0.0
DB_HOST=localhost
DB_PORT=3306
DB_USER=puzzle_user
DB_PASSWORD=secure_password
DB_NAME=puzzle_minigames
VITE_API_BASE_URL=https://api.yourdomain.com/api
VITE_SOCKET_URL=https://api.yourdomain.com
```

## Build Process

The build script performs the following steps:

### 1. Environment Validation
- Checks for .env file
- Validates required variables
- Verifies Node.js and npm versions
- Warns about production settings

### 2. Clean Previous Builds
- Removes old build directories
- Cleans temporary files
- Optionally removes old deployment packages

### 3. Install Dependencies
- Installs root dependencies
- Installs backend dependencies
- Installs frontend dependencies

### 4. Build Projects

**Backend:**
- Compiles TypeScript to JavaScript
- Bundles application code
- Optimizes for production
- Output: `packages/backend/build/`

**Frontend (Mobile App):**
- Generates static site
- Optimizes assets
- Creates production build
- Output: `packages/mobile-app/.output/`

### 5. Create Deployment Package

The script creates a structured deployment package:

```
puzzle-minigames-YYYYMMDD_HHMMSS/
├── backend/
│   ├── build/              # Compiled backend
│   ├── database/           # Migration files
│   ├── scripts/            # Utility scripts
│   └── package.json        # Dependencies
├── mobile-app/             # Static frontend files
├── DEPLOY.md              # Deployment instructions
├── .env.example           # Environment template
└── Documentation files
```

### 6. Compression

Uses **GZIP level 9** (highest compression) to minimize package size:

- Algorithm: gzip
- Compression level: 9 (maximum)
- Format: tar.gz
- Typical compression ratio: 70-80%

### 7. Generate Checksums

Creates verification files:
- `puzzle-minigames-YYYYMMDD_HHMMSS.tar.gz.sha256` - SHA256 checksum
- `puzzle-minigames-YYYYMMDD_HHMMSS.tar.gz.md5` - MD5 checksum

## Output

After successful build, you'll have:

1. **Deployment Package**: `puzzle-minigames-YYYYMMDD_HHMMSS.tar.gz`
2. **SHA256 Checksum**: `puzzle-minigames-YYYYMMDD_HHMMSS.tar.gz.sha256`
3. **MD5 Checksum**: `puzzle-minigames-YYYYMMDD_HHMMSS.tar.gz.md5`

Example output:
```
✅ Deployment package created!
📄 Package: puzzle-minigames-20241230_143022.tar.gz
📄 Compressed size: 12M
📄 Uncompressed size: 45M
📄 Compression ratio: 73.3%
```

## Deployment

### 1. Upload Package

```bash
# Upload to server
scp puzzle-minigames-*.tar.gz user@server:/var/www/
scp puzzle-minigames-*.tar.gz.sha256 user@server:/var/www/
```

### 2. Verify Package Integrity

```bash
# On the server
cd /var/www
sha256sum -c puzzle-minigames-*.tar.gz.sha256
```

### 3. Extract Package

```bash
tar -xzf puzzle-minigames-*.tar.gz
cd puzzle-minigames-*
```

### 4. Configure Environment

```bash
cp .env.example .env
nano .env  # Edit with production values
```

### 5. Install Production Dependencies

```bash
cd backend
npm install --production
```

### 6. Set Up Database

```bash
# Create database
mysql -u root -p
CREATE DATABASE puzzle_minigames CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
exit

# Run migrations
node scripts/migrate.mjs
```

### 7. Start Services

**Option A: Direct Start (for testing)**
```bash
cd backend
npm start
```

**Option B: Process Manager (recommended)**
```bash
# Install PM2
npm install -g pm2

# Start backend
cd backend
pm2 start npm --name "puzzle-backend" -- start
pm2 save
pm2 startup
```

**Option C: Systemd Service**
Create `/etc/systemd/system/puzzle-backend.service`:
```ini
[Unit]
Description=Puzzle Minigames Backend
After=network.target mysql.service

[Service]
Type=simple
User=www-data
WorkingDirectory=/var/www/puzzle-minigames/backend
ExecStart=/usr/bin/npm start
Restart=always

[Install]
WantedBy=multi-user.target
```

Then:
```bash
sudo systemctl enable puzzle-backend
sudo systemctl start puzzle-backend
```

### 8. Configure Web Server

**Nginx Example:**
```nginx
# Frontend (mobile-app)
server {
    listen 80;
    server_name yourdomain.com;
    root /var/www/puzzle-minigames/mobile-app/public;
    
    location / {
        try_files $uri $uri/ /index.html;
    }
}

# Backend API
server {
    listen 80;
    server_name api.yourdomain.com;
    
    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## Troubleshooting

### Build Fails: Missing .env

**Error:** `.env file not found!`

**Solution:**
```bash
cp .env.example .env
# Edit .env with proper values
nano .env
```

### Build Fails: APP_KEY Not Set

**Error:** `Variable APP_KEY is not configured properly`

**Solution:**
```bash
# Generate a secure key
openssl rand -base64 32
# Add to .env: APP_KEY=<generated-key>
```

### Build Fails: Node.js Version

**Error:** `Node.js version must be 18 or higher`

**Solution:**
Install Node.js 18+ from https://nodejs.org/

### Backend Build Fails

**Error:** Build directory not created

**Solution:**
```bash
cd packages/backend
npm install
npm run build
```

### Frontend Build Fails

**Error:** .output directory not created

**Solution:**
```bash
cd packages/mobile-app
npm install
npm run generate
```

## Advanced Options

### Manual Build Steps

If you need to build manually:

```bash
# 1. Install dependencies
npm install
cd packages/backend && npm install
cd ../mobile-app && npm install

# 2. Build backend
cd packages/backend
npm run build

# 3. Build frontend
cd ../mobile-app
npm run generate

# 4. Package manually
cd ../..
tar -czf puzzle-minigames-custom.tar.gz \
    packages/backend/build \
    packages/mobile-app/.output \
    .env.example \
    INSTALLATION.md
```

### Custom Compression

For different compression algorithms:

```bash
# Using bzip2 (better compression, slower)
tar -cjf puzzle-minigames.tar.bz2 <files>

# Using xz (best compression, slowest)
tar -cJf puzzle-minigames.tar.xz <files>

# Using zstd (fast, good compression)
tar -c <files> | zstd -19 > puzzle-minigames.tar.zst
```

## Security Considerations

1. **Never commit .env files** to version control
2. **Use strong APP_KEY** (32+ characters, random)
3. **Secure database credentials**
4. **Enable SSL/TLS** in production
5. **Set proper file permissions** on server
6. **Keep dependencies updated**
7. **Verify package checksums** before deployment
8. **Use firewall rules** to protect services

## Performance Tips

1. **Use a CDN** for frontend static files
2. **Enable gzip** compression on web server
3. **Set up caching headers** for static assets
4. **Use connection pooling** for database
5. **Monitor application** with tools like PM2 or New Relic
6. **Optimize database** queries and indexes

## Maintenance

### Update Deployment

To update an existing deployment:

```bash
# On server
cd /var/www
# Stop services
pm2 stop puzzle-backend

# Backup current installation
mv puzzle-minigames puzzle-minigames.backup

# Extract new package
tar -xzf puzzle-minigames-NEW.tar.gz

# Copy .env from backup
cp puzzle-minigames.backup/.env puzzle-minigames/.env

# Install dependencies and restart
cd puzzle-minigames/backend
npm install --production
pm2 start puzzle-backend
```

### Rollback

If something goes wrong:

```bash
pm2 stop puzzle-backend
rm -rf puzzle-minigames
mv puzzle-minigames.backup puzzle-minigames
pm2 start puzzle-backend
```

## Support

For issues or questions:
- Check [INSTALLATION.md](./INSTALLATION.md)
- Review [QUICKSTART.md](./QUICKSTART.md)
- See [README.md](./README.md)

---

**Build with confidence! 🚀**
