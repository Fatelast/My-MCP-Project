# My MCP Project

## 项目背景

本仓库是一个个人全栈学习与实践项目合集，涵盖 MCP（Model Context Protocol）服务端开发、前端游戏、博客页面以及跨平台桌面应用等多个方向。所有子项目均基于现代前端技术栈构建，旨在探索 AI 工具集成、游戏逻辑设计与桌面应用开发等领域。

---

## 项目结构

```
My-MCP-Project/
├── mcp-server/          # 自定义 MCP 服务端（Node.js + TypeScript）
├── my-blog/             # 个人博客静态页面
├── nihong-majiang/      # 日本麻将单机游戏（React + TypeScript）
└── tauri-app-template/  # Tauri 跨平台桌面应用模板
```

---

## 子项目介绍

### 1. mcp-server

> 基于 Node.js + TypeScript 构建的自定义 MCP（Model Context Protocol）服务端。

集成了多个实用工具，包括：
- **天气查询**：根据城市名查询天气预报
- **地理编码 / 逆地理编码**：地址与经纬度互转
- **GitHub 仓库摘要**：一键获取仓库基本信息、语言占比、最近 Issues
- **地点 + 天气联合查询**：输入地点名，同时返回坐标与天气

**技术栈**：`@modelcontextprotocol/sdk` · `TypeScript` · `Node.js` · `zod`

---

### 2. my-blog

> 个人博客静态页面。

一个简洁的静态 HTML 博客首页，用于展示个人信息与文章内容，无需构建工具，直接用浏览器打开即可预览。

**技术栈**：`HTML`

---

### 3. nihong-majiang

> 日本麻将（立直麻雀）单机游戏。

完整实现了日本麻将的核心游戏逻辑，包括：
- 完整的牌山、手牌、碰/杠/吃操作
- AI 自动出牌策略
- 立直、荣和、自摸等役种判定与计分
- 响应式游戏界面（TailwindCSS）

**技术栈**：`React 18` · `TypeScript` · `Vite` · `Zustand` · `Immer` · `TailwindCSS` · `Vitest`

---

### 4. tauri-app-template

> 开箱即用的 Tauri v2 跨平台桌面应用模板。

功能完备的桌面应用起点，内置：
- 深色 / 浅色主题切换
- 多语言国际化（i18n，中英文）
- 全局快捷键支持
- 自动更新（OTA）
- 系统托盘
- shadcn/ui 组件库集成

**技术栈**：`Tauri v2` · `React 19` · `TypeScript` · `Vite` · `TailwindCSS v4` · `shadcn/ui` · `i18next`

---

## 启动指南

### mcp-server

```bash
cd mcp-server
npm install

# 开发模式（tsx 热重载）
npm run dev

# 生产模式
npm run build
npm run start
```

### my-blog

无需安装依赖，直接用浏览器打开 `my-blog/index.html` 即可预览。

### nihong-majiang

```bash
cd nihong-majiang
npm install

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build

# 运行单元测试
npm run test
```

### tauri-app-template

> 需要提前安装 Rust 工具链与 Tauri CLI，详见 [Tauri 官方文档](https://tauri.app/start/prerequisites/)。

```bash
cd tauri-app-template
pnpm install

# 启动 Web 开发服务器（仅前端预览）
pnpm dev

# 启动 Tauri 桌面应用（开发模式）
pnpm tauri:dev

# 打包桌面应用（Windows NSIS 安装包）
pnpm tauri:build
```

---

## License

MIT
