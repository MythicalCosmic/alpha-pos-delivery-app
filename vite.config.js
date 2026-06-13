import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// Smart Food — Telegram Mini App
// base is './' so the built app works when served from any sub-path (Telegram hosting, GitHub Pages, etc.)
export default defineConfig({
  plugins: [vue()],
  base: './',
  server: {
    host: true,
    port: 5173,
  },
})
