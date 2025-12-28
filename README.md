# اینفرنال (Infernal) - بازی پازل سه‌بعدی 🧩

<div dir="rtl">

## درباره بازی

اینفرنال یک بازی پازل سه‌بعدی تعاملی است که برای مرورگرهای موبایل و PWA طراحی شده است. در این بازی، کاربران باید قطعات پازل را از صندوق‌های گنج کشف کرده و آن‌ها را در جای صحیح خود در یک جدول 3x3 (شبیه سودوکو) قرار دهند.

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

See [VITE_CONFIG_GUIDE.md](./VITE_CONFIG_GUIDE.md) for detailed configuration options.

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
