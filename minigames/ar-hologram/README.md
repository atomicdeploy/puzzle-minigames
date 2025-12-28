# AR/VR Holographic Experience 🌟

## Overview

An impressive augmented reality experience that displays holographic-like 3D objects through your phone's camera. This minigame uses advanced Three.js rendering techniques, camera tracking, and shader effects to create a stunning visual experience.

## Features

### 🎯 Core AR Features
- **Real-time Camera Feed**: Access to device camera (rear-facing preferred)
- **3D Holographic Object**: Complex geometric shape with stunning visual effects
- **Marker-less Tracking**: No physical markers needed, works in any environment
- **Touch Interactions**: Rotate, scale, and manipulate the hologram with gestures

### ✨ Visual Effects
- **Holographic Shader**: Custom GLSL shaders for Fresnel effect and scan lines
- **Glow and Rim Lighting**: Multiple colored point lights for depth
- **Particle System**: 100+ animated particles orbiting the hologram
- **Wireframe Overlay**: Animated wireframe for extra detail
- **Color Cycling**: Dynamic color changes and pulsing effects

### 🎮 Interactions
- **Single Touch**: Rotate the hologram in 3D space
- **Pinch to Zoom**: Scale the object up or down
- **Mouse Support**: Desktop testing with mouse controls
- **Camera Switch**: Toggle between front and rear cameras
- **Screenshot**: Capture your AR experience
- **Effects Toggle**: Turn particle effects on/off

## Technical Details

### Technologies Used
- **Three.js**: WebGL 3D rendering engine
- **Custom GLSL Shaders**: For holographic effects
- **WebRTC**: Camera access via getUserMedia API
- **Canvas API**: For screenshot functionality
- **CSS3**: Advanced animations and backdrop filters

### Shader Effects

#### Vertex Shader
- Normal and position calculations for lighting
- Proper transformation matrices

#### Fragment Shader
- **Fresnel Effect**: Creates rim lighting based on view angle
- **Scan Lines**: Animated horizontal lines for holographic look
- **Color Pulsing**: Time-based color animation
- **Alpha Blending**: Transparent holographic appearance

### 3D Object Components

1. **Main Mesh**: Icosahedron geometry with custom holographic shader
2. **Wireframe**: Edge-based line geometry that pulses
3. **Glow Sphere**: Back-face sphere with glow shader
4. **Particle System**: Point cloud with orbital motion

## Usage Instructions

### For Users

1. **Launch**: Open the AR experience from the main game
2. **Camera Permission**: Allow camera access when prompted
3. **Read Instructions**: Review the on-screen guide
4. **Start AR**: Tap "شروع تجربه AR" to begin
5. **Interact**: Touch and drag to rotate, pinch to scale
6. **Explore**: View the hologram from different angles
7. **Complete**: Interact for sufficient time to unlock puzzle piece

### Camera Controls

- **🔄 Switch Camera**: Toggle between front/rear cameras
- **📸 Take Photo**: Capture screenshot of your AR scene
- **✨ Effects**: Toggle particle effects on/off
- **↩️ Back**: Return to main game

### Gestures

- **Tap and Drag**: Rotate hologram
- **Pinch**: Scale up/down (0.5x to 2.5x)
- **Mouse Wheel**: Desktop scaling (testing)
- **Mouse Drag**: Desktop rotation (testing)

## Performance Optimization

- High-performance WebGL rendering
- Efficient particle system updates
- Optimized shader calculations
- Adaptive pixel ratio for device
- RequestAnimationFrame for smooth 60fps
- Minimal DOM manipulation

## Browser Compatibility

### Mobile
- ✅ Chrome Android (recommended)
- ✅ Safari iOS 11+
- ✅ Samsung Internet
- ✅ Firefox Android

### Desktop (Testing)
- ✅ Chrome/Edge (with webcam)
- ✅ Firefox (with webcam)
- ✅ Safari (macOS with camera)

### Requirements
- Camera access permission
- WebGL support
- Modern browser (ES6+)
- Accelerometer (optional, for better tracking)

## File Structure

```
minigames/ar-hologram/
├── index.html              # Main HTML structure
├── ar-experience.js        # AR logic and Three.js setup
├── style.css              # Holographic UI styles
└── README.md              # This file
```

## Code Architecture

### Main Components

1. **initAR()**: Initialize entire AR system
2. **setupCamera()**: Request and setup camera stream
3. **initScene()**: Create Three.js scene, camera, renderer
4. **createHologram()**: Build holographic 3D object
5. **createParticleSystem()**: Generate particle effects
6. **setupInteractions()**: Handle touch/mouse input
7. **animate()**: Main render loop

### State Management

```javascript
arState = {
    scene: THREE.Scene,
    camera: THREE.PerspectiveCamera,
    renderer: THREE.WebGLRenderer,
    hologram: THREE.Group,
    particles: Array,
    video: HTMLVideoElement,
    isARActive: Boolean,
    effectsEnabled: Boolean,
    interactionTime: Number,
    rotationSpeed: Number,
    scale: Number,
    touch: Object
}
```

## Customization

### Change Hologram Geometry

```javascript
// In createHologram() function
const geometry = new THREE.IcosahedronGeometry(1.5, 1);
// Try: BoxGeometry, TorusKnotGeometry, etc.
```

### Adjust Colors

```javascript
// Modify point lights
const colors = [0x00ffff, 0xff00ff, 0xffff00, 0x00ff00];
// Use any hex colors
```

### Particle Count

```javascript
// In createParticleSystem()
const particleCount = 100; // Increase for more particles
```

### Shader Uniforms

```javascript
uniforms: {
    glowColor: { value: new THREE.Color(0x00ffff) },
    rimPower: { value: 2.0 } // Adjust Fresnel intensity
}
```

## Integration with Main Game

The AR experience integrates with the main puzzle game by:

1. Storing completion status in localStorage
2. Awarding a puzzle piece upon completion
3. Returning to main game with completion data

```javascript
// Completion stored as:
{
    name: 'ar-hologram',
    timestamp: Date.now(),
    puzzleNumber: 1-9
}
```

## Future Enhancements

- [ ] Real marker-based tracking (AR.js markers)
- [ ] Motion tracking for more stable AR
- [ ] Multiple hologram models to choose from
- [ ] Environmental occlusion
- [ ] Shadows and reflections
- [ ] Social sharing of AR photos
- [ ] AR filters and effects
- [ ] Multiplayer AR experiences
- [ ] WebXR API integration for true VR mode

## Troubleshooting

### Camera Not Working
- Check browser permissions
- Ensure HTTPS (required for camera)
- Try different browser
- Check camera not in use by another app

### Poor Performance
- Reduce particle count
- Disable effects
- Close other tabs
- Use newer device
- Lower screen resolution

### Hologram Not Visible
- Check lighting in shader uniforms
- Verify renderer alpha settings
- Ensure camera position is correct
- Check z-index layering

### Touch Not Working
- Verify pointer-events CSS
- Check touch event listeners
- Test on actual device (not emulator)
- Try mouse on desktop

## Performance Metrics

- **Target FPS**: 60fps
- **Particle Count**: 100
- **Draw Calls**: ~5 per frame
- **Shader Uniforms**: 3 per material
- **Memory Usage**: ~50MB typical

## Credits

- **Three.js**: 3D rendering library
- **WebGL**: Graphics API
- **GLSL**: Shader language
- **AR.js**: AR tracking library
- **Vazirmatn**: Persian font

## License

MIT License - Part of the Infernal Puzzle Game project

---

**Note**: This AR experience is designed for mobile devices with cameras. Desktop testing is supported but the full experience is best on phones/tablets.

للطفاً روی دستگاه موبایل خود برای تجربه کامل AR استفاده کنید! 📱✨
