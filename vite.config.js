import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  // Repassa /api para o servidor de favoritos (server/index.js). Vale também para o `vite preview`.
  server: {
    proxy: { '/api': 'http://localhost:3001' },
  },
})
