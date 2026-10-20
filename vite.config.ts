import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { fileURLToPath, URL } from 'node:url'

// 100% client-side PWA. Service Worker memungkinkan Mode Offline Standalone
// (seluruh konversi dokumen lokal berjalan tanpa jaringan).
export default defineConfig({
  // Worker subsetting font (subsetWorker) memakai dynamic import (wasm) → code-split,
  // sehingga format worker harus ES module (bukan default 'iife').
  worker: { format: 'es' },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg'],
      manifest: {
        name: 'EPUB Builder — Data to eReader',
        short_name: 'EPUB Builder',
        description:
          'Konversi dokumen (.docx/.md/.csv/.xlsx/URL) menjadi EPUB 3.0 ramah E-Ink. Non-AI, 100% client-side, gratis.',
        lang: 'id',
        dir: 'ltr',
        theme_color: '#000000',
        background_color: '#F8F6F0',
        display: 'standalone',
        orientation: 'portrait',
        icons: [
          { src: 'pwa-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512.png', sizes: '512x512', type: 'image/png' },
          {
            src: 'pwa-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        // Library berat (Tesseract OCR) di-lazy-load & tidak di-precache agar bundle awal ringan.
        globPatterns: ['**/*.{js,css,html,svg,woff2}'],
        maximumFileSizeToCacheInBytes: 3 * 1024 * 1024,
        // Font embed (.ttf/.otf) TIDAK di-precache (hemat muat awal) tapi di-cache
        // saat pertama dipakai (CacheFirst) -> tersedia offline untuk konversi & simulator.
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.pathname.startsWith('/fonts/'),
            handler: 'CacheFirst',
            options: {
              cacheName: 'epub-fonts',
              expiration: { maxEntries: 20, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            // hb-subset.wasm (subsetter font) di-lazy-load; cache setelah pakai
            // pertama agar subsetting tetap jalan offline.
            urlPattern: ({ url }) => url.pathname.endsWith('.wasm'),
            handler: 'CacheFirst',
            options: {
              cacheName: 'epub-wasm',
              expiration: { maxEntries: 5, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            // Font CJK on-demand diunduh dari CDN google/fonts (raw.githubusercontent).
            // Cache setelah unduh pertama agar embed CJK tetap bisa offline.
            urlPattern: ({ url }) => url.hostname === 'raw.githubusercontent.com',
            handler: 'CacheFirst',
            options: {
              cacheName: 'epub-remote-fonts',
              expiration: { maxEntries: 6, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
      devOptions: { enabled: false },
    }),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      '@core': fileURLToPath(new URL('./src/core', import.meta.url)),
      '@parsers': fileURLToPath(new URL('./src/parsers', import.meta.url)),
      '@epub': fileURLToPath(new URL('./src/epub', import.meta.url)),
      '@fonts': fileURLToPath(new URL('./src/fonts', import.meta.url)),
      '@cover': fileURLToPath(new URL('./src/cover', import.meta.url)),
      '@ui': fileURLToPath(new URL('./src/ui', import.meta.url)),
      '@pwa': fileURLToPath(new URL('./src/pwa', import.meta.url)),
      '@presets': fileURLToPath(new URL('./src/presets', import.meta.url)),
    },
  },
})
