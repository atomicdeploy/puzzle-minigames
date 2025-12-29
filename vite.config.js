import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';
import { resolve } from 'path';

// Constants
const ONE_YEAR_IN_SECONDS = 365 * 24 * 60 * 60;

export default defineConfig(({ command, mode }) => {
  // Determine if HTTPS is enabled
  const useHttps = false; // Change to true to enable HTTPS
  
  return {
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
      https: useHttps,
      
      // CORS configuration
      cors: true,
      
      // Allowed hosts configuration
      allowedHosts: true,
      
      // HMR (Hot Module Replacement) configuration
      hmr: {
        protocol: useHttps ? 'wss' : 'ws',
      },
      
      // Proxy configuration for API requests
      proxy: {},
      
      // Custom headers
      headers: {
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'SAMEORIGIN',
      },
      
      // File watching configuration
      watch: {},
      
      // Filesystem serving configuration
      fs: {},
    },
    build: {
      outDir: 'dist',
      sourcemap: false,
      rollupOptions: {
        input: {
          main: resolve(__dirname, 'index.html'),
          welcome: resolve(__dirname, 'welcome.html')
        },
        output: {
          manualChunks: {
            three: ['three']
          }
        }
      }
    }
  };
});
