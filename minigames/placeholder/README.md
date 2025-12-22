# Mini-Game Template

This directory is for integrating mini-games with the main puzzle game.

## Structure

Each mini-game should be in its own directory under `minigames/`:

```
minigames/
├── minigame-1/
│   ├── index.html
│   ├── game.js
│   ├── style.css
│   └── README.md
├── minigame-2/
└── ...
```

## Integration API

Each mini-game should expose the following interface:

### Success Callback

When a mini-game is completed successfully, it should call:

```javascript
window.parent.postMessage({
    type: 'minigame-complete',
    success: true,
    puzzleNumber: 1 // The puzzle piece number to unlock
}, '*');
```

### Failure Callback

If the player fails:

```javascript
window.parent.postMessage({
    type: 'minigame-complete',
    success: false
}, '*');
```

### Exit

To close the mini-game:

```javascript
window.parent.postMessage({
    type: 'minigame-exit'
}, '*');
```

## Design Guidelines

1. **RTL Support**: Use `dir="rtl"` and Persian language
2. **Color Scheme**: Match the main game's color palette
3. **Responsive**: Must work on mobile devices
4. **Touch Controls**: Optimize for touch input
5. **Loading Time**: Keep assets minimal for fast loading

## Example Mini-Games

Ideas for mini-games:
1. Memory card matching
2. Simple math puzzles
3. Pattern recognition
4. Quick reflex games
5. Maze navigation
6. Color matching
7. Sequence repetition
8. Shape sorting
9. Logic puzzles

## Testing

To test a mini-game:

1. Create the mini-game in its directory
2. Link it from a treasure chest in the main game
3. Test the postMessage communication
4. Ensure proper puzzle piece unlocking

## Resources

- Main game color variables are in `src/style.css`
- Use Vazirmatn font for consistency
- Follow mobile-first design principles
