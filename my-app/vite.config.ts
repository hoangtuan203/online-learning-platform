import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(),tailwindcss()],
  optimizeDeps: {
    include: ['react-quill-new'],
  },
  server:{
    allowedHosts: [
      'localhost',
      '127.0.0.1',
      '614ae38b7cee.ngrok-free.app',  
      '.ngrok-free.app' 
    ],
    host: true, 
    port: 5173
  }
  
})
