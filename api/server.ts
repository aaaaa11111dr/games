/**
 * local/production server entry file.
 * Production: serves built frontend dist/ as static files and proxies /api.
 */
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { existsSync } from 'node:fs'
import express from 'express'
import app from './app.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const PORT = Number(process.env.PORT || 3001)

// Optional: serve built frontend dist/ from the same process.
// Enable by setting SERVE_STATIC=1, and build frontend first.
const SERVE_STATIC = process.env.SERVE_STATIC === '1'
const DIST_DIR = path.resolve(__dirname, '../dist')

if (SERVE_STATIC && existsSync(DIST_DIR)) {
  console.log(`[static] serving ${DIST_DIR}`)
  // Serve assets first (they may be under subpaths like /assets/)
  app.use(express.static(DIST_DIR, { fallthrough: true }))
  // SPA fallback — index.html for unknown routes
  app.get(/^\/(?!api\/).*/, (_req, res) => {
    res.sendFile(path.join(DIST_DIR, 'index.html'))
  })
}

const server = app.listen(PORT, () => {
  console.log(`Server ready on port ${PORT}${SERVE_STATIC ? ' (static+api)' : ' (api only)'}`)
})

process.on('SIGTERM', () => {
  console.log('SIGTERM signal received')
  server.close(() => { console.log('Server closed'); process.exit(0) })
})
process.on('SIGINT', () => {
  console.log('SIGINT signal received')
  server.close(() => { console.log('Server closed'); process.exit(0) })
})

export default app