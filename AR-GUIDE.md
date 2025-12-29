# AR.js Integration Guide 📱

This guide explains how to use the Augmented Reality (AR) features in the اینفرنال puzzle game.

## Overview

The game now includes AR.js integration, allowing players to discover puzzle pieces in augmented reality using their device camera and marker-based tracking.

## Features ✨

### Marker-Based AR Tracking
- Uses the **Hiro marker** for AR object tracking
- Place 3D treasure chests on the marker
- Interact with chests in AR space
- Smooth integration with the existing game mechanics

### AR Mode Toggle
- Easy-to-use AR button in the header
- Seamless switching between 2D and AR modes
- Automatic camera initialization
- Clean resource cleanup when exiting AR

### 3D AR Objects
- 3D treasure chest models with realistic materials
- Gold trim and lock details
- Number labels on each chest
- Floating puzzle pieces (future enhancement)

## How to Use AR Mode

### Step 1: Print the Hiro Marker

Download and print the Hiro marker:
- [Download Hiro Marker](https://github.com/AR-js-org/AR.js/blob/master/data/images/hiro.png)
- Print it on white paper (A4 or Letter size)
- Keep it flat and well-lit

### Step 2: Enable AR Mode

1. Open the game on a mobile device
2. Click the **📷 AR** button in the header
3. Grant camera permissions when prompted
4. Point your camera at the Hiro marker

### Step 3: Interact with AR Objects

1. Once the marker is detected, you'll see treasure chests appear
2. Chests are arranged in a 3×3 grid on the marker
3. Tap on any chest to open it and discover a puzzle piece
4. Complete the puzzle by collecting all 9 pieces

### Step 4: Exit AR Mode

Click the **✕ بستن AR** button at the top to return to normal mode.

## Technical Details 🛠️

### Architecture

```
src/
├── main.js           # Main game logic with AR integration
├── ar-scene.js       # AR.js wrapper and utilities
└── style.css         # AR-specific styles
```

### AR.js Integration

The game uses AR.js through a CDN:
```html
<script src="https://cdn.jsdelivr.net/gh/AR-js-org/AR.js@3.4.5/three.js/build/ar-threex.js"></script>
```

### Key Components

#### 1. AR Scene Manager (`ar-scene.js`)
- `initARScene()` - Initialize Three.js scene for AR
- `initARToolkit()` - Set up AR.js with webcam source
- `updateAR()` - Update AR tracking each frame
- `renderAR()` - Render AR scene
- `createARTreasureChest()` - Generate 3D chest models
- `addObjectToMarker()` - Attach objects to the marker
- `cleanupAR()` - Clean up camera and resources

#### 2. Main Game Integration (`main.js`)
- `toggleARMode()` - Enable/disable AR
- `setupARInteraction()` - Handle AR object clicks
- `disableARMode()` - Clean up AR resources
- Updated `animate()` loop for AR rendering

#### 3. AR Styles (`style.css`)
- `.ar-toggle-btn` - AR mode button
- `.ar-instructions` - Instructions overlay
- `.ar-close-btn` - Close AR button
- `.ar-active` - AR mode state class

### AR Tracking Flow

```
User clicks AR button
    ↓
Initialize AR scene (Three.js)
    ↓
Initialize AR toolkit (AR.js)
    ↓
Request camera access
    ↓
Start marker detection
    ↓
Render 3D objects on marker
    ↓
Handle user interactions
    ↓
Update and render each frame
```

## Browser Support 🌐

AR features work on:
- ✅ Chrome/Edge Mobile (Android)
- ✅ Safari (iOS 11+)
- ✅ Firefox Mobile
- ⚠️ Desktop browsers (for testing with webcam)

**Note:** HTTPS is required for camera access in production.

## Performance Considerations 📊

### Optimization Tips

1. **Lighting**: Ensure good lighting for marker detection
2. **Marker Size**: Print marker at least 10×10 cm
3. **Marker Quality**: Use high-contrast, non-glossy paper
4. **Distance**: Keep marker 20-50 cm from camera
5. **Stability**: Hold device steady for best tracking

### Resource Usage

- Camera feed: ~640×480 resolution
- AR processing: ~10-20 fps marker detection
- 3D rendering: 30-60 fps (device-dependent)
- Memory: ~50-100 MB additional for AR

## Troubleshooting 🔧

### Camera Not Working

**Problem**: Camera permission denied or not accessible

**Solutions**:
1. Check browser permissions for camera access
2. Ensure HTTPS is enabled (required for camera)
3. Try a different browser
4. Restart the browser/device

### Marker Not Detected

**Problem**: AR objects don't appear on the marker

**Solutions**:
1. Improve lighting (avoid glare and shadows)
2. Print a larger marker (at least 10×10 cm)
3. Keep marker flat and clearly visible
4. Move camera closer (20-30 cm)
5. Ensure marker is not damaged or distorted

### Poor Performance

**Problem**: Laggy or stuttering AR experience

**Solutions**:
1. Close other browser tabs/apps
2. Reduce number of AR objects (modify code)
3. Use a more powerful device
4. Ensure good WiFi/network connection
5. Clear browser cache

### AR Mode Stuck

**Problem**: Can't exit AR mode or camera stays on

**Solutions**:
1. Click the close button multiple times
2. Refresh the page
3. Clear browser cache
4. Check browser console for errors

## Development 💻

### Adding Custom AR Objects

To add new 3D objects to the AR scene:

```javascript
import { addObjectToMarker } from './ar-scene.js';

// Create your custom Three.js object
const geometry = new THREE.BoxGeometry(1, 1, 1);
const material = new THREE.MeshPhongMaterial({ color: 0xff0000 });
const cube = new THREE.Mesh(geometry, material);

// Position it
cube.position.set(0, 0.5, 0);

// Add to marker
addObjectToMarker(cube);
```

### Using Different Markers

To use a custom marker instead of Hiro:

1. Create your marker using [AR.js Marker Training](https://ar-js-org.github.io/AR.js/marker-based/)
2. Host your `.patt` file
3. Update `ar-scene.js`:

```javascript
const markerControls = new window.THREEx.ArMarkerControls(arToolkitContext, markerRoot, {
    type: 'pattern',
    patternUrl: '/path/to/your/marker.patt' // Your marker file
});
```

### Location-Based AR

AR.js also supports location-based AR. To implement:

1. Use GPS coordinates instead of markers
2. Replace marker controls with location controls
3. See [AR.js Location-Based docs](https://ar-js-org.github.io/AR.js-Docs/)

## Security & Privacy 🔒

### Camera Access
- Camera is only accessed in AR mode
- Video stream is processed locally
- No data is sent to external servers
- Camera is fully released when exiting AR

### HTTPS Requirement
Modern browsers require HTTPS for camera access:
- Development: `localhost` works without HTTPS
- Production: Must use HTTPS certificate

## Future Enhancements 🚀

Planned AR features:
- [ ] Multiple marker support
- [ ] Location-based AR mode
- [ ] AR puzzle board overlay
- [ ] Persistent AR objects
- [ ] AR mini-games
- [ ] AR leaderboard visualization
- [ ] Custom marker generator
- [ ] AR tutorial/onboarding
- [ ] Hand tracking integration
- [ ] WebXR support

## Resources 📚

### Documentation
- [AR.js Official Docs](https://ar-js-org.github.io/AR.js-Docs/)
- [Three.js Documentation](https://threejs.org/docs/)
- [WebRTC Camera API](https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia)

### Markers
- [Hiro Marker](https://github.com/AR-js-org/AR.js/blob/master/data/images/hiro.png)
- [Kanji Marker](https://github.com/AR-js-org/AR.js/blob/master/data/images/kanji.png)
- [Custom Marker Generator](https://jeromeetienne.github.io/AR.js/three.js/examples/marker-training/examples/generator.html)

### Examples
- [AR.js Examples](https://ar-js-org.github.io/AR.js-Docs/examples/)
- [Three.js Examples](https://threejs.org/examples/)

## Credits 👏

- **AR.js**: Jerome Etienne, Nicolas Carpignoli, and contributors
- **Three.js**: Mr.doob and contributors
- **ARToolKit**: Original library by Hirokazu Kato

## License 📄

The AR features integrate with AR.js which is licensed under MIT.
See [AR.js License](https://github.com/AR-js-org/AR.js/blob/master/LICENSE) for details.

---

<div dir="rtl">

## راهنمای فارسی

### استفاده از حالت AR

1. روی دکمه **📷 AR** در بالای صفحه کلیک کنید
2. به دوربین دسترسی بدهید
3. مارکر Hiro را چاپ کرده و جلوی دوربین قرار دهید
4. روی صندوق‌های گنج کلیک کنید تا قطعات پازل را کشف کنید
5. برای خروج از حالت AR روی دکمه **✕ بستن AR** کلیک کنید

### دانلود مارکر
[دانلود مارکر Hiro](https://github.com/AR-js-org/AR.js/blob/master/data/images/hiro.png)

</div>
