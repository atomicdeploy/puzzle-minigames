# QR Code Generator System Documentation

## Overview

This system provides a comprehensive QR code generation and validation solution for the puzzle minigame platform. It enables Game Masters to generate secure access codes for players and validates access when QR codes are scanned.

## Quick Start

### Before First Use

**Important:** Configure your production URL before generating QR codes:

1. Open `/src/qr-generator.js`
2. Update the `baseUrl` in the state object:
   ```javascript
   baseUrl: 'https://yourdomain.com/minigame-access',
   ```
3. Replace `yourdomain.com` with your actual domain
4. Rebuild the application: `npm run build`

Alternatively, you can enter the URL directly in the QR generator interface each time.

## Components

### 1. QR Code Generator (`/qr-generator.html`)

A web-based tool for Game Masters to generate QR codes for all 9 minigames.

#### Features

- **Real-time Preview**: See QR code changes instantly as you adjust settings
- **Batch Generation**: Automatically generates 9 QR codes (one per minigame)
- **UUID Security**: Each QR code contains a unique UUID v4 token
- **Customization Options**:
  - QR Code color (foreground)
  - Background color
  - Error correction level (L, M, Q, H)
  - Margin/padding (0-10 modules)
  - Scale factor (5-30 for DPI control)
  - Custom logo overlay (center placement)
- **High-Resolution Export**: 300 DPI images suitable for printing
- **ZIP Download**: All QR codes packaged with metadata in one file

#### Usage

1. Navigate to `/qr-generator.html`
2. Enter your base URL (e.g., `https://yourdomain.com/minigame-access`)
3. Customize appearance settings:
   - Adjust colors for branding
   - Set error correction level (higher = more resilient, allows logo overlay)
   - Adjust margin and scale for print quality
   - Optionally upload a logo
4. Click "🔄 تولید QR Codeها" (Generate QR Codes)
5. Review the preview and grid of all 9 codes
6. Click "📥 دانلود فایل ZIP" (Download ZIP) to get all files

#### Downloaded Package Contents

The ZIP file contains:
- `minigame-[1-9]-qr-code.png`: High-resolution QR code images (300 DPI)
- `tokens.json`: JSON file with all tokens and URLs
- `README.txt`: Documentation in Persian

### 2. Minigame Access Page (`/minigame-access.html`)

The landing page players reach when scanning a QR code. It validates access and redirects to the appropriate minigame.

#### URL Parameters

- `game`: Minigame number (1-9)
- `token`: UUID v4 access token

Example: `https://example.com/minigame-access?game=1&token=ad529222-795a-4702-9693-242ecfdd7a0e`

#### Validation Flow

1. **Loading State**: Shows while validating
2. **Parameter Check**: Verifies both `game` and `token` parameters exist
3. **Game Number Validation**: Ensures game number is between 1-9
4. **Token Format Validation**: Verifies token is a valid UUID v4
5. **Access Decision**:
   - ✅ **Access Granted**: Valid parameters → Show game info and start button
   - ❌ **Access Denied**: Invalid token → Show error with reasons
   - ⚠️ **Invalid URL**: Missing parameters → Show instruction page

#### Access Granted Page

Displays:
- Success confirmation (✅)
- Minigame number
- Game description
- Access token (for reference)
- "🎮 شروع بازی" (Start Game) button

Clicking the start button redirects to the main game with the puzzle unlocked.

#### Access Denied Page

Shows:
- Error icon (❌)
- Error message explaining the issue
- Possible reasons for denial
- Retry button
- Link back to main page

### 3. Main Game Integration

The main game (`/index.html`) now supports automatic puzzle unlocking via QR codes.

#### QR Unlock Flow

1. Player scans QR code → redirected to minigame access page
2. After validation, click "Start Game" → redirected to main game with parameters
3. Main game reads `unlock` and `token` URL parameters
4. Automatically unlocks the corresponding treasure chest
5. Shows notification: "🎉 مینی‌گیم X از طریق QR Code باز شد!"
6. Cleans up URL parameters from browser history

## Security Considerations

### Token Validation

The current implementation validates:
- ✅ UUID format (v4 pattern)
- ✅ Game number range (1-9)
- ✅ Parameter presence

### Recommended Enhancements for Production

For a production environment, consider adding:

1. **Backend Validation**:
   ```javascript
   // Example API call
   const response = await fetch('/api/validate-token', {
     method: 'POST',
     headers: { 'Content-Type': 'application/json' },
     body: JSON.stringify({ game: gameNumber, token: token })
   });
   const { valid, reason } = await response.json();
   ```

2. **Token Database**:
   - Store tokens in a database
   - Track usage (single-use vs. multi-use)
   - Set expiration dates
   - Log access attempts

3. **Rate Limiting**:
   - Prevent brute force attacks
   - Limit validation attempts per IP

4. **Token Revocation**:
   - Allow Game Masters to revoke tokens
   - Blacklist compromised tokens

5. **Encryption**:
   - Use HTTPS only
   - Consider JWTs for additional claims
   - Add digital signatures

## Technical Details

### Dependencies

```json
{
  "qrcode": "^1.5.4",      // QR code generation
  "uuid": "^13.0.0",        // UUID generation
  "jszip": "^3.10.1"        // ZIP file creation
}
```

### QR Code Specifications

- **Format**: PNG
- **Default DPI**: 300 (configurable via scale)
- **Error Correction Levels**:
  - L (Low): 7% recovery
  - M (Medium): 15% recovery (default)
  - Q (Quartile): 25% recovery
  - H (High): 30% recovery
- **Color Space**: RGB (convert to CMYK for professional printing)

### Browser Compatibility

- Modern browsers (Chrome, Firefox, Safari, Edge)
- Mobile browsers (iOS Safari, Chrome Mobile)
- PWA support via Vite PWA plugin

## Customization Guide

### Changing Base URL

Edit the default value in `/qr-generator.html`:
```html
<input 
    type="url" 
    id="baseUrl" 
    value="https://yourdomain.com/minigame-access"
>
```

### Styling QR Codes

Colors can be customized via the UI, or set defaults in `/src/qr-generator.js`:
```javascript
const state = {
    settings: {
        qrColor: '#000000',  // Change default foreground color
        bgColor: '#ffffff',  // Change default background color
        // ...
    }
};
```

### Game Descriptions

Edit descriptions in `/src/minigame-access.js`:
```javascript
function getGameDescription(gameNumber) {
    const descriptions = {
        1: 'Your custom description',
        2: 'Another description',
        // ...
    };
    return descriptions[gameNumber];
}
```

### Logo Overlay

For best results with logo overlays:
1. Use a square logo (1:1 aspect ratio)
2. Use high error correction (Q or H level)
3. Logo should be simple with high contrast
4. Recommended logo size: 20% of QR code size (automatic)

## Troubleshooting

### QR Code Not Scanning

1. Check error correction level (increase for damaged codes)
2. Ensure sufficient contrast between foreground and background
3. Verify margin/quiet zone is adequate (minimum 4 modules)
4. Test with multiple QR code scanning apps
5. Ensure printed size is adequate (minimum 2cm × 2cm)

### Access Validation Failing

1. Verify URL parameters are correctly formatted
2. Check token is a valid UUID v4
3. Ensure game number is 1-9
4. Check browser console for errors
5. Verify localStorage is enabled

### ZIP Download Issues

1. Check browser allows downloads
2. Verify sufficient disk space
3. Try a different browser
4. Check console for JavaScript errors

## API Reference

### QR Generator Functions

```javascript
// Generate a single QR code canvas
async function generateQRCanvas(data)

// Build minigame access URL
function buildUrl(gameNumber, token)

// Generate all 9 QR codes
async function generateAllQRCodes()

// Download ZIP package
async function downloadZip()
```

### Minigame Access Functions

```javascript
// Parse URL parameters
function getUrlParams()

// Validate UUID format
function isValidUUID(uuid)

// Validate game number
function isValidGameNumber(gameNumber)

// Verify token (customize for backend integration)
async function verifyToken(gameNumber, token)
```

## Deployment Checklist

- [ ] Set production base URL in QR generator
- [ ] Implement backend token validation
- [ ] Set up token database
- [ ] Configure HTTPS
- [ ] Add rate limiting
- [ ] Test QR codes after printing
- [ ] Document token management procedures
- [ ] Train Game Masters on usage
- [ ] Set up monitoring and logging
- [ ] Create backup procedure for tokens

## Support

For issues or questions:
1. Check this documentation
2. Review console logs for errors
3. Test in different browsers
4. Verify network connectivity
5. Check token validity

## License

MIT License - See project root LICENSE file
