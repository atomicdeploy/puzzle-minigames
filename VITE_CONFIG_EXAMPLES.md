# Vite Configuration Examples

This file contains example configurations for common scenarios. Copy the relevant sections to your `vite.config.js`.

## Example 1: Basic Development (Current Default)

```javascript
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

const ONE_YEAR_IN_SECONDS = 365 * 24 * 60 * 60;

export default defineConfig({
  plugins: [
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'icon-192.png', 'icon-512.png'],
      manifest: false,
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
    host: true,
    port: 3000,
    strictPort: false,
    cors: true,
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
```

## Example 2: HTTPS Development with Auto-Generated Certificate

```javascript
export default defineConfig({
  plugins: [/* ... */],
  server: {
    host: true,
    port: 3000,
    https: true, // Vite generates self-signed certificate
    cors: true,
    hmr: {
      protocol: 'wss', // Use WSS for HTTPS
    }
  },
  build: {/* ... */}
});
```

## Example 3: HTTPS with Custom Certificate (mkcert)

```javascript
export default defineConfig({
  plugins: [/* ... */],
  server: {
    host: true,
    port: 3000,
    https: {
      key: './localhost+2-key.pem',
      cert: './localhost+2.pem',
    },
    cors: true,
    hmr: {
      protocol: 'wss',
    }
  },
  build: {/* ... */}
});
```

## Example 4: Behind nginx Reverse Proxy (HTTP)

```javascript
export default defineConfig({
  plugins: [/* ... */],
  server: {
    host: true,
    port: 3000,
    cors: true,
    hmr: {
      protocol: 'ws',
      host: 'dev.example.com',
      clientPort: 80,
    }
  },
  build: {/* ... */}
});
```

Corresponding nginx config:
```nginx
server {
    listen 80;
    server_name dev.example.com;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
    }
}
```

## Example 5: Behind nginx Reverse Proxy (HTTPS)

```javascript
export default defineConfig({
  plugins: [/* ... */],
  server: {
    host: true,
    port: 3000,
    cors: true,
    hmr: {
      protocol: 'wss', // WSS for HTTPS
      host: 'dev.example.com',
      clientPort: 443,
    }
  },
  build: {/* ... */}
});
```

Corresponding nginx config:
```nginx
server {
    listen 443 ssl http2;
    server_name dev.example.com;
    
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-Proto https;
    }
}
```

## Example 6: With Backend API Proxy

```javascript
export default defineConfig({
  plugins: [/* ... */],
  server: {
    host: true,
    port: 3000,
    cors: true,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
      '/auth': {
        target: 'http://localhost:5001',
        changeOrigin: true,
      },
    }
  },
  build: {/* ... */}
});
```

Now you can call:
- `fetch('/api/users')` → proxied to `http://localhost:5000/users`
- `fetch('/auth/login')` → proxied to `http://localhost:5001/auth/login`

## Example 7: Cloudflare Tunnel

```javascript
export default defineConfig({
  plugins: [/* ... */],
  server: {
    host: true,
    port: 3000,
    cors: true,
    hmr: {
      protocol: 'wss',
      host: 'your-tunnel.trycloudflare.com',
      clientPort: 443,
    }
  },
  build: {/* ... */}
});
```

Start Cloudflare Tunnel:
```bash
cloudflared tunnel --url http://localhost:3000
```

## Example 8: Docker/WSL Development

```javascript
export default defineConfig({
  plugins: [/* ... */],
  server: {
    host: '0.0.0.0', // Expose to host machine
    port: 3000,
    cors: true,
    watch: {
      usePolling: true, // Required for file watching in Docker/WSL
      interval: 100,
    }
  },
  build: {/* ... */}
});
```

## Example 9: Multiple Environments with Environment Variables

```javascript
import { defineConfig, loadEnv } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  
  return {
    plugins: [/* ... */],
    server: {
      host: true,
      port: parseInt(env.VITE_PORT || '3000'),
      https: env.VITE_HTTPS === 'true',
      cors: true,
      hmr: env.VITE_HTTPS === 'true' ? {
        protocol: 'wss',
      } : {
        protocol: 'ws',
      },
      proxy: env.VITE_API_URL ? {
        '/api': {
          target: env.VITE_API_URL,
          changeOrigin: true,
        }
      } : {}
    },
    build: {/* ... */}
  };
});
```

Create `.env.local`:
```bash
VITE_PORT=3000
VITE_HTTPS=false
VITE_API_URL=http://localhost:5000
```

Create `.env.production`:
```bash
VITE_PORT=3000
VITE_HTTPS=true
VITE_API_URL=https://api.example.com
```

## Example 10: Full Production-Ready Configuration

```javascript
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

const ONE_YEAR_IN_SECONDS = 365 * 24 * 60 * 60;

export default defineConfig({
  plugins: [
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'icon-192.png', 'icon-512.png'],
      manifest: false,
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
    host: true,
    port: 3000,
    strictPort: false,
    open: false,
    https: false,
    cors: true,
    hmr: {
      protocol: 'ws',
      timeout: 30000,
      overlay: true,
    },
    proxy: {
      // Add your API proxies here
    },
    headers: {
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'SAMEORIGIN',
      'X-XSS-Protection': '1; mode=block',
    },
    watch: {
      ignored: ['**/node_modules/**', '**/.git/**'],
    },
    fs: {
      strict: true,
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true, // Remove console.log in production
      }
    },
    rollupOptions: {
      output: {
        manualChunks: {
          three: ['three'],
          // Add more chunks for code splitting
        },
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
      }
    },
    chunkSizeWarningLimit: 1000, // KB
  },
  preview: {
    host: true,
    port: 4173,
    strictPort: false,
    cors: true,
  }
});
```

## Tips

### Switching Between Configurations

1. **Keep original as default**: Use the basic config for most development
2. **Create variants**: Create `vite.config.https.js`, `vite.config.proxy.js`, etc.
3. **Use environment variables**: Use `.env` files to toggle features
4. **Comment/uncomment**: Keep examples in comments, uncomment when needed

### Testing Your Configuration

```bash
# Test basic dev server
npm run dev

# Test with HTTPS
# (Enable https: true in config first)
npm run dev

# Test production build
npm run build
npm run preview

# Test specific port
PORT=4000 npm run dev
```

### Common Patterns

1. **Local development**: Basic config with CORS enabled
2. **Team development**: HTTPS with mkcert for consistent experience
3. **Backend integration**: Add API proxy for local backend
4. **Reverse proxy**: Configure HMR for production-like setup
5. **Docker/WSL**: Enable polling for file watching

---

Choose the configuration that best matches your development setup!
