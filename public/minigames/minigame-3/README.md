# Mini-Game 3: Voice/Audio Controlled Game (کنترل صوتی)

## Description

This is an innovative audio-controlled minigame where players use their voice (different pitches/frequencies) to control the movement of a ball on screen. The objective is to keep the ball within the game boundaries for 30 seconds by producing different sounds/pitches with your mouth.

## Game Mechanics

### Objective
Keep the ball from falling out of the screen boundaries for 30 seconds using only your voice!

### Voice Controls
The game uses pitch detection to map different vocal frequencies to directional controls:

- **🎵 Low Pitch (0-150 Hz)**: Move LEFT ⬅️
  - Make a deep, low humming sound
  
- **🎵 Medium-Low Pitch (150-250 Hz)**: Move DOWN ⬇️
  - Make a slightly higher, but still low sound
  
- **🎵 Medium-High Pitch (250-400 Hz)**: Move UP ⬆️
  - Make a medium-pitched sound (normal speaking voice)
  
- **🎵 High Pitch (400-1000 Hz)**: Move RIGHT ➡️
  - Make a high-pitched sound (like a whistle or high note)

### Scoring
- You earn points continuously for every moment the ball stays within the boundaries
- Final score is based on time survived and points accumulated
- Win condition: Survive for the full 30 seconds

### How to Play

1. Click "شروع بازی" (Start Game)
2. Grant microphone permission when prompted
3. The game begins immediately
4. Use different vocal pitches to control the ball's direction
5. Keep the ball away from the red borders
6. Stay within the green dashed lines for safety
7. Survive for 30 seconds to win!

## Features

- ✅ Real-time pitch detection using Web Audio API
- ✅ Autocorrelation algorithm for accurate frequency detection
- ✅ Visual pitch indicator showing current frequency
- ✅ Direction display showing detected command
- ✅ Real-time ball physics
- ✅ Score and timer display
- ✅ Visual feedback (borders, arrows, ball gradient)
- ✅ Mobile-optimized touch interface
- ✅ RTL (Right-to-Left) Persian language support
- ✅ Responsive design for all screen sizes
- ✅ Integration with main game via postMessage API
- ✅ Microphone permission handling

## Technical Implementation

### Pitch Detection
The game uses the **autocorrelation algorithm** to detect the fundamental frequency (pitch) of the user's voice:

1. Captures audio from microphone via `getUserMedia()`
2. Analyzes audio data using Web Audio API's `AnalyserNode`
3. Applies autocorrelation to find the dominant frequency
4. Maps frequency to one of four directional controls
5. Updates ball velocity based on detected direction

### Audio Processing
- **FFT Size**: 2048 samples for accurate frequency resolution
- **Sample Rate**: Uses browser's default (typically 44.1kHz or 48kHz)
- **Smoothing**: 70% smoothing factor to reduce jitter
- **Volume Threshold**: 0.01 to filter out background noise

### Physics
- Ball has velocity and acceleration
- Directional controls apply acceleration to the ball
- Drag coefficient (0.98) prevents infinite acceleration
- Max speed capping for playability
- Boundary detection triggers game over

## Files

- `index.html` - Main HTML structure with game UI
- `style.css` - Styling with Persian font and RTL support
- `game.js` - Game logic with pitch detection and physics
- `README.md` - This file

## Integration

The minigame communicates with the parent window using the postMessage API:

```javascript
// On success (survived 30 seconds)
window.parent.postMessage({
    type: 'minigame-complete',
    success: true,
    puzzleNumber: 3,
    score: finalScore
}, window.location.origin);

// On failure (ball went out of bounds)
// Game allows replay without sending failure message
```

## Technologies

- **Web Audio API** - For microphone access and audio analysis
- **Canvas API** - For game rendering
- **Autocorrelation Algorithm** - For pitch detection
- **Vanilla JavaScript** - No external dependencies
- **CSS3 animations** - For UI effects
- **Vazirmatn font** - For Persian text

## Browser Requirements

- Modern browser with Web Audio API support
- Microphone access permission
- HTTPS (required for microphone access on most browsers)
- Recommended: Chrome, Edge, Firefox, Safari (latest versions)

## Testing Tips

### For Developers
1. Open browser console to see pitch detection logs
2. Test on HTTPS or localhost (required for microphone access)
3. Use headphones to avoid feedback
4. Try different vocal sounds to test pitch ranges
5. Adjust `PITCH_RANGES` in game.js to calibrate for different voices

### For Players
- Experiment with different mouth shapes to produce different pitches
- Humming works well for low pitches
- Whistling or "ee" sounds work for high pitches
- "ah" or "oh" sounds work for medium pitches
- Keep sounds steady for better control
- The pitch indicator bar helps you see what frequency you're producing

## Customization

### Adjusting Difficulty
In `game.js`, modify:
```javascript
const GAME_DURATION = 30; // Change game length
const BALL_SPEED = 3; // Adjust ball responsiveness
const PITCH_SMOOTHING = 0.7; // Adjust control sensitivity
```

### Changing Pitch Mappings
Modify the `PITCH_RANGES` object to adjust frequency ranges:
```javascript
const PITCH_RANGES = {
    LEFT: { min: 0, max: 150, name: 'چپ ⬅️' },
    // Adjust min/max values for your needs
};
```

## Known Limitations

1. Microphone access requires HTTPS (or localhost for development)
2. Pitch detection accuracy varies with microphone quality
3. Background noise can interfere with detection
4. Some browsers may have different Web Audio API implementations
5. Mobile browsers may have restrictions on microphone access

## Accessibility

- Clear visual indicators for detected pitch and direction
- Large, high-contrast UI elements
- Persian language support with RTL layout
- Touch-friendly interface for mobile devices
- Clear instructions provided in-game

## Future Enhancements

- [ ] Difficulty levels (beginner, normal, hard)
- [ ] Obstacles or enemies to avoid
- [ ] Power-ups that appear on screen
- [ ] Multiplayer mode with voice battles
- [ ] Voice training/calibration mode
- [ ] Alternative control schemes (keyboard fallback)
- [ ] Save high scores
- [ ] Different game modes (time trial, survival, etc.)

## License

Part of the Infernal Puzzle Game project - MIT License

---

## راهنمای فارسی

### چگونه بازی کنیم؟
1. دکمه "شروع بازی" را بزنید
2. اجازه دسترسی به میکروفون را بدهید
3. با تولید صداهای مختلف با دهان خود، توپ را کنترل کنید
4. توپ را 30 ثانیه در صفحه نگه دارید تا برنده شوید!

### کنترل‌های صوتی:
- صدای خیلی پایین = چپ
- صدای پایین = پایین  
- صدای متوسط = بالا
- صدای بالا = راست
