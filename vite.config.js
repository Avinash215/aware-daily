import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// Two hosts, two base paths. Azure Static Web Apps serves from the root, so the
// default is '/'. GitHub Pages serves from a project subpath and must build with
// VITE_BASE=/aware-daily/. Getting this wrong does not fail the build: index.html
// still returns 200 and every asset 404s, which looks like a working deploy and
// renders a blank page.
export default defineConfig({
  base: process.env.VITE_BASE || '/',
  plugins: [react(), tailwindcss()],
})
