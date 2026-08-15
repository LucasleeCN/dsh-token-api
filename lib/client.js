window.__ModuleLoader__.load({
  id: "dsh-client-ui-token-billing",
  factory: (require) => {
    var module = { exports: {} }
    var exports = module.exports

    var STYLE_ID = "dsh-client-ui-token-billing-style"
    var ROOT_ID = "dsh-client-ui-token-billing-root"
    var PANEL_ID = "dsh-client-ui-token-billing-panel"
    var PRICE_STORAGE_KEY = "dsh-client-ui-token-billing.prices.v1"
    var POLL_INTERVAL_MS = 4000

    // 全部视觉都消费 DeepSeek Harness 官方设计变量（--dsw-alias-*），
    // 浅色/深色主题由 body[data-ds-dark-theme] 自动切换，插件不另起一套配色。
    var CSS = `
#dsh-client-ui-token-billing-root {
  position: fixed;
  right: 12px;
  bottom: 12px;
  z-index: 2147483647;
  font-family: system-ui, -apple-system, "Segoe UI", "Microsoft YaHei", sans-serif;
  color: var(--dsw-alias-label-primary, #0f172a);
}

#dsh-client-ui-token-billing-fab {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 32px;
  padding: 0 12px;
  margin-left: auto;
  border: 1px solid var(--dsw-alias-border-l2, rgba(0, 0, 0, 0.08));
  border-radius: 10px;
  background: var(--dsw-alias-bg-overlay, rgba(255, 255, 255, 0.88));
  color: var(--dsw-alias-label-primary, #0f172a);
  font-size: 12px;
  font-weight: 600;
  line-height: 1;
  cursor: pointer;
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.14);
  -webkit-backdrop-filter: blur(16px);
  backdrop-filter: blur(16px);
  transition: background 0.15s ease, transform 0.15s ease;
}
#dsh-client-ui-token-billing-fab:hover {
  background: var(--dsw-alias-button-floating-hover, rgba(255, 255, 255, 0.95));
  transform: translateY(-1px);
}
.dsh-tb-fab-dot {
  width: 6px;
  height: 6px;
  border-radius: 999px;
  background: var(--dsw-alias-state-success-primary, rgba(22, 163, 74, 0.9));
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--dsw-alias-state-success-primary, rgba(22, 163, 74, 0.9)) 18%, transparent);
}

#dsh-client-ui-token-billing-panel {
  position: absolute;
  right: 0;
  bottom: 44px;
  width: 316px;
  max-height: min(72vh, 600px);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border: 1px solid var(--dsw-alias-border-l2, rgba(0, 0, 0, 0.08));
  border-radius: 14px;
  background: var(--dsw-alias-bg-overlay, rgba(255, 255, 255, 0.92));
  box-shadow: 0 18px 48px rgba(15, 23, 42, 0.22);
  -webkit-backdrop-filter: blur(22px) saturate(150%);
  backdrop-filter: blur(22px) saturate(150%);
}
#dsh-client-ui-token-billing-panel.dsh-tb-hidden { display: none; }

.dsh-tb-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px;
  border-bottom: 1px solid var(--dsw-alias-border-l2, rgba(0, 0, 0, 0.08));
}
.dsh-tb-title {
  display: flex;
  align-items: center;
  gap: 7px;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.01em;
  color: var(--dsw-alias-label-primary, #0f172a);
}
.dsh-tb-title::before {
  content: "";
  width: 8px;
  height: 8px;
  border-radius: 3px;
  background: #4d6bfe;
  box-shadow: 0 0 0 3px rgba(77, 107, 254, 0.14);
}
.dsh-tb-head-actions { display: flex; gap: 4px; }
.dsh-tb-head-actions button {
  width: 24px;
  height: 24px;
  border: none;
  border-radius: 7px;
  background: transparent;
  color: var(--dsw-alias-label-tertiary, #475569);
  font-size: 13px;
  line-height: 1;
  cursor: pointer;
}
.dsh-tb-head-actions button:hover {
  background: var(--dsw-alias-interactive-bg-hover, rgba(38, 49, 72, 0.08));
  color: var(--dsw-alias-label-primary, #0f172a);
}

.dsh-tb-body {
  padding: 10px 12px;
  overflow: auto;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.dsh-tb-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  font-size: 11px;
  line-height: 1.4;
}
.dsh-tb-row > label {
  color: var(--dsw-alias-label-tertiary, #475569);
  white-space: nowrap;
  flex: 0 0 auto;
}
.dsh-tb-row select,
.dsh-tb-row input[type="number"] {
  flex: 1;
  min-width: 0;
  height: 26px;
  border: 1px solid var(--dsw-alias-border-l2, rgba(0, 0, 0, 0.08));
  border-radius: 7px;
  background: var(--dsw-alias-bg-layer-1, rgba(255, 255, 255, 0.62));
  color: var(--dsw-alias-label-primary, #0f172a);
  font-size: 11px;
  padding: 0 7px;
  outline: none;
}
.dsh-tb-row select:focus,
.dsh-tb-row input[type="number"]:focus {
  border-color: #4d6bfe;
}

.dsh-tb-section {
  margin-top: 2px;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: var(--dsw-alias-label-dimmed, rgba(51, 65, 85, 0.55));
}

.dsh-tb-context-card {
  border: 1px solid var(--dsw-alias-border-l2, rgba(0, 0, 0, 0.08));
  border-radius: 10px;
  background: var(--dsw-alias-bg-layer-1, rgba(255, 255, 255, 0.62));
  padding: 8px 9px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.dsh-tb-context-line {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  font-size: 10px;
  color: var(--dsw-alias-label-tertiary, #475569);
  font-variant-numeric: tabular-nums;
}
.dsh-tb-context-line strong {
  font-size: 12px;
  font-weight: 700;
  color: var(--dsw-alias-label-primary, #0f172a);
}
.dsh-tb-context-track {
  height: 5px;
  border-radius: 999px;
  background: var(--dsw-alias-bg-skeleton, rgba(15, 23, 42, 0.08));
  overflow: hidden;
}
.dsh-tb-context-fill {
  height: 100%;
  width: 0%;
  border-radius: inherit;
  background: linear-gradient(90deg, #4d6bfe, #7c8cff);
  transition: width 0.35s ease;
}
.dsh-tb-context-fill.dsh-tb-warn { background: linear-gradient(90deg, #f59e0b, #fbbf24); }
.dsh-tb-context-fill.dsh-tb-danger { background: linear-gradient(90deg, #dc2626, #f87171); }

.dsh-tb-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 6px;
}
.dsh-tb-cell {
  border: 1px solid var(--dsw-alias-border-l2, rgba(0, 0, 0, 0.08));
  border-radius: 9px;
  background: var(--dsw-alias-bg-layer-1, rgba(255, 255, 255, 0.62));
  padding: 6px 8px;
}
.dsh-tb-cell-label { font-size: 10px; color: var(--dsw-alias-label-tertiary, #475569); }
.dsh-tb-cell-value {
  font-size: 13px;
  font-weight: 700;
  margin-top: 1px;
  color: var(--dsw-alias-label-primary, #0f172a);
  font-variant-numeric: tabular-nums;
}

.dsh-tb-cost { display: flex; flex-direction: column; gap: 3px; }
.dsh-tb-cost-line {
  display: flex;
  justify-content: space-between;
  font-size: 10px;
  color: var(--dsw-alias-label-tertiary, #475569);
  font-variant-numeric: tabular-nums;
}
.dsh-tb-cost-line.dsh-tb-total {
  margin-top: 3px;
  padding-top: 6px;
  border-top: 1px dashed var(--dsw-alias-border-l2, rgba(0, 0, 0, 0.08));
  font-size: 13px;
  font-weight: 800;
  color: var(--dsw-alias-label-primary, #0f172a);
}
.dsh-tb-total-value { color: #4d6bfe; }
body[data-ds-dark-theme] .dsh-tb-total-value { color: #8ea2ff; }

.dsh-tb-hint {
  font-size: 10px;
  line-height: 1.4;
  color: var(--dsw-alias-state-warn-label, rgba(180, 83, 9, 0.9));
}
body[data-ds-dark-theme] .dsh-tb-hint { color: var(--dsw-alias-state-warn-label, #fbbf24); }

.dsh-tb-settings {
  border-top: 1px solid var(--dsw-alias-border-l2, rgba(0, 0, 0, 0.08));
  padding-top: 8px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.dsh-tb-settings.dsh-tb-hidden { display: none; }
.dsh-tb-settings-buttons { display: flex; gap: 6px; }
.dsh-tb-settings-buttons button {
  flex: 1;
  height: 26px;
  border: none;
  border-radius: 7px;
  background: var(--dsw-alias-button-primary-fill, #4d6bfe);
  color: var(--dsw-alias-label-primary-foreground, #ffffff);
  font-size: 11px;
  font-weight: 600;
  cursor: pointer;
}
.dsh-tb-settings-buttons button:hover {
  background: var(--dsw-alias-button-primary-hover, rgba(59, 130, 246, 0.9));
}
.dsh-tb-settings-buttons button.dsh-tb-secondary {
  background: var(--dsw-alias-interactive-bg-hover, rgba(38, 49, 72, 0.08));
  color: var(--dsw-alias-label-secondary, #334155);
}
.dsh-tb-settings-buttons button.dsh-tb-secondary:hover {
  background: var(--dsw-alias-interactive-bg-active, rgba(38, 49, 72, 0.12));
}

.dsh-tb-foot {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  padding: 7px 12px;
  border-top: 1px solid var(--dsw-alias-border-l2, rgba(0, 0, 0, 0.08));
  font-size: 10px;
  color: var(--dsw-alias-label-dimmed, rgba(51, 65, 85, 0.55));
  font-variant-numeric: tabular-nums;
}
`

    // 内置价格仅作为占位示例，不宣称是官方实时价格；用户保存的价格写入 localStorage。
    var MODEL_PRESETS = [
      {
        id: "deepseek-chat",
        name: "DeepSeek Chat",
        input: 2.0,
        output: 8.0,
        cacheRead: 0.5,
        cacheWrite: 0,
        note: "内置为示例价，请按 DeepSeek 官方价格调整"
      },
      {
        id: "deepseek-reasoner",
        name: "DeepSeek Reasoner",
        input: 4.0,
        output: 16.0,
        cacheRead: 1.0,
        cacheWrite: 0,
        note: "内置为示例价，请按 DeepSeek 官方价格调整"
      }
    ]

    function loadPrices() {
      try {
        var raw = window.localStorage.getItem(PRICE_STORAGE_KEY)
        if (raw) {
          var parsed = JSON.parse(raw)
          if (parsed && typeof parsed === "object") return parsed
        }
      } catch (error) {}
      return {}
    }

    function savePrices(prices) {
      try {
        window.localStorage.setItem(PRICE_STORAGE_KEY, JSON.stringify(prices))
      } catch (error) {}
    }

    function defaultPriceFor(modelId) {
      if (!modelId) return null
      for (var i = 0; i < MODEL_PRESETS.length; i++) {
        if (MODEL_PRESETS[i].id === modelId) {
          var p = MODEL_PRESETS[i]
          return {
            input: p.input,
            output: p.output,
            cacheRead: p.cacheRead,
            cacheWrite: p.cacheWrite,
            note: p.note
          }
        }
      }
      return null
    }

    function priceForModel(modelId) {
      var stored = loadPrices()
      if (modelId && stored[modelId]) return stored[modelId]
      return defaultPriceFor(modelId)
    }

    function setPriceForModel(modelId, price) {
      var prices = loadPrices()
      prices[modelId] = {
        input: Number(price.input) || 0,
        output: Number(price.output) || 0,
        cacheRead: Number(price.cacheRead) || 0,
        cacheWrite: Number(price.cacheWrite) || 0
      }
      savePrices(prices)
    }

    function rpc(method, payload) {
      var rpcId = (window.crypto && typeof window.crypto.randomUUID === "function")
        ? window.crypto.randomUUID()
        : "rpc-" + Date.now() + "-" + Math.random().toString(36).slice(2)
      var envelope = {
        type: "client-request",
        rpcId: rpcId,
        method: method,
        payload: payload || {}
      }
      return fetch("/api/" + method, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(envelope)
      }).then(function (response) {
        if (!response.ok) throw new Error("HTTP " + response.status + " for " + method)
        return response.json()
      }).then(function (message) {
        if (message && message.result && message.result.ok) return message.result.value
        var err = message && message.result && message.result.error
        throw new Error((err && err.message) || ("RPC failed: " + method))
      })
    }

    function fmtTokens(n) {
      n = Number(n) || 0
      if (n >= 1000000) return (n / 1000000).toFixed(2) + "M"
      if (n >= 1000) return (n / 1000).toFixed(1) + "K"
      return String(n)
    }

    function fmtCost(n) {
      return "¥" + (Number(n) || 0).toFixed(4)
    }

    function fmtTime(ms) {
      ms = Number(ms) || 0
      if (ms >= 60000) return (ms / 60000).toFixed(1) + " min"
      if (ms >= 1000) return (ms / 1000).toFixed(1) + " s"
      return ms + " ms"
    }

    function calcCost(usage, price) {
      if (!usage || !price) return null
      var input = (Number(usage.uncachedInputTokens) || 0) / 1000000 * (Number(price.input) || 0)
      var output = (Number(usage.outputTokens) || 0) / 1000000 * (Number(price.output) || 0)
      var cacheRead = (Number(usage.cacheReadTokens) || 0) / 1000000 * (Number(price.cacheRead) || 0)
      var cacheWrite = (Number(usage.cacheWriteTokens) || 0) / 1000000 * (Number(price.cacheWrite) || 0)
      return {
        input: input,
        output: output,
        cacheRead: cacheRead,
        cacheWrite: cacheWrite,
        total: input + output + cacheRead + cacheWrite
      }
    }

    function ensureStyle() {
      var style = document.getElementById(STYLE_ID)
      if (!style) {
        style = document.createElement("style")
        style.id = STYLE_ID
        style.dataset.plugin = "dsh-client-ui-token-billing"
        style.textContent = CSS
        document.head.appendChild(style)
      }
      return style
    }

    function buildPanel() {
      var root = document.createElement("div")
      root.id = ROOT_ID
      root.innerHTML = `
<button id="dsh-client-ui-token-billing-fab" type="button" title="显示当前 API Token 计费信息">
  <span class="dsh-tb-fab-dot"></span>Token
</button>
<div id="dsh-client-ui-token-billing-panel" class="dsh-tb-hidden">
  <div class="dsh-tb-head">
    <div class="dsh-tb-title">API Token 计费</div>
    <div class="dsh-tb-head-actions">
      <button id="dsh-tb-refresh" type="button" title="刷新">↻</button>
      <button id="dsh-tb-settings" type="button" title="价格设置">⚙</button>
      <button id="dsh-tb-close" type="button" title="关闭">×</button>
    </div>
  </div>
  <div class="dsh-tb-body">
    <div class="dsh-tb-row">
      <label for="dsh-tb-session">会话</label>
      <select id="dsh-tb-session"></select>
    </div>
    <div class="dsh-tb-row">
      <label>模型</label>
      <span id="dsh-tb-model">-</span>
    </div>

    <div class="dsh-tb-section">上下文窗口</div>
    <div class="dsh-tb-context-card">
      <div class="dsh-tb-context-line">
        <span>已用 <strong id="dsh-tb-ctx-pressure">-</strong> / <span id="dsh-tb-ctx-window">-</span></span>
        <span id="dsh-tb-ctx-pct">-</span>
      </div>
      <div class="dsh-tb-context-track"><div class="dsh-tb-context-fill" id="dsh-tb-ctx-bar"></div></div>
      <div class="dsh-tb-context-line">
        <span>下次预计</span>
        <strong id="dsh-tb-ctx-projected">-</strong>
      </div>
    </div>

    <div class="dsh-tb-section">Token 用量（本会话累计）</div>
    <div class="dsh-tb-grid">
      <div class="dsh-tb-cell"><div class="dsh-tb-cell-label">输入</div><div class="dsh-tb-cell-value" id="dsh-tb-tok-input">-</div></div>
      <div class="dsh-tb-cell"><div class="dsh-tb-cell-label">输出</div><div class="dsh-tb-cell-value" id="dsh-tb-tok-output">-</div></div>
      <div class="dsh-tb-cell"><div class="dsh-tb-cell-label">缓存读</div><div class="dsh-tb-cell-value" id="dsh-tb-tok-cache-read">-</div></div>
      <div class="dsh-tb-cell"><div class="dsh-tb-cell-label">缓存写</div><div class="dsh-tb-cell-value" id="dsh-tb-tok-cache-write">-</div></div>
    </div>

    <div class="dsh-tb-section">费用估算（¥ / 1M tokens）</div>
    <div class="dsh-tb-cost">
      <div class="dsh-tb-cost-line"><span>输入</span><span id="dsh-tb-cost-input">-</span></div>
      <div class="dsh-tb-cost-line"><span>输出</span><span id="dsh-tb-cost-output">-</span></div>
      <div class="dsh-tb-cost-line"><span>缓存读</span><span id="dsh-tb-cost-cache-read">-</span></div>
      <div class="dsh-tb-cost-line"><span>缓存写</span><span id="dsh-tb-cost-cache-write">-</span></div>
      <div class="dsh-tb-cost-line dsh-tb-total"><span>合计</span><span class="dsh-tb-total-value" id="dsh-tb-cost-total">-</span></div>
    </div>
    <div class="dsh-tb-hint" id="dsh-tb-price-hint">该模型未配置价格，点击 ⚙ 设置后显示费用估算。</div>

    <div id="dsh-tb-settings-block" class="dsh-tb-settings dsh-tb-hidden">
      <div class="dsh-tb-row">
        <label for="dsh-tb-preset">价格预设</label>
        <select id="dsh-tb-preset"></select>
      </div>
      <div class="dsh-tb-row">
        <label for="dsh-tb-price-input">输入</label>
        <input id="dsh-tb-price-input" type="number" min="0" step="0.0001" placeholder="0.0000">
      </div>
      <div class="dsh-tb-row">
        <label for="dsh-tb-price-output">输出</label>
        <input id="dsh-tb-price-output" type="number" min="0" step="0.0001" placeholder="0.0000">
      </div>
      <div class="dsh-tb-row">
        <label for="dsh-tb-price-cache-read">缓存读</label>
        <input id="dsh-tb-price-cache-read" type="number" min="0" step="0.0001" placeholder="0.0000">
      </div>
      <div class="dsh-tb-row">
        <label for="dsh-tb-price-cache-write">缓存写</label>
        <input id="dsh-tb-price-cache-write" type="number" min="0" step="0.0001" placeholder="0.0000">
      </div>
      <div class="dsh-tb-settings-buttons">
        <button id="dsh-tb-save-prices" type="button">保存价格</button>
        <button id="dsh-tb-reset-prices" type="button" class="dsh-tb-secondary">恢复预设</button>
      </div>
    </div>
  </div>
  <div class="dsh-tb-foot">
    <span id="dsh-tb-status">加载中…</span>
    <span id="dsh-tb-updated"></span>
  </div>
</div>`
      document.body.appendChild(root)
      bindEvents(root)
      return root
    }

    function bindEvents(root) {
      var fab = root.querySelector("#dsh-client-ui-token-billing-fab")
      var panel = root.querySelector("#dsh-client-ui-token-billing-panel")
      var closeBtn = root.querySelector("#dsh-tb-close")
      var refreshBtn = root.querySelector("#dsh-tb-refresh")
      var settingsBtn = root.querySelector("#dsh-tb-settings")
      var sessionSelect = root.querySelector("#dsh-tb-session")
      var settingsBlock = root.querySelector("#dsh-tb-settings-block")
      var presetSelect = root.querySelector("#dsh-tb-preset")
      var saveBtn = root.querySelector("#dsh-tb-save-prices")
      var resetBtn = root.querySelector("#dsh-tb-reset-prices")

      fab.addEventListener("click", function () {
        panel.classList.toggle("dsh-tb-hidden")
        if (!panel.classList.contains("dsh-tb-hidden") && typeof window.dshTokenBillingRefresh === "function") {
          window.dshTokenBillingRefresh()
        }
      })
      closeBtn.addEventListener("click", function () {
        panel.classList.add("dsh-tb-hidden")
      })
      refreshBtn.addEventListener("click", function () {
        if (typeof window.dshTokenBillingRefresh === "function") window.dshTokenBillingRefresh()
      })
      settingsBtn.addEventListener("click", function () {
        settingsBlock.classList.toggle("dsh-tb-hidden")
        if (!settingsBlock.classList.contains("dsh-tb-hidden")) fillSettingsForm()
      })
      sessionSelect.addEventListener("change", function () {
        var state = window.dshTokenBillingState
        state.selectedSessionId = sessionSelect.value || null
        if (typeof window.dshTokenBillingRefresh === "function") window.dshTokenBillingRefresh()
      })
      presetSelect.addEventListener("change", function () {
        var preset = presetSelect.value
        var price = null
        if (preset === "__custom__") {
          price = { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 }
        } else {
          for (var i = 0; i < MODEL_PRESETS.length; i++) {
            if (MODEL_PRESETS[i].id === preset) {
              var p = MODEL_PRESETS[i]
              price = { input: p.input, output: p.output, cacheRead: p.cacheRead, cacheWrite: p.cacheWrite }
            }
          }
        }
        if (price) fillPriceInputs(price)
      })
      saveBtn.addEventListener("click", function () {
        var state = window.dshTokenBillingState
        var modelId = state.currentModelId
        if (!modelId) return
        setPriceForModel(modelId, readPriceInputs())
        fillSettingsForm()
        if (typeof window.dshTokenBillingRender === "function") {
          window.dshTokenBillingRender(state.currentSession, state.models)
        }
        if (typeof window.dshTokenBillingStatus === "function") {
          window.dshTokenBillingStatus("价格已保存")
        }
      })
      resetBtn.addEventListener("click", function () {
        var state = window.dshTokenBillingState
        var modelId = state.currentModelId
        if (!modelId) return
        var prices = loadPrices()
        delete prices[modelId]
        savePrices(prices)
        fillSettingsForm()
        if (typeof window.dshTokenBillingRender === "function") {
          window.dshTokenBillingRender(state.currentSession, state.models)
        }
        if (typeof window.dshTokenBillingStatus === "function") {
          window.dshTokenBillingStatus("已恢复预设价格")
        }
      })
    }

    function readPriceInputs() {
      return {
        input: Number(document.getElementById("dsh-tb-price-input").value) || 0,
        output: Number(document.getElementById("dsh-tb-price-output").value) || 0,
        cacheRead: Number(document.getElementById("dsh-tb-price-cache-read").value) || 0,
        cacheWrite: Number(document.getElementById("dsh-tb-price-cache-write").value) || 0
      }
    }

    function fillPriceInputs(price) {
      document.getElementById("dsh-tb-price-input").value = Number(price.input) || 0
      document.getElementById("dsh-tb-price-output").value = Number(price.output) || 0
      document.getElementById("dsh-tb-price-cache-read").value = Number(price.cacheRead) || 0
      document.getElementById("dsh-tb-price-cache-write").value = Number(price.cacheWrite) || 0
    }

    function fillSettingsForm() {
      var state = window.dshTokenBillingState
      var modelId = state.currentModelId || ""
      var price = priceForModel(modelId)
      if (!price) price = { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 }
      fillPriceInputs(price)

      var preset = document.getElementById("dsh-tb-preset")
      var options = "<option value=\"__custom__\">自定义</option>"
      for (var i = 0; i < MODEL_PRESETS.length; i++) {
        var p = MODEL_PRESETS[i]
        options += "<option value=\"" + escapeHtml(p.id) + "\""
        if (p.id === modelId) options += " selected"
        options += ">" + escapeHtml(p.name) + "</option>"
      }
      preset.innerHTML = options
    }

    function updateSessionSelect(sessions, selectedSessionId) {
      var select = document.getElementById("dsh-tb-session")
      if (!select) return
      var current = selectedSessionId
      var html = ""
      for (var i = 0; i < sessions.length; i++) {
        var s = sessions[i]
        var title = (s.projections && s.projections.values && s.projections.values.title) || s.sessionId
        if (String(title).length > 40) title = String(title).slice(0, 40) + "…"
        var option = "<option value=\"" + escapeHtml(String(s.sessionId)) + "\""
        if (s.sessionId === current) option += " selected"
        option += ">" + escapeHtml(String(title)) + (s.running ? " ●" : "") + "</option>"
        html += option
      }
      select.innerHTML = html || "<option value=\"\">（无会话）</option>"
    }

    function escapeHtml(value) {
      return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
    }

    function render(session, models) {
      var state = window.dshTokenBillingState
      var values = session && session.projections ? session.projections.values : null
      var usage = values && values.tokenUsage ? values.tokenUsage : null
      var context = values && values.contextPressure ? values.contextPressure : null
      var stats = values && values.sessionStats ? values.sessionStats : null

      var model = models && models.current ? models.current.model : "未知"
      state.currentModelId = model

      document.getElementById("dsh-tb-model").textContent = model

      document.getElementById("dsh-tb-tok-input").textContent = usage ? fmtTokens(usage.uncachedInputTokens) : "-"
      document.getElementById("dsh-tb-tok-output").textContent = usage ? fmtTokens(usage.outputTokens) : "-"
      document.getElementById("dsh-tb-tok-cache-read").textContent = usage ? fmtTokens(usage.cacheReadTokens) : "-"
      document.getElementById("dsh-tb-tok-cache-write").textContent = usage ? fmtTokens(usage.cacheWriteTokens) : "-"

      var pressure = context && context.pressureTokens != null ? Number(context.pressureTokens) : null
      var projected = context && context.projectedTokens != null ? Number(context.projectedTokens) : null
      var windowSize = context && context.contextWindow != null ? Number(context.contextWindow) : null
      document.getElementById("dsh-tb-ctx-pressure").textContent = pressure != null ? fmtTokens(pressure) : "-"
      document.getElementById("dsh-tb-ctx-projected").textContent = projected != null ? fmtTokens(projected) : "-"
      document.getElementById("dsh-tb-ctx-window").textContent = windowSize != null ? fmtTokens(windowSize) : "-"

      var pct = null
      if (pressure != null && windowSize) pct = Math.max(0, Math.min(100, Math.round(pressure / windowSize * 100)))
      document.getElementById("dsh-tb-ctx-pct").textContent = pct != null ? pct + "%" : "-"
      var bar = document.getElementById("dsh-tb-ctx-bar")
      if (bar) {
        bar.style.width = (pct != null ? pct : 0) + "%"
        bar.classList.toggle("dsh-tb-warn", pct != null && pct >= 70 && pct < 90)
        bar.classList.toggle("dsh-tb-danger", pct != null && pct >= 90)
      }

      var price = priceForModel(model)
      var cost = calcCost(usage, price)
      if (cost) {
        document.getElementById("dsh-tb-cost-input").textContent = fmtCost(cost.input)
        document.getElementById("dsh-tb-cost-output").textContent = fmtCost(cost.output)
        document.getElementById("dsh-tb-cost-cache-read").textContent = fmtCost(cost.cacheRead)
        document.getElementById("dsh-tb-cost-cache-write").textContent = fmtCost(cost.cacheWrite)
        document.getElementById("dsh-tb-cost-total").textContent = fmtCost(cost.total)
        document.getElementById("dsh-tb-price-hint").textContent = price && price.note ? price.note : "价格为手动配置，非官方实时账单。"
      } else {
        document.getElementById("dsh-tb-cost-input").textContent = "-"
        document.getElementById("dsh-tb-cost-output").textContent = "-"
        document.getElementById("dsh-tb-cost-cache-read").textContent = "-"
        document.getElementById("dsh-tb-cost-cache-write").textContent = "-"
        document.getElementById("dsh-tb-cost-total").textContent = "-"
        document.getElementById("dsh-tb-price-hint").textContent = "该模型未配置价格，点击 ⚙ 设置后显示费用估算。"
      }

      if (stats) {
        document.getElementById("dsh-tb-updated").textContent =
          "步骤 " + (stats.steps || 0) + " · " + fmtTime(stats.llmMs || 0)
      } else {
        document.getElementById("dsh-tb-updated").textContent = new Date().toLocaleTimeString()
      }
    }

    function apply(ctx) {
      var previousState = window.dshTokenBillingState
      if (previousState && previousState.timer) {
        window.clearInterval(previousState.timer)
        previousState.timer = null
      }

      ensureStyle()
      var root = document.getElementById(ROOT_ID) || buildPanel()
      root.style.display = "block"

      var state = {
        sessions: [],
        selectedSessionId: null,
        currentSession: null,
        models: null,
        currentModelId: null,
        timer: null
      }
      window.dshTokenBillingState = state

      window.dshTokenBillingRefresh = function () {
        window.dshTokenBillingStatus("刷新中…")
        return rpc("session.list", {}).then(function (data) {
          var items = Array.isArray(data.items) ? data.items : []
          state.sessions = items
          if (!state.selectedSessionId || !items.some(function (s) { return s.sessionId === state.selectedSessionId })) {
            var preferred = null
            for (var i = 0; i < items.length; i++) {
              if (items[i].running) { preferred = items[i]; break }
            }
            if (!preferred && items.length > 0) preferred = items[0]
            state.selectedSessionId = preferred ? preferred.sessionId : null
          }
          state.currentSession = null
          for (var j = 0; j < items.length; j++) {
            if (items[j].sessionId === state.selectedSessionId) { state.currentSession = items[j]; break }
          }
          updateSessionSelect(state.sessions, state.selectedSessionId)

          if (!state.currentSession) {
            render(null, null)
            window.dshTokenBillingStatus("暂无会话")
            return
          }

          return rpc("session.models", { sessionId: state.currentSession.sessionId }).catch(function () {
            return null
          }).then(function (models) {
            state.models = models
            render(state.currentSession, models)
            window.dshTokenBillingStatus("已更新 " + new Date().toLocaleTimeString())
          })
        }).catch(function (error) {
          window.dshTokenBillingStatus("错误：" + error.message)
        })
      }

      window.dshTokenBillingRender = render
      window.dshTokenBillingStatus = function (text) {
        var el = document.getElementById("dsh-tb-status")
        if (el) el.textContent = text
      }

      var timer = window.setInterval(function () {
        if (typeof window.dshTokenBillingRefresh === "function") {
          window.dshTokenBillingRefresh()
        }
      }, POLL_INTERVAL_MS)
      state.timer = timer

      window.dshTokenBillingRefresh()

      var cleanup = function () {
        if (timer) window.clearInterval(timer)
        timer = null
        if (root && root.parentNode) root.parentNode.removeChild(root)
        var style = document.getElementById(STYLE_ID)
        if (style && style.parentNode) style.parentNode.removeChild(style)
        try { delete window.dshTokenBillingRefresh } catch (error) {}
        try { delete window.dshTokenBillingRender } catch (error) {}
        try { delete window.dshTokenBillingStatus } catch (error) {}
        try { delete window.dshTokenBillingState } catch (error) {}
      }

      if (ctx && typeof ctx.effect === "function") {
        ctx.effect(function () { return cleanup }, "dsh-client-ui-token-billing: cleanup")
      }
    }

    exports.apply = apply
    return module.exports
  }
})
