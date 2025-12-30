# AR Quick Start Guide 🚀

## Setup (One-Time)

### 1. Print the Marker
Download and print: [Hiro Marker](https://github.com/AR-js-org/AR.js/blob/master/data/images/hiro.png)
- Paper: White, A4 or Letter
- Size: At least 10×10 cm
- Keep flat and clean

### 2. Prepare Device
- Ensure good lighting
- Grant camera permissions
- Use HTTPS (production) or localhost (dev)

## Using AR Mode

### Quick Steps
1. **Open** the game
2. **Click** 📷 AR button (top left)
3. **Point** camera at Hiro marker
4. **Tap** on treasure chests to unlock
5. **Close** with ✕ button when done

### Tips for Best Results
- **Distance**: 20-50 cm from marker
- **Angle**: Hold camera perpendicular to marker
- **Lighting**: Bright, even lighting (no glare)
- **Stability**: Hold device steady
- **Marker**: Keep marker flat and fully visible

## Troubleshooting

### Marker Not Detected
- Move closer to marker
- Improve lighting
- Ensure marker is flat
- Check marker print quality

### Camera Not Working
- Grant camera permissions
- Use HTTPS or localhost
- Check browser compatibility
- Restart browser if needed

### Poor Performance
- Close other apps/tabs
- Use better lighting
- Update browser
- Try a newer device

## Technical Info

### Browser Support
- ✅ Chrome/Edge Mobile (Android)
- ✅ Safari (iOS 11+)
- ✅ Firefox Mobile
- ⚠️ Desktop (with webcam)

### Requirements
- Camera-enabled device
- HTTPS (production only)
- Modern browser
- Hiro marker

### Tested On
- Android 9+
- iOS 11+
- Chrome 90+
- Safari 14+

## Development

### Run Locally
```bash
npm install
npm run dev
# Open http://localhost:3000
```

### Build
```bash
npm run build
# Output: dist/
```

### Enable AR
Click the 📷 AR button in the header

## Resources

- [Full AR Guide](./AR-GUIDE.md)
- [Main README](./README.md)
- [AR.js Docs](https://ar-js-org.github.io/AR.js-Docs/)
- [Hiro Marker](https://github.com/AR-js-org/AR.js/blob/master/data/images/hiro.png)

## FAQ

**Q: Do I need an internet connection?**
A: Yes, for AR.js CDN. Future: can be bundled offline.

**Q: Can I use a different marker?**
A: Yes! See AR-GUIDE.md for custom markers.

**Q: Does it work on desktop?**
A: Yes, with a webcam, but optimized for mobile.

**Q: Is my data private?**
A: Yes! All AR processing is local. No data sent to servers.

**Q: Why HTTPS?**
A: Modern browsers require HTTPS for camera access (security).

---

<div dir="rtl">

## راهنمای سریع فارسی

### مراحل استفاده

1. **چاپ مارکر**: [دانلود مارکر Hiro](https://github.com/AR-js-org/AR.js/blob/master/data/images/hiro.png)
2. **باز کردن بازی** و کلیک روی دکمه 📷 AR
3. **گرفتن دوربین** روی مارکر
4. **کلیک روی صندوق‌ها** برای کشف پازل‌ها
5. **بستن** با دکمه ✕

### نکات مهم
- فاصله 20-50 سانتی‌متر از مارکر
- نور مناسب و بدون سایه
- مارکر صاف و کامل در دید دوربین
- دستگاه ثابت نگه دارید

</div>
