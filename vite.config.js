import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    // Local dev: `npx wrangler pages dev` serves /api/* on 8788; proxy it so the UI can hit it.
    proxy: {
      '/api': 'http://localhost:8788',
    },
  },
})
