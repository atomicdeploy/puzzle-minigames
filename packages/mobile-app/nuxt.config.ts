// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  
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
