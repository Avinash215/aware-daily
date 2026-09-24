import process from 'node:process'
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'

// Normalize before loading Vite or its plugins; --mode alone does not set NODE_ENV.
process.env.NODE_ENV = 'production'

const require = createRequire(import.meta.url)
const manifestPath = require.resolve('vite/package.json')
const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'))
const cliPath = resolve(dirname(manifestPath), manifest.bin.vite)

process.argv = [process.execPath, cliPath, 'build', ...process.argv.slice(2)]
await import(pathToFileURL(cliPath).href)
