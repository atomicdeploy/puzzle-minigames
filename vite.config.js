import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

// Constants
const ONE_YEAR_IN_SECONDS = 365 * 24 * 60 * 60;

export default defineConfig({
  plugins: [
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'icon-192.png', 'icon-512.png'],
      manifest: false, // We're using public/manifest.json
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: ONE_YEAR_IN_SECONDS
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          }
        ]
      }
    })
  ],
  server: {
    // Network configuration
    host: true, // Listen on all addresses, including LAN and public
    port: 3000,
    strictPort: false, // If port is in use, try next available port
    open: false, // Don't auto-open browser
    
    // HTTPS configuration
    // Set to true to use auto-generated self-signed certificate
    // Or provide an object with key and cert paths for custom certificates
    https: false, // Enable with: https: true or https: { key: 'path/to/key.pem', cert: 'path/to/cert.pem' }
    
    // CORS configuration
    cors: true, // Enable CORS for all origins in development
    
    // HMR (Hot Module Replacement) configuration
    hmr: {
      // Use default port (server.port + 1) or specify custom port
      // For reverse proxy scenarios, you may need to configure this
      // clientPort: 443, // Use this when behind a reverse proxy with different external port
      // host: 'dev.example.com', // Use this when behind a reverse proxy with different hostname
      protocol: 'ws', // Use 'wss' for HTTPS
      // timeout: 30000, // HMR connection timeout
      // overlay: true, // Show overlay for errors
    },
    
    // Proxy configuration for API requests
    // Useful for proxying API calls to a backend server during development
    proxy: {
      // Example: proxy /api requests to backend server
      // '/api': {
      //   target: 'http://localhost:5000',
      //   changeOrigin: true,
      //   rewrite: (path) => path.replace(/^\/api/, ''),
      //   secure: false, // Set to true if proxying to HTTPS
      //   ws: true, // Proxy websockets
      //   configure: (proxy, options) => {
      //     // Custom proxy configuration
      //   }
      // }
    },
    
    // Custom headers
    headers: {
      // Security headers for development
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'SAMEORIGIN',
      'X-XSS-Protection': '1; mode=block',
    },
    
    // File watching configuration
    watch: {
      // Watch options passed to chokidar
      // ignored: ['**/node_modules/**', '**/.git/**'],
      // usePolling: false, // Set to true if watching doesn't work in Docker/WSL
    },
    
    // Server middleware configuration
    // middlewareMode: false, // Set to 'ssr' or 'html' for custom server integration
    
    // Filesystem serving configuration
    fs: {
      // Allow serving files outside of project root
      // strict: true,
      // allow: ['..'],
      // deny: ['.env', '.env.*', '*.{pem,crt,key}'],
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          three: ['three']
        }
      }
    }
  }
});
