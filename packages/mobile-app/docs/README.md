# Mobile App Documentation

This directory contains documentation for the Mobile App package (Nuxt 3 + Vue 3 + Capacitor).

## 📚 Available Documentation

### 🎮 User Guides
- **[Assets Guide](./assets.md)** - How to create and manage game assets (icons, audio, 3D models)
- **[QR System Guide](./qr-system.md)** - QR code generation and validation system for game access
- **[Welcome Page Guide](./welcome-page.md)** - User onboarding and authentication flow

### 💻 Development
- **[Testing Guide](./testing.md)** - Integration testing and QA procedures
- **[Vite Configuration Guide](./vite-config-guide.md)** - Comprehensive Vite server configuration (legacy)
- **[Vite Configuration Examples](./vite-config-examples.md)** - Common Vite configuration scenarios (legacy)

### 🚀 Deployment
- **[Deployment Guide](./deployment-guide.md)** - Multiple deployment options (Web, Android, Docker, Firebase)

### 📋 Project History
- **[Monorepo Migration](./monorepo-migration.md)** - History of the monorepo transformation
- **[Project Summary](./project-summary.md)** - Complete project overview and achievements

## 🏗️ Mobile App Structure

```
mobile-app/
├── app/                    # Nuxt 4 app directory
│   ├── assets/            # SCSS styles
│   ├── composables/       # Vue composables
│   ├── pages/             # Nuxt pages
│   └── app.vue            # Root component
├── minigames/             # Mini-game modules
│   ├── minigame-2/
│   ├── minigame-basketball/
│   ├── minigame-mirror/
│   └── placeholder/
├── public/                # Static files (HTML, manifest, icons)
├── src/                   # Legacy source files
├── docs/                  # This directory
├── nuxt.config.ts         # Nuxt configuration
├── capacitor.config.json  # Capacitor native config
└── package.json
```

## 🚀 Quick Start

See the main [Mobile App README](../README.md) for setup and running instructions.

## ✨ Features

### Mobile App
- Nuxt 3 & Vue 3 - Modern reactive framework
- SCSS Styling - Organized, maintainable styles
- 3D Graphics - Three.js integration
- Sudoku-style Puzzle - 3x3 grid puzzle board
- Mini-games - Modular mini-game system
- Capacitor - Native mobile deployment (Android/iOS)
- RTL Support - Full Persian (Farsi) language
- PWA Ready - Progressive Web App capabilities

### QR Code System
- Game Master QR code generator
- Secure token-based access
- Multiple minigame support
- Customizable QR appearance
- High-resolution export

See [QR System Guide](./qr-system.md) for complete details.

## 🔗 Related Documentation

- [Main Project README](../../../README.md) - Root project documentation
- [Backend Documentation](../../backend/docs/README.md) - Backend API and Socket.io
- [Backend README](../../backend/README.md) - Backend setup

## 📱 Building for Mobile

### Android
```bash
npm run generate          # Generate static site
npm run android:sync      # Sync with Capacitor
npm run android:open      # Open in Android Studio
```

See [Deployment Guide](./deployment-guide.md) for complete mobile build instructions.

## 🎨 Asset Creation

Need to create game assets? See the [Assets Guide](./assets.md) for:
- Icon creation (192x192, 512x512)
- Audio file preparation
- 3D model requirements
- Asset optimization tips

## 🧪 Testing

See the [Testing Guide](./testing.md) for:
- Setting up test environment
- Running integration tests
- Testing both mobile app and backend
- Database setup for testing
- Common testing scenarios
