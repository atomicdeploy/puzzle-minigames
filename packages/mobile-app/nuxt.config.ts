// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  
  // Environment variables
  runtimeConfig: {
    // Private keys (server-side only)
    // These are not exposed to the client
    
    // Public keys (exposed to client with NUXT_PUBLIC_ prefix)
    public: {
      apiBaseUrl: process.env.VITE_API_BASE_URL || 'http://localhost:3001/api',
      socketUrl: process.env.VITE_SOCKET_URL || 'http://localhost:3001',
      appName: process.env.VITE_APP_NAME || 'اینفرنال',
      appVersion: process.env.VITE_APP_VERSION || '1.0.0',
      enableSocket: process.env.VITE_ENABLE_SOCKET === 'true',
      enablePwa: process.env.VITE_ENABLE_PWA === 'true',
    }
  },
  
  // CSS configuration
  css: [
    '@/assets/scss/main.scss'
  ],
  
  // Vite configuration for Capacitor compatibility
  vite: {
    define: {
      'process.env.DEBUG': false,
    },
    css: {
      preprocessorOptions: {
        scss: {
          additionalData: ''
        }
      }
    }
  },
  
  // App configuration
  app: {
    head: {
      htmlAttrs: {
        lang: 'fa',
        dir: 'rtl'
      },
      title: 'اینفرنال - بازی پازل',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no' },
        { name: 'theme-color', content: '#1a1a2e' },
        { name: 'description', content: 'اینفرنال - بازی پازل سه‌بعدی' }
      ],
      link: [
        { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' },
        { rel: 'manifest', href: '/manifest.json' }
      ]
    }
  },
  
  // SSR configuration for Capacitor
  ssr: false,
  
  // Build output directory (for Capacitor)
  nitro: {
    output: {
      dir: '../.output',
      publicDir: '../.output/public'
    }
  }
})
