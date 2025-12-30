/**
 * Confetti Animation Composable
 * 
 * Provides a reusable confetti animation that can be used from any page.
 * 
 * @example
 * ```vue
 * <template>
 *   <div>
 *     <canvas ref="confettiCanvas" class="confetti-canvas"></canvas>
 *     <button @click="celebrate">Celebrate!</button>
 *   </div>
 * </template>
 * 
 * <script setup>
 * import { ref } from 'vue';
 * import { useConfetti } from '~/composables/useConfetti';
 * 
 * const confettiCanvas = ref(null);
 * const { playConfetti, stopConfetti } = useConfetti();
 * 
 * function celebrate() {
 *   playConfetti(confettiCanvas.value);
 * }
 * </script>
 * 
 * <style>
 * .confetti-canvas {
 *   position: fixed;
 *   top: 0;
 *   left: 0;
 *   width: 100%;
 *   height: 100%;
 *   pointer-events: none;
 *   z-index: 9999;
 * }
 * </style>
 * ```
 */
export function useConfetti() {
  let animationId = null;
  let ctx = null;
  let confettiParticles = [];

  /**
   * Play confetti animation
   * @param {HTMLCanvasElement|Ref} canvas - Canvas element or ref to canvas element
   * @param {Object} options - Configuration options
   * @param {number} options.particleCount - Number of confetti particles (default: 200)
   * @param {string[]} options.colors - Array of color hex codes (default: ['#ff8c42', '#ff6b6b', '#00b894', '#4ecdc4', '#fdcb6e', '#6c5ce7'])
   * @param {number} options.duration - Animation duration in milliseconds (default: 3000)
   * @param {boolean} options.autoStop - Auto-stop animation when particles fall off screen (default: true)
   */
  function playConfetti(canvas, options = {}) {
    // Stop any existing animation
    stopConfetti();

    // Handle Vue ref
    const canvasElement = canvas?.value || canvas;
    
    if (!canvasElement) {
      console.warn('Confetti: Canvas element not found');
      return;
    }

    // Configuration
    const config = {
      particleCount: options.particleCount || 200,
      colors: options.colors || ['#ff8c42', '#ff6b6b', '#00b894', '#4ecdc4', '#fdcb6e', '#6c5ce7'],
      duration: options.duration || 3000,
      autoStop: options.autoStop !== false
    };

    // Setup canvas
    ctx = canvasElement.getContext('2d');
    canvasElement.width = window.innerWidth;
    canvasElement.height = window.innerHeight;

    // Create confetti particles
    confettiParticles = [];
    for (let i = 0; i < config.particleCount; i++) {
      confettiParticles.push({
        x: Math.random() * canvasElement.width,
        y: Math.random() * canvasElement.height - canvasElement.height,
        r: Math.random() * 6 + 4,
        d: Math.random() * config.particleCount,
        color: config.colors[Math.floor(Math.random() * config.colors.length)],
        tilt: Math.floor(Math.random() * 10) - 10,
        tiltAngleIncrement: Math.random() * 0.07 + 0.05,
        tiltAngle: 0
      });
    }

    // Start animation
    const startTime = Date.now();
    
    function animate() {
      if (!ctx || !canvasElement) return;

      ctx.clearRect(0, 0, canvasElement.width, canvasElement.height);

      // Draw confetti particles
      for (let i = 0; i < confettiParticles.length; i++) {
        const particle = confettiParticles[i];
        ctx.beginPath();
        ctx.lineWidth = particle.r / 2;
        ctx.strokeStyle = particle.color;
        ctx.moveTo(particle.x + particle.tilt + particle.r / 4, particle.y);
        ctx.lineTo(particle.x + particle.tilt, particle.y + particle.tilt + particle.r / 4);
        ctx.stroke();
      }

      // Update particle positions
      let stillActive = false;
      for (let i = 0; i < confettiParticles.length; i++) {
        const particle = confettiParticles[i];
        particle.tiltAngle += particle.tiltAngleIncrement;
        particle.y += (Math.cos(particle.d) + 3 + particle.r / 2) / 2;
        particle.x += Math.sin(particle.d);
        particle.tilt = Math.sin(particle.tiltAngle - i / 3) * 15;

        if (particle.y <= canvasElement.height) {
          stillActive = true;
        }
      }

      // Continue animation or stop
      const elapsed = Date.now() - startTime;
      const shouldContinue = config.autoStop ? stillActive : elapsed < config.duration;

      if (shouldContinue) {
        animationId = requestAnimationFrame(animate);
      } else {
        stopConfetti();
      }
    }

    animate();
  }

  /**
   * Stop confetti animation and clear canvas
   */
  function stopConfetti() {
    if (animationId) {
      cancelAnimationFrame(animationId);
      animationId = null;
    }

    if (ctx) {
      const canvas = ctx.canvas;
      if (canvas) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
      ctx = null;
    }

    confettiParticles = [];
  }

  /**
   * Check if confetti animation is currently playing
   * @returns {boolean}
   */
  function isPlaying() {
    return animationId !== null;
  }

  return {
    playConfetti,
    stopConfetti,
    isPlaying
  };
}
