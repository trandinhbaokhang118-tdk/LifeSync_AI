import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    // Cache Layer 3 (build-time): sinh Service Worker (Workbox) để cache
    // asset tĩnh và cho phép chạy offline. Dùng được cho web + Capacitor.
    VitePWA({
      registerType: 'prompt',
      injectRegister: null, // tự đăng ký qua src/cache/serviceWorker.ts
      manifest: {
        name: 'LifeSync AI',
        short_name: 'LifeSync',
        theme_color: '#0F1520',
        background_color: '#0F1520',
        display: 'standalone',
      },
      workbox: {
        // Precache toàn bộ asset đã build (đã có hash -> an toàn để cache lâu).
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2}'],
        // Cache động cho ảnh và font tải runtime.
        runtimeCaching: [
          {
            urlPattern: ({ request }) =>
              request.destination === 'image' ||
              request.destination === 'font',
            handler: 'CacheFirst',
            options: {
              cacheName: 'lifesync-assets',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 * 30, // 30 ngày
              },
            },
          },
        ],
      },
    }),
  ],
  base: './',
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-ui': [
            '@radix-ui/react-dialog',
            '@radix-ui/react-dropdown-menu',
            '@radix-ui/react-select',
            '@radix-ui/react-tabs',
            '@radix-ui/react-tooltip',
            '@radix-ui/react-switch',
            '@radix-ui/react-progress',
          ],
          'vendor-charts': ['recharts'],
          'vendor-utils': ['date-fns', 'zod', 'clsx', 'tailwind-merge'],
        },
      },
    },
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom', 'axios', 'zustand'],
  },
  server: {
    port: 5173,
    host: true,
  },
})
