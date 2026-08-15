import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import vm from 'node:vm'
import { fileURLToPath } from 'node:url'

const clientSource = readFileSync(
  new URL('../lib/client.js', import.meta.url),
  'utf8'
)

function makeElement(id) {
  const listeners = new Map()
  const classes = new Set()
  return {
    id: id || '',
    style: {},
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

function createHarness() {
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
    body: makeElement('body')
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
      getItem: () => null,
      setItem: () => {}
    },
    setInterval: () => 1,
    clearInterval: () => {}
  }

  const context = { window, document, console, fetch: null }
  vm.createContext(context)
  vm.runInContext(clientSource, context)

  return { window, document, byId, loadedSpec, context }
}

test('client bundle registers a loader entry and exposes apply()', () => {
  const { loadedSpec } = createHarness()
  assert.equal(loadedSpec.id, 'dsh-client-ui-token-billing')

  const module = loadedSpec.factory(() => {
    throw new Error('the plugin must not require external modules')
  })
  assert.equal(typeof module.apply, 'function')
})

test('apply() renders token usage, context pressure, and cost from official RPC shape', async () => {
  const harness = createHarness()
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
      model: 'deepseek-chat'
    }
  }

  context.fetch = async url => {
    const target = String(url)
    const value = target.includes('session.models') ? sessionModelsValue : sessionListValue
    return {
      ok: true,
      json: async () => ({
        type: 'server-response',
        rpcId: 'test-rpc-id',
        result: { ok: true, value }
      })
    }
  }

  const module = harness.loadedSpec.factory(() => {
    throw new Error('the plugin must not require external modules')
  })
  module.apply({ effect: () => {} })

  // The first refresh is fired by apply(); await a second one for determinism.
  await window.dshTokenBillingRefresh()

  assert.equal(byId('dsh-tb-model').textContent, 'deepseek-chat')
  assert.equal(byId('dsh-tb-tok-input').textContent, '1.0K')
  assert.equal(byId('dsh-tb-tok-output').textContent, '2.0K')
  assert.equal(byId('dsh-tb-tok-cache-read').textContent, '3.0K')
  assert.equal(byId('dsh-tb-ctx-pressure').textContent, '5.0K')
  assert.equal(byId('dsh-tb-ctx-projected').textContent, '6.0K')
  assert.equal(byId('dsh-tb-ctx-window').textContent, '100.0K')
  assert.equal(byId('dsh-tb-ctx-pct').textContent, '5%')
  assert.equal(byId('dsh-tb-ctx-bar').style.width, '5%')
  assert.equal(byId('dsh-tb-cost-total').textContent, '¥0.0195')
  assert.match(byId('dsh-tb-session').innerHTML, /session-1/)
  assert.match(byId('dsh-tb-status').textContent, /已更新/)
})

test('apply() shows unconfigured pricing hint when model price is missing', async () => {
  const harness = createHarness()
  const { window, byId, context } = harness

  context.fetch = async url => {
    const target = String(url)
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
    return {
      ok: true,
      json: async () => ({
        type: 'server-response',
        rpcId: 'test-rpc-id',
        result: { ok: true, value }
      })
    }
  }

  const module = harness.loadedSpec.factory(() => {
    throw new Error('the plugin must not require external modules')
  })
  module.apply({ effect: () => {} })
  await window.dshTokenBillingRefresh()

  assert.equal(byId('dsh-tb-cost-total').textContent, '-')
  assert.match(byId('dsh-tb-price-hint').textContent, /未配置价格/)
})
