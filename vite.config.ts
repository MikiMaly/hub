import { defineConfig } from 'vite'
import path from 'node:path'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@gekos': path.resolve(__dirname, './gekos/src'),
    },
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
})
