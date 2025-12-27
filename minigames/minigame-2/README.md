# Mini-Game 2: White Ball's Weight (وزن توپ سفید)

## Description

This is an interactive physics-based puzzle game where players need to figure out the weight of a white ball using a balanced scale system.

## Game Mechanics

### Setup
- **Main Scale (Left)**: Contains 3 balls - ⚪🔴⚪ (white, red, white)
- **Main Scale (Right)**: Contains a nested smaller scale
- **Nested Scale (Left)**: Contains 3 red balls - 🔴🔴🔴
- **Nested Scale (Right)**: Contains 1 green ball labeled "30" (🟢 = 30)

### Objective
The player needs to determine the weight of the white ball (⚪ = ❓)

### Solution Logic
The scales are in perfect balance:
- Left side of main scale: 2 white balls + 1 red ball = 2W + R
- Right side of main scale equals the nested scale's total weight

For the nested scale:
- Left side: 3 red balls = 3R
- Right side: 1 green ball = 30

For the nested scale to be balanced: 3R = 30, therefore R = 10

For the main scale to be balanced:
- Left side = Right side
- 2W + R = 3R (the weight of red balls on nested scale's left side)
- 2W + 10 = 30
- 2W = 20
- **W = 10**

### Answer: The white ball weighs **10** units.

## Features

- ✅ Real physics engine using Matter.js
- ✅ Interactive ball dragging
- ✅ Visual feedback for correct/incorrect answers
- ✅ Confetti animation on success
- ✅ Scale tipping animation on error
- ✅ Mobile-optimized touch controls
- ✅ RTL (Right-to-Left) Persian language support
- ✅ Responsive design for all screen sizes
- ✅ Integration with main game via postMessage API

## Files

- `index.html` - Main HTML structure
- `style.css` - Styling with Persian font and RTL support
- `game.js` - Game logic with Matter.js physics engine
- `README.md` - This file

## Integration

The minigame communicates with the parent window using the postMessage API:

```javascript
// On success
window.parent.postMessage({
    type: 'minigame-complete',
    success: true,
    puzzleNumber: 2,
    answer: 5
}, '*');
```

## Technologies

- Matter.js - 2D physics engine
- Vanilla JavaScript
- CSS3 animations
- HTML5 Canvas for confetti effect
- Vazirmatn font for Persian text

## How to Play

1. Observe the balanced scales
2. Note that the green ball = 30
3. Calculate the weight relationships
4. Enter your answer in the input field
5. Press "تأیید" (Confirm) to submit
6. If correct, confetti plays and you win!
7. If incorrect, the scale tips over

## Testing

To test this minigame:
1. Open `index.html` in a browser
2. Try dragging the balls around
3. Enter different answers to see success/error states
4. Test on mobile devices for touch interaction
