// Host half of the token billing panel plugin.
//
// The browser half (`./client.js`) injects the panel. This host half exists for
// two reasons:
//   1. it is the Loader entry the client-modules service discovers through the
//      package.json `dsh.client` declaration;
//   2. it fetches the official DeepSeek pricing page server-side (avoiding
//      browser CORS) and serves it back to the browser on a same-origin route.

export const inject = ['webServer']

const PRICING_URL = 'https://api-docs.deepseek.com/zh-cn/quick_start/pricing/'
const PRICING_ROUTE = '/plugins/dsh-client-ui-token-billing/pricing'
const CACHE_TTL_MS = 30 * 60 * 1000

let cached = null
let cachedAt = 0

function stripTags(html) {
  return String(html)
    .replace(/<[^>]+>/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function extractRows(tableHtml) {
  return [...tableHtml.matchAll(/<tr[\s\S]*?<\/tr>/gi)].map(m => m[0])
}

function extractCells(rowHtml) {
  return [...rowHtml.matchAll(/<td[\s\S]*?<\/td>/gi)].map(m => stripTags(m[0]))
}

function parseYuan(text) {
  const match = String(text).match(/([0-9]+(?:\.[0-9]+)?)\s*元/)
  return match ? Number(match[1]) : null
}

function parseCurrentPricing(tableHtml) {
  const rows = extractRows(tableHtml).map(extractCells)
  const models = []
  for (const row of rows) {
    if (row.length >= 2 && /deepseek-v4-(flash|pro)/.test(row.join(' '))) {
      const headerModels = row.filter(cell => /^deepseek-v4-(flash|pro)$/.test(cell))
      if (headerModels.length) models.push(...headerModels)
    }
  }
  if (!models.length) return null

  const result = {}
  for (const row of rows) {
    let labelIndex = -1
    let valueStart = -1
    if (row.length >= 4 && /百万tokens/.test(row[1] || '')) {
      labelIndex = 1
      valueStart = 2
    } else if (row.length >= 3 && /百万tokens/.test(row[0] || '')) {
      labelIndex = 0
      valueStart = 1
    }
    if (labelIndex < 0) continue
    const label = row[labelIndex]
    const values = row.slice(valueStart).map(parseYuan)
    const key = label.includes('缓存命中')
      ? 'inputCacheHit'
      : label.includes('缓存未命中')
        ? 'inputCacheMiss'
        : label.includes('输出')
          ? 'output'
          : null
    if (!key) continue
    for (let i = 0; i < models.length && i < values.length; i++) {
      if (!result[models[i]]) result[models[i]] = {}
      result[models[i]][key] = values[i]
    }
  }
  return Object.keys(result).length ? result : null
}

function parseUpcomingPricing(tableHtml) {
  const rows = extractRows(tableHtml).map(extractCells)
  const result = {}
  let currentModel = null
  for (const row of rows) {
    const joined = row.join(' ')
    if (/deepseek-v4-(flash|pro)/.test(joined)) {
      const modelCell = row.find(cell => /^deepseek-v4-(flash|pro)$/.test(cell))
      if (modelCell) currentModel = modelCell
    }
    if (!currentModel || !/时段/.test(joined)) continue
    const period = row.find(cell => /时段/.test(cell))
    const values = row.filter(cell => /元$/.test(cell)).map(parseYuan)
    if (!period || values.length < 3) continue
    const bucket = period.includes('空闲') ? 'offPeak' : 'peak'
    if (!result[currentModel]) result[currentModel] = {}
    result[currentModel][bucket] = {
      inputCacheHit: values[0],
      inputCacheMiss: values[1],
      output: values[2],
      cacheWrite: 0
    }
  }
  return Object.keys(result).length ? result : null
}

function parsePricing(html) {
  const tables = [...html.matchAll(/<table[\s\S]*?<\/table>/gi)].map(m => m[0])
  let current = null
  let upcoming = null
  for (const table of tables) {
    if (/空闲时段|高峰时段/.test(table)) {
      upcoming = parseUpcomingPricing(table) || upcoming
    } else if (/deepseek-v4-flash|deepseek-v4-pro/.test(table)) {
      current = parseCurrentPricing(table) || current
    }
  }
  return { current, upcoming }
}

async function fetchPricing() {
  const response = await fetch(PRICING_URL, {
    headers: {
      'user-agent': 'dsh-client-ui-token-billing/0.1 (+https://github.com/LucasleeCN/dsh-token-api)',
      'accept': 'text/html'
    },
    signal: AbortSignal.timeout(8000)
  })
  if (!response.ok) throw new Error(`pricing page HTTP ${response.status}`)
  const html = await response.text()
  return parsePricing(html)
}

function jsonResponse(res, status, payload) {
  const body = JSON.stringify(payload)
  res.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-cache'
  })
  res.end(body)
}

async function pricingRoute(req, res) {
  try {
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      jsonResponse(res, 405, { error: 'method not allowed' })
      return
    }
    if (!cached || Date.now() - cachedAt > CACHE_TTL_MS) {
      const parsed = await fetchPricing()
      cached = {
        fetchedAt: new Date().toISOString(),
        source: PRICING_URL,
        current: {
          effectiveUntil: '2026-08-17T00:00:00+08:00',
          models: parsed.current || {}
        },
        upcoming: {
          effectiveFrom: '2026-08-17T00:00:00+08:00',
          peakHours: [[9 * 60, 12 * 60], [14 * 60, 18 * 60]],
          models: parsed.upcoming || {}
        }
      }
      cachedAt = Date.now()
    }
    if (req.method === 'HEAD') {
      res.writeHead(200, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-cache' })
      res.end()
      return
    }
    jsonResponse(res, 200, cached)
  } catch (error) {
    // Never take the panel down because the pricing page changed or is unreachable.
    jsonResponse(res, 200, {
      fetchedAt: null,
      source: PRICING_URL,
      current: {
        effectiveUntil: '2026-08-17T00:00:00+08:00',
        models: {
          'deepseek-v4-flash': { inputCacheHit: 0.02, inputCacheMiss: 1.0, output: 2.0, cacheWrite: 0 },
          'deepseek-v4-pro': { inputCacheHit: 0.025, inputCacheMiss: 3.0, output: 6.0, cacheWrite: 0 }
        }
      },
      upcoming: {
        effectiveFrom: '2026-08-17T00:00:00+08:00',
        peakHours: [[9 * 60, 12 * 60], [14 * 60, 18 * 60]],
        models: {
          'deepseek-v4-flash': {
            offPeak: { inputCacheHit: 0.05, inputCacheMiss: 1.5, output: 4.5, cacheWrite: 0 },
            peak: { inputCacheHit: 0.10, inputCacheMiss: 3.0, output: 9.0, cacheWrite: 0 }
          },
          'deepseek-v4-pro': {
            offPeak: { inputCacheHit: 0.15, inputCacheMiss: 4.5, output: 13.5, cacheWrite: 0 },
            peak: { inputCacheHit: 0.30, inputCacheMiss: 9.0, output: 27.0, cacheWrite: 0 }
          }
        }
      }
    })
  }
}

export function apply(ctx) {
  if (!ctx.webServer) return
  ctx.effect(() => ctx.webServer.register({
    kind: 'exact',
    path: PRICING_ROUTE,
    handler: pricingRoute
  }), 'dsh-client-ui-token-billing: pricing route')
}

export { parsePricing, parseCurrentPricing, parseUpcomingPricing }
