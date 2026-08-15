window.__ModuleLoader__.load({
  id: "dsh-client-ui-token-billing",
  factory: (require) => {
    var module = { exports: {} }
    var exports = module.exports

    var STYLE_ID = "dsh-client-ui-token-billing-style"
    var ROOT_ID = "dsh-client-ui-token-billing-root"
    var PANEL_ID = "dsh-client-ui-token-billing-panel"
    var PRICE_STORAGE_KEY = "dsh-client-ui-token-billing.prices.v1"
    var POSITION_STORAGE_KEY = "dsh-client-ui-token-billing.position.v1"
    var PRICING_ROUTE = "/plugins/dsh-client-ui-token-billing/pricing"
    var POLL_INTERVAL_MS = 4000
    var PRICING_TTL_MS = 30 * 60 * 1000

    var PEAK_HOURS = [[9 * 60, 12 * 60], [14 * 60, 18 * 60]]
    var PEAK_EFFECTIVE_FROM = "2026-08-17T00:00:00+08:00"
    var DEFAULT_PRICING = {
      fetchedAt: null,
      source: "https://api-docs.deepseek.com/zh-cn/quick_start/pricing/",
      current: {
        effectiveUntil: PEAK_EFFECTIVE_FROM,
        models: {
          "deepseek-v4-flash": { inputCacheHit: 0.02, inputCacheMiss: 1.0, output: 2.0, cacheWrite: 0 },
          "deepseek-v4-pro": { inputCacheHit: 0.025, inputCacheMiss: 3.0, output: 6.0, cacheWrite: 0 }
        }
      },
      upcoming: {
        effectiveFrom: PEAK_EFFECTIVE_FROM,
        peakHours: PEAK_HOURS,
        models: {
          "deepseek-v4-flash": {
            offPeak: { inputCacheHit: 0.05, inputCacheMiss: 1.5, output: 4.5, cacheWrite: 0 },
            peak: { inputCacheHit: 0.10, inputCacheMiss: 3.0, output: 9.0, cacheWrite: 0 }
          },
          "deepseek-v4-pro": {
            offPeak: { inputCacheHit: 0.15, inputCacheMiss: 4.5, output: 13.5, cacheWrite: 0 },
            peak: { inputCacheHit: 0.30, inputCacheMiss: 9.0, output: 27.0, cacheWrite: 0 }
          }
        }
      }
    }

    // 统一线性 SVG 图标（无 emoji），通过 currentColor 继承主题色。
    var ICON_REFRESH = '<svg viewBox="0 0 16 16" width="13" height="13" aria-hidden="true"><path d="M13.5 8a5.5 5.5 0 1 1-1.6-3.9M13.5 2.6V6H10" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>'
    var ICON_SETTINGS = '<svg viewBox="0 0 16 16" width="13" height="13" aria-hidden="true"><circle cx="8" cy="8" r="2.1" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M8 1.4v1.7M8 12.9v1.7M1.4 8h1.7M12.9 8h1.7M3.3 3.3l1.2 1.2M11.5 11.5l1.2 1.2M12.7 3.3l-1.2 1.2M4.5 11.5l-1.2 1.2" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>'
    var ICON_CLOSE = '<svg viewBox="0 0 16 16" width="13" height="13" aria-hidden="true"><path d="M4 4l8 8M12 4l-8 8" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>'
    var ICON_CHEVRON = '<svg viewBox="0 0 16 16" width="12" height="12" aria-hidden="true"><path d="M4 6l4 4 4-4" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>'

    // DeepSeek Harness 设计变量 + 8px 间距节奏。密度按 dashboard 级别收紧，
    // 信息层级：核心（费用/模型/推理）在 1 级，明细在可展开的 2 级。
    var CSS = `
#dsh-client-ui-token-billing-root {
  position: fixed;
  right: 12px;
  bottom: 12px;
  z-index: 2147483647;
  font-family: system-ui, -apple-system, "Segoe UI", "Microsoft YaHei", sans-serif;
  color: var(--dsw-alias-label-primary, #0f172a);
  --dsh-tb-accent: #4d6bfe;
  --dsh-tb-accent-strong: #4d6bfe;
}

#dsh-client-ui-token-billing-fab {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  justify-content: center;
  gap: 20px;
  width: 148px;
  height: auto;
  padding: 10px 10px 12px;
  margin-left: auto;
  border: 1px solid var(--dsw-alias-border-l2, rgba(0, 0, 0, 0.08));
  border-radius: 12px;
  background:
    radial-gradient(140% 110% at 50% -12%, color-mix(in srgb, var(--dsh-tb-accent, #4d6bfe) 26%, transparent) 0%, color-mix(in srgb, var(--dsh-tb-accent, #4d6bfe) 11%, transparent) 38%, transparent 72%),
    var(--dsw-alias-bg-overlay, rgba(255, 255, 255, 0.94));
  color: var(--dsw-alias-label-primary, #0f172a);
  font-size: 11px;
  line-height: 1;
  cursor: grab;
  box-shadow:
    0 10px 30px rgba(15, 23, 42, 0.18),
    inset 0 1px 0 rgba(255, 255, 255, 0.5);
  -webkit-backdrop-filter: blur(18px) saturate(150%);
  backdrop-filter: blur(18px) saturate(150%);
  transition: background 0.15s ease, box-shadow 0.15s ease, transform 0.15s ease;
  touch-action: none;
  user-select: none;
  -webkit-user-select: none;
}
#dsh-client-ui-token-billing-fab:hover {
  background:
    radial-gradient(140% 110% at 50% -12%, color-mix(in srgb, var(--dsh-tb-accent, #4d6bfe) 32%, transparent) 0%, color-mix(in srgb, var(--dsh-tb-accent, #4d6bfe) 14%, transparent) 40%, transparent 74%),
    var(--dsw-alias-button-floating-hover, rgba(255, 255, 255, 0.98));
  box-shadow:
    0 12px 34px rgba(15, 23, 42, 0.22),
    inset 0 1px 0 rgba(255, 255, 255, 0.55);
}
#dsh-client-ui-token-billing-fab:active { cursor: grabbing; }
#dsh-client-ui-token-billing-fab.dsh-tb-dragging {
  cursor: grabbing;
  transform: scale(1.01);
  box-shadow: 0 16px 38px rgba(15, 23, 42, 0.3);
}

.dsh-tb-fab-reasoning {
  flex: 0 0 auto;
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 3px;
}
.dsh-tb-fab-reasoning-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 9px;
  line-height: 1.1;
}
.dsh-tb-fab-reasoning-label {
  color: var(--dsw-alias-label-tertiary, #475569);
  font-weight: 500;
}
.dsh-tb-fab-reasoning-value {
  color: var(--dsh-tb-accent, #4d6bfe);
  font-weight: 800;
  font-variant-numeric: tabular-nums;
  transition: opacity 0.12s ease, transform 0.12s ease, color 0.2s ease;
}
.dsh-tb-fab-reasoning-value.dsh-tb-switching {
  opacity: 0;
  transform: translateY(3px);
}
.dsh-tb-fab-reasoning input[type="range"] {
  width: 100%;
  height: 8px;
  margin: 0;
  -webkit-appearance: none;
  appearance: none;
  background: linear-gradient(90deg, var(--dsh-tb-accent, #4d6bfe) 0%, var(--dsh-tb-accent, #4d6bfe) var(--dsh-tb-range-pct, 50%), var(--dsw-alias-bg-skeleton, rgba(15, 23, 42, 0.08)) var(--dsh-tb-range-pct, 50%));
  border-radius: 999px;
  cursor: pointer;
  box-shadow:
    0 0 0 1px color-mix(in srgb, var(--dsh-tb-accent, #4d6bfe) 22%, transparent),
    0 0 0 4px color-mix(in srgb, var(--dsh-tb-accent, #4d6bfe) 8%, transparent);
  transition: box-shadow 0.2s ease;
}
.dsh-tb-fab-reasoning input[type="range"]:focus-visible {
  outline: 2px solid color-mix(in srgb, var(--dsh-tb-accent, #4d6bfe) 65%, transparent);
  outline-offset: 2px;
}
.dsh-tb-fab-reasoning input[type="range"]::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 16px;
  height: 16px;
  border-radius: 999px;
  background: #ffffff;
  border: 3px solid var(--dsh-tb-accent, #4d6bfe);
  box-shadow: 0 1px 5px rgba(15, 23, 42, 0.3);
  cursor: grab;
  transition: box-shadow 0.15s ease, transform 0.15s ease, border-color 0.2s ease;
  animation: dsh-tb-thumb-breathe 2.4s ease-in-out infinite;
}
.dsh-tb-fab-reasoning input[type="range"]::-webkit-slider-thumb:hover {
  box-shadow: 0 2px 8px color-mix(in srgb, var(--dsh-tb-accent, #4d6bfe) 60%, transparent);
}
.dsh-tb-fab-reasoning input[type="range"]::-webkit-slider-thumb:active {
  cursor: grabbing;
  transform: scale(1.1);
  animation: none;
  box-shadow: 0 2px 10px color-mix(in srgb, var(--dsh-tb-accent, #4d6bfe) 75%, transparent);
}
@keyframes dsh-tb-thumb-breathe {
  0%, 100% {
    box-shadow: 0 1px 5px rgba(15, 23, 42, 0.3), 0 0 0 0 color-mix(in srgb, var(--dsh-tb-accent, #4d6bfe) 35%, transparent);
  }
  50% {
    box-shadow: 0 2px 8px color-mix(in srgb, var(--dsh-tb-accent, #4d6bfe) 40%, transparent), 0 0 0 5px color-mix(in srgb, var(--dsh-tb-accent, #4d6bfe) 0%, transparent);
  }
}

.dsh-tb-fab-main {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  min-width: 0;
  margin-top: 2px;
}
.dsh-tb-fab-price-row {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
  min-width: 0;
}
.dsh-tb-fab-dot {
  width: 6px;
  height: 6px;
  border-radius: 999px;
  flex: 0 0 auto;
  background: var(--dsw-alias-state-success-primary, rgba(22, 163, 74, 0.9));
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--dsw-alias-state-success-primary, rgba(22, 163, 74, 0.9)) 18%, transparent);
}
.dsh-tb-fab-label {
  font-size: 14px;
  font-weight: 800;
  letter-spacing: -0.01em;
  font-variant-numeric: tabular-nums;
  font-family: ui-monospace, SFMono-Regular, Consolas, "Liberation Mono", monospace;
  line-height: 1.15;
  color: var(--dsw-alias-label-primary, #0f172a);
}
.dsh-tb-fab-model {
  max-width: 132px;
  font-size: 9px;
  font-weight: 500;
  color: var(--dsw-alias-label-tertiary, #475569);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: 1.2;
}

#dsh-client-ui-token-billing-panel {
  position: absolute;
  right: 0;
  bottom: 44px;
  width: 296px;
  max-height: min(78vh, 640px);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border: 1px solid var(--dsw-alias-border-l2, rgba(0, 0, 0, 0.08));
  border-radius: 16px;
  background: var(--dsw-alias-bg-overlay, rgba(255, 255, 255, 0.95));
  box-shadow: 0 20px 56px rgba(15, 23, 42, 0.26);
  -webkit-backdrop-filter: blur(24px) saturate(155%);
  backdrop-filter: blur(24px) saturate(155%);
}
#dsh-client-ui-token-billing-panel.dsh-tb-hidden { display: none; }
#dsh-client-ui-token-billing-panel.dsh-tb-panel-below {
  bottom: auto;
  top: 44px;
}

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
.dsh-tb-brand {
  width: 8px;
  height: 8px;
  border-radius: 3px;
  background: linear-gradient(135deg, #4d6bfe, #7c8cff);
  box-shadow: 0 0 0 3px rgba(77, 107, 254, 0.14);
}
.dsh-tb-head-actions { display: flex; gap: 4px; }
.dsh-tb-head-actions button {
  width: 26px;
  height: 26px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: 8px;
  background: transparent;
  color: var(--dsw-alias-label-tertiary, #475569);
  cursor: pointer;
  transition: background 0.12s ease, color 0.12s ease;
}
.dsh-tb-head-actions button:hover {
  background: var(--dsw-alias-interactive-bg-hover, rgba(38, 49, 72, 0.08));
  color: var(--dsw-alias-label-primary, #0f172a);
}
.dsh-tb-head-actions button:focus-visible,
.dsh-tb-details-toggle:focus-visible,
.dsh-tb-settings-buttons button:focus-visible {
  outline: 2px solid color-mix(in srgb, #4d6bfe 65%, transparent);
  outline-offset: 1px;
}

.dsh-tb-body {
  padding: 10px 12px 12px;
  overflow: auto;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.dsh-tb-model-line {
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
}
.dsh-tb-model-label {
  font-size: 10px;
  color: var(--dsw-alias-label-tertiary, #475569);
  flex: 0 0 auto;
}
.dsh-tb-model-name {
  flex: 1;
  min-width: 0;
  font-size: 12px;
  font-weight: 700;
  color: var(--dsw-alias-label-primary, #0f172a);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.dsh-tb-badge {
  display: inline-flex;
  align-items: center;
  height: 18px;
  padding: 0 7px;
  border-radius: 999px;
  font-size: 9px;
  font-weight: 700;
  background: var(--dsw-alias-state-business-tertiary, rgba(219, 234, 254, 0.6));
  color: var(--dsw-alias-label-primary-bluish, #1e3a8a);
  white-space: nowrap;
  font-variant-numeric: tabular-nums;
}
body[data-ds-dark-theme] .dsh-tb-badge { color: #dbeafe; }

.dsh-tb-section-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.dsh-tb-section-label {
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--dsw-alias-label-dimmed, rgba(51, 65, 85, 0.55));
}

.dsh-tb-reasoning { display: flex; flex-direction: column; gap: 4px; }
.dsh-tb-reasoning input[type="range"] {
  width: 100%;
  height: 8px;
  margin: 3px 0 2px;
  -webkit-appearance: none;
  appearance: none;
  background: linear-gradient(90deg, var(--dsh-tb-accent, #4d6bfe) 0%, var(--dsh-tb-accent, #4d6bfe) var(--dsh-tb-range-pct, 50%), var(--dsw-alias-bg-skeleton, rgba(15, 23, 42, 0.08)) var(--dsh-tb-range-pct, 50%));
  border-radius: 999px;
  cursor: pointer;
  transition: box-shadow 0.15s ease;
}
.dsh-tb-reasoning input[type="range"]:focus-visible {
  outline: 2px solid color-mix(in srgb, var(--dsh-tb-accent, #4d6bfe) 65%, transparent);
  outline-offset: 2px;
}
.dsh-tb-reasoning input[type="range"]::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 16px;
  height: 16px;
  border-radius: 999px;
  background: #ffffff;
  border: 3px solid var(--dsh-tb-accent, #4d6bfe);
  box-shadow: 0 1px 5px rgba(15, 23, 42, 0.28);
  cursor: grab;
  transition: box-shadow 0.15s ease, transform 0.15s ease, border-color 0.2s ease;
}
.dsh-tb-reasoning input[type="range"]::-webkit-slider-thumb:hover { box-shadow: 0 2px 8px color-mix(in srgb, var(--dsh-tb-accent, #4d6bfe) 55%, transparent); }
.dsh-tb-reasoning input[type="range"]::-webkit-slider-thumb:active {
  cursor: grabbing;
  transform: scale(1.08);
}
.dsh-tb-reasoning-labels {
  display: flex;
  justify-content: space-between;
  font-size: 9px;
  color: var(--dsw-alias-label-tertiary, #475569);
}
.dsh-tb-reasoning-labels span { cursor: pointer; transition: color 0.12s ease; }
.dsh-tb-reasoning-labels span.dsh-tb-active { color: var(--dsh-tb-accent, #4d6bfe); font-weight: 700; }

.dsh-tb-cost-hero {
  border: 1px solid var(--dsw-alias-border-l2, rgba(0, 0, 0, 0.08));
  border-radius: 12px;
  background:
    radial-gradient(120% 120% at 0% 0%, color-mix(in srgb, #4d6bfe 10%, transparent), transparent 55%),
    var(--dsw-alias-bg-layer-1, rgba(255, 255, 255, 0.62));
  padding: 9px 10px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.dsh-tb-cost-hero-top { display: flex; align-items: center; justify-content: space-between; }
.dsh-tb-cost-hero-value {
  font-size: 24px;
  font-weight: 800;
  letter-spacing: -0.02em;
  line-height: 1.1;
  color: var(--dsw-alias-label-primary, #0f172a);
  font-family: ui-monospace, SFMono-Regular, Consolas, "Liberation Mono", monospace;
  font-variant-numeric: tabular-nums;
}
.dsh-tb-cost-hero-sub {
  font-size: 10px;
  color: var(--dsw-alias-label-tertiary, #475569);
  font-variant-numeric: tabular-nums;
}

.dsh-tb-context-mini {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.dsh-tb-context-mini-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 10px;
  color: var(--dsw-alias-label-tertiary, #475569);
  font-variant-numeric: tabular-nums;
}
.dsh-tb-context-mini-head strong {
  font-size: 11px;
  color: var(--dsw-alias-label-primary, #0f172a);
  font-family: ui-monospace, SFMono-Regular, Consolas, "Liberation Mono", monospace;
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

.dsh-tb-details-toggle {
  width: 100%;
  height: 28px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  border: none;
  border-radius: 8px;
  background: var(--dsw-alias-interactive-bg-hover, rgba(38, 49, 72, 0.08));
  color: var(--dsw-alias-label-secondary, #334155);
  font-size: 11px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.12s ease;
}
.dsh-tb-details-toggle:hover { background: var(--dsw-alias-interactive-bg-active, rgba(38, 49, 72, 0.12)); }
.dsh-tb-details-toggle svg { transition: transform 0.18s ease; }
.dsh-tb-details-toggle.dsh-tb-open svg { transform: rotate(180deg); }

.dsh-tb-details { display: flex; flex-direction: column; gap: 8px; }
.dsh-tb-details.dsh-tb-hidden { display: none; }

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
}
.dsh-tb-row select:focus-visible,
.dsh-tb-row input[type="number"]:focus-visible {
  outline: 2px solid color-mix(in srgb, #4d6bfe 65%, transparent);
  outline-offset: 1px;
  border-color: #4d6bfe;
}

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
.dsh-tb-cell-label { font-size: 9px; color: var(--dsw-alias-label-tertiary, #475569); }
.dsh-tb-cell-value {
  font-size: 12px;
  font-weight: 700;
  margin-top: 1px;
  color: var(--dsw-alias-label-primary, #0f172a);
  font-family: ui-monospace, SFMono-Regular, Consolas, "Liberation Mono", monospace;
  font-variant-numeric: tabular-nums;
}

.dsh-tb-cost-lines { display: flex; flex-direction: column; gap: 3px; }
.dsh-tb-cost-line {
  display: flex;
  justify-content: space-between;
  font-size: 10px;
  color: var(--dsw-alias-label-tertiary, #475569);
  font-variant-numeric: tabular-nums;
}
.dsh-tb-cost-line span:last-child {
  font-family: ui-monospace, SFMono-Regular, Consolas, "Liberation Mono", monospace;
}
.dsh-tb-cost-line.dsh-tb-total {
  margin-top: 3px;
  padding: 6px 8px;
  border: none;
  border-radius: 8px;
  background: color-mix(in srgb, #4d6bfe 9%, transparent);
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
@keyframes dsh-tb-content-in {
  from { opacity: 0; transform: translateY(4px); }
  to { opacity: 1; transform: translateY(0); }
}
.dsh-tb-body.dsh-tb-rolling { animation: dsh-tb-content-in 0.25s var(--ds-ease-in-out, ease); }
@media (prefers-reduced-motion: reduce) {
  #dsh-client-ui-token-billing-root *,
  #dsh-client-ui-token-billing-root *::before,
  #dsh-client-ui-token-billing-root *::after {
    transition: none !important;
    animation: none !important;
  }
}
`

    // ---------- 价格解析与计算 ----------

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

    function loadPosition() {
      try {
        var raw = window.localStorage.getItem(POSITION_STORAGE_KEY)
        if (raw) {
          var parsed = JSON.parse(raw)
          if (parsed && typeof parsed.right === "number" && typeof parsed.bottom === "number") {
            return { right: parsed.right, bottom: parsed.bottom }
          }
        }
      } catch (error) {}
      return null
    }

    function savePosition(position) {
      try {
        window.localStorage.setItem(POSITION_STORAGE_KEY, JSON.stringify(position))
      } catch (error) {}
    }

    function clampPosition(root, position) {
      var fab = root.querySelector("#dsh-client-ui-token-billing-fab")
      var fabWidth = fab ? fab.offsetWidth || 148 : 148
      var fabHeight = fab ? fab.offsetHeight || 34 : 34
      var margin = 8
      var maxRight = Math.max(margin, (window.innerWidth || 1200) - fabWidth - margin)
      var maxBottom = Math.max(margin, (window.innerHeight || 800) - fabHeight - margin)
      return {
        right: Math.max(margin, Math.min(maxRight, Number(position.right) || margin)),
        bottom: Math.max(margin, Math.min(maxBottom, Number(position.bottom) || margin))
      }
    }

    function applyPosition(root) {
      var position = loadPosition()
      if (!position) return
      var clamped = clampPosition(root, position)
      root.style.right = clamped.right + "px"
      root.style.bottom = clamped.bottom + "px"
    }

    function updatePanelSide(root) {
      var panel = root.querySelector("#dsh-client-ui-token-billing-panel")
      if (!panel) return
      var rect = root.getBoundingClientRect()
      var spaceAbove = rect.top
      var spaceBelow = (window.innerHeight || 800) - rect.bottom
      // 优先在 FAB 上方展开；上方空间不足且下方更宽裕时改为下方展开。
      if (spaceAbove < 360 && spaceBelow > spaceAbove) {
        panel.classList.add("dsh-tb-panel-below")
      } else {
        panel.classList.remove("dsh-tb-panel-below")
      }
    }

    function makeDraggable(root) {
      var fab = root.querySelector("#dsh-client-ui-token-billing-fab")
      if (!fab) return
      var dragging = false
      var moved = false
      var startX = 0
      var startY = 0
      var startRight = 0
      var startBottom = 0

      fab.addEventListener("pointerdown", function (event) {
        if (event.button !== 0 && event.pointerType === "mouse") return
        if (event.target && event.target.closest && event.target.closest("button,input,select,textarea")) return
        dragging = true
        moved = false
        startX = event.clientX
        startY = event.clientY
        startRight = parseFloat(root.style.right) || 12
        startBottom = parseFloat(root.style.bottom) || 12
        fab.classList.add("dsh-tb-dragging")
        if (fab.setPointerCapture) {
          try { fab.setPointerCapture(event.pointerId) } catch (error) {}
        }
        event.preventDefault()
      })

      fab.addEventListener("pointermove", function (event) {
        if (!dragging) return
        var dx = event.clientX - startX
        var dy = event.clientY - startY
        if (Math.abs(dx) + Math.abs(dy) > 3) {
          moved = true
          fab.dshDragMoved = true
        }
        var next = clampPosition(root, {
          right: startRight - dx,
          bottom: startBottom - dy
        })
        root.style.right = next.right + "px"
        root.style.bottom = next.bottom + "px"
        updatePanelSide(root)
      })

      function finishDrag(event) {
        if (!dragging) return
        dragging = false
        fab.classList.remove("dsh-tb-dragging")
        if (fab.releasePointerCapture && event && event.pointerId != null) {
          try { fab.releasePointerCapture(event.pointerId) } catch (error) {}
        }
        if (moved) {
          savePosition({
            right: parseFloat(root.style.right) || 12,
            bottom: parseFloat(root.style.bottom) || 12
          })
        }
      }

      fab.addEventListener("pointerup", finishDrag)
      fab.addEventListener("pointercancel", finishDrag)
    }

    function measureComposerHeight() {
      try {
        var card = document.querySelector('[data-composer-card]')
        if (card) {
          var height = card.getBoundingClientRect().height
          if (height > 20) return height
        }
        var seat = document.querySelector('[data-composer-seat]')
        if (seat) {
          var seatHeight = seat.getBoundingClientRect().height
          if (seatHeight > 20) return seatHeight
        }
      } catch (error) {}
      return 52
    }

    function applyFabHeight(root) {
      var fab = root.querySelector("#dsh-client-ui-token-billing-fab")
      if (!fab) return
      var height = measureComposerHeight()
      var minHeight = Math.max(48, Math.min(height, 96))
      fab.style.minHeight = minHeight + "px"
      fab.style.height = "auto"
      fab.style.borderRadius = Math.round(minHeight * 0.22) + "px"
    }

    function installSessionWatcher() {
      if (window.dshTokenBillingFetchWrapped) return
      window.dshTokenBillingFetchWrapped = true
      var originalFetch = window.fetch
      window.fetch = function (input, init) {
        var result = originalFetch.apply(this, arguments)
        try {
          var url = typeof input === "string" ? input : (input && input.url) || ""
          if (url.indexOf("/api/session.history") !== -1) {
            var body = init && init.body
            if (typeof body === "string") {
              var parsed = JSON.parse(body)
              var sessionId = parsed && parsed.payload && parsed.payload.sessionId
              if (sessionId) {
                var state = window.dshTokenBillingState
                if (state && state.selectedSessionId !== sessionId) {
                  state.selectedSessionId = sessionId
                  if (typeof window.dshTokenBillingRefresh === "function") {
                    window.dshTokenBillingRefresh()
                  }
                }
              }
            }
          }
        } catch (error) {}
        return result
      }
    }

    function findActiveSessionIdFromComposer() {
      try {
        var anchor = document.querySelector("[data-composer-card]") || document.querySelector("[data-composer-seat]")
        if (!anchor) return null
        var key = Object.keys(anchor).find(function (name) {
          return name.indexOf("__reactFiber$") === 0
        })
        if (!key) return null
        var fiber = anchor[key]
        while (fiber) {
          var props = fiber.memoizedProps
          if (props && typeof props.sessionId === "string" && props.sessionId) return props.sessionId
          fiber = fiber.return
        }
      } catch (error) {}
      return null
    }

    function beijingNow() {
      try {
        var parts = new Intl.DateTimeFormat("en-US", {
          timeZone: "Asia/Shanghai",
          hour12: false,
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit"
        }).formatToParts(new Date())
        var map = {}
        for (var i = 0; i < parts.length; i++) map[parts[i].type] = parts[i].value
        return new Date(map.year + "-" + map.month + "-" + map.day + "T" + map.hour + ":" + map.minute + ":" + map.second + "+08:00")
      } catch (error) {
        return new Date()
      }
    }

    function minutesOfDay(date) {
      return date.getHours() * 60 + date.getMinutes()
    }

    function isPeakTime(date, peakHours) {
      var minutes = minutesOfDay(date)
      for (var i = 0; i < peakHours.length; i++) {
        var range = peakHours[i]
        if (minutes >= range[0] && minutes < range[1]) return true
      }
      return false
    }

    function priceForModel(modelId, pricing, manualPrices) {
      if (!modelId) return null
      var manual = manualPrices && manualPrices[modelId]
      if (manual) return extendPrice(manual, "手动")

      var now = beijingNow()
      var upcoming = pricing && pricing.upcoming
      var current = pricing && pricing.current

      if (upcoming && upcoming.effectiveFrom && now.getTime() >= new Date(upcoming.effectiveFrom).getTime()) {
        var peak = isPeakTime(now, upcoming.peakHours || PEAK_HOURS)
        var bucket = upcoming.models && upcoming.models[modelId]
        var source = bucket ? (peak ? bucket.peak : bucket.offPeak) : null
        return source ? extendPrice(source, peak ? "高峰" : "空闲") : null
      }
      if (current && current.models && current.models[modelId]) {
        return extendPrice(current.models[modelId], "当前")
      }
      return null
    }

    function extendPrice(price, periodLabel) {
      return {
        inputCacheHit: Number(price.inputCacheHit) || 0,
        inputCacheMiss: Number(price.inputCacheMiss) || 0,
        output: Number(price.output) || 0,
        cacheWrite: Number(price.cacheWrite) || 0,
        periodLabel: periodLabel
      }
    }

    function calcCost(usage, price) {
      if (!usage || !price) return null
      var inputMiss = (Number(usage.uncachedInputTokens) || 0) / 1000000 * (Number(price.inputCacheMiss) || 0)
      var inputHit = (Number(usage.cacheReadTokens) || 0) / 1000000 * (Number(price.inputCacheHit) || 0)
      var output = (Number(usage.outputTokens) || 0) / 1000000 * (Number(price.output) || 0)
      var cacheWrite = (Number(usage.cacheWriteTokens) || 0) / 1000000 * (Number(price.cacheWrite) || 0)
      return {
        inputMiss: inputMiss,
        inputHit: inputHit,
        output: output,
        cacheWrite: cacheWrite,
        total: inputMiss + inputHit + output + cacheWrite
      }
    }

    function fetchOfficialPricing() {
      var controller = typeof AbortController !== "undefined" ? new AbortController() : null
      var timer = null
      if (controller) {
        timer = window.setTimeout(function () { controller.abort() }, 5000)
      }
      return fetch(PRICING_ROUTE, {
        method: "GET",
        headers: { "accept": "application/json" },
        signal: controller ? controller.signal : undefined
      }).then(function (response) {
        if (!response.ok) throw new Error("HTTP " + response.status)
        return response.json()
      }).then(function (data) {
        return data && data.current ? data : DEFAULT_PRICING
      }).catch(function () {
        return DEFAULT_PRICING
      }).then(function (pricing) {
        if (timer) window.clearTimeout(timer)
        return pricing
      })
    }

    // ---------- RPC ----------

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

    // ---------- 格式化 ----------

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

    function escapeHtml(value) {
      return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
    }

    // ---------- DOM 构建 ----------

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
<div id="dsh-client-ui-token-billing-fab" class="dsh-tb-fab" role="button" tabindex="0" aria-label="打开 Token 计费面板">
  <div class="dsh-tb-fab-reasoning" id="dsh-tb-fab-reasoning">
    <div class="dsh-tb-fab-reasoning-head">
      <span class="dsh-tb-fab-reasoning-label">推理</span>
      <span class="dsh-tb-fab-reasoning-value" id="dsh-tb-fab-reasoning-value">-</span>
    </div>
    <input id="dsh-tb-fab-reasoning-range" type="range" min="0" max="100" step="1" value="50" aria-label="推理强度">
  </div>
  <div class="dsh-tb-fab-main">
    <div class="dsh-tb-fab-price-row">
      <span class="dsh-tb-fab-dot"></span>
      <span class="dsh-tb-fab-label" id="dsh-tb-fab-label">Token</span>
    </div>
    <span class="dsh-tb-fab-model" id="dsh-tb-fab-model">-</span>
  </div>
</div>
<div id="dsh-client-ui-token-billing-panel" class="dsh-tb-hidden">
  <div class="dsh-tb-head">
    <div class="dsh-tb-title"><span class="dsh-tb-brand"></span>API Token</div>
    <div class="dsh-tb-head-actions">
      <button id="dsh-tb-refresh" type="button" aria-label="刷新" title="刷新">${ICON_REFRESH}</button>
      <button id="dsh-tb-settings" type="button" aria-label="价格设置" title="价格设置">${ICON_SETTINGS}</button>
      <button id="dsh-tb-close" type="button" aria-label="关闭" title="关闭">${ICON_CLOSE}</button>
    </div>
  </div>
  <div class="dsh-tb-body" id="dsh-tb-body">
    <div class="dsh-tb-model-line">
      <span class="dsh-tb-model-label">模型</span>
      <span class="dsh-tb-model-name" id="dsh-tb-model-name">-</span>
      <span class="dsh-tb-badge" id="dsh-tb-provider">-</span>
    </div>

    <div class="dsh-tb-section-head">
      <span class="dsh-tb-section-label">推理强度</span>
      <span class="dsh-tb-badge" id="dsh-tb-reasoning-value">-</span>
    </div>
    <div class="dsh-tb-reasoning" id="dsh-tb-reasoning-block">
      <input id="dsh-tb-reasoning-range" type="range" min="0" max="100" step="1" value="0" aria-label="推理强度">
      <div class="dsh-tb-reasoning-labels" id="dsh-tb-reasoning-labels"></div>
    </div>

    <div class="dsh-tb-cost-hero">
      <div class="dsh-tb-cost-hero-top">
        <span class="dsh-tb-section-label">预计费用</span>
        <span class="dsh-tb-badge" id="dsh-tb-price-period">-</span>
      </div>
      <div class="dsh-tb-cost-hero-value" id="dsh-tb-cost-total">-</div>
      <div class="dsh-tb-cost-hero-sub" id="dsh-tb-cost-sub">-</div>
    </div>

    <div class="dsh-tb-context-mini">
      <div class="dsh-tb-context-mini-head">
        <span>上下文窗口</span>
        <span><strong id="dsh-tb-ctx-used">-</strong> / <span id="dsh-tb-ctx-window">-</span> · <span id="dsh-tb-ctx-pct">-</span></span>
      </div>
      <div class="dsh-tb-context-track"><div class="dsh-tb-context-fill" id="dsh-tb-ctx-bar"></div></div>
    </div>

    <button id="dsh-tb-details-toggle" class="dsh-tb-details-toggle" type="button" aria-expanded="false">
      <span>Token 详情</span>${ICON_CHEVRON}
    </button>

    <div id="dsh-tb-details" class="dsh-tb-details dsh-tb-hidden">
      <div class="dsh-tb-row">
        <label for="dsh-tb-session">会话</label>
        <select id="dsh-tb-session"></select>
      </div>

      <div class="dsh-tb-section-head"><span class="dsh-tb-section-label">Token 用量</span></div>
      <div class="dsh-tb-grid">
        <div class="dsh-tb-cell"><div class="dsh-tb-cell-label">输入</div><div class="dsh-tb-cell-value" id="dsh-tb-tok-input">-</div></div>
        <div class="dsh-tb-cell"><div class="dsh-tb-cell-label">输出</div><div class="dsh-tb-cell-value" id="dsh-tb-tok-output">-</div></div>
        <div class="dsh-tb-cell"><div class="dsh-tb-cell-label">缓存读</div><div class="dsh-tb-cell-value" id="dsh-tb-tok-cache-read">-</div></div>
        <div class="dsh-tb-cell"><div class="dsh-tb-cell-label">缓存写</div><div class="dsh-tb-cell-value" id="dsh-tb-tok-cache-write">-</div></div>
      </div>

      <div class="dsh-tb-section-head"><span class="dsh-tb-section-label">费用明细</span></div>
      <div class="dsh-tb-cost-lines">
        <div class="dsh-tb-cost-line"><span>输入（未命中）</span><span id="dsh-tb-cost-input-miss">-</span></div>
        <div class="dsh-tb-cost-line"><span>输入（缓存命中）</span><span id="dsh-tb-cost-input-hit">-</span></div>
        <div class="dsh-tb-cost-line"><span>输出</span><span id="dsh-tb-cost-output">-</span></div>
        <div class="dsh-tb-cost-line"><span>缓存写</span><span id="dsh-tb-cost-cache-write">-</span></div>
        <div class="dsh-tb-cost-line dsh-tb-total"><span>合计</span><span class="dsh-tb-total-value" id="dsh-tb-cost-total-line">-</span></div>
      </div>

      <div class="dsh-tb-section-head"><span class="dsh-tb-section-label">上下文明细</span></div>
      <div class="dsh-tb-row"><label>上次请求</label><span id="dsh-tb-ctx-pressure">-</span></div>
      <div class="dsh-tb-row"><label>下次预计</label><span id="dsh-tb-ctx-projected">-</span></div>

      <div class="dsh-tb-hint" id="dsh-tb-price-hint">价格来自 DeepSeek 官方价格页。</div>

      <div id="dsh-tb-settings-block" class="dsh-tb-settings dsh-tb-hidden">
        <div class="dsh-tb-row">
          <label for="dsh-tb-price-cache-hit">输入（缓存命中）</label>
          <input id="dsh-tb-price-cache-hit" type="number" min="0" step="0.0001" placeholder="0.0000">
        </div>
        <div class="dsh-tb-row">
          <label for="dsh-tb-price-cache-miss">输入（未命中）</label>
          <input id="dsh-tb-price-cache-miss" type="number" min="0" step="0.0001" placeholder="0.0000">
        </div>
        <div class="dsh-tb-row">
          <label for="dsh-tb-price-output">输出</label>
          <input id="dsh-tb-price-output" type="number" min="0" step="0.0001" placeholder="0.0000">
        </div>
        <div class="dsh-tb-row">
          <label for="dsh-tb-price-cache-write">缓存写</label>
          <input id="dsh-tb-price-cache-write" type="number" min="0" step="0.0001" placeholder="0.0000">
        </div>
        <div class="dsh-tb-settings-buttons">
          <button id="dsh-tb-save-prices" type="button">保存手动价格</button>
          <button id="dsh-tb-reset-prices" type="button" class="dsh-tb-secondary">恢复官方价格</button>
        </div>
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
      var fabReasoningRange = root.querySelector("#dsh-tb-fab-reasoning-range")
      var panel = root.querySelector("#dsh-client-ui-token-billing-panel")
      var closeBtn = root.querySelector("#dsh-tb-close")
      var refreshBtn = root.querySelector("#dsh-tb-refresh")
      var settingsBtn = root.querySelector("#dsh-tb-settings")
      var sessionSelect = root.querySelector("#dsh-tb-session")
      var detailsToggle = root.querySelector("#dsh-tb-details-toggle")
      var details = root.querySelector("#dsh-tb-details")
      var settingsBlock = root.querySelector("#dsh-tb-settings-block")
      var reasoningRange = root.querySelector("#dsh-tb-reasoning-range")
      var reasoningLabels = root.querySelector("#dsh-tb-reasoning-labels")
      var saveBtn = root.querySelector("#dsh-tb-save-prices")
      var resetBtn = root.querySelector("#dsh-tb-reset-prices")

      fab.addEventListener("click", function (event) {
        if (fab.dshDragMoved) {
          fab.dshDragMoved = false
          return
        }
        if (event.target && event.target.closest && event.target.closest("button,input,select,textarea")) return
        panel.classList.toggle("dsh-tb-hidden")
        if (!panel.classList.contains("dsh-tb-hidden")) {
          updatePanelSide(root)
          if (typeof window.dshTokenBillingRefresh === "function") window.dshTokenBillingRefresh()
        }
      })
      fab.addEventListener("keydown", function (event) {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault()
          panel.classList.toggle("dsh-tb-hidden")
          if (!panel.classList.contains("dsh-tb-hidden")) {
            updatePanelSide(root)
            if (typeof window.dshTokenBillingRefresh === "function") window.dshTokenBillingRefresh()
          }
        }
      })
      if (fabReasoningRange) {
        fabReasoningRange.addEventListener("input", function () {
          var state = window.dshTokenBillingState
          var efforts = state.reasoningEfforts || []
          if (!efforts.length) return
          var pct = Number(fabReasoningRange.value) || 0
          fabReasoningRange.style.setProperty("--dsh-tb-range-pct", pct + "%")
          var index = Math.round(pct / 100 * (efforts.length - 1))
          applyIntensityColor(index, efforts.length)
          if (efforts[index]) {
            var valueEl = document.getElementById("dsh-tb-fab-reasoning-value")
            if (valueEl) {
              valueEl.textContent = efforts[index].name || efforts[index].id
              valueEl.classList.remove("dsh-tb-switching")
              void valueEl.offsetWidth
              valueEl.classList.add("dsh-tb-switching")
              window.setTimeout(function () {
                valueEl.classList.remove("dsh-tb-switching")
              }, 120)
            }
            document.getElementById("dsh-tb-reasoning-value").textContent = efforts[index].name || efforts[index].id
            updateReasoningLabels(index)
          }
        })
        fabReasoningRange.addEventListener("change", function () {
          var state = window.dshTokenBillingState
          var efforts = state.reasoningEfforts || []
          if (!efforts.length) return
          var pct = Number(fabReasoningRange.value) || 0
          var index = Math.round(pct / 100 * (efforts.length - 1))
          var effort = efforts[index]
          if (!effort) return
          applyIntensityColor(index, efforts.length)
          fabReasoningRange.value = String(index / Math.max(1, efforts.length - 1) * 100)
          fabReasoningRange.style.setProperty("--dsh-tb-range-pct", fabReasoningRange.value + "%")
          applyReasoningEffort(effort.id)
        })
      }
      closeBtn.addEventListener("click", function () {
        panel.classList.add("dsh-tb-hidden")
      })
      refreshBtn.addEventListener("click", function () {
        if (typeof window.dshTokenBillingRefresh === "function") window.dshTokenBillingRefresh()
      })
      settingsBtn.addEventListener("click", function () {
        details.classList.remove("dsh-tb-hidden")
        detailsToggle.classList.add("dsh-tb-open")
        detailsToggle.setAttribute("aria-expanded", "true")
        settingsBlock.classList.toggle("dsh-tb-hidden")
        if (!settingsBlock.classList.contains("dsh-tb-hidden")) fillSettingsForm()
      })
      detailsToggle.addEventListener("click", function () {
        var isOpen = !details.classList.contains("dsh-tb-hidden")
        details.classList.toggle("dsh-tb-hidden", isOpen)
        detailsToggle.classList.toggle("dsh-tb-open", !isOpen)
        detailsToggle.setAttribute("aria-expanded", String(!isOpen))
      })
      sessionSelect.addEventListener("change", function () {
        var state = window.dshTokenBillingState
        state.selectedSessionId = sessionSelect.value || null
        if (typeof window.dshTokenBillingRefresh === "function") window.dshTokenBillingRefresh()
      })
      reasoningRange.addEventListener("input", function () {
        var state = window.dshTokenBillingState
        var efforts = state.reasoningEfforts || []
        if (!efforts.length) return
        var pct = Number(reasoningRange.value) || 0
        var index = Math.round(pct / 100 * (efforts.length - 1))
        applyIntensityColor(index, efforts.length)
        reasoningRange.style.setProperty("--dsh-tb-range-pct", pct + "%")
        if (efforts[index]) {
          document.getElementById("dsh-tb-reasoning-value").textContent = efforts[index].name || efforts[index].id
          updateReasoningLabels(index)
        }
      })
      reasoningRange.addEventListener("change", function () {
        var state = window.dshTokenBillingState
        var efforts = state.reasoningEfforts || []
        if (!efforts.length) return
        var pct = Number(reasoningRange.value) || 0
        var index = Math.round(pct / 100 * (efforts.length - 1))
        var effort = efforts[index]
        if (!effort) return
        applyIntensityColor(index, efforts.length)
        reasoningRange.value = String(index / Math.max(1, efforts.length - 1) * 100)
        reasoningRange.style.setProperty("--dsh-tb-range-pct", reasoningRange.value + "%")
        updateReasoningLabels(index)
        applyReasoningEffort(effort.id)
      })
      reasoningLabels.addEventListener("click", function (event) {
        var target = event.target
        if (!target || target.tagName !== "SPAN") return
        var index = Number(target.getAttribute("data-index") || 0)
        var state = window.dshTokenBillingState
        var efforts = state.reasoningEfforts || []
        var effort = efforts[index]
        if (!effort) return
        applyIntensityColor(index, efforts.length)
        var pct = efforts.length > 1 ? index / (efforts.length - 1) * 100 : 100
        reasoningRange.value = String(pct)
        reasoningRange.style.setProperty("--dsh-tb-range-pct", pct + "%")
        updateReasoningLabels(index)
        applyReasoningEffort(effort.id)
      })
      saveBtn.addEventListener("click", function () {
        var state = window.dshTokenBillingState
        var modelId = state.currentModelId
        if (!modelId) return
        setManualPriceForModel(modelId, readPriceInputs())
        fillSettingsForm()
        if (typeof window.dshTokenBillingRender === "function") {
          window.dshTokenBillingRender(state.currentSession, state.models, state.pricing)
        }
        if (typeof window.dshTokenBillingStatus === "function") {
          window.dshTokenBillingStatus("手动价格已保存")
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
          window.dshTokenBillingRender(state.currentSession, state.models, state.pricing)
        }
        if (typeof window.dshTokenBillingStatus === "function") {
          window.dshTokenBillingStatus("已恢复官方价格")
        }
      })
    }

    // ---------- 推理等级 ----------

    function effortsForModel(models) {
      if (!models || !models.current || !models.groups) return []
      var providerId = models.current.provider
      var modelId = models.current.model
      for (var i = 0; i < models.groups.length; i++) {
        var group = models.groups[i]
        if (group.id !== providerId) continue
        for (var j = 0; j < group.models.length; j++) {
          var model = group.models[j]
          if (model.id !== modelId) continue
          if (model.reasoning && Array.isArray(model.reasoning.efforts)) return model.reasoning.efforts
        }
      }
      return []
    }

    function effortIndex(efforts, effortId) {
      for (var i = 0; i < efforts.length; i++) {
        if (efforts[i].id === effortId) return i
      }
      return 0
    }

    var INTENSITY_COLORS = ["#94a3b8", "#4d6bfe", "#f43f5e"]

    function intensityColorForIndex(index, count) {
      if (!count) return INTENSITY_COLORS[1]
      if (count === 1) return INTENSITY_COLORS[1]
      if (count === 2) return index === 0 ? INTENSITY_COLORS[0] : INTENSITY_COLORS[2]
      var i = Math.max(0, Math.min(INTENSITY_COLORS.length - 1, index))
      return INTENSITY_COLORS[i]
    }

    function applyIntensityColor(index, count) {
      var root = document.getElementById(ROOT_ID)
      if (!root) return
      var color = intensityColorForIndex(index, count)
      root.style.setProperty("--dsh-tb-accent", color)
      root.style.setProperty("--dsh-tb-accent-strong", color)
      root.dataset.intensity = String(index)
    }

    function updateReasoningLabels(activeIndex) {
      var labels = document.querySelectorAll("#dsh-tb-reasoning-labels span")
      for (var i = 0; i < labels.length; i++) {
        if (i === activeIndex) labels[i].classList.add("dsh-tb-active")
        else labels[i].classList.remove("dsh-tb-active")
      }
    }

    function applyReasoningEffort(effortId) {
      var state = window.dshTokenBillingState
      if (!state || !state.currentSession || !state.models || !state.models.current) return
      var sessionId = state.currentSession.sessionId
      var provider = state.models.current.provider
      var model = state.models.current.model
      if (typeof window.dshTokenBillingStatus === "function") {
        window.dshTokenBillingStatus("切换推理等级…")
      }
      return rpc("session.selectModel", {
        sessionId: sessionId,
        provider: provider,
        model: model,
        reasoningEffort: effortId
      }).then(function () {
        if (state.models && state.models.current) state.models.current.reasoningEffort = effortId
        if (typeof window.dshTokenBillingRender === "function") {
          window.dshTokenBillingRender(state.currentSession, state.models, state.pricing)
        }
        if (typeof window.dshTokenBillingStatus === "function") {
          window.dshTokenBillingStatus("推理等级已切换")
        }
      }).catch(function (error) {
        if (typeof window.dshTokenBillingStatus === "function") {
          window.dshTokenBillingStatus("切换失败：" + error.message)
        }
        if (typeof window.dshTokenBillingRefresh === "function") window.dshTokenBillingRefresh()
      })
    }

    // ---------- 手动价格 ----------

    function setManualPriceForModel(modelId, price) {
      var prices = loadPrices()
      prices[modelId] = {
        inputCacheHit: Number(price.inputCacheHit) || 0,
        inputCacheMiss: Number(price.inputCacheMiss) || 0,
        output: Number(price.output) || 0,
        cacheWrite: Number(price.cacheWrite) || 0
      }
      savePrices(prices)
    }

    function readPriceInputs() {
      return {
        inputCacheHit: Number(document.getElementById("dsh-tb-price-cache-hit").value) || 0,
        inputCacheMiss: Number(document.getElementById("dsh-tb-price-cache-miss").value) || 0,
        output: Number(document.getElementById("dsh-tb-price-output").value) || 0,
        cacheWrite: Number(document.getElementById("dsh-tb-price-cache-write").value) || 0
      }
    }

    function fillPriceInputs(price) {
      document.getElementById("dsh-tb-price-cache-hit").value = Number(price.inputCacheHit) || 0
      document.getElementById("dsh-tb-price-cache-miss").value = Number(price.inputCacheMiss) || 0
      document.getElementById("dsh-tb-price-output").value = Number(price.output) || 0
      document.getElementById("dsh-tb-price-cache-write").value = Number(price.cacheWrite) || 0
    }

    function fillSettingsForm() {
      var state = window.dshTokenBillingState
      var modelId = state.currentModelId || ""
      var price = priceForModel(modelId, state.pricing, loadPrices())
      if (!price) price = { inputCacheHit: 0, inputCacheMiss: 0, output: 0, cacheWrite: 0 }
      fillPriceInputs(price)
    }

    // ---------- 渲染 ----------

    function updateSessionSelect(sessions, selectedSessionId) {
      var select = document.getElementById("dsh-tb-session")
      if (!select) return
      var current = selectedSessionId
      var html = ""
      for (var i = 0; i < sessions.length; i++) {
        var s = sessions[i]
        var title = (s.projections && s.projections.values && s.projections.values.title) || s.sessionId
        if (String(title).length > 36) title = String(title).slice(0, 36) + "…"
        var option = "<option value=\"" + escapeHtml(String(s.sessionId)) + "\""
        if (s.sessionId === current) option += " selected"
        option += ">" + escapeHtml(String(title)) + (s.running ? " ●" : "") + "</option>"
        html += option
      }
      select.innerHTML = html || "<option value=\"\">（无会话）</option>"
    }

    function render(session, models, pricing) {
      var state = window.dshTokenBillingState
      var values = session && session.projections ? session.projections.values : null
      var usage = values && values.tokenUsage ? values.tokenUsage : null
      var context = values && values.contextPressure ? values.contextPressure : null
      var stats = values && values.sessionStats ? values.sessionStats : null

      var sessionId = session && session.sessionId ? session.sessionId : null
      if (state.lastRenderedSessionId !== sessionId) {
        state.lastRenderedSessionId = sessionId
        var body = document.getElementById("dsh-tb-body")
        if (body) {
          body.classList.remove("dsh-tb-rolling")
          void body.offsetWidth
          body.classList.add("dsh-tb-rolling")
          window.setTimeout(function () {
            body.classList.remove("dsh-tb-rolling")
          }, 300)
        }
      }

      var model = models && models.current ? models.current.model : "未知"
      var provider = models && models.current ? models.current.provider : "未知"
      state.currentModelId = model
      state.reasoningEfforts = effortsForModel(models)

      document.getElementById("dsh-tb-model-name").textContent = model
      document.getElementById("dsh-tb-provider").textContent = provider
      updateFabModel(model)

      // 1 级：Token 用量概览（输入+输出）
      document.getElementById("dsh-tb-tok-input").textContent = usage ? fmtTokens(usage.uncachedInputTokens) : "-"
      document.getElementById("dsh-tb-tok-output").textContent = usage ? fmtTokens(usage.outputTokens) : "-"
      document.getElementById("dsh-tb-tok-cache-read").textContent = usage ? fmtTokens(usage.cacheReadTokens) : "-"
      document.getElementById("dsh-tb-tok-cache-write").textContent = usage ? fmtTokens(usage.cacheWriteTokens) : "-"

      // 1 级：上下文迷你进度
      var pressure = context && context.pressureTokens != null ? Number(context.pressureTokens) : null
      var projected = context && context.projectedTokens != null ? Number(context.projectedTokens) : null
      var windowSize = context && context.contextWindow != null ? Number(context.contextWindow) : null
      document.getElementById("dsh-tb-ctx-used").textContent = pressure != null ? fmtTokens(pressure) : "-"
      document.getElementById("dsh-tb-ctx-window").textContent = windowSize != null ? fmtTokens(windowSize) : "-"
      document.getElementById("dsh-tb-ctx-pressure").textContent = pressure != null ? fmtTokens(pressure) : "-"
      document.getElementById("dsh-tb-ctx-projected").textContent = projected != null ? fmtTokens(projected) : "-"
      var pct = null
      if (pressure != null && windowSize) pct = Math.max(0, Math.min(100, Math.round(pressure / windowSize * 100)))
      document.getElementById("dsh-tb-ctx-pct").textContent = pct != null ? pct + "%" : "-"
      var bar = document.getElementById("dsh-tb-ctx-bar")
      if (bar) {
        bar.style.width = (pct != null ? pct : 0) + "%"
        bar.classList.toggle("dsh-tb-warn", pct != null && pct >= 70 && pct < 90)
        bar.classList.toggle("dsh-tb-danger", pct != null && pct >= 90)
      }

      // 1 级：推理等级
      renderReasoning(model, models)

      // 1 级：费用主视觉 + 2 级费用明细
      var manualPrices = loadPrices()
      var price = priceForModel(model, pricing || DEFAULT_PRICING, manualPrices)
      var cost = calcCost(usage, price)
      var periodEl = document.getElementById("dsh-tb-price-period")
      if (price) {
        periodEl.textContent = price.periodLabel || "官方"
        document.getElementById("dsh-tb-cost-total").textContent = fmtCost(cost.total)
        document.getElementById("dsh-tb-cost-sub").textContent =
          "输入 " + fmtCost(cost.inputMiss + cost.inputHit) + " · 输出 " + fmtCost(cost.output)
        document.getElementById("dsh-tb-cost-input-miss").textContent = fmtCost(cost.inputMiss)
        document.getElementById("dsh-tb-cost-input-hit").textContent = fmtCost(cost.inputHit)
        document.getElementById("dsh-tb-cost-output").textContent = fmtCost(cost.output)
        document.getElementById("dsh-tb-cost-cache-write").textContent = fmtCost(cost.cacheWrite)
        document.getElementById("dsh-tb-cost-total-line").textContent = fmtCost(cost.total)
        document.getElementById("dsh-tb-price-hint").textContent = manualPrices[model]
          ? "当前为手动价格；点击右上角设置可恢复官方价格。"
          : "价格来自 DeepSeek 官方价格页；高峰/空闲自动切换。"
        updateFab("¥" + (cost.total >= 0.01 ? cost.total.toFixed(2) : cost.total.toFixed(4)))
      } else {
        periodEl.textContent = "未配置"
        document.getElementById("dsh-tb-cost-total").textContent = "-"
        document.getElementById("dsh-tb-cost-sub").textContent = "-"
        document.getElementById("dsh-tb-cost-input-miss").textContent = "-"
        document.getElementById("dsh-tb-cost-input-hit").textContent = "-"
        document.getElementById("dsh-tb-cost-output").textContent = "-"
        document.getElementById("dsh-tb-cost-cache-write").textContent = "-"
        document.getElementById("dsh-tb-cost-total-line").textContent = "-"
        document.getElementById("dsh-tb-price-hint").textContent = "未找到该模型的官方价格，点击右上角设置手动输入。"
        updateFab("Token")
      }

      if (stats) {
        document.getElementById("dsh-tb-updated").textContent =
          "步骤 " + (stats.steps || 0) + " · " + fmtTime(stats.llmMs || 0)
      } else {
        document.getElementById("dsh-tb-updated").textContent = new Date().toLocaleTimeString()
      }
    }

    function renderReasoning(model, models) {
      var state = window.dshTokenBillingState
      var efforts = state.reasoningEfforts || []
      var block = document.getElementById("dsh-tb-reasoning-block")
      var range = document.getElementById("dsh-tb-reasoning-range")
      var labels = document.getElementById("dsh-tb-reasoning-labels")
      var valueEl = document.getElementById("dsh-tb-reasoning-value")
      if (!efforts.length) {
        block.style.display = "none"
        valueEl.textContent = "-"
        return
      }
      block.style.display = "flex"
      var currentEffort = models && models.current ? models.current.reasoningEffort : null
      var activeIndex = effortIndex(efforts, currentEffort)
      applyIntensityColor(activeIndex, efforts.length)
      var pct = efforts.length > 1 ? activeIndex / (efforts.length - 1) * 100 : 100
      range.value = String(pct)
      range.style.setProperty("--dsh-tb-range-pct", pct + "%")
      valueEl.textContent = efforts[activeIndex].name || efforts[activeIndex].id
      renderFabReasoning(efforts, activeIndex)

      var html = ""
      for (var i = 0; i < efforts.length; i++) {
        html += "<span data-index=\"" + i + "\" class=\"" + (i === activeIndex ? "dsh-tb-active" : "") + "\">" + escapeHtml(efforts[i].name || efforts[i].id) + "</span>"
      }
      labels.innerHTML = html
    }

    function updateFab(text) {
      var label = document.getElementById("dsh-tb-fab-label")
      if (label) label.textContent = text
    }

    function updateFabModel(model) {
      var el = document.getElementById("dsh-tb-fab-model")
      if (el) el.textContent = model || "-"
    }

    function renderFabReasoning(efforts, activeIndex) {
      var container = document.getElementById("dsh-tb-fab-reasoning")
      var fabRange = document.getElementById("dsh-tb-fab-reasoning-range")
      if (!container || !fabRange) return
      if (!efforts.length) {
        container.style.display = "none"
        return
      }
      container.style.display = "flex"
      var pct = efforts.length > 1 ? activeIndex / (efforts.length - 1) * 100 : 100
      fabRange.value = String(pct)
      fabRange.style.setProperty("--dsh-tb-range-pct", pct + "%")
      var valueEl = document.getElementById("dsh-tb-fab-reasoning-value")
      if (valueEl) valueEl.textContent = efforts[activeIndex].name || efforts[activeIndex].id
    }

    // ---------- 刷新 ----------

    function refresh() {
      var state = window.dshTokenBillingState
      window.dshTokenBillingStatus("刷新中…")

      var pricingPromise
      if (!state.pricing || !state.pricingFetchedAt || Date.now() - state.pricingFetchedAt > PRICING_TTL_MS) {
        pricingPromise = fetchOfficialPricing().then(function (pricing) {
          state.pricing = pricing
          state.pricingFetchedAt = Date.now()
          return pricing
        })
      } else {
        pricingPromise = Promise.resolve(state.pricing)
      }

      return rpc("session.list", {}).then(function (data) {
        var items = Array.isArray(data.items) ? data.items : []
        state.sessions = items

        var composerSessionId = findActiveSessionIdFromComposer()
        if (composerSessionId && items.some(function (s) { return s.sessionId === composerSessionId })) {
          if (state.selectedSessionId !== composerSessionId) {
            state.selectedSessionId = composerSessionId
          }
        } else if (!state.selectedSessionId || !items.some(function (s) { return s.sessionId === state.selectedSessionId })) {
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
          render(null, null, state.pricing)
          window.dshTokenBillingStatus("暂无会话")
          return
        }

        var modelsPromise = rpc("session.models", { sessionId: state.currentSession.sessionId }).catch(function () {
          return null
        })

        return Promise.all([modelsPromise, pricingPromise]).then(function (results) {
          state.models = results[0]
          state.pricing = results[1]
          render(state.currentSession, state.models, state.pricing)
          window.dshTokenBillingStatus("已更新 " + new Date().toLocaleTimeString())
        })
      }).catch(function (error) {
        window.dshTokenBillingStatus("错误：" + error.message)
      })
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
      if (!root.dshDragBound) {
        root.dshDragBound = true
        makeDraggable(root)
      }
      applyPosition(root)
      applyFabHeight(root)
      updatePanelSide(root)
      installSessionWatcher()

      var state = {
        sessions: [],
        selectedSessionId: null,
        currentSession: null,
        models: null,
        currentModelId: null,
        reasoningEfforts: [],
        pricing: null,
        pricingFetchedAt: null,
        timer: null,
        lastRenderedSessionId: null
      }
      window.dshTokenBillingState = state

      window.dshTokenBillingRefresh = refresh
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

      var onResize = function () {
        applyFabHeight(root)
        updatePanelSide(root)
      }
      window.addEventListener("resize", onResize)

      window.dshTokenBillingRefresh()

      var cleanup = function () {
        if (timer) window.clearInterval(timer)
        timer = null
        window.removeEventListener("resize", onResize)
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
