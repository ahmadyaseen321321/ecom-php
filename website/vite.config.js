import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    watch: {
      ignored: ['**/dist/**', '**/*.zip', '**/.git/**']
    },
    proxy: {
      '/ecom_api': {
        target: 'http://192.168.100.203',
        changeOrigin: true,
        secure: false,
      }
    }
  }
})
