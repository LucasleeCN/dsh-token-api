import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import vm from 'node:vm'
import { fileURLToPath } from 'node:url'
import { parsePricing } from '../lib/index.js'

const clientSource = readFileSync(
  new URL('../lib/client.js', import.meta.url),
  'utf8'
)

const PRICING_ROUTE = '/plugins/dsh-client-ui-token-billing/pricing'

function makeElement(id) {
  const listeners = new Map()
  const classes = new Set()
  return {
    id: id || '',
    style: {
      setProperty() {}
    },
    dataset: {},
    textContent: '',
    innerHTML: '',
    value: '',
    parentNode: null,
    children: [],
    classList: {
      add: (...names) => names.forEach(name => classes.add(name)),
      remove: (...names) => names.forEach(name => classes.delete(name)),
      toggle: (name, force) => {
        const next = force === undefined ? !classes.has(name) : Boolean(force)
        if (next) classes.add(name)
        else classes.delete(name)
        return next
      },
      contains: name => classes.has(name)
    },
    appendChild(child) {
      child.parentNode = this
      this.children.push(child)
      return child
    },
    addEventListener(type, handler) {
      if (!listeners.has(type)) listeners.set(type, [])
      listeners.get(type).push(handler)
    },
    dispatch(type, event = {}) {
      for (const handler of listeners.get(type) || []) handler(event)
    },
    querySelector(selector) {
      if (selector.startsWith('#')) return document.getElementById(selector.slice(1))
      return null
    }
  }
}

function createHarness(storage = {}) {
  const registry = new Map()
  function byId(id) {
    if (!registry.has(id)) registry.set(id, makeElement(id))
    return registry.get(id)
  }

  const document = {
    getElementById: byId,
    createElement() {
      return makeElement('')
    },
    head: makeElement('head'),
    body: makeElement('body'),
    querySelectorAll() {
      return []
    }
  }

  let loadedSpec = null
  const window = {
    __ModuleLoader__: {
      load(spec) {
        loadedSpec = spec
      }
    },
    crypto: { randomUUID: () => 'test-rpc-id' },
    localStorage: {
      getItem: key => (key in storage ? JSON.stringify(storage[key]) : null),
      setItem: (key, value) => { storage[key] = JSON.parse(value) }
    },
    setInterval: () => 1,
    clearInterval: () => {}
  }

  const context = { window, document, console, fetch: null }
  vm.createContext(context)
  vm.runInContext(clientSource, context)

  return { window, document, byId, loadedSpec, context }
}

function rpcResponse(value) {
  return {
    ok: true,
    json: async () => ({
      type: 'server-response',
      rpcId: 'test-rpc-id',
      result: { ok: true, value }
    })
  }
}

test('client bundle registers a loader entry and exposes apply()', () => {
  const { loadedSpec } = createHarness()
  assert.equal(loadedSpec.id, 'dsh-client-ui-token-billing')

  const module = loadedSpec.factory(() => {
    throw new Error('the plugin must not require external modules')
  })
  assert.equal(typeof module.apply, 'function')
})

test('host parser extracts current and upcoming peak/off-peak pricing from the official page', () => {
  const html = `
<table>
  <tr><td colspan="2">模型</td><td>deepseek-v4-flash</td><td>deepseek-v4-pro</td></tr>
  <tr><td rowspan="3">价格</td><td>百万tokens输入（缓存命中）</td><td>0.02元</td><td>0.025元</td></tr>
  <tr><td>百万tokens输入（缓存未命中）</td><td>1元</td><td>3元</td></tr>
  <tr><td>百万tokens输出</td><td>2元</td><td>6元</td></tr>
</table>
<table>
  <tr><td colspan="2">模型</td><td>百万tokens输入（缓存命中）</td><td>百万tokens输入（缓存未命中）</td><td>百万tokens输出</td></tr>
  <tr><td rowspan="2">deepseek-v4-flash</td><td>空闲时段</td><td>0.05元</td><td>1.5元</td><td>4.5元</td></tr>
  <tr><td>高峰时段</td><td>0.10元</td><td>3.0元</td><td>9.0元</td></tr>
  <tr><td rowspan="2">deepseek-v4-pro</td><td>空闲时段</td><td>0.15元</td><td>4.5元</td><td>13.5元</td></tr>
  <tr><td>高峰时段</td><td>0.30元</td><td>9.0元</td><td>27.0元</td></tr>
</table>`

  const parsed = parsePricing(html)
  assert.equal(parsed.current['deepseek-v4-flash'].inputCacheHit, 0.02)
  assert.equal(parsed.current['deepseek-v4-pro'].inputCacheMiss, 3)
  assert.equal(parsed.current['deepseek-v4-pro'].output, 6)
  assert.equal(parsed.upcoming['deepseek-v4-flash'].offPeak.inputCacheHit, 0.05)
  assert.equal(parsed.upcoming['deepseek-v4-flash'].peak.output, 9)
  assert.equal(parsed.upcoming['deepseek-v4-pro'].offPeak.inputCacheMiss, 4.5)
  assert.equal(parsed.upcoming['deepseek-v4-pro'].peak.output, 27)
})

test('apply() renders token usage, context pressure, cost, and reasoning level', async () => {
  const storage = {
    'dsh-client-ui-token-billing.prices.v1': {
      'deepseek-v4-pro': {
        inputCacheHit: 0.5,
        inputCacheMiss: 2,
        output: 8,
        cacheWrite: 0
      }
    }
  }
  const harness = createHarness(storage)
  const { window, byId, context } = harness

  const sessionListValue = {
    items: [{
      sessionId: 'session-1',
      running: true,
      projections: {
        values: {
          title: '测试会话',
          tokenUsage: {
            uncachedInputTokens: 1000,
            outputTokens: 2000,
            cacheReadTokens: 3000,
            cacheWriteTokens: 0
          },
          contextPressure: {
            pressureTokens: 5000,
            projectedTokens: 6000,
            contextWindow: 100000
          },
          sessionStats: {
            steps: 3,
            llmMs: 12000,
            decodeTokens: 2000
          }
        }
      }
    }]
  }
  const sessionModelsValue = {
    current: {
      provider: 'deepseek-official',
      model: 'deepseek-v4-pro',
      reasoningEffort: 'high'
    },
    groups: [{
      id: 'deepseek-official',
      models: [{
        id: 'deepseek-v4-pro',
        reasoning: {
          efforts: [
            { id: 'off', name: 'Off' },
            { id: 'high', name: 'High' },
            { id: 'max', name: 'Max' }
          ]
        }
      }]
    }]
  }

  context.fetch = async url => {
    const target = String(url)
    if (target.includes(PRICING_ROUTE)) return rpcResponse({ current: null })
    const value = target.includes('session.models') ? sessionModelsValue : sessionListValue
    return rpcResponse(value)
  }

  const module = harness.loadedSpec.factory(() => {
    throw new Error('the plugin must not require external modules')
  })
  module.apply({ effect: () => {} })
  await window.dshTokenBillingRefresh()

  assert.equal(byId('dsh-tb-model-name').textContent, 'deepseek-v4-pro')
  assert.equal(byId('dsh-tb-provider').textContent, 'deepseek-official')
  assert.equal(byId('dsh-tb-tok-input').textContent, '1.0K')
  assert.equal(byId('dsh-tb-tok-output').textContent, '2.0K')
  assert.equal(byId('dsh-tb-tok-cache-read').textContent, '3.0K')
  assert.equal(byId('dsh-tb-ctx-pressure').textContent, '5.0K')
  assert.equal(byId('dsh-tb-ctx-projected').textContent, '6.0K')
  assert.equal(byId('dsh-tb-ctx-window').textContent, '100.0K')
  assert.equal(byId('dsh-tb-ctx-pct').textContent, '5%')
  assert.equal(byId('dsh-tb-ctx-bar').style.width, '5%')
  assert.equal(byId('dsh-tb-cost-total').textContent, '¥0.0195')
  assert.equal(byId('dsh-tb-cost-total-line').textContent, '¥0.0195')
  assert.equal(byId('dsh-tb-reasoning-value').textContent, 'High')
  assert.match(byId('dsh-tb-reasoning-labels').innerHTML, /Off/)
  assert.match(byId('dsh-tb-reasoning-labels').innerHTML, /Max/)
  assert.match(byId('dsh-tb-session').innerHTML, /session-1/)
  assert.match(byId('dsh-tb-status').textContent, /已更新/)
})

test('apply() shows missing price hint when model price is unknown', async () => {
  const harness = createHarness()
  const { window, byId, context } = harness

  context.fetch = async url => {
    const target = String(url)
    if (target.includes(PRICING_ROUTE)) return rpcResponse({ current: null })
    const value = target.includes('session.models')
      ? { current: { provider: 'deepseek-official', model: 'unknown-model' } }
      : {
          items: [{
            sessionId: 'session-2',
            running: true,
            projections: {
              values: {
                tokenUsage: {
                  uncachedInputTokens: 100,
                  outputTokens: 200,
                  cacheReadTokens: 0,
                  cacheWriteTokens: 0
                },
                contextPressure: {
                  pressureTokens: 100,
                  projectedTokens: 120,
                  contextWindow: 100000
                }
              }
            }
          }]
        }
    return rpcResponse(value)
  }

  const module = harness.loadedSpec.factory(() => {
    throw new Error('the plugin must not require external modules')
  })
  module.apply({ effect: () => {} })
  await window.dshTokenBillingRefresh()

  assert.equal(byId('dsh-tb-cost-total').textContent, '-')
  assert.match(byId('dsh-tb-price-hint').textContent, /未找到该模型/)
})
