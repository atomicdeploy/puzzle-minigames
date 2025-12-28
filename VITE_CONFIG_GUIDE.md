# Vite Configuration Guide

This guide explains the comprehensive Vite server configuration options available in this project.

## Table of Contents

1. [HTTPS Configuration](#https-configuration)
2. [HMR (Hot Module Replacement)](#hmr-hot-module-replacement)
3. [CORS Configuration](#cors-configuration)
4. [Proxy Configuration](#proxy-configuration)
5. [Reverse Proxy Setup](#reverse-proxy-setup)
6. [Security Headers](#security-headers)
7. [Advanced Options](#advanced-options)

---

## HTTPS Configuration

### Enable HTTPS with Auto-Generated Certificate

To enable HTTPS during development with a self-signed certificate:

```javascript
// vite.config.js
export default defineConfig({
  server: {
    https: true, // Vite will generate a self-signed certificate
  }
})
```

Access your app at: `https://localhost:3000`

**Note:** Your browser will show a security warning for self-signed certificates. This is expected in development.

### Use Custom SSL Certificate

For custom certificates (e.g., from Let's Encrypt or mkcert):

```javascript
// vite.config.js
export default defineConfig({
  server: {
    https: {
      key: './path/to/private-key.pem',
      cert: './path/to/certificate.pem',
    }
  }
})
```

#### Creating Local Certificates with mkcert

1. Install mkcert:
```bash
# macOS
brew install mkcert

# Windows (with Chocolatey)
choco install mkcert

# Linux
# Download from: https://github.com/FiloSottile/mkcert/releases
```

2. Generate certificates:
```bash
# Create a local CA
mkcert -install

# Generate certificate for localhost
mkcert localhost 127.0.0.1 ::1

# This creates:
# - localhost+2.pem (certificate)
# - localhost+2-key.pem (private key)
```

3. Update vite.config.js:
```javascript
export default defineConfig({
  server: {
    https: {
      key: './localhost+2-key.pem',
      cert: './localhost+2.pem',
    }
  }
})
```

---

## HMR (Hot Module Replacement)

HMR allows modules to be updated in the browser without a full page refresh.

### Basic HMR (Default)

HMR is enabled by default in Vite. No configuration needed.

### HMR Behind Reverse Proxy

If you're running Vite behind a reverse proxy (nginx, Apache, Cloudflare Tunnel), configure HMR:

```javascript
// vite.config.js
export default defineConfig({
  server: {
    hmr: {
      protocol: 'wss', // Use 'wss' for HTTPS, 'ws' for HTTP
      host: 'dev.example.com', // Your public domain
      clientPort: 443, // External port (what users connect to)
    }
  }
})
```

### HMR Configuration Options

```javascript
hmr: {
  protocol: 'ws',      // 'ws' or 'wss'
  host: 'localhost',   // HMR server hostname
  port: 3001,          // HMR server port (default: server.port + 1)
  clientPort: 3001,    // Port on client side (for reverse proxy)
  timeout: 30000,      // Connection timeout (ms)
  overlay: true,       // Show error overlay in browser
  path: '/hmr',        // Custom HMR path
}
```

### HMR with HTTPS

When using HTTPS, HMR automatically uses WSS (WebSocket Secure):

```javascript
export default defineConfig({
  server: {
    https: true,
    hmr: {
      protocol: 'wss', // Required for HTTPS
    }
  }
})
```

---

## CORS Configuration

### Enable CORS for All Origins (Development)

```javascript
// vite.config.js
export default defineConfig({
  server: {
    cors: true, // Allow all origins
  }
})
```

### Custom CORS Configuration

```javascript
// vite.config.js
export default defineConfig({
  server: {
    cors: {
      origin: ['http://localhost:8080', 'https://example.com'],
      methods: ['GET', 'POST', 'PUT', 'DELETE'],
      allowedHeaders: ['Content-Type', 'Authorization'],
      credentials: true,
      maxAge: 86400, // 24 hours
    }
  }
})
```

### Disable CORS

```javascript
export default defineConfig({
  server: {
    cors: false,
  }
})
```

---

## Proxy Configuration

Proxy API requests to a backend server during development.

### Basic Proxy

```javascript
// vite.config.js
export default defineConfig({
  server: {
    proxy: {
      // Proxy requests starting with /api
      '/api': 'http://localhost:5000',
    }
  }
})
```

Request: `http://localhost:3000/api/users`  
Proxied to: `http://localhost:5000/api/users`

### Advanced Proxy Configuration

```javascript
export default defineConfig({
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true, // Change origin header to target
        rewrite: (path) => path.replace(/^\/api/, ''), // Remove /api prefix
        secure: false, // Accept self-signed certificates
        ws: true, // Proxy WebSocket
        configure: (proxy, options) => {
          // Custom proxy configuration
          proxy.on('error', (err, req, res) => {
            console.log('proxy error', err);
          });
          proxy.on('proxyReq', (proxyReq, req, res) => {
            console.log('Sending Request:', req.method, req.url);
          });
        }
      },
      // Multiple proxy targets
      '/auth': {
        target: 'http://localhost:5001',
        changeOrigin: true,
      },
      '/ws': {
        target: 'ws://localhost:5002',
        ws: true, // WebSocket proxy
      }
    }
  }
})
```

### Proxy Use Cases

1. **API Backend**: Proxy `/api` to backend server
2. **Authentication Service**: Proxy `/auth` to auth server
3. **WebSocket Server**: Proxy WebSocket connections
4. **Microservices**: Proxy different paths to different services
5. **Bypass CORS**: Proxy to external APIs

---

## Reverse Proxy Setup

### nginx Configuration

```nginx
# nginx.conf
server {
    listen 80;
    server_name dev.example.com;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        
        # WebSocket support for HMR
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        
        # Forward headers
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Vite configuration for nginx:

```javascript
export default defineConfig({
  server: {
    hmr: {
      protocol: 'ws',
      host: 'dev.example.com',
      clientPort: 80,
    }
  }
})
```

### HTTPS with nginx

```nginx
server {
    listen 443 ssl http2;
    server_name dev.example.com;
    
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        
        # WebSocket support for HMR
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto https;
    }
}
```

Vite configuration for HTTPS nginx:

```javascript
export default defineConfig({
  server: {
    hmr: {
      protocol: 'wss', // Use WSS for HTTPS
      host: 'dev.example.com',
      clientPort: 443,
    }
  }
})
```

### Cloudflare Tunnel

When using Cloudflare Tunnel (cloudflared):

1. Start Vite server:
```bash
npm run dev
```

2. Start Cloudflare Tunnel:
```bash
cloudflared tunnel --url http://localhost:3000
```

3. Update vite.config.js:
```javascript
export default defineConfig({
  server: {
    hmr: {
      protocol: 'wss',
      host: 'your-tunnel-id.trycloudflare.com',
      clientPort: 443,
    }
  }
})
```

### Apache Configuration

```apache
# httpd.conf or virtual host config
<VirtualHost *:80>
    ServerName dev.example.com
    
    ProxyPreserveHost On
    ProxyPass / http://localhost:3000/
    ProxyPassReverse / http://localhost:3000/
    
    # WebSocket support for HMR
    RewriteEngine on
    RewriteCond %{HTTP:Upgrade} websocket [NC]
    RewriteCond %{HTTP:Connection} upgrade [NC]
    RewriteRule ^/?(.*) "ws://localhost:3000/$1" [P,L]
</VirtualHost>
```

---

## Security Headers

The configuration includes security headers for development:

```javascript
export default defineConfig({
  server: {
    headers: {
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'SAMEORIGIN',
      'X-XSS-Protection': '1; mode=block',
    }
  }
})
```

### Additional Security Headers

```javascript
headers: {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'SAMEORIGIN',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'geolocation=(), microphone=(), camera=()',
  // For production builds, consider adding:
  // 'Strict-Transport-Security': 'max-age=31536000; includeSubDomains', // Only in production with HTTPS
  // 'Content-Security-Policy': "default-src 'self'", // May interfere with Vite dev features
}
```

**Note:** 
- HSTS (Strict-Transport-Security) should only be used in production with HTTPS, not in development
- CSP (Content-Security-Policy) may interfere with Vite's development features and should be configured carefully
- X-XSS-Protection header is deprecated and no longer needed in modern browsers

---

## Advanced Options

### File System Access

Control which files can be served:

```javascript
export default defineConfig({
  server: {
    fs: {
      strict: true, // Restrict access to workspace root
      allow: ['..'], // Allow serving files outside root
      deny: ['.env', '.env.*', '*.{pem,crt,key}'], // Explicitly deny files
    }
  }
})
```

### File Watching

Configure file watching behavior:

```javascript
export default defineConfig({
  server: {
    watch: {
      ignored: ['**/node_modules/**', '**/.git/**'],
      usePolling: false, // Set to true for Docker/WSL
      interval: 100, // Polling interval (ms)
      binaryInterval: 300, // Binary file polling interval
    }
  }
})
```

### Port Configuration

```javascript
export default defineConfig({
  server: {
    port: 3000,
    strictPort: false, // If true, exit if port is in use
    open: true, // Auto-open browser
    // open: '/docs', // Open specific path
  }
})
```

### Network Access

```javascript
export default defineConfig({
  server: {
    host: true, // Listen on all addresses (0.0.0.0)
    // host: '0.0.0.0', // Explicit IP
    // host: 'localhost', // Localhost only
  }
})
```

---

## Environment-Specific Configuration

### Development vs Production

```javascript
import { defineConfig } from 'vite';

export default defineConfig(({ command, mode }) => {
  const isDev = command === 'serve';
  const isProd = command === 'build';
  
  return {
    server: {
      https: isDev, // Only in development
      cors: isDev, // Only in development
      hmr: isDev ? {
        protocol: 'ws',
      } : false,
    }
  };
});
```

### Using Environment Variables

```javascript
// vite.config.js
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  
  return {
    server: {
      port: parseInt(env.VITE_PORT || '3000'),
      https: env.VITE_HTTPS === 'true',
      proxy: env.VITE_API_URL ? {
        '/api': env.VITE_API_URL
      } : {}
    }
  };
});
```

Create `.env.local`:
```bash
VITE_PORT=3000
VITE_HTTPS=false
VITE_API_URL=http://localhost:5000
```

---

## Testing the Configuration

### Test HTTPS

```bash
# Enable HTTPS in vite.config.js (https: true)
npm run dev

# Access: https://localhost:3000
# Accept the self-signed certificate warning
```

### Test HMR

1. Start dev server: `npm run dev`
2. Open browser console
3. Edit a source file and save
4. Check console for HMR update messages
5. Verify page updates without refresh

### Test CORS

```bash
# Start dev server
npm run dev

# In another terminal, test CORS
curl -H "Origin: http://example.com" \
     -H "Access-Control-Request-Method: GET" \
     -H "Access-Control-Request-Headers: X-Requested-With" \
     -X OPTIONS \
     http://localhost:3000
```

### Test Proxy

```bash
# Configure proxy in vite.config.js
# Start backend server on port 5000
# Start Vite dev server
npm run dev

# Test proxy
curl http://localhost:3000/api/test
# Should proxy to http://localhost:5000/test
```

---

## Common Issues and Solutions

### Issue: HMR Not Working Behind Reverse Proxy

**Solution:** Configure HMR with correct protocol, host, and port:
```javascript
hmr: {
  protocol: 'wss',
  host: 'your-domain.com',
  clientPort: 443,
}
```

### Issue: CORS Errors

**Solution:** Enable CORS or use proxy:
```javascript
server: {
  cors: true,
  // OR
  proxy: {
    '/api': 'http://backend-server.com'
  }
}
```

### Issue: Self-Signed Certificate Errors

**Solution:** Use mkcert for trusted local certificates:
```bash
mkcert -install
mkcert localhost
```

### Issue: Port Already in Use

**Solution:** Change port or use auto-increment:
```javascript
server: {
  port: 3000,
  strictPort: false, // Try next port if 3000 is busy
}
```

### Issue: HMR Connection Timeout

**Solution:** Increase timeout:
```javascript
hmr: {
  timeout: 60000, // 60 seconds
}
```

---

## Resources

- [Vite Server Options](https://vitejs.dev/config/server-options.html)
- [Vite HMR API](https://vitejs.dev/guide/api-hmr.html)
- [mkcert](https://github.com/FiloSottile/mkcert)
- [nginx Documentation](https://nginx.org/en/docs/)
- [Apache mod_proxy](https://httpd.apache.org/docs/current/mod/mod_proxy.html)

---

## Quick Reference

### Enable HTTPS
```javascript
server: { https: true }
```

### Enable CORS
```javascript
server: { cors: true }
```

### Configure HMR for Reverse Proxy
```javascript
server: {
  hmr: {
    protocol: 'wss',
    host: 'dev.example.com',
    clientPort: 443,
  }
}
```

### Add API Proxy
```javascript
server: {
  proxy: {
    '/api': {
      target: 'http://localhost:5000',
      changeOrigin: true,
    }
  }
}
```

### Custom SSL Certificate
```javascript
server: {
  https: {
    key: './key.pem',
    cert: './cert.pem',
  }
}
```

---

**Happy developing!** 🚀
