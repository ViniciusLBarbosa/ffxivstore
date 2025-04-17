import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    host: true,
    strictPort: true,
    hmr: {
      clientPort: 443
    },
    // Permitir todos os subdomínios do ngrok-free.app
    allowedHosts: ['.ngrok-free.app', 'localhost']
  },
})
