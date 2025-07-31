import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const apiUrl = mode === 'development'
    ? 'http://localhost:8000'  // Use localhost for development
    : 'https://djigbo-backend-xxxxx.ondigitalocean.app'; // Use DigitalOcean for production

  return {
    plugins: [react()],
    server: {
      proxy: {
        '/api': {
          target: apiUrl,
          changeOrigin: true,
          secure: mode === 'production',
        }
      }
    }
  }
})
