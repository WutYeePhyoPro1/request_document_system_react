import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import tsconfigPaths from "vite-tsconfig-paths"

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_')

  // Default to localhost:8000 if VITE_API_URL is not set
  const apiUrl = env.VITE_API_URL || 'http://localhost:8000' || 'http://rds.test'

  return {
    plugins: [react(), tailwindcss(), tsconfigPaths()],
    server: {
      host: true,
      proxy: {
        '/api': {
          target: apiUrl,
          changeOrigin: true,
          secure: false,
          // No rewrite needed - forward /api/* to backend /api/*
        }
      }
    }
  }
})
