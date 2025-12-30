# 🔐 CAPTCHA System - Quick Start

## What is this?

A **mind-blowingly beautiful** CAPTCHA system that:
- ✨ Works completely **offline**
- 🎨 Features **vibrant, dark-mode** design
- 📱 Is **HD quality** and responsive
- 🔤 Is **case-insensitive** and treats similar characters as equal (0/o, i/1/l, etc.)
- 🚀 Loads **instantly** with smooth animations

## Demo

Visit `/captcha-demo` in your browser to see it in action!

## Quick Integration

### 1. Add to Any Form (Vue)

```vue
<template>
  <form @submit.prevent="handleSubmit">
    <!-- Your form fields -->
    <input v-model="email" type="email" />
    
    <!-- CAPTCHA -->
    <CaptchaInput ref="captchaRef" />
    
    <button type="submit">Submit</button>
  </form>
</template>

<script setup>
import { ref } from 'vue'
import { useCaptcha } from '~/composables/useCaptcha'
import CaptchaInput from '~/components/CaptchaInput.vue'

const captchaRef = ref(null)
const { verifyCaptcha } = useCaptcha()

async function handleSubmit() {
  const code = captchaRef.value?.getValue()
  const isValid = await verifyCaptcha(code)
  
  if (!isValid) {
    captchaRef.value?.setVerified(false, 'کد اشتباه است')
    return
  }
  
  captchaRef.value?.setVerified(true)
  // Continue with form submission...
}
</script>
```

### 2. API Endpoints

**Generate CAPTCHA:**
```bash
GET /api/captcha/generate
```

**Verify CAPTCHA:**
```bash
POST /api/captcha/verify
Content-Type: application/json

{
  "captcha": "ABC123"
}
```

**Refresh CAPTCHA:**
```bash
GET /api/captcha/refresh
```

## Character Aliasing Guide

These characters are treated as **equivalent**:

| Group | Characters | Example |
|-------|-----------|---------|
| Zero/O | `0`, `o`, `O` | `A0BC` = `AoBC` = `AOBC` |
| One/I/L | `1`, `i`, `I`, `l`, `L` | `1ABC` = `iABC` = `lABC` |
| Seven/One | `7`, `1` | `7ABC` = `1ABC` |
| Z/Two | `z`, `Z`, `2` | `2ABC` = `zABC` |
| S/Five | `s`, `S`, `5` | `5ABC` = `sABC` |
| G/Nine | `g`, `G`, `9` | `9ABC` = `gABC` |
| B/Eight | `b`, `B`, `8` | `8ABC` = `bABC` |

## Testing

### Backend Test
```bash
cd packages/backend
node --import tsx/esm test-captcha.ts
```

### Frontend Demo
```
http://localhost:3000/captcha-demo
```

## Features

✅ **Offline**: No external dependencies  
✅ **HD Quality**: SVG-based, perfect at any resolution  
✅ **Dark Mode**: Beautiful vibrant colors  
✅ **User Friendly**: Character aliasing reduces errors  
✅ **Case Insensitive**: Type in any case  
✅ **Secure**: Session-based, one-time use, time-limited  
✅ **Fast**: Generates in ~5ms  
✅ **Responsive**: Works on all devices  

## Where It's Used

Currently integrated in:
- ✅ Registration form (`/welcome`)
- ✅ Sign-in form (`/welcome`)
- 📋 Can be added to answer submissions
- 📋 Can be added to any sensitive action

## Configuration

No configuration needed! Works out of the box.

**Optional:** Customize colors in `CaptchaService.ts`:
```typescript
private readonly COLOR_PALETTES = {
  neon: ['#ff006e', '#fb5607', '#ffbe0b', '#8338ec', '#3a86ff'],
  // Add your custom palette
}
```

## Full Documentation

See [captcha-system.md](./captcha-system.md) for complete details.

---

Made with 💜 for the اینفرنال project
