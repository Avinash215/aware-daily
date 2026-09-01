import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// Deployed to GitHub Pages at https://avinash215.github.io/aware-daily/
export default defineConfig({
  base: '/aware-daily/',
  plugins: [react(), tailwindcss()],
})
