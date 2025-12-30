# Welcome Page Documentation

## Overview
The welcome/onboarding page (`welcome.html`) provides a complete user registration and authentication flow for the اینفرنال (Infernal) escape room game.

## Features

### 1. Welcome Screen
- Beautiful landing page with game branding
- Event information display
- Call-to-action button to start the tour

### 2. Interactive Tour
Four-step guide explaining:
- Finding hidden QR codes in the environment
- Scanning QR codes to discover puzzles
- Solving puzzle challenges
- Winning the game

### 3. Authentication Flow
Users can choose between:
- **New Registration**: Complete form with validation
- **Sign In**: Login with existing phone number

### 4. Registration Form
Comprehensive form with the following fields:
- **Profile Picture** (Optional): Upload and preview
- **Full Name** (Required): Text input with validation
- **Birthday** (Required): Date picker
- **Gender** (Required): Radio buttons (Male/Female/Prefer not to say)
- **Education Level** (Required): Dropdown with Persian education levels
- **Field of Study** (Required): Text input
- **Phone Number** (Required): Iranian mobile number format (09xxxxxxxxx)
- **Favorite Color** (Required): 8 vibrant colors to choose from

### 5. OTP Verification
- 6-digit OTP input with smart features:
  - Auto-focus on first input
  - Auto-advance to next digit
  - Backspace navigation
  - Paste support for full OTP code
  - Secure generation using Web Crypto API
- Resend OTP functionality
- Visual feedback for errors

### 6. Success Screen
- Displays user information
- Shows generated Player ID (format: INF-TIMESTAMP-RANDOM)
- Displays selected color
- Shows profile picture if uploaded
- Game instructions checklist
- Good luck message
- Button to start the game

## Technical Implementation

### File Structure
```
puzzle-minigames/
├── welcome.html           # Main welcome page
├── src/
│   ├── welcome.css       # Styles and animations
│   └── welcome.js        # Logic and validation
└── vite.config.js        # Updated for multi-page build
```

### Security Features
- ✅ Cryptographically secure OTP generation (crypto.getRandomValues)
- ✅ Phone number format validation
- ✅ Input sanitization
- ✅ Error handling for localStorage operations
- ✅ XSS protection through proper escaping

### Data Flow
1. User fills registration form
2. Form validation runs
3. OTP sent to phone number (simulated in dev)
4. User verifies OTP
5. Player ID generated
6. Data saved to localStorage
7. Redirect to main game

### LocalStorage Schema
```javascript
// Key: 'infernal-current-user'
{
  name: "علی احمدی",
  birthday: "2000-01-15",
  gender: "male",
  educationLevel: "bachelor",
  fieldOfStudy: "مهندسی کامپیوتر",
  phone: "09123456789",
  color: "#6c5ce7",
  playerId: "INF-MJQOYXUM-IFH6",
  profilePicture: "data:image/jpeg;base64,...", // Optional
  createdAt: "2024-12-29T05:00:00.000Z"
}

// Key: 'infernal-users' (all registered users)
{
  "09123456789": { /* user data */ },
  "09111111111": { /* user data */ }
}
```

## Integration with Main Game

The welcome page integrates seamlessly with the main game:

1. **Authentication Check**: `src/main.js` checks for logged-in user
2. **Redirect Logic**: Redirects to welcome page if not authenticated
3. **Personalized Greeting**: Shows "سلام [FirstName]!" in game header
4. **Session Persistence**: User stays logged in across page refreshes

## Styling & Design

### Color Palette
- Primary: `#6c5ce7` (Purple)
- Secondary: `#fd79a8` (Pink)
- Success: `#00b894` (Green)
- Error: `#d63031` (Red)
- Background: Gradient from `#0f0e17` to `#16213e`

### Animations
- Screen transitions: Smooth fade and slide
- Button hover effects
- Form validation feedback
- Success celebration animations
- Loading spinners

### Responsive Design
- Mobile-first approach
- Breakpoints at 768px and 480px
- Touch-friendly tap targets
- Optimized for all screen sizes

## Usage

### For Development
```bash
npm run dev
# Visit http://localhost:3000/welcome.html
```

### For Production Build
```bash
npm run build
# welcome.html will be in dist/ folder
```

### Testing Flow
1. Clear localStorage: `localStorage.clear()`
2. Navigate to `/` or `/index.html`
3. Should automatically redirect to `/welcome.html`
4. Complete registration flow
5. Will redirect to main game with personalized greeting

## Customization

### Change Colors
Edit color variables in `src/welcome.css`:
```css
:root {
    --primary-color: #6c5ce7;
    --secondary-color: #fd79a8;
    /* ... */
}
```

### Modify Form Fields
Edit `welcome.html` to add/remove form fields, then update validation in `src/welcome.js`.

### Change OTP Length
Modify the OTP generation and input handling in `src/welcome.js`:
```javascript
// Current: 6-digit OTP
// Change to 4-digit:
const randomValues = new Uint32Array(1);
crypto.getRandomValues(randomValues);
state.otpCode = (1000 + (randomValues[0] % 9000)).toString();
```

## Browser Support
- Chrome/Edge (latest)
- Firefox (latest)
- Safari (iOS 12+)
- Chrome Mobile (Android 5+)

## Known Limitations
1. OTP is simulated (logged to console) - needs backend integration
2. Sign-in checks localStorage only - needs backend authentication
3. Profile pictures stored in localStorage (size limitations)
4. No email verification (phone-only authentication)

## Future Enhancements
- [ ] Backend API integration for real OTP sending
- [ ] Email verification option
- [ ] Social media login (Google, etc.)
- [ ] Multi-language support
- [ ] Forgot password flow
- [ ] Profile picture compression
- [ ] Analytics tracking
- [ ] A/B testing different flows

## Support
For issues or questions, contact the development team or create an issue in the repository.
