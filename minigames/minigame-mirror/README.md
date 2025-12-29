# Mirror Minigame - آینه 🪞

## Overview

This is the "Mirror" minigame for the Infernal puzzle game. It features a two-stage challenge:

1. **Stage 1: Password Entry** - User must enter the correct Persian phrase: "حقیقت در سکوت است" (Truth is in silence)
2. **Stage 2: Word Ordering** - User must arrange three words (Zoom, Escape, Infernal) in the correct order using drag-and-drop

## Correct Answers

- **Password**: `حقیقت در سکوت است`
- **Word Order**: 
  - Top: Zoom
  - Middle: Escape
  - Bottom: Infernal

## Features

- Two-stage validation flow
- Impressive mirror-themed UI with animations
- Drag and drop functionality (desktop and mobile)
- Touch support for mobile devices
- Confetti animation on success
- Persian RTL support
- Responsive design
- Accessible with ARIA labels

## Integration

This minigame unlocks puzzle piece #3 in the main game. Upon successful completion, it sends a postMessage to the parent window with the puzzle number.

## Files

- `index.html` - Game structure
- `style.css` - Mirror-themed styling with animations
- `game.js` - Game logic and drag-and-drop functionality
- `README.md` - This file
