# Deployment Guide for اینفرنال

This guide covers different deployment options for the puzzle game.

## Option 1: Deploy to Web Hosting (Netlify, Vercel, GitHub Pages)

### Build the Project

```bash
npm install
npm run build
```

The production files will be in the `dist/` directory.

### Deploy to Netlify

1. **Using Netlify CLI:**
```bash
npm install -g netlify-cli
netlify deploy --prod --dir=dist
```

2. **Using Netlify UI:**
- Drag and drop the `dist` folder to Netlify dashboard
- Or connect your GitHub repository

### Deploy to Vercel

```bash
npm install -g vercel
vercel --prod
```

### Deploy to GitHub Pages

```bash
# Build the project
npm run build

# Deploy to gh-pages branch
npx gh-pages -d dist
```

Update `vite.config.js` to add base path:
```javascript
export default defineConfig({
  base: '/puzzle-minigames/', // Your repo name
  // ... rest of config
});
```

## Option 2: Build Android APK

### Prerequisites

- Java JDK 11 or higher
- Android Studio
- Android SDK (API 22+)

### Steps

1. **Install dependencies:**
```bash
npm install
```

2. **Build the web app:**
```bash
npm run build
```

3. **Initialize Capacitor (first time only):**
```bash
npm run android:init
```

4. **Sync and copy files to Android:**
```bash
npm run android:sync
```

5. **Open in Android Studio:**
```bash
npm run android:open
```

6. **Build APK in Android Studio:**
- Click **Build** → **Build Bundle(s) / APK(s)** → **Build APK(s)**
- Wait for the build to complete
- Click "locate" to find the APK file
- Default location: `android/app/build/outputs/apk/debug/app-debug.apk`

### Build Signed APK for Production

1. **Generate keystore:**
```bash
keytool -genkey -v -keystore my-release-key.keystore -alias my-key-alias -keyalg RSA -keysize 2048 -validity 10000
```

2. **In Android Studio:**
- **Build** → **Generate Signed Bundle / APK**
- Select APK
- Choose your keystore file
- Enter keystore password
- Select release build variant
- The signed APK will be in `android/app/build/outputs/apk/release/`

### Install APK on Device

```bash
adb install android/app/build/outputs/apk/debug/app-debug.apk
```

## Option 3: Test Locally

### Development Server

```bash
npm install
npm run dev
```

Open http://localhost:3000 in your browser.

#### Development with HTTPS

To enable HTTPS during development:

1. Edit `vite.config.js`:
```javascript
server: {
  https: true, // Vite will auto-generate self-signed certificate
}
```

2. Start dev server:
```bash
npm run dev
```

3. Open https://localhost:3000 (accept certificate warning)

For trusted certificates, see [VITE_CONFIG_GUIDE.md](./VITE_CONFIG_GUIDE.md#creating-local-certificates-with-mkcert).

#### Development Behind Reverse Proxy

When developing behind nginx, Apache, or Cloudflare Tunnel, configure HMR:

```javascript
// vite.config.js
server: {
  hmr: {
    protocol: 'wss', // Use 'wss' for HTTPS
    host: 'dev.example.com',
    clientPort: 443,
  }
}
```

See [VITE_CONFIG_GUIDE.md](./VITE_CONFIG_GUIDE.md#reverse-proxy-setup) for complete reverse proxy examples.

### Production Preview

```bash
npm run build
npm run preview
```

Open http://localhost:4173 to test the production build.

## Option 4: Deploy to Firebase Hosting

1. **Install Firebase CLI:**
```bash
npm install -g firebase-tools
```

2. **Login to Firebase:**
```bash
firebase login
```

3. **Initialize Firebase:**
```bash
firebase init hosting
```

- Select your Firebase project
- Set public directory to `dist`
- Configure as single-page app: Yes
- Don't overwrite index.html

4. **Deploy:**
```bash
npm run build
firebase deploy
```

## Option 5: Self-Hosted (Docker)

Create a `Dockerfile`:

```dockerfile
FROM node:18-alpine as builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

Build and run:

```bash
docker build -t infernal-puzzle-game .
docker run -p 8080:80 infernal-puzzle-game
```

## Environment Configuration

### PWA Configuration

The PWA is configured in:
- `public/manifest.json` - App manifest
- `vite.config.js` - Service worker settings

### Mobile Configuration

The mobile app is configured in:
- `capacitor.config.json` - Capacitor settings

## Testing on Mobile

### Test Web Version on Mobile

1. Start dev server: `npm run dev`
2. Find your local IP: `ipconfig` (Windows) or `ifconfig` (Mac/Linux)
3. Access from mobile: `http://YOUR_IP:3000`

### Test APK on Physical Device

1. Enable Developer Options on your Android device
2. Enable USB Debugging
3. Connect device via USB
4. Run: `adb install path/to/app-debug.apk`

### Test APK on Emulator

1. Open Android Studio
2. **Tools** → **AVD Manager**
3. Create or start an emulator
4. Drag and drop APK onto emulator

## Performance Optimization

### Web Performance

1. **Enable compression** on your hosting provider
2. **Use CDN** for static assets
3. **Enable caching** headers
4. **Lazy load** Three.js if needed

### Mobile Performance

1. **Reduce texture sizes** for lower-end devices
2. **Limit particle count** in Three.js scene
3. **Test on multiple devices** with different specs
4. **Profile with Chrome DevTools** on mobile

## Troubleshooting

### Build Errors

```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
npm run build
```

### Android Build Issues

```bash
# Clean and rebuild
cd android
./gradlew clean
cd ..
npm run android:sync
```

### Icons Not Showing

Replace placeholder files in `public/`:
- `icon-192.png`
- `icon-512.png`

Use online tools like favicon.io or Figma to create proper PNG icons.

## Assets Checklist

Before deploying, ensure you have:

- [ ] Created `icon-192.png` (currently placeholder)
- [ ] Created `icon-512.png` (currently placeholder)
- [ ] (Optional) Custom audio files in `src/assets/audio/`
- [ ] (Optional) Custom 3D models
- [ ] Tested on multiple devices
- [ ] Verified RTL layout works correctly
- [ ] Tested PWA installation
- [ ] Tested APK on Android device

## Post-Deployment

### Monitor Performance

- Use Lighthouse for web performance
- Use Firebase Performance Monitoring for app
- Check Core Web Vitals

### Update Strategy

1. Make changes to code
2. Test locally
3. Build: `npm run build`
4. Test production build: `npm run preview`
5. Deploy to hosting
6. For mobile: Rebuild APK and distribute

## Support

For issues or questions:
- Check the main README.md
- Review Vite documentation: https://vitejs.dev
- Review Capacitor documentation: https://capacitorjs.com
- Check Three.js documentation: https://threejs.org

---

Happy deploying! 🚀
