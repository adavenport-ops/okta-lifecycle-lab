import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    proxy: {
      '/events': 'http://localhost:5001',
      '/api': 'http://localhost:5001',
      '/health': 'http://localhost:5001',
      '/slack': 'http://localhost:5001',
      '/github': 'http://localhost:5001',
      '/zoom': 'http://localhost:5001',
      '/gws': 'http://localhost:5001',
      '/figma': 'http://localhost:5001',
      '/salesforce': 'http://localhost:5001',
      '/hubspot': 'http://localhost:5001',
      '/netsuite': 'http://localhost:5001',
      '/rippling': 'http://localhost:5001',
    },
  },
})
