import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': { target: 'http://127.0.0.1:8080', xfwd: true },
      '/oauth2/authorization': { target: 'http://127.0.0.1:8080', xfwd: true },
      '/login/oauth2': { target: 'http://127.0.0.1:8080', xfwd: true },
      '/uploads': { target: 'http://127.0.0.1:8080', xfwd: true }
    }
  }
})
