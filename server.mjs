import { readFileSync, existsSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const PORT = parseInt(process.env.PORT || '3000', 10)
const __dirname = fileURLToPath(new URL('.', import.meta.url))
const DIST_DIR = join(__dirname, 'dist')

const PROXY_PATH = '/__mtk_asset_proxy'
const BASE = '/mtk-launchpad/'

const ALLOWED_PROXY_HOSTS = new Set([
  'api.github.com',
  'github.com',
  'release-assets.githubusercontent.com',
  'objects.githubusercontent.com',
  // Common CDN mirrors (user-configurable, so keep this list updated)
  'ghproxy.net',
  'gh-proxy.com',
])

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.wasm': 'application/wasm',
  '.woff2': 'font/woff2',
}

/**
 * Handle /__mtk_asset_proxy?target=... requests.
 * Mirrors the middleware in vite.config.ts for use in production.
 */
async function handleProxy(req, res) {
  try {
    const requestUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`)
    const target = requestUrl.searchParams.get('target')
    const accept = requestUrl.searchParams.get('accept') || '*/*'

    if (!target) {
      res.writeHead(400, { 'content-type': 'text/plain; charset=utf-8' })
      res.end('Missing target query')
      return
    }

    let upstreamUrl
    try {
      upstreamUrl = new URL(target)
    } catch {
      res.writeHead(400, { 'content-type': 'text/plain; charset=utf-8' })
      res.end('Invalid target URL')
      return
    }

    if (upstreamUrl.protocol !== 'https:' || !ALLOWED_PROXY_HOSTS.has(upstreamUrl.hostname)) {
      res.writeHead(403, { 'content-type': 'text/plain; charset=utf-8' })
      res.end('Target host is not allowed')
      return
    }

    const upstream = await fetch(upstreamUrl.toString(), {
      headers: { Accept: accept },
      redirect: 'follow',
    })

    if (!upstream.ok) {
      const bodyText = await upstream.text().catch(() => '')
      res.writeHead(upstream.status, { 'content-type': 'text/plain; charset=utf-8' })
      res.end(bodyText || `Upstream request failed: ${upstream.status}`)
      return
    }

    const contentType = upstream.headers.get('content-type')
    if (contentType) {
      res.setHeader('content-type', contentType)
    }
    const contentDisposition = upstream.headers.get('content-disposition')
    if (contentDisposition) {
      res.setHeader('content-disposition', contentDisposition)
    }

    const payload = Buffer.from(await upstream.arrayBuffer())
    res.writeHead(200, {
      'cache-control': 'no-store',
      'content-length': String(payload.byteLength),
    })
    res.end(payload)
  } catch (error) {
    res.writeHead(502, { 'content-type': 'text/plain; charset=utf-8' })
    res.end(`Proxy request failed: ${String(error)}`)
  }
}

/**
 * Serve static files from dist/, with SPA fallback.
 * Also handles the BASE path prefix.
 */
function serveStatic(req, res) {
  let pathname = new URL(req.url, `http://${req.headers.host || 'localhost'}`).pathname

  // Strip BASE prefix if present
  if (pathname.startsWith(BASE)) {
    pathname = pathname.slice(BASE.length - 1) // keep leading /
  }
  if (pathname === '' || pathname.endsWith('/')) {
    pathname = '/index.html'
  }

  // Prevent directory traversal
  const normalized = pathname.replace(/\.\./g, '').replace(/\/+/g, '/')
  const filePath = join(DIST_DIR, normalized)

  if (existsSync(filePath)) {
    const ext = extname(filePath).toLowerCase()
    const mime = MIME_TYPES[ext] || 'application/octet-stream'
    const content = readFileSync(filePath)
    res.writeHead(200, {
      'content-type': mime,
      'content-length': String(content.byteLength),
      'cache-control': ext === '.html' ? 'no-cache' : 'public, max-age=3600',
    })
    res.end(content)
    return
  }

  // SPA fallback: serve index.html for SPA routing
  const indexPath = join(DIST_DIR, 'index.html')
  if (existsSync(indexPath)) {
    const content = readFileSync(indexPath)
    res.writeHead(200, {
      'content-type': 'text/html; charset=utf-8',
      'content-length': String(content.byteLength),
      'cache-control': 'no-cache',
    })
    res.end(content)
    return
  }

  res.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' })
  res.end('Not Found')
}

function handler(req, res) {
  try {
    if (req.url && (req.url.startsWith(PROXY_PATH) || req.url.startsWith(BASE.slice(0, -1) + PROXY_PATH))) {
      return handleProxy(req, res)
    }
    serveStatic(req, res)
  } catch (err) {
    if (!res.headersSent) {
      res.writeHead(500, { 'content-type': 'text/plain; charset=utf-8' })
    }
    res.end(`Internal server error: ${err.message}`)
  }
}

function tryListen(port) {
  const srv = createServer(handler)
  return new Promise((resolve, reject) => {
    const onError = (err) => {
      srv.removeListener('listening', onListen)
      reject(err)
    }
    const onListen = () => {
      srv.removeListener('error', onError)
      resolve(srv)
    }
    srv.once('listening', onListen)
    srv.once('error', onError)
    srv.listen(port)
  })
}

;(async () => {
  let port = PORT
  const maxPort = PORT + 20
  let srv
  while (port <= maxPort) {
    try {
      srv = await tryListen(port)
      console.log(`MTK Launchpad server running at http://localhost:${port}`)
      console.log(`Proxy endpoint: ${PROXY_PATH}`)
      return
    } catch (err) {
      if (err.code === 'EADDRINUSE') {
        port++
        if (port <= maxPort) {
          console.warn(`Port ${port - 1} is in use, trying ${port}...`)
        }
      } else {
        console.error(err)
        process.exit(1)
      }
    }
  }
  console.error(`No available port in range ${PORT}-${maxPort}`)
  process.exit(1)
})()
