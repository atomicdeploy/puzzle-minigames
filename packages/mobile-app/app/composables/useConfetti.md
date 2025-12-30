# useConfetti Composable

A reusable Vue composable for playing confetti animations in your Nuxt 3 application.

## Features

- 🎉 Easy-to-use confetti animation
- 🎨 Customizable colors, particle count, and duration
- 🔄 Auto-stop when particles fall off screen
- 🧹 Automatic cleanup on component unmount
- 📱 Mobile and desktop compatible
- ♿ Non-intrusive (pointer-events: none)

## Installation

The composable is already available at `~/composables/useConfetti.js` in your Nuxt 3 app.

## Basic Usage

```vue
<template>
  <div>
    <canvas ref="confettiCanvas" class="confetti-canvas"></canvas>
    <button @click="celebrate">🎉 Celebrate!</button>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useConfetti } from '~/composables/useConfetti';

const confettiCanvas = ref(null);
const { playConfetti, stopConfetti } = useConfetti();

function celebrate() {
  playConfetti(confettiCanvas.value);
}
</script>

<style scoped>
.confetti-canvas {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 9999;
}
</style>
```

## Advanced Usage

### Custom Colors

```javascript
playConfetti(confettiCanvas.value, {
  colors: ['#ff0000', '#00ff00', '#0000ff', '#ffff00']
});
```

### Custom Particle Count

```javascript
playConfetti(confettiCanvas.value, {
  particleCount: 300  // More confetti!
});
```

### Fixed Duration

```javascript
playConfetti(confettiCanvas.value, {
  duration: 5000,      // 5 seconds
  autoStop: false      // Don't auto-stop when particles fall off
});
```

### Full Customization

```javascript
playConfetti(confettiCanvas.value, {
  particleCount: 150,
  colors: ['#ff8c42', '#ff6b6b', '#00b894', '#4ecdc4', '#fdcb6e', '#6c5ce7'],
  duration: 4000,
  autoStop: true
});
```

## API

### `playConfetti(canvas, options)`

Starts the confetti animation.

**Parameters:**
- `canvas` (HTMLCanvasElement | Ref): Canvas element or Vue ref to canvas element
- `options` (Object): Configuration options
  - `particleCount` (number): Number of confetti particles (default: 200)
  - `colors` (string[]): Array of color hex codes (default: ['#ff8c42', '#ff6b6b', '#00b894', '#4ecdc4', '#fdcb6e', '#6c5ce7'])
  - `duration` (number): Animation duration in milliseconds (default: 3000)
  - `autoStop` (boolean): Auto-stop when particles fall off screen (default: true)

### `stopConfetti()`

Stops the confetti animation and clears the canvas.

### `isPlaying()`

Returns `true` if confetti animation is currently playing, `false` otherwise.

## Examples

### Success Message with Confetti

```vue
<template>
  <div>
    <canvas ref="confettiCanvas" class="confetti-canvas"></canvas>
    <form @submit.prevent="handleSubmit">
      <!-- form fields -->
      <button type="submit">Submit</button>
    </form>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useConfetti } from '~/composables/useConfetti';

const confettiCanvas = ref(null);
const { playConfetti } = useConfetti();

async function handleSubmit() {
  // Submit form...
  const success = await submitForm();
  
  if (success) {
    playConfetti(confettiCanvas.value);
  }
}
</script>
```

### Game Victory

```vue
<template>
  <div>
    <canvas ref="confettiCanvas" class="confetti-canvas"></canvas>
    <div v-if="hasWon" class="victory-message">
      🎉 You Win! 🎉
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue';
import { useConfetti } from '~/composables/useConfetti';

const confettiCanvas = ref(null);
const hasWon = ref(false);
const { playConfetti } = useConfetti();

watch(hasWon, (newValue) => {
  if (newValue) {
    playConfetti(confettiCanvas.value, {
      particleCount: 300,
      duration: 5000
    });
  }
});
</script>
```

## Cleanup

The confetti animation automatically cleans up when:
1. Particles fall off the screen (if `autoStop: true`)
2. Duration expires (if `autoStop: false`)
3. `stopConfetti()` is called
4. Component is unmounted (if you call `stopConfetti()` in `onUnmounted`)

It's recommended to call `stopConfetti()` in your component's `onUnmounted` hook:

```javascript
onUnmounted(() => {
  stopConfetti();
});
```

## Browser Support

Works in all modern browsers that support:
- Canvas API
- requestAnimationFrame

## Credits

Based on the confetti animation from the original minigame implementations.
