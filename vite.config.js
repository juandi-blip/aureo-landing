import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Vite + React (JSX). SPA con React Router; un solo punto de entrada (index.html).
export default defineConfig({
  plugins: [react()],
  server: { port: 5173, open: true },
  build: {
    rollupOptions: {
      output: {
        // Three.js (firma del hero Woven) en su propio chunk: pesado pero
        // cacheable y desacoplado del bundle principal de la app.
        manualChunks: {
          three: ['three'],
        },
      },
    },
  },
})
