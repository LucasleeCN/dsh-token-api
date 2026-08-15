# Changelog

## 1.0.0

First public release.

### Highlights

- Floating HUD bar with live API token billing, model name, and reasoning-effort control.
- Auto-follows the currently active Harness conversation.
- Official DeepSeek pricing sync (server-side fetch, same-origin route for the browser).
- Automatic peak / off-peak pricing after the official 2026-08-17 00:00 Beijing-time switch.
- Manual per-model price override persisted in `localStorage`.
- Draggable and position-persistent widget.
- DeepSeek Harness design tokens and dark-mode support.
- Reasoning intensity slider with animated color radiation and level indicator.
- Expandable detail panel for token usage, cost breakdown, context pressure, and session switching.
- Test suite for the host pricing parser and the browser panel.
