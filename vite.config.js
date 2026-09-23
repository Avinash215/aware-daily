import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// A recovery entry needs fresh identities for its optional dependencies too:
// browsers retain rejected module loads. Keep stores/data/hooks shared and eager.
function recoveryViews() {
  return {
    name: 'optional-view-recovery',
    enforce: 'pre',
    transform(code, id) {
      if (!id.endsWith('?recovery')) return null
      const component = id.replaceAll('\\', '/').includes('/src/components/')
      return {
        code: code.replace(/(\bfrom\s+)(['"])([^'"]+)\2/g, (match, prefix, quote, source) => {
          const view = component && (source.startsWith('./') || source.startsWith('../components/'))
          const exclusiveHelper = /\/lib\/(glossary|quiz)\.js$/.test(source)
          return view || exclusiveHelper ? `${prefix}${quote}${source}?recovery${quote}` : match
        }),
        map: null,
      }
    },
  }
}

// Two hosts, two base paths. Azure Static Web Apps serves from the root, so the
// default is '/'. GitHub Pages serves from a project subpath and must build with
// VITE_BASE=/aware-daily/. Getting this wrong does not fail the build: index.html
// still returns 200 and every asset 404s, which looks like a working deploy and
// renders a blank page.
export default defineConfig({
  base: process.env.VITE_BASE || '/',
  plugins: [recoveryViews(), react(), tailwindcss()],
})
