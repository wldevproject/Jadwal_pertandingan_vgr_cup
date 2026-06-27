import { defineConfig } from 'vite';
import { fileURLToPath, URL } from 'node:url';
import vue from '@vitejs/plugin-vue';
import { quasar, transformAssetUrls } from '@quasar/vite-plugin';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  base: '/',
  plugins: [
    vue({
      template: {
        transformAssetUrls,
      },
    }),
    quasar({
      autoImportComponentCase: 'pascal',
      sassVariables: false,
    }),
    VitePWA({
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.js',
      registerType: 'autoUpdate',
      includeAssets: ['app-icon.svg'],
      manifest: {
        name: 'VGR 5 Badminton Cup 2026',
        short_name: 'VGR 5 Cup',
        description: 'Papan skor, jadwal, dan klasemen turnamen badminton VGR 5 Badminton Cup 2026.',
        id: '/',
        start_url: '/results/putra',
        scope: '/',
        display: 'standalone',
        display_override: ['window-controls-overlay', 'standalone'],
        background_color: '#f3f5fa',
        theme_color: '#d61f63',
        orientation: 'portrait-primary',
        categories: ['sports', 'lifestyle'],
        shortcuts: [
          {
            name: 'Hasil',
            short_name: 'Hasil',
            url: '/results/putra',
          },
          {
            name: 'Jadwal',
            short_name: 'Jadwal',
            url: '/schedule/putra',
          },
          {
            name: 'Klasemen',
            short_name: 'Klasemen',
            url: '/groups/putra',
          },
        ],
        icons: [
          {
            src: '/app-icon.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'any maskable',
          },
        ],
      },
      injectRegister: null,
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,json,ico,png,webmanifest}'],
      },
    }),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
});
