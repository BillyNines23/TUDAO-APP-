import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import * as path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // FIX: Using __dirname ensures correct path resolution relative to this config file
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./client/src"), 
    },
  },
})