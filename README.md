# dsh-client-ui-token-billing

DeepSeek Harness 官方 Web UI 的客户端插件：在界面右下角注入一个紧凑的浮动面板，
展示**当前会话的 API Token 用量**、**上下文窗口占用**、**推理等级**和**费用估算**。
UI 使用 Harness 官方设计变量（`--dsw-alias-*`），自动适配浅色/深色主题，并参考
Claude Code 的紧凑信息框布局。

## 功能

- 读取官方 `session.list` RPC 返回的 projection：
  - `tokenUsage`：输入 / 输出 / 缓存读 / 缓存写 token；
  - `contextPressure`：上次请求压力、下次预计压力、上下文窗口；
  - `sessionStats`：步骤数与耗时等会话统计。
- 通过 `session.models` 显示当前模型，并读取模型支持的推理等级。
- **推理等级拖拽条**：拖动滑块即可切换 `off` / `high` / `max` 等推理等级，
  内部调用官方 `session.selectModel` RPC。
- **官方价格自动同步**：Host 半侧抓取 DeepSeek 官方价格页
  `https://api-docs.deepseek.com/zh-cn/quick_start/pricing/`，通过同源路由
  `/plugins/dsh-client-ui-token-billing/pricing` 提供给浏览器，避开跨域限制。
- **峰谷价格自动切换**：2026-08-17 00:00 北京时间起，高峰时段
  （9:00-12:00、14:00-18:00）与空闲时段自动使用不同价格。
- 价格单位：¥ / 1M tokens。内置价格为官方页面兜底，拉取失败时自动回退。
- 支持手动覆盖单个模型价格；手动价格保存在浏览器 `localStorage`。
- 每 4 秒自动刷新；可手动刷新、切换会话、展开价格设置。
- 纯浏览器端展示：不修改模型输入，不读取 API Key。

## 目录结构

```text
dsh-client-ui-token-billing/
├─ package.json
├─ cordis.patch.yml
├─ lib/
│  ├─ index.js      # Host 半侧（官方价格抓取 + 同源价格路由）
│  └─ client.js     # Browser 半侧（浮动面板）
└─ test/
   └─ client.test.mjs
```

## 安装

该插件是一个标准的 `dsh.client` 双面包，必须能被 profile 的
`ctx.baseUrl` 解析到（通常就是 profile 自己的 `node_modules`）。

发布到 GitHub 后，也可以直接用 npm 从 Git 安装（把地址换成你的仓库）：

```json
{
  "dependencies": {
    "dsh-client-ui-token-billing": "github:LucasleeCN/dsh-token-api"
  }
}
```

### 方法 A：作为 profile bundle（推荐）

1. 将插件目录复制或链接到 profile 可解析的位置，例如复制到
   `<DSH_HOME>/profiles/web/node_modules/dsh-client-ui-token-billing`。

2. 编辑 `<DSH_HOME>/profiles/web/package.json`：

   ```json
   {
     "dependencies": {
       "dsh-client-ui-token-billing": "github:LucasleeCN/dsh-token-api"
     },
     "dsh": {
       "profile": {
         "bundles": [
           "@deepseek-ai/dsh-base",
           "@deepseek-ai/dsh-web-app",
           "dsh-client-ui-token-billing"
         ]
       }
     }
   }
   ```

3. 重启 DeepSeek Harness Web。

### 方法 B：手动插入 Loader 行

1. 将插件目录复制到 `<DSH_HOME>/profiles/web/node_modules/dsh-client-ui-token-billing`。

2. 编辑 `<DSH_HOME>/profiles/web/cordis.patch.yml`：

   ```yaml
   - insert:
       - id: ui-token-billing
         name: 'dsh-client-ui-token-billing'
         config:
           enabled: true
   ```

3. 重启 DeepSeek Harness Web。

## 验证

重启后打开 Harness Web UI，右下角出现 `Token` 胶囊按钮；点击展开面板。
如果页面已经打开，刷新即可（`dsh web` 会注入新的 boot manifest）。

也可以直接调用 RPC 确认数据源可用：

```text
POST /api/session.list
Content-Type: application/json

{
  "type": "client-request",
  "rpcId": "manual-check",
  "method": "session.list",
  "payload": {}
}
```

返回中的 `items[].projections.values.tokenUsage` 即本插件展示的原始数据。

## 价格说明

- Host 半侧每 30 分钟重新抓取一次官方价格页；浏览器通过同源路由读取。
- 当前（2026-08-17 前）使用页面中的当前价格；之后自动切换峰谷价格。
- 高峰时段：北京时间 9:00-12:00、14:00-18:00；其余为空闲时段。
- 面板右上角会显示当前价格所处时段（`当前` / `高峰` / `空闲` / `手动`）。
- 点击 ⚙ 可手动覆盖价格；保存后优先使用手动价格，恢复官方价格即删除覆盖。
- 手动价格保存在 `localStorage`（键：`dsh-client-ui-token-billing.prices.v1`）。

## 开发

```powershell
npm run check   # 语法检查 + 测试
npm test        # 运行测试
```

测试包括：

- 官方价格页 HTML 的解析（当前价格 + 峰谷价格）；
- 用 `node:vm` 加载 `lib/client.js`，以模拟的 `session.list` /
  `session.models` RPC 返回验证面板渲染、费用计算、推理等级展示和
  未配置价格提示。

## 许可

MIT
