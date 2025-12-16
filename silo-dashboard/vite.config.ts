import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import * as path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // Essential fix: configure alias for Rollup/Vite to resolve "@/" imports
  resolve: {
    alias: {
      // Assuming your source code root is client/src, map "@" to that directory
      "@": path.resolve(process.cwd(), "./client/src"), 
    },
  },
})
