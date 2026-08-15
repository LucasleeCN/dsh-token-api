# dsh-client-ui-token-billing

DeepSeek Harness 官方 Web UI 的客户端插件：在界面右下角注入一个紧凑的浮动面板，
展示**当前会话的 API Token 用量**、**上下文窗口占用**和**可配置的费用估算**。
UI 完全使用 Harness 官方设计变量（`--dsw-alias-*`），自动适配浅色/深色主题。

## 功能

- 读取官方 `session.list` RPC 返回的 projection：
  - `tokenUsage`：输入 / 输出 / 缓存读 / 缓存写 token；
  - `contextPressure`：上次请求压力、下次预计压力、上下文窗口；
  - `sessionStats`：步骤数与耗时等会话统计。
- 通过 `session.models` 显示当前模型，并按模型保存价格配置。
- 每 4 秒自动刷新；可手动刷新、切换会话、展开价格设置。
- 价格单位：¥ / 1M tokens。内置 DeepSeek Chat / Reasoner 示例价，
  但**不是官方实时价格**；用户保存的价格写入 `localStorage`。
- 纯浏览器端实现：无 Node 侧副作用，不影响模型输入。

## 目录结构

```text
dsh-client-ui-token-billing/
├─ package.json
├─ cordis.patch.yml
├─ lib/
│  ├─ index.js      # Host 半侧（空 Loader 入口）
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
    "dsh-client-ui-token-billing": "github:你的用户名/dsh-client-ui-token-billing"
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
       "dsh-client-ui-token-billing": "file:./node_modules/dsh-client-ui-token-billing"
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

- 插件不会从 DeepSeek 拉取实时价格（API 未暴露该字段）。
- 首次打开某个模型时，若命中内置预设则填入示例价，否则显示“未配置价格”。
- 点击 ⚙ 可编辑并保存该模型价格；保存后立即重算并持久化到浏览器
  `localStorage`（键：`dsh-client-ui-token-billing.prices.v1`）。

## 开发

```powershell
npm run check   # 语法检查 + 测试
npm test        # 运行测试
```

测试使用 `node:vm` 加载 `lib/client.js`，以模拟的 `session.list` /
`session.models` RPC 返回验证面板渲染、费用计算和未配置价格提示。

## 许可

MIT
