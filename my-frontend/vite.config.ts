import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-dom') || id.includes('react-router-dom')) {
              return 'vendor';
            }
            if (id.includes('lucide-react') || id.includes('qrcode.react')) {
              return 'ui';
            }
          }
        },

      }
    }
  },
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