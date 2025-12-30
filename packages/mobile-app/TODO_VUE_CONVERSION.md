# TODO: Vue Component Conversion

## Overview

The HTML pages have been successfully moved to Vue component locations using `git mv` to preserve git history:
- `packages/mobile-app/app/pages/welcome.vue`
- `packages/mobile-app/app/pages/qr-generator.vue`
- `packages/mobile-app/app/pages/minigame-access.vue`

However, these files still contain full HTML structure (DOCTYPE, html, head, body tags) and need to be converted to proper Vue Single File Components.

## What Needs to Be Done

### 1. Convert to Vue SFC Format

Each page should be converted from:
```html
<!DOCTYPE html>
<html lang="fa" dir="rtl">
<head>
    <meta charset="UTF-8">
    <title>Page Title</title>
    <link rel="stylesheet" href="/src/style.css">
</head>
<body>
    <div id="app">
        <!-- content -->
    </div>
    <script src="/src/script.js"></script>
</body>
</html>
```

To Vue SFC format:
```vue
<template>
  <div>
    <!-- content -->
  </div>
</template>

<script setup>
// JavaScript logic here
import { ref, onMounted } from 'vue';
// ...
</script>

<style scoped lang="scss">
// Styles here or import from assets
@import '@/assets/scss/page-specific.scss';
</style>
```

### 2. Extract and Integrate JavaScript

The legacy JavaScript files in `packages/mobile-app/src/` need to be:
- Converted to Vue composables
- Integrated into the Vue components
- Use Vue's reactivity system (ref, reactive, computed)

Files to convert:
- `src/welcome.js` → integrate into `app/pages/welcome.vue`
- `src/qr-generator.js` → integrate into `app/pages/qr-generator.vue`
- `src/minigame-access.js` → integrate into `app/pages/minigame-access.vue`
- `src/api.js` → convert to `app/composables/useApi.js` or similar

### 3. Migrate CSS to SCSS

The CSS files in `packages/mobile-app/src/` should be:
- Already moved to `app/assets/scss/` as `.scss` files
- Need to be imported in components or in main.scss
- Use SCSS variables and nesting

Files already moved:
- ✅ `src/minigame-access.css` → `app/assets/scss/minigame-access.scss`
- ✅ `src/qr-generator.css` → `app/assets/scss/qr-generator.scss`

Still in src:
- `src/welcome.css` → should move to `app/assets/scss/welcome.scss`

### 4. Update Meta Tags and Head

Meta tags should be configured in:
- `nuxt.config.ts` for global meta
- `useHead()` or `useSeoMeta()` composables in pages for page-specific meta

Example:
```vue
<script setup>
useHead({
  title: 'خوش آمدید به اینفرنال',
  meta: [
    { name: 'description', content: 'اتاق فرار محیطی - رویداد بازیهای فکری دانشگاه هنر' }
  ]
})
</script>
```

### 5. Handle External Dependencies

Libraries imported via CDN or script tags need to be:
- Added to package.json if not already present
- Imported properly in Vue components
- Used via Vue's reactivity system

Example libraries to check:
- QRCode generation library
- Three.js for 3D graphics
- Matter.js for physics
- Socket.io client

## Step-by-Step Conversion Guide

### For Each Page:

1. **Backup** (already done via git)
   ```bash
   git log --follow packages/mobile-app/app/pages/welcome.vue
   # History is preserved from the original HTML file
   ```

2. **Extract Content**
   - Copy the content inside `<body>` to `<template>` section
   - Remove wrapping `<div id="app">` (Vue handles this)

3. **Extract Scripts**
   - Move JavaScript to `<script setup>` section
   - Convert to Vue composition API
   - Import necessary functions from Vue

4. **Extract Styles**
   - Import SCSS from assets
   - Or add scoped styles inline

5. **Configure Head**
   - Use `useHead()` for page-specific meta tags

6. **Test Thoroughly**
   - Ensure all functionality works
   - Check routing works
   - Verify styles are applied
   - Test interactivity

## Priority Order

1. **welcome.vue** (simplest, good starting point)
2. **minigame-access.vue** (medium complexity)
3. **qr-generator.vue** (most complex, has QR generation logic)

## Code Review Items to Address

From the code review, these should be addressed during conversion:

1. **welcome.vue**: Remove DOCTYPE and html structure tags
2. **qr-generator.js**: Make QR styling configuration more prominent
3. **minigame-access.js**: Implement proper backend token validation
4. **Minigame logic**: Make puzzle solutions configurable

## Testing Checklist

After conversion, verify:
- [ ] Page renders correctly in browser
- [ ] Nuxt routing works (`/welcome`, `/qr-generator`, `/minigame-access`)
- [ ] Styles are applied correctly (RTL support, colors, layout)
- [ ] JavaScript functionality works (forms, interactions, API calls)
- [ ] Socket.io connection works (if applicable)
- [ ] Meta tags appear in page source
- [ ] Mobile responsiveness maintained
- [ ] No console errors
- [ ] Git history still accessible via `git log --follow`

## Resources

- [Nuxt 3 Pages Documentation](https://nuxt.com/docs/guide/directory-structure/pages)
- [Vue 3 Composition API](https://vuejs.org/guide/extras/composition-api-faq.html)
- [useHead() Composable](https://nuxt.com/docs/api/composables/use-head)
- [Nuxt 3 Assets](https://nuxt.com/docs/guide/directory-structure/assets)
- [Vue SFC Syntax](https://vuejs.org/guide/scaling-up/sfc.html)

## Notes

- This conversion is a **separate task** from the directory structure cleanup
- The current PR has successfully moved files to correct locations with `git mv`
- Git history is preserved for all moved files
- The conversion should be done incrementally, one page at a time
- Each converted page should be tested before moving to the next
- Consider creating a separate branch/PR for this conversion work

## Related Files

- `packages/mobile-app/nuxt.config.ts` - Already configured with runtimeConfig
- `packages/mobile-app/app/app.vue` - Root component (handles html/body)
- `packages/mobile-app/app/composables/` - Place for shared composables
- `packages/mobile-app/app/assets/scss/` - Centralized SCSS files
