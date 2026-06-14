import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'

// Smart Food — Telegram Mini App
// base is './' so the built app works when served from any sub-path
// (it ships behind nginx at /webapp/ in production — see Dockerfile/nginx.conf).
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  // Where the dev server proxies /api/smartfood. Lets `npm run dev` talk to a real
  // backend same-origin (no CORS) while developing in a desktop browser.
  const apiTarget = env.VITE_DEV_API_TARGET || 'https://pos.78.111.90.65.nip.io'

  return {
    plugins: [vue()],
    base: './',
    server: {
      host: true,
      port: 5173,
      proxy: {
        '/api/smartfood': {
          target: apiTarget,
          changeOrigin: true,
          secure: false,
        },
      },
    },
  }
})
