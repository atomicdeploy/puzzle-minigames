# Asset Creation Guide

This guide helps you create the required assets for the اینفرنال puzzle game.

## Required Assets

### 1. App Icons (PNG)

You need two PNG icons:
- **icon-192.png** - 192x192 pixels
- **icon-512.png** - 512x512 pixels

#### Option A: Use Online Tools

**favicon.io (Recommended)**
1. Go to https://favicon.io/favicon-converter/
2. Upload the `public/favicon.svg` file
3. Download the generated icons
4. Rename and place in `public/` directory

**RealFaviconGenerator**
1. Go to https://realfavicongenerator.net/
2. Upload `public/favicon.svg`
3. Generate icons
4. Download and extract

**Canva**
1. Go to https://www.canva.com/
2. Create new design: 512x512
3. Use the puzzle emoji 🧩 or create custom design
4. Use gradient colors: #6c5ce7 to #fd79a8
5. Export as PNG (512x512 and 192x192)

#### Option B: Use Design Software

**Figma**
1. Create frame: 512x512
2. Add rectangle with rounded corners (radius: 64px)
3. Add gradient fill: #6c5ce7 → #fd79a8 (135°)
4. Add puzzle emoji 🧩 (font-size: 280px, centered)
5. Export as PNG at 1x (512) and 0.375x (192)

**Adobe Photoshop/Illustrator**
1. Create new document: 512x512, RGB
2. Add gradient background
3. Add puzzle icon or custom design
4. Export as PNG (512px)
5. Create 192px version by scaling down

**GIMP (Free)**
1. File → New: 512x512
2. Use gradient tool with colors
3. Add text/emoji layer
4. Export as PNG
5. Scale to 192x192 for smaller version

#### Option C: Command Line (ImageMagick)

If you have ImageMagick installed:

```bash
# Convert SVG to PNG at different sizes
magick public/favicon.svg -resize 512x512 public/icon-512.png
magick public/favicon.svg -resize 192x192 public/icon-192.png
```

#### Option D: Node.js Script

Create `scripts/generate-icons.js`:

```javascript
import sharp from 'sharp';
import fs from 'fs';

const sizes = [192, 512];
const svgBuffer = fs.readFileSync('public/favicon.svg');

for (const size of sizes) {
  await sharp(svgBuffer)
    .resize(size, size)
    .png()
    .toFile(`public/icon-${size}.png`);
  
  console.log(`Generated icon-${size}.png`);
}
```

Run:
```bash
npm install sharp
node scripts/generate-icons.js
```

### 2. Audio Files (Optional)

While the game uses Web Audio API for sounds, you can add custom audio files:

#### Error Sound (`src/assets/audio/error.mp3`)
- Duration: 0.3-0.5 seconds
- Type: Descending beep or "ding ding" error sound
- Volume: Moderate
- Format: MP3 or OGG

**Free Sources:**
- Freesound.org
- Zapsplat.com (free tier)
- Mixkit.co

**Example search terms:**
- "error beep"
- "wrong answer"
- "negative feedback"

#### Success Sound (`src/assets/audio/success.mp3`)
- Duration: 0.4-0.6 seconds
- Type: Ascending chime or success fanfare
- Volume: Moderate
- Format: MP3 or OGG

**Example search terms:**
- "success chime"
- "level complete"
- "positive feedback"

#### Discovery Sound (`src/assets/audio/discover.mp3`)
- Duration: 0.5-0.8 seconds
- Type: Magical or sparkle sound
- Volume: Moderate
- Format: MP3 or OGG

**Example search terms:**
- "magic sparkle"
- "item discovered"
- "treasure found"

#### Background Music (`src/assets/audio/background.mp3`)
- Duration: 2-3 minutes (loopable)
- Type: Ambient, puzzle game music
- Volume: Low (20-30%)
- Format: MP3 or OGG

**To use custom audio files**, update `src/main.js`:

```javascript
// Replace the audio initialization
function initAudio() {
    gameState.audio.error = new Audio('/src/assets/audio/error.mp3');
    gameState.audio.success = new Audio('/src/assets/audio/success.mp3');
    gameState.audio.discover = new Audio('/src/assets/audio/discover.mp3');
    
    // Set volumes
    gameState.audio.error.volume = 0.5;
    gameState.audio.success.volume = 0.5;
    gameState.audio.discover.volume = 0.5;
}

// To play: gameState.audio.error.play();
```

### 3. Custom 3D Models (Optional Advanced)

If you want custom 3D puzzle pieces or treasure chests:

#### Puzzle Piece Model
- Format: GLTF (.glb) or OBJ
- Polygon count: <5000 triangles
- Texture size: 512x512 or smaller
- Color: Use vertex colors or simple textures

**Free 3D Model Sources:**
- Sketchfab (free models)
- Poly Pizza
- TurboSquid (free section)

**To use custom models**, update `src/main.js`:

```javascript
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

const loader = new GLTFLoader();
loader.load('/assets/models/puzzle-piece.glb', (gltf) => {
    const model = gltf.scene;
    scene.add(model);
});
```

### 4. Splash Screen (For Mobile App)

For better mobile experience, create a splash screen:

#### Size Requirements
- Android: 2732x2732 (will be cropped)
- PNG format with transparency

#### Design
- Background: #0f0e17 (dark color from theme)
- Logo: Centered puzzle icon
- Text: "اینفرنال" in Vazirmatn font

Save as `public/splash.png` and update `capacitor.config.json`:

```json
{
  "plugins": {
    "SplashScreen": {
      "launchShowDuration": 2000,
      "backgroundColor": "#0f0e17",
      "androidScaleType": "CENTER_CROP",
      "showSpinner": false,
      "splashFullScreen": true,
      "splashImmersive": true
    }
  }
}
```

## Design Guidelines

### Color Palette

Use these colors from the game:

```css
Primary: #6c5ce7 (purple)
Secondary: #fd79a8 (pink)
Success: #00b894 (teal)
Error: #d63031 (red)
Warning: #fdcb6e (yellow)
Background: #0f0e17 (dark blue)
```

### Typography

- Font: Vazirmatn (for Persian text)
- Font weights: 400 (regular), 700 (bold)
- Use for consistency in all assets

### Style

- Modern, vibrant, playful
- Use gradients (linear or radial)
- Include glow effects
- Rounded corners (border-radius: 15-20%)
- High contrast for visibility

## Verification

After creating assets, verify:

1. **Icons display correctly:**
   - In browser tab (favicon)
   - In PWA install prompt
   - In Android app drawer

2. **File sizes are reasonable:**
   - icon-192.png: <50 KB
   - icon-512.png: <100 KB
   - Audio files: <500 KB each
   - 3D models: <1 MB each

3. **Formats are correct:**
   - Icons: PNG format
   - Audio: MP3 or OGG
   - 3D: GLTF/GLB preferred

4. **Colors match theme:**
   - Use color picker to verify
   - Test in light and dark conditions

## Checklist

- [ ] icon-192.png created and placed in `public/`
- [ ] icon-512.png created and placed in `public/`
- [ ] (Optional) error.mp3 added to `src/assets/audio/`
- [ ] (Optional) success.mp3 added to `src/assets/audio/`
- [ ] (Optional) discover.mp3 added to `src/assets/audio/`
- [ ] (Optional) background.mp3 added to `src/assets/audio/`
- [ ] (Optional) 3D models added to `src/assets/models/`
- [ ] (Optional) splash.png created for mobile
- [ ] All files optimized for size
- [ ] Tested assets in game
- [ ] Removed placeholder .txt files

## Need Help?

If you need custom assets created:
1. Describe requirements clearly
2. Provide reference images
3. Use AI tools like:
   - DALL-E / Midjourney (images)
   - Suno / Udio (music)
   - Blender + plugins (3D models)

---

Remember: The game works perfectly with the current SVG favicon and procedural audio. These assets are enhancements, not requirements!
