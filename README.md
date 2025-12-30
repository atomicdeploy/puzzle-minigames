# اینفرنال (Infernal) - بازی پازل سه‌بعدی 🧩

<div dir="rtl">

## درباره پروژه

اینفرنال یک بازی پازل سه‌بعدی تعاملی است که به صورت یک مونوریپو (Monorepo) سازماندهی شده و شامل دو بخش اصلی است:

1. **Mobile App**: برنامه موبایل با Nuxt 3 + Vue 3 + Capacitor
2. **Backend**: سرور Node.js با Express + Socket.io + MySQL/MariaDB

</div>

## 🏗️ Monorepo Structure

```
puzzle-minigames/
├── packages/
│   ├── mobile-app/          # Nuxt 3 Mobile Application
│   │   ├── app/             # Nuxt app directory
│   │   ├── assets/          # SCSS styles and assets
│   │   ├── components/      # Vue components
│   │   ├── pages/           # Nuxt pages
│   │   ├── composables/     # Vue composables
│   │   ├── public/          # Static files
│   │   ├── minigames/       # Mini-game modules
│   │   └── package.json
│   └── backend/             # Node.js Backend Server
│       ├── src/
│       │   ├── config/      # Configuration files
│       │   ├── controllers/ # Request controllers
│       │   ├── routes/      # API routes
│       │   ├── socket/      # Socket.io handlers
│       │   ├── models/      # Database models
│       │   └── server.js    # Main server file
│       ├── database/        # Database schemas
│       └── package.json
├── package.json             # Root workspace configuration
└── README.md               # This file
```

## ✨ Features

### Mobile App
- **Nuxt 3 & Vue 3**: Modern reactive framework
- **SCSS Styling**: Organized, maintainable styles with nesting
- **3D Graphics**: Three.js integration for rich 3D visuals
- **Sudoku-style Puzzle**: 3x3 grid puzzle board
- **Mini-games**: Modular mini-game system
- **Capacitor**: Native mobile deployment (Android/iOS)
- **RTL Support**: Full Persian (Farsi) language support
- **PWA Ready**: Progressive Web App capabilities

### Backend
- **Express.js**: Fast, minimalist web framework
- **Socket.io**: Real-time bidirectional communication
- **MySQL/MariaDB**: Relational database for data persistence
- **RESTful API**: Clean API design
- **Player Progress**: Save and load game state
- **Leaderboard**: Track top players
- **CORS Enabled**: Cross-origin resource sharing

## 🚀 Quick Start

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- MySQL or MariaDB (for backend)

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd puzzle-minigames
```

2. Install all dependencies:
```bash
npm install
```

This will install dependencies for the root workspace and both packages.

### Setting up the Backend

1. Navigate to the backend package:
```bash
cd packages/backend
```

2. Create `.env` file:
```bash
cp .env.example .env
```

3. Configure your database connection in `.env`

4. Create the database and tables:
```bash
mysql -u root -p < database/schema.sql
```

### Running the Applications

#### Development Mode (Both Services)

From the root directory:
```bash
npm run dev
```

This will start both the mobile app and backend server concurrently.

#### Individual Services

**Mobile App Only:**
```bash
npm run mobile:dev
```
The app will be available at http://localhost:3000

**Backend Only:**
```bash
npm run backend:dev
```
The server will run on http://localhost:3001

### Building for Production

**Build all packages:**
```bash
npm run build
```

**Build individual packages:**
```bash
npm run mobile:build
npm run backend:build
```

## 📱 Mobile App Development

### Available Scripts

```bash
npm run dev          # Start dev server
npm run build        # Build for production
npm run generate     # Generate static site
npm run preview      # Preview production build
```

### Building for Android

1. Generate the static site:
```bash
npm run generate
```

2. Sync with Capacitor:
```bash
npm run android:sync
```

3. Open in Android Studio:
```bash
npm run android:open
```

See `packages/mobile-app/README.md` for more details.

## 🔧 Backend Development

### API Endpoints

- `GET /health` - Health check
- `GET /api/games` - Get all games
- `GET /api/players/:playerId/progress` - Get player progress
- `POST /api/players/:playerId/progress` - Save player progress
- `GET /api/leaderboard` - Get leaderboard

### Socket.io Events

**Client → Server:**
- `player:join`
- `game:start`
- `game:move`
- `game:complete`
- `puzzle:discovered`

**Server → Client:**
- `player:joined`
- `game:started`
- `game:move`
- `game:completed`
- `puzzle:saved`

See `packages/backend/README.md` for complete documentation.

## 🛠️ Technology Stack

### Mobile App
- **Nuxt 3** - Vue.js framework
- **Vue 3** - Progressive JavaScript framework
- **SCSS** - CSS preprocessor
- **Three.js** - 3D graphics library
- **Matter.js** - 2D physics engine
- **Capacitor** - Native runtime for web apps
- **Vite** - Build tool

### Backend
- **Node.js** - JavaScript runtime
- **Express.js** - Web framework
- **Socket.io** - Real-time engine
- **MySQL2** - MySQL client
- **CORS** - Cross-origin middleware
- **dotenv** - Environment configuration

## 📝 Development Workflow

1. **Make changes** in the appropriate package
2. **Test locally** using `npm run dev`
3. **Build** using `npm run build`
4. **Commit** your changes with descriptive messages

## 🔐 Environment Configuration

This project uses a **unified `.env` file** at the root level for both backend and frontend.

### Quick Setup
```bash
# Copy the example file
cp .env.example .env

# Edit with your configuration
nano .env
```

### Key Variables
```env
# Backend
PORT=3001
DB_HOST=localhost
DB_NAME=puzzle_minigames
CORS_ORIGIN=*

# Frontend
VITE_API_BASE_URL=http://localhost:3001/api
VITE_SOCKET_URL=http://localhost:3001
```

**📖 See [ENV_CONFIG.md](./ENV_CONFIG.md) for complete configuration guide.**

## 🌐 Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (iOS 12+)
- Chrome Mobile (Android 5+)

## 📚 Documentation

Comprehensive documentation is organized by package:

### Mobile App Documentation
- **[📖 Mobile App Docs Index](./packages/mobile-app/docs/README.md)** - Complete mobile app documentation
- **[🎮 Assets Guide](./packages/mobile-app/docs/assets.md)** - Asset creation guide
- **[🔐 QR System Guide](./packages/mobile-app/docs/qr-system.md)** - QR code system documentation
- **[👋 Welcome Page Guide](./packages/mobile-app/docs/welcome-page.md)** - User onboarding flow
- **[🚀 Deployment Guide](./packages/mobile-app/docs/deployment-guide.md)** - Deployment instructions
- **[🧪 Testing Guide](./packages/mobile-app/docs/testing.md)** - Testing procedures
- **[📋 Project Summary](./packages/mobile-app/docs/project-summary.md)** - Project overview

### Backend Documentation
- **[📖 Backend Docs Index](./packages/backend/docs/README.md)** - Complete backend documentation
- **[🔌 API Integration Guide](./packages/backend/docs/api-integration.md)** - REST API documentation
- **[⚡ Socket.io Guide](./packages/backend/docs/socket-io-guide.md)** - Real-time communication

### Project History
- **[🔄 Monorepo Migration](./packages/mobile-app/docs/monorepo-migration.md)** - Migration history
Comprehensive documentation is available in the [`/docs`](./docs) directory:

- **[📖 Documentation Index](./docs/README.md)** - Complete guide to all documentation
- **[🎮 Guides](./docs/guides)** - User guides and tutorials
- **[🔌 API & Integration](./docs/api)** - API endpoints and Socket.io
- **[💻 Development](./docs/development)** - Testing and configuration guides
- **[🚀 Deployment](./docs/deployment)** - Deployment instructions
- **[📋 Project Summary](./docs/project-summary.md)** - Complete project overview

## 📄 License

MIT License - Feel free to use and modify

## 👥 Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

---

<div dir="rtl">

## راهنمای سریع فارسی

### نصب و اجرا
```bash
# نصب وابستگی‌ها
npm install

# اجرای هر دو سرویس
npm run dev

# اجرای تنها برنامه موبایل
npm run mobile:dev

# اجرای تنها بک‌اند
npm run backend:dev
```

### ساخت نسخه نهایی
```bash
npm run build
```

</div>


## Features ✨

- **3D Interactive Environment**: Built with Three.js for rich 3D graphics
- **Sudoku-style Puzzle Board**: 3x3 grid with unique puzzle pieces
- **Discovery Mechanism**: Unlock puzzle pieces from treasure chests
- **Drag & Drop**: Intuitive touch-based controls for mobile
- **Multi-sensory Feedback**:
  - Visual feedback (flashes, animations)
  - Audio feedback (success/error sounds)
  - Haptic feedback (vibrations on mobile)
- **RTL Support**: Full Persian (Farsi) language support
- **PWA Ready**: Installable as a Progressive Web App
- **Android APK**: Build to native Android app using Capacitor
- **Persistent State**: Game progress is saved automatically
- **Responsive Design**: Works on all mobile devices

## Technologies Used 🛠️

- **Frontend**: Vanilla JavaScript (ES6+)
- **3D Graphics**: Three.js
- **Build Tool**: Vite
- **PWA**: vite-plugin-pwa
- **Native Mobile**: Capacitor
- **Styling**: CSS3 with RTL support
- **Font**: Vazirmatn (Persian/Arabic)

## Project Structure 📁

```
puzzle-minigames/
├── public/
│   ├── manifest.json          # PWA manifest
│   ├── favicon.svg            # App icon (SVG)
│   ├── icon-192.png.txt       # Placeholder for 192x192 icon
│   └── icon-512.png.txt       # Placeholder for 512x512 icon
├── src/
│   ├── main.js                # Main game logic
│   ├── style.css              # Styles with RTL support
│   └── assets/
│       ├── audio/             # Audio files (to be added)
│       └── fonts/             # Custom fonts (if needed)
├── minigames/
│   └── placeholder/           # Structure for future mini-games
├── index.html                 # Entry point
├── package.json               # Dependencies
├── vite.config.js             # Vite configuration
├── capacitor.config.json      # Capacitor configuration
└── README.md                  # This file
```

## Installation & Setup 🚀

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn

### Install Dependencies

```bash
npm install
```

### Development Server

Run the development server with hot reload:

```bash
npm run dev
```

Open http://localhost:3000 in your browser (or mobile browser for testing).

#### Advanced Development Options

The Vite configuration supports:
- **HTTPS**: Enable with `https: true` in `vite.config.js`
- **HMR over Reverse Proxy**: Configure for nginx, Apache, Cloudflare Tunnel
- **CORS**: Cross-origin resource sharing for API development
- **API Proxy**: Forward API requests to backend servers
- **Custom Headers**: Security headers and more

See [docs/development/vite-config-guide.md](./docs/development/vite-config-guide.md) for detailed configuration options.

### Build for Production

Build the project for web deployment:

```bash
npm run build
```

The built files will be in the `dist/` directory.

### Preview Production Build

```bash
npm run preview
```

## Building for Android 📱

### Initial Setup

1. Install Android Studio
2. Initialize Capacitor for Android:

```bash
npm run android:init
```

### Build APK

1. Build the web app and sync to Android:

```bash
npm run android:build
```

2. Open in Android Studio:

```bash
npm run android:open
```

3. In Android Studio:
   - Click **Build** > **Build Bundle(s) / APK(s)** > **Build APK(s)**
   - The APK will be generated in `android/app/build/outputs/apk/`

## Assets Needed 🎨

The following assets need to be created/imported:

### Icons
- **icon-192.png**: 192x192 app icon
- **icon-512.png**: 512x512 app icon
- Use the provided `favicon.svg` as a base or create custom designs

### Audio Files (Optional Enhancement)
Place these in `src/assets/audio/`:
- `error.mp3` - Error sound effect
- `success.mp3` - Success sound effect
- `discover.mp3` - Discovery sound effect
- `background.mp3` - Background music (optional)

Currently, the game generates sounds programmatically using Web Audio API.

### Custom 3D Models (Optional Enhancement)
- Puzzle piece 3D models
- Treasure chest 3D models
- Background environment assets

## Game Mechanics 🎮

### How to Play

<div dir="rtl">

1. **کشف پازل‌ها**: روی صندوق‌های گنج کلیک کنید تا قطعات پازل را کشف کنید
2. **جابجایی**: قطعات پازل را با کشیدن و رها کردن به جای خود منتقل کنید
3. **تکمیل**: همه ۹ قطعه پازل را در جای صحیح قرار دهید
4. **بازخورد**: اگر قطعه در جای اشتباه قرار گیرد، بازخورد بصری و صوتی دریافت می‌کنید

</div>

### Rules

- Each puzzle piece has a unique number (1-9)
- Pieces must be placed in the correct position to complete the Sudoku-style grid
- Incorrect placements trigger error feedback
- Progress is automatically saved

## Mini-Games Integration 🎯

The treasure chests are designed to link to external mini-games. The structure for mini-games is:

```
minigames/
├── placeholder/
│   └── README.md              # Mini-game template
├── minigame-1/
│   ├── index.html
│   ├── game.js
│   └── style.css
├── minigame-2/
│   └── ...
└── ...
```

Each mini-game should:
1. Be self-contained
2. Return success/failure status
3. Award a puzzle piece upon completion
4. Follow the same RTL/Persian design language

### QR Code Access System 🎯

The game includes a comprehensive QR code system for Game Masters:

**For Game Masters:**
- Navigate to `/qr-generator.html` to generate QR codes
- Create 9 unique QR codes (one per mini-game) with security tokens
- Customize appearance: colors, error correction, margins, logos
- Download high-resolution images (300 DPI) in a ZIP file
- Print and place QR codes around the game environment

**For Players:**
- Scan QR codes to unlock mini-games
- Access is validated with unique UUID tokens
- Automatic puzzle piece unlocking upon valid access
- Seamless integration with main game

**Documentation:**
- See [docs/guides/qr-system.md](./docs/guides/qr-system.md) for complete documentation
- Includes security considerations and customization guide

## Customization 🎨

### Colors

Edit CSS variables in `src/style.css`:

```css
:root {
    --primary-color: #6c5ce7;
    --secondary-color: #fd79a8;
    --success-color: #00b894;
    --error-color: #d63031;
    /* ... more colors */
}
```

### Puzzle Solution

Modify the solution array in `src/main.js`:

```javascript
const gameState = {
    solution: [1, 2, 3, 4, 5, 6, 7, 8, 9] // Change this pattern
};
```

## Browser Support 🌐

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (iOS 12+)
- Chrome Mobile (Android 5+)

## Known Limitations ⚠️

1. Haptic feedback only works on physical devices (not in browser emulators)
2. Some audio features require user interaction to start (browser policy)
3. PNG icons need to be created manually (placeholders provided)

## Future Enhancements 🚀

- [ ] Multiple puzzle difficulty levels
- [ ] Leaderboard and scoring system
- [ ] Multiplayer mode
- [ ] More visual effects and animations
- [ ] Integration with actual mini-games
- [ ] Localization for other languages
- [ ] Dark/Light theme toggle
- [ ] Accessibility improvements

## Development Notes 📝

### Local Storage

Game state is saved to `localStorage` under key `infernal-puzzle-game`:
```javascript
{
    discoveredPuzzles: [1, 2, 3],
    puzzleBoard: [1, null, 3, ...]
}
```

### 3D Scene

- Uses Three.js with WebGL renderer
- Floating puzzle pieces in background for visual appeal
- Two colored point lights for dynamic lighting
- Responsive to window resize

## License 📄

MIT License - Feel free to use and modify

## Credits 👏

- Developed for the "اینفرنال" project
- Uses Three.js for 3D graphics
- Vazirmatn font for Persian text
- Capacitor for native mobile support

---

<div dir="rtl">

## راهنمای فارسی

برای اجرای پروژه:
1. `npm install` را اجرا کنید
2. `npm run dev` برای اجرای محیط توسعه
3. `npm run build` برای ساخت نسخه نهایی
4. `npm run android:build` برای ساخت اپلیکیشن اندروید

</div>
