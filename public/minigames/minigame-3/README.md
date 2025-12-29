# Mini-Game 3: Voice/Audio Controlled Game (کنترل صوتی)

## Description

This is an innovative audio-controlled minigame where players use their voice (different pitches/frequencies) to control the movement of a ball on screen. The objective is to keep the ball within the game boundaries for 30 seconds by producing different sounds/pitches with your mouth.

**NEW**: Now features Web Speech Recognition for detecting magic words ("Zoom!", "Escape", "Infernal") and advanced FFT+HPS pitch detection for superior accuracy!

## Game Mechanics

### Objective
Keep the ball from falling out of the screen boundaries for 30 seconds using only your voice!

### Voice Controls
The game uses **FFT + Harmonic Product Spectrum (HPS)** pitch detection to map vocal frequencies to musical notes and directional controls:

- **🎵 Low Notes (C2-G2, ~65-196 Hz)**: Move LEFT ⬅️
  - Make a deep, low humming sound
  
- **🎵 Medium-Low Notes (G#2-D3, ~196-293 Hz)**: Move DOWN ⬇️
  - Make a slightly higher, but still low sound
  
- **🎵 Medium-High Notes (D#3-A3, ~293-440 Hz)**: Move UP ⬆️
  - Make a medium-pitched sound (normal speaking voice)
  
- **🎵 High Notes (A#3-C5, ~440-800 Hz)**: Move RIGHT ➡️
  - Make a high-pitched sound (like a whistle or high note)

### Magic Words
Say these words to trigger special reward animations:
- **"Zoom"** - زوم (Green animation)
- **"Escape"** - فرار (Yellow animation)
- **"Infernal"** - جهنمی (Red animation)

### Debug Mode
Press the **'D'** key to toggle the debug panel, which displays:
- Current frequency (Hz)
- Detected musical note
- Direction
- Amplitude level
- Speech recognition status
- FFT peaks
- Detected harmonics

### Scoring
- You earn points continuously for every moment the ball stays within the boundaries
- Final score is based on time survived and points accumulated
- Win condition: Survive for the full 30 seconds

### How to Play

1. Click "شروع آموزش" (Start Tutorial)
2. Grant microphone permission when prompted
3. Complete the tutorial to learn the controls
4. Use different vocal pitches to control the ball's direction
5. Try saying magic words for bonus effects!
6. Keep the ball away from the red borders
7. Survive for 30 seconds to win!

## Features

### Core Features
- ✅ Real-time pitch detection using Web Audio API
- ✅ **NEW: FFT + HPS algorithm** for superior pitch accuracy (O(n log n) instead of O(n²))
- ✅ **NEW: Musical note detection** across chromatic scale (C2-C5)
- ✅ **NEW: Web Speech Recognition API** for magic word detection
- ✅ **NEW: Enhanced debug panel** with detailed pitch analysis
- ✅ **NEW: Continuous spectrogram** with FFT visualization
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

### Pitch Detection Algorithm
The game uses the **FFT + Harmonic Product Spectrum (HPS)** algorithm for accurate pitch detection:

1. **Audio Capture**: Captures audio from microphone via `getUserMedia()`
2. **FFT Analysis**: Analyzes frequency data using Web Audio API's `AnalyserNode`
3. **HPS Processing**: 
   - Downsamples spectrum at 5 harmonic levels
   - Multiplies downsampled spectra to emphasize fundamental frequency
   - Filters out harmonic noise
4. **Note Mapping**: Maps detected frequency to closest musical note
5. **Direction Control**: Maps note to directional control based on frequency ranges
6. **Ball Control**: Updates ball velocity based on detected direction

### Speech Recognition
- Uses Web Audio Speech Recognition API
- Continuous listening for magic words
- Displays Persian translations with animations
- Plays celebratory chord on detection

### Audio Processing
- **FFT Size**: 4096 samples for high frequency resolution
- **Frequency Range**: 100-800 Hz (optimized for human voice)
- **Sample Rate**: Uses browser's default (typically 44.1kHz or 48kHz)
- **Smoothing**: 70% smoothing factor to reduce jitter
- **Volume Threshold**: 0.01 to filter out background noise
- **HPS Harmonics**: 5 harmonic levels for fundamental frequency isolation

### Musical Note System
The game maps frequencies to the chromatic scale:
- **C2 (65.41 Hz)** to **C5 (523.25 Hz)**
- Full chromatic scale with sharps (C, C#, D, D#, E, F, F#, G, G#, A, A#, B)
- Note ranges mapped to directional controls

### Physics
- Ball has velocity and acceleration
- Directional controls apply acceleration to the ball
- Drag coefficient (0.98) prevents infinite acceleration
- Max speed capping for playability
- Boundary detection triggers game over

## Files

- `index.html` - Main HTML structure with game UI and new debug/reward elements
- `style.css` - Styling with Persian font, RTL support, and new animations
- `game.js` - Game logic with FFT+HPS pitch detection, speech recognition, and physics
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
- **Web Speech Recognition API** - For detecting magic words
- **Canvas API** - For game rendering and spectrogram visualization
- **FFT + HPS Algorithm** - For accurate pitch detection
- **Vanilla JavaScript** - No external dependencies
- **CSS3 animations** - For UI effects and word rewards
- **Vazirmatn font** - For Persian text

## Browser Requirements

- Modern browser with Web Audio API support
- Speech Recognition API support (Chrome, Edge recommended)
- Microphone access permission
- HTTPS (required for microphone access on most browsers)
- Recommended: Chrome, Edge, Firefox, Safari (latest versions)

## New Features in This Update

### 1. Web Speech Recognition
- Detects spoken words "Zoom", "Escape", and "Infernal"
- Shows Persian translations with animated rewards
- Plays celebratory audio chord on detection
- Continuous listening during gameplay

### 2. FFT + HPS Pitch Detection
- Superior accuracy compared to AMDF (O(n log n) vs O(n²))
- Harmonic Product Spectrum filters noise harmonics
- 5-level harmonic analysis for fundamental frequency isolation
- Better detection of human voice fundamentals

### 3. Musical Note Detection
- Full chromatic scale support (C2 to C5)
- Maps frequencies to specific musical notes
- Note-based direction mapping for more intuitive control
- Displays detected note in debug panel

### 4. Enhanced Debug Display
- Toggle with 'D' key
- Shows frequency, note, direction, amplitude
- Displays FFT peaks (top 5)
- Shows detected harmonics
- Speech recognition status
- Real-time analysis data

### 5. Continuous Spectrogram
- Always updating, independent of game state
- Logarithmic frequency display (100-800 Hz)
- Visual FFT representation
- Color-coded by frequency and amplitude

### 6. Real-time Direction Bars
- Continuously updated proximity meters
- Shows how close current frequency is to each direction
- Active highlighting when in range
- Works independently of game state

## Testing Tips

### For Developers
1. Press 'D' to toggle debug panel and see real-time analysis
2. Open browser console to see detailed pitch detection logs
3. Test on HTTPS or localhost (required for microphone and speech recognition)
4. Use headphones to avoid feedback
5. Try different vocal sounds to test pitch ranges
6. Monitor FFT peaks and harmonics in debug panel
7. Test magic word detection by saying "Zoom", "Escape", or "Infernal"

### For Players
- Experiment with different mouth shapes to produce different pitches
- Humming works well for low pitches (LEFT)
- "ah" or "oh" sounds work for medium pitches (DOWN/UP)
- Whistling or "ee" sounds work for high pitches (RIGHT)
- Keep sounds steady for better control
- The pitch indicator bar helps you see what frequency you're producing
- Watch the spectrogram to visualize your voice
- Try the magic words for fun effects!

## Customization

### Adjusting Difficulty
In `game.js`, modify:
```javascript
const GAME_DURATION = 30; // Change game length
const BALL_SPEED = 3; // Adjust ball responsiveness
const PITCH_SMOOTHING = 0.7; // Adjust control sensitivity (0-1)
```

### Changing Note/Frequency Mappings
Modify the `PITCH_RANGES` object to adjust note ranges:
```javascript
const PITCH_RANGES = {
    LEFT: { minNote: 'C2', maxNote: 'G2', name: 'چپ ⬅️' },
    // Adjust minNote/maxNote for your needs
};
```

### Adding More Magic Words
Add to the `MAGIC_WORDS` object:
```javascript
const MAGIC_WORDS = {
    'zoom': { persian: 'زوم', color: '#00b894' },
    'newword': { persian: 'کلمه جدید', color: '#0984e3' },
    // Add your own!
};
```

## Known Limitations

1. Microphone access requires HTTPS (or localhost for development)
2. Speech Recognition API works best in Chrome and Edge browsers
3. Pitch detection accuracy varies with microphone quality
4. Background noise can interfere with detection (use noise suppression)
5. Some browsers may have different Web Audio API implementations
6. Mobile browsers may have restrictions on microphone access
7. Speech recognition may not support all languages/accents equally

## Accessibility

- Clear visual indicators for detected pitch and direction
- Large, high-contrast UI elements
- Persian language support with RTL layout
- Touch-friendly interface for mobile devices
- Clear instructions provided in-game
- Debug mode for detailed feedback
- Visual and audio feedback for all interactions

## Algorithm Details

### FFT + HPS Implementation
1. **FFT Analysis**: Converts time-domain audio to frequency domain
2. **Spectrum Extraction**: Isolates 100-800 Hz range (human voice)
3. **HPS Processing**: 
   - Creates 5 downsampled versions of spectrum
   - Multiplies them together to emphasize fundamental
   - Suppresses harmonic overtones
4. **Peak Detection**: Finds strongest peak with smoothing
5. **Note Mapping**: Maps frequency to nearest musical note
6. **Direction Output**: Determines direction from note range

### Benefits of FFT + HPS vs AMDF
- **Speed**: O(n log n) vs O(n²) - much faster
- **Accuracy**: Better fundamental frequency detection
- **Noise Rejection**: HPS filters harmonic noise effectively
- **Resolution**: Higher frequency resolution with larger FFT
- **Harmonics**: Can detect and display harmonic structure

## Future Enhancements

- [x] FFT + HPS pitch detection algorithm
- [x] Web Speech Recognition for magic words
- [x] Musical note detection system
- [x] Enhanced debug display
- [x] Continuous spectrogram visualization
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
1. دکمه "شروع آموزش" را بزنید
2. اجازه دسترسی به میکروفون را بدهید
3. آموزش را کامل کنید تا با کنترل‌ها آشنا شوید
4. با تولید صداهای مختلف با دهان خود، توپ را کنترل کنید
5. کلمات جادویی ("Zoom", "Escape", "Infernal") را بگویید!
6. توپ را 30 ثانیه در صفحه نگه دارید تا برنده شوید!

### کنترل‌های صوتی:
- نت‌های پایین (C2-G2) = چپ
- نت‌های متوسط-پایین (G#2-D3) = پایین  
- نت‌های متوسط-بالا (D#3-A3) = بالا
- نت‌های بالا (A#3-C5) = راست

### کلمات جادویی:
- "Zoom" = زوم 🟢
- "Escape" = فرار 🟡
- "Infernal" = جهنمی 🔴

### حالت دیباگ:
دکمه 'D' را بزنید برای نمایش اطلاعات تفصیلی تشخیص صدا
