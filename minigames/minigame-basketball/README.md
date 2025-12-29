# رد نهان (Basketball Hidden Puzzle)

## نام بازی
Mini Game Basketball - Basketball Footstep Tracking Puzzle

## توضیحات
<div dir="rtl">

این یک بازی معمایی است که در آن بازیکن باید رد پاها را روی زمین بسکتبال دنبال کند و امتیاز نهایی را محاسبه کند.

### قوانین بازی
- 🔍 **بازی نهان:** باید رد پاها را دنبال کنید تا امتیاز درست را تشخیص دهید
- 📏 **قانون اول:** به ازای هر یک قدم، یک متر
- ⭐ **قانون دوم:** به اندازهٔ هر ۱ متر، یک امتیاز
- 🟠 **نقطهٔ شروع:** خط نارنجی که زیر تور قرار دارد، نقطهٔ صفر است
- 🧩 **هدف:** ترتیب حرکت را پیدا کنید و امتیاز نهایی را محاسبه کنید

</div>

## Features

### Visual Elements
- **Seven-Segment Display**: Authentic digital scoreboard with red LED segments
- **Basketball Court**: Canvas-rendered mini-map with:
  - Parallel vertical lines numbered (including decimals and negatives: -10, -5, -1.5, -1, 0, 1, 1.5, 3, 5, 7, 10, 15)
  - Orange center line (starting point) with spotlight effect
  - Three-point arc decoration
  - Basketball hoop and backboard
- **Draggable Footsteps**: 5 footsteps (👣) that users can drag and position on any line (including decimal and negative values)
- **Radar Effect**: Pulsing shimmer/spotlight on the orange center line

### Interactive Elements
- **Draggable Footsteps**: 
  - 5 footsteps that can be dragged and positioned
  - Supports drag & drop on desktop
  - Touch support for mobile devices
  - Snaps to nearest 0.5 line increment
  - Supports decimal (1.5) and negative (-1.5) line positions
- **Score Controls**: 
  - Plus (+) button to increase score
  - Minus (−) button to decrease score
  - Score range: 0-99
- **Submit Button**: Large green button with checkmark icon
- **Keyboard Support**: 
  - Arrow Up/+ to increase
  - Arrow Down/- to decrease
  - Enter to submit

### Feedback System
- **Success**: 
  - "🎉 عالی! پاسخ صحیح است! 🏀"
  - 200-piece confetti animation
  - All footsteps highlighted
  - Controls disabled
- **Error**: Contextual hints based on proximity:
  - Very close (≤3): "خیلی نزدیک هستید! 🔥"
  - Close (≤7): "نزدیک‌تر شوید! 🎯"
  - Far (>7): "دوباره رد پا‌ها را بررسی کنید! 👣"
  - Display shake animation

## Solution

**Correct Answer: 15**

### User Configuration
Players can drag 5 footsteps to different line positions (including decimals and negatives) to solve the puzzle. The final score is calculated based on the footstep positions they choose.

Example solution path:
1. Footstep 1 at line 0 → Start (0 points)
2. Footstep 2 at line 3 → 3 points
3. Footstep 3 at line 5 → 5 points
4. Footstep 4 at line 8 → 8 points
5. Footstep 5 at line 15 → **15 points (FINAL)**

## Technical Details

### Files
- `index.html` - HTML structure with Persian RTL support
- `style.css` - Responsive CSS with animations and draggable styles
- `game.js` - Game logic with Canvas rendering and drag & drop

### Dependencies
- No external libraries required
- Uses native Canvas API
- Uses Web Audio API for sounds
- Uses HTML5 Drag and Drop API
- Touch events for mobile support

### Browser Support
- Modern browsers (Chrome, Firefox, Safari, Edge)
- Mobile responsive (320px+)
- Touch and mouse input supported
- Drag and drop on desktop
- Touch drag on mobile

### Integration
Posts message on completion:
```javascript
{
  type: 'minigame-complete',
  success: true,
  puzzleNumber: 'basketball',
  answer: 15
}
```

## Styling

### Color Scheme
- Primary: Orange (`#ff8c42`) - Basketball theme
- Secondary: Red (`#ff6b6b`)
- Success: Green (`#00b894`)
- Court: Brown (`#c17b3a`)
- Segments: Red LED (`#ff3333`)

### Animations
- `radar-pulse`: 3s pulsing spotlight effect
- `footstep-appear`: 0.5s sequential appearance
- `footstep-glow`: 1.5s highlight pulse
- `shake`: 0.5s error feedback
- `success-pulse`: 0.6s success celebration

## Accessibility

- ARIA labels on all buttons
- Keyboard navigation support
- High contrast colors
- Large touch targets (60px+ buttons)
- RTL text direction for Persian

## Responsive Breakpoints

- **Desktop**: 1200px+ (default)
- **Tablet**: 768px
- **Mobile**: 480px
- **Small Mobile**: 320px

## Development

### Running Locally
```bash
cd minigames/minigame-basketball
# Open index.html in browser
# Or serve via development server
```

### Testing
1. Load the page
2. Observe footsteps appearing sequentially
3. Use +/- buttons to adjust score
4. Submit various answers to test feedback
5. Submit 15 to see success state

## Credits

Created for the اینفرنال (Infernal) puzzle game collection.
