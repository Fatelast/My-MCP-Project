# 🀄 日本麻将 (Riichi Mahjong)

> 基于 React + TypeScript 的日本立直麻雀单机游戏，支持 PC 和手机浏览器。

## 功能特性

- ✅ 完整立直麻雀规则（东风战 / 东南战）
- ✅ 20+ 基础役种判定（立直、断幺、平和、清一色等）
- ✅ 符数 + 番数 + 点数完整计算
- ✅ 3 个 AI 对手（简单 / 普通 / 困难）
- ✅ 响应式布局，PC 和手机浏览器均可游玩
- ✅ 纯前端单机，无需后端，无需登录

## 技术栈

| 技术 | 版本 | 说明 |
|------|------|------|
| React | 18.x | UI 框架 |
| TypeScript | 5.x | 严格类型 |
| Vite | 5.x | 构建工具 |
| Zustand | 4.x | 状态管理 |
| Tailwind CSS | 3.x | 样式框架 |
| Vitest | 1.x | 单元测试 |

## 本地运行

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 运行单元测试
npm run test

# 生产构建
npm run build

# 预览生产构建
npm run preview
```

## 项目结构

```
src/
├── engine/          # 游戏引擎（纯 TypeScript，不依赖 React）
│   ├── types.ts     # 核心类型定义
│   ├── tiles.ts     # 牌山工具
│   ├── wall.ts      # 牌山管理
│   ├── hand.ts      # 手牌操作
│   ├── tenpai.ts    # 听牌检测
│   ├── yaku/        # 役种判定 + 点数计算
│   ├── ai/          # AI 决策引擎
│   └── game.ts      # 游戏主流程
├── store/           # Zustand 状态管理
├── components/      # React UI 组件
├── hooks/           # 自定义 Hooks
└── utils/           # 工具函数
```

## 部署到 GitHub Pages

```bash
# 构建
npm run build

# 推送 dist/ 到 gh-pages 分支
npx gh-pages -d dist
```

或在 `vite.config.ts` 中设置 `base` 为你的仓库名：

```ts
export default defineConfig({
  base: '/nihong-majiang/',
  // ...
});
```

## 役种列表（基础版）

| 役种 | 番数（门清）| 番数（副露）|
|------|------------|------------|
| 立直 | 1 | - |
| 一发 | 1 | - |
| 门清自摸 | 1 | - |
| 断幺九 | 1 | 1 |
| 平和 | 1 | - |
| 一盃口 | 1 | - |
| 役牌 | 1 | 1 |
| 一气通贯 | 2 | 1 |
| 三色同顺 | 2 | 1 |
| 混全带幺九 | 2 | 1 |
| 七对子 | 2 | - |
| 对对和 | 2 | 2 |
| 混一色 | 3 | 2 |
| 小三元 | 2 | 2 |
| 混老头 | 2 | 2 |
| 清一色 | 6 | 5 |
| 海底摸月 | 1 | 1 |
| 河底捞鱼 | 1 | 1 |
| 岭上开花 | 1 | 1 |
| 抢杠 | 1 | 1 |

## License

MIT
