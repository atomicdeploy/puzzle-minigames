# رد بسکتبال نهان (Basketball Hidden Puzzle)

## نام بازی
Mini Game 3 - Basketball Footstep Tracking Puzzle

## توضیحات
<div dir="rtl">

این یک بازی معمایی است که در آن بازیکن باید رد پاها را روی زمین بسکتبال دنبال کند و امتیاز نهایی را محاسبه کند.

### قوانین بازی
- 🔍 **بازی نهان:** باید رد پاها را دنبال کنید تا امتیاز درست را تشخیص دهید
- 📏 **قانون اول:** به ازای هر یک قدم، یک متر
- ⭐ **قانون دوم:** به اندازهٔ هر ۱ متر، یک امتیاز
- 🧡 **نقطهٔ شروع:** خط نارنجی که زیر نور قرار دارد، نقطهٔ صفر است
- 🎯 **مثال:** اگر از ۵ متری توپ را به سبد انداخت، ۵ امتیاز می‌گیرد
- 🧩 **هدف:** ترتیب حرکت را پیدا کنید و امتیاز نهایی را محاسبه کنید

</div>

## Features

### Visual Elements
- **Seven-Segment Display**: Authentic digital scoreboard with red LED segments
- **Basketball Court**: Canvas-rendered mini-map with:
  - Parallel vertical lines numbered (0, 3, 5, 7, 10, 15)
  - Orange center line (starting point) with spotlight effect
  - Three-point arc decoration
  - Basketball hoop and backboard
- **Animated Footsteps**: 9 footsteps (👣) that appear sequentially
- **Radar Effect**: Pulsing shimmer/spotlight on the orange center line

### Interactive Elements
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

### Footstep Sequence
The footsteps follow this path from the orange center line (line 0):

1. Line 0 → Start (0 points)
2. Line 3 → +3 (3 points)
3. Line 5 → +2 (5 points total)
4. Line 2 → -3 (2 points)
5. Line 7 → +5 (7 points)
6. Line 8 → +1 (8 points)
7. Line 3 → -5 (3 points)
8. Line 8 → +5 (8 points)
9. Line 15 → +7 (**15 points - FINAL**)

## Technical Details

### Files
- `index.html` - HTML structure with Persian RTL support
- `style.css` - Responsive CSS with animations
- `game.js` - Game logic and Canvas rendering

### Dependencies
- No external libraries required
- Uses native Canvas API
- Uses Web Audio API for sounds

### Browser Support
- Modern browsers (Chrome, Firefox, Safari, Edge)
- Mobile responsive (320px+)
- Touch and mouse input supported

### Integration
Posts message on completion:
```javascript
{
  type: 'minigame-complete',
  success: true,
  puzzleNumber: 3,
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
cd minigames/minigame-3
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
