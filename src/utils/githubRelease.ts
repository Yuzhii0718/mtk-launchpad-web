import type { FirmwareCandidate } from '../types'
import { parseFirmwareName } from './fileNameParsers'

interface GithubReleaseAsset {
  url: string
  name: string
  size: number
  browser_download_url: string
}

interface GithubReleaseResponse {
  tag_name: string
  assets: GithubReleaseAsset[]
}

export interface ReleaseQueryResult {
  tag: string
  candidates: FirmwareCandidate[]
}

const LOCAL_PROXY_PATH = '/__mtk_asset_proxy'

const CORS_PROXIES: Array<{ label: string; buildUrl: (url: string) => string }> = [
  {
    label: 'codetabs-proxy',
    buildUrl: (url) => `https://api.codetabs.com/v1/proxy/?quest=${encodeURIComponent(url)}`,
  },
]

const NOISY_FALLBACK_PROXIES: Array<{ label: string; buildUrl: (url: string) => string }> = [
  {
    label: 'corsproxy-io',
    buildUrl: (url) => `https://corsproxy.io/?${encodeURIComponent(url)}`,
  },
  {
    label: 'isomorphic-git-proxy',
    buildUrl: (url) => `https://cors.isomorphic-git.org/${url}`,
  },
]

function buildLocalProxyUrl(targetUrl: string, accept?: string): string {
  const params = new URLSearchParams({
    target: targetUrl,
  })
  if (accept) {
    params.set('accept', accept)
  }
  return `${LOCAL_PROXY_PATH}?${params.toString()}`
}

/** Lazily memoized check: does the same-origin proxy endpoint exist? */
let proxyAvailable: boolean | null = null
let proxyCheckPromise: Promise<boolean> | null = null

async function checkProxyAvailable(): Promise<boolean> {
  if (proxyAvailable !== null) return proxyAvailable
  if (proxyCheckPromise) return proxyCheckPromise

  if (typeof window === 'undefined') {
    proxyAvailable = true
    return true
  }

  proxyCheckPromise = (async () => {
    try {
      // Use a simple, fast-responding target for the check.
      const testUrl = buildLocalProxyUrl('https://api.github.com/zen')
      const resp = await fetch(testUrl, { method: 'HEAD', cache: 'no-store' })
      // SPA fallback (e.g. Cloudflare Pages) returns text/html for unknown
      // routes with a 200 status. The real proxy returns text/plain on errors
      // or application/octet-stream on success — never text/html.
      const ct = (resp.headers.get('content-type') || '').toLowerCase()
      proxyAvailable = resp.ok && !ct.includes('text/html')
    } catch {
      proxyAvailable = false
    }
    return proxyAvailable
  })()

  return proxyCheckPromise
}

export interface CdnMirrorConfig {
  enabled: boolean
  baseUrl: string
}

export function buildCdnUrl(originalUrl: string, cdnMirrorUrl: string): string {
  const base = cdnMirrorUrl.replace(/\/+$/, '')
  return `${base}/${originalUrl}`
}

export async function fetchReleaseCandidates(apiUrl: string): Promise<ReleaseQueryResult> {
  const response = await fetch(apiUrl, {
    headers: {
      Accept: 'application/vnd.github+json',
    },
  })

  if (!response.ok) {
    throw new Error(`GitHub API error: ${response.status}`)
  }

  const json = (await response.json()) as GithubReleaseResponse

  const candidates: FirmwareCandidate[] = json.assets.flatMap((asset) => {
    const parsed = parseFirmwareName(asset.name)
    if (!parsed) {
      return []
    }

    const candidate: FirmwareCandidate = {
      ...parsed,
      source: 'github-release',
      size: asset.size,
      url: asset.browser_download_url,
      githubAssetApiUrl: asset.url,
    }
    return [candidate]
  })

  return {
    tag: json.tag_name,
    candidates,
  }
}

export async function downloadFirmwareCandidate(candidate: FirmwareCandidate, cdn?: CdnMirrorConfig): Promise<ArrayBuffer> {
  if (candidate.source !== 'github-release') {
    if (!candidate.url) {
      throw new Error('Missing firmware URL')
    }

    const response = await fetch(candidate.url)
    if (!response.ok) {
      throw new Error(`File download failed: ${response.status}`)
    }
    return response.arrayBuffer()
  }

  const attempts: Array<{ url: string; init?: RequestInit; label: string }> = []
  const proxyReady = await checkProxyAvailable()
  const cdnEnabled = cdn?.enabled && cdn?.baseUrl

  // --- 1. CDN (proxied if proxy is available, direct otherwise) ---
  if (cdnEnabled && candidate.url) {
    const cdnUrl = buildCdnUrl(candidate.url, cdn!.baseUrl)
    if (proxyReady) {
      attempts.push({ url: buildLocalProxyUrl(cdnUrl), label: 'cdn-mirror-via-proxy' })
    } else {
      attempts.push({ url: cdnUrl, label: 'cdn-mirror' })
    }
  }

  // --- 2. Proxied GitHub URLs (only if proxy is available) ---
  if (proxyReady) {
    if (candidate.githubAssetApiUrl) {
      attempts.push({
        url: buildLocalProxyUrl(candidate.githubAssetApiUrl, 'application/octet-stream'),
        label: 'local-proxy-github-asset-api',
      })
    }
    if (candidate.url) {
      attempts.push({
        url: buildLocalProxyUrl(candidate.url),
        label: 'local-proxy-github-download-url',
      })
    }
  }

  // --- 3. Direct GitHub URLs (always try these) ---
  if (candidate.githubAssetApiUrl) {
    attempts.push({
      url: candidate.githubAssetApiUrl,
      init: { headers: { Accept: 'application/octet-stream' } },
      label: 'github-asset-api',
    })
  }
  if (candidate.url) {
    attempts.push({
      url: candidate.url,
      label: 'github-download-url',
    })
  }

  // --- 4. CORS proxies ---
  if (candidate.githubAssetApiUrl) {
    for (const proxy of CORS_PROXIES) {
      attempts.push({
        url: proxy.buildUrl(candidate.githubAssetApiUrl),
        init: { headers: { Accept: 'application/octet-stream' } },
        label: `${proxy.label}-github-asset-api`,
      })
    }
    for (const proxy of NOISY_FALLBACK_PROXIES) {
      attempts.push({
        url: proxy.buildUrl(candidate.githubAssetApiUrl),
        init: { headers: { Accept: 'application/octet-stream' } },
        label: `${proxy.label}-github-asset-api`,
      })
    }
  }
  if (candidate.url) {
    for (const proxy of CORS_PROXIES) {
      attempts.push({
        url: proxy.buildUrl(candidate.url),
        label: `${proxy.label}-github-download-url`,
      })
    }
    for (const proxy of NOISY_FALLBACK_PROXIES) {
      attempts.push({
        url: proxy.buildUrl(candidate.url),
        label: `${proxy.label}-github-download-url`,
      })
    }
  }

  if (attempts.length === 0) {
    throw new Error('Missing firmware URL')
  }

  const errors: string[] = []

  for (const attempt of attempts) {
    try {
      const response = await fetch(attempt.url, attempt.init)
      if (!response.ok) {
        errors.push(`${attempt.label}: HTTP ${response.status}`)
        continue
      }

      const contentType = response.headers.get('content-type')?.toLowerCase() ?? ''
      if (contentType.includes('application/json')) {
        const text = await response.text()
        errors.push(`${attempt.label}: unexpected json response (${text.slice(0, 120)})`)
        continue
      }

      return response.arrayBuffer()
    } catch (error) {
      errors.push(`${attempt.label}: ${String(error)}`)
    }
  }

  throw new Error(
    `Remote asset fetch failed. ${errors.join(' | ')}`,
  )
}

export function triggerBrowserFileDownload(candidate: FirmwareCandidate, cdn?: CdnMirrorConfig): void {
  if (!candidate.url) {
    throw new Error('Missing browser download URL')
  }

  const href = (cdn?.enabled && cdn?.baseUrl)
    ? buildCdnUrl(candidate.url, cdn.baseUrl)
    : candidate.url

  const anchor = document.createElement('a')
  anchor.href = href
  anchor.download = candidate.fileName
  anchor.rel = 'noopener noreferrer'
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
}

export function triggerBrowserFileDownloadFromApi(candidate: FirmwareCandidate, cdn?: CdnMirrorConfig): void {
  if (!candidate.githubAssetApiUrl) {
    triggerBrowserFileDownload(candidate, cdn)
    return
  }

  const href = (cdn?.enabled && cdn?.baseUrl)
    ? buildCdnUrl(candidate.githubAssetApiUrl, cdn.baseUrl)
    : candidate.githubAssetApiUrl

  const anchor = document.createElement('a')
  anchor.href = href
  anchor.rel = 'noopener noreferrer'
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
}
