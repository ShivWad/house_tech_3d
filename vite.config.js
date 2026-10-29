import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  // Relative asset URLs so the build works from a sub-path (GitHub Pages).
  base: './',
  plugins: [react()],
  server: { host: true },
})
