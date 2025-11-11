import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  css: {
    devSourcemap: true, // THÊM: Giúp debug Tailwind classes
  },
  optimizeDeps: {
    include: ['react-quill-new', 'react-oauth/google'],
  },
  server: {
    allowedHosts: [
      'localhost',
      '127.0.0.1',
      '614ae38b7cee.ngrok-free.app',
      '.ngrok-free.app',
    ],
    host: true,
    port: 5173,
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'require-corp',
    },
  },
  define: {
    global: 'window',
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
})