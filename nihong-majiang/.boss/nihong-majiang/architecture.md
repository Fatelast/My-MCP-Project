# 系统架构文档

## 摘要

> 下游 Agent 请优先阅读本节。

- **架构模式**：纯前端单页应用（SPA），无后端
- **技术栈**：React 18 + TypeScript 5 + Vite + Zustand + Tailwind CSS
- **核心设计决策**：
  1. 游戏逻辑引擎（纯 TS）与 UI 层完全解耦，方便单元测试
  2. 使用 Zustand 管理全局游戏状态，避免 prop drilling
  3. 麻将牌使用 Unicode 字符 + CSS 渲染，无需图片资源
- **主要风险**：役种判定逻辑复杂，需要充分单元测试
- **项目结构**：`src/engine/`（游戏逻辑）+ `src/components/`（UI）+ `src/store/`（状态）

---

## 1. 技术调研

### 1.1 调研背景

**需求概述**：纯前端日本麻将单机游戏，React + TypeScript，响应式支持手机

**关键技术挑战**：
- 役种判定算法（和牌型枚举、复合役计算）
- 麻将牌的视觉渲染方案
- 全局游戏状态管理（轮次、牌山、各家手牌）
- 移动端触控操作适配

### 1.2 技术方案调研

#### 构建工具对比

| 方案 | 优点 | 缺点 | 结论 |
|------|------|------|------|
| Vite | 极快热更新、原生 ESM、生态好 | 生产构建需优化 | **采用** |
| Create React App | 零配置 | 已停止维护、慢 | 不采用 |
| Next.js | SSR/SSG | 纯游戏无需SSR，过重 | 不采用 |

#### 状态管理对比

| 方案 | 优点 | 缺点 | 结论 |
|------|------|------|------|
| Zustand | 轻量、API简单、TypeScript友好 | 大型应用需规范 | **采用** |
| Redux Toolkit | 成熟、DevTools完善 | 样板代码多，过重 | 不采用 |
| Jotai | 原子化、细粒度 | 游戏状态整体性强 | 不采用 |

#### 样式方案对比

| 方案 | 优点 | 缺点 | 结论 |
|------|------|------|------|
| Tailwind CSS | 原子类、响应式强、无运行时 | 类名较长 | **采用** |
| CSS Modules | 隔离性好 | 响应式需手写媒体查询 | 不采用 |
| Styled Components | JS in CSS | 运行时开销 | 不采用 |

#### 麻将牌渲染方案对比

| 方案 | 优点 | 缺点 | 结论 |
|------|------|------|------|
| Unicode 麻将字符 + CSS | 零资源、可缩放、响应式友好 | 需要自定义样式 | **采用** |
| SVG 图片 | 高质量 | 需要136张SVG资源 | 不采用 |
| Canvas 渲染 | 性能好 | 开发复杂，移动端适配难 | 不采用 |

### 1.3 开源方案评估

| 开源项目 | 功能 | 结论 |
|----------|------|------|
| mahjong-utils（npm） | 役种判定工具库 | 可参考算法，但自实现更可控 |
| riichi-mahjong-ts | TypeScript 麻将引擎 | 参考其数据结构设计 |

### 1.4 调研结论

| 层级 | 推荐方案 | 选择理由 |
|------|----------|----------|
| 前端框架 | React 18 + TypeScript 5 | 用户指定 |
| 构建工具 | Vite 5 | 最快的开发体验 |
| 状态管理 | Zustand 4 | 轻量适合游戏状态 |
| 样式 | Tailwind CSS 3 | 响应式开发效率最高 |
| 测试 | Vitest + Testing Library | Vite生态，速度快 |
| 牌面渲染 | Unicode + CSS | 零依赖，可缩放 |

---

## 2. 架构概述

### 2.1 架构类型

**本项目选择**：纯前端 SPA（单页应用）- 无需后端，游戏逻辑全在浏览器运行，便于 GitHub Pages 直接部署

### 2.2 系统架构图

```
┌─────────────────────────────────────────────────────────┐
│                    浏览器（PC / 手机）                    │
│  ┌──────────────────────────────────────────────────┐   │
│  │                  React UI 层                      │   │
│  │  GameBoard │ PlayerHand │ ActionPanel │ ScoreBoard│   │
│  └─────────────────────┬────────────────────────────┘   │
│                         │ dispatch / select              │
│  ┌──────────────────────▼────────────────────────────┐  │
│  │              Zustand Game Store                    │  │
│  │  gamePhase │ players │ wall │ river │ scores       │  │
│  └──────────────────────┬────────────────────────────┘  │
│                         │ call                           │
│  ┌──────────────────────▼────────────────────────────┐  │
│  │              Game Engine（纯 TypeScript）           │  │
│  │  ┌──────────┐ ┌──────────┐ ┌────────────────────┐ │  │
│  │  │ WallMgr  │ │ YakuCalc │ │   PointCalculator  │ │  │
│  │  │（牌山管理）│ │（役种判定）│ │   （点数计算）       │ │  │
│  │  └──────────┘ └──────────┘ └────────────────────┘ │  │
│  │  ┌──────────┐ ┌──────────┐                         │  │
│  │  │ AIMgr    │ │ TenpaiChk│                         │  │
│  │  │（AI决策）  │ │（听牌检测）│                         │  │
│  │  └──────────┘ └──────────┘                         │  │
│  └────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

### 2.3 技术栈总览

| 层级 | 技术 | 版本 | 说明 |
|------|------|------|------|
| 框架 | React | 18.x | UI 渲染 |
| 语言 | TypeScript | 5.x | 严格模式 |
| 构建 | Vite | 5.x | 开发服务器 + 生产构建 |
| 状态 | Zustand | 4.x | 游戏全局状态 |
| 样式 | Tailwind CSS | 3.x | 响应式原子类 |
| 测试 | Vitest | 1.x | 单元测试 |
| 代码规范 | ESLint + Prettier | - | Airbnb 规范 |
| Git | Git | - | GitHub 托管 |

---

## 3. 项目目录结构

```
nihong-majiang/
├── public/
│   └── favicon.ico
├── src/
│   ├── engine/                    # 游戏逻辑（纯 TS，不依赖 React）
│   │   ├── types.ts               # 核心类型定义（Tile, Player, GameState...）
│   │   ├── tiles.ts               # 牌的常量、生成、洗牌
│   │   ├── wall.ts                # 牌山管理（摸牌、岭上牌、宝牌）
│   │   ├── hand.ts                # 手牌操作（排序、副露、暗杠）
│   │   ├── tenpai.ts              # 听牌检测、待牌计算
│   │   ├── yaku/
│   │   │   ├── index.ts           # 役种判定总入口
│   │   │   ├── basic.ts           # 基础役（断幺、平和、一盃口等）
│   │   │   ├── special.ts         # 特殊役（七对子、国士等）
│   │   │   └── scoring.ts         # 符数+番数+点数计算
│   │   ├── ai/
│   │   │   ├── index.ts           # AI 决策总入口
│   │   │   ├── discard.ts         # AI 出牌策略
│   │   │   └── action.ts          # AI 鸣牌/和牌决策
│   │   └── game.ts                # 游戏流程控制（回合管理）
│   ├── store/
│   │   ├── gameStore.ts           # Zustand 游戏状态
│   │   └── settingsStore.ts       # 设置状态（难度等）
│   ├── components/
│   │   ├── GameBoard/             # 牌桌主界面
│   │   │   ├── index.tsx
│   │   │   ├── CenterArea.tsx     # 中央区域（牌山、宝牌、场风）
│   │   │   └── PlayerArea.tsx     # 玩家区域（手牌+河牌）
│   │   ├── Tile/
│   │   │   ├── index.tsx          # 单张牌组件
│   │   │   └── TileBack.tsx       # 牌背
│   │   ├── ActionPanel/
│   │   │   └── index.tsx          # 操作按钮（吃碰杠荣自摸跳过）
│   │   ├── ScoreModal/
│   │   │   └── index.tsx          # 和牌结算弹窗
│   │   ├── GameOver/
│   │   │   └── index.tsx          # 对局结束界面
│   │   └── common/
│   │       ├── Button.tsx
│   │       └── Modal.tsx
│   ├── hooks/
│   │   ├── useGameLoop.ts         # 游戏主循环 Hook
│   │   └── usePlayerAction.ts     # 玩家操作 Hook
│   ├── utils/
│   │   └── tileRender.ts          # 牌面 Unicode 映射
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── tests/
│   ├── engine/
│   │   ├── yaku.test.ts           # 役种判定测试
│   │   ├── scoring.test.ts        # 点数计算测试
│   │   └── tenpai.test.ts         # 听牌检测测试
│   └── components/
│       └── Tile.test.tsx
├── .boss/                         # Boss 产物目录
├── .gitignore
├── .eslintrc.cjs
├── .prettierrc
├── tailwind.config.ts
├── tsconfig.json
├── vite.config.ts
├── vitest.config.ts
├── package.json
└── README.md
```

---

## 4. 核心数据模型

### 4.1 类型定义（TypeScript）

```typescript
// 牌的花色
type Suit = 'man' | 'pin' | 'sou' | 'honor';
// 牌面值：数牌1-9，字牌1-7（东南西北中发白）
type TileValue = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;

interface Tile {
  suit: Suit;
  value: TileValue;
  id: string;        // 唯一ID（区分同种牌）
  isAka?: boolean;   // 是否赤五
}

type Wind = 'east' | <thinking>
Continuing the truncated tool call for architecture.md
</thinking>

[TM_CONTINUE_ACK:tmc-ym2h9]
[TM_CONTINUE_START:tmc-ym2h9]
 'south' | 'west' | 'north';

interface Player {
  id: number;
  name: string;
  isHuman: boolean;
  wind: Wind;
  hand: Tile[];           // 手牌（13/14张）
  discards: Tile[];       // 河牌
  melds: Meld[];          // 副露（吃/碰/明杠）
  score: number;          // 持有点数
  isRiichi: boolean;      // 是否立直
  riichiDiscard?: Tile;   // 立直时打出的牌
}

type MeldType = 'chi' | 'pon' | 'minkan' | 'ankan';

interface Meld {
  type: MeldType;
  tiles: Tile[];
  calledFrom?: number;    // 从哪位玩家处鸣牌
}

type GamePhase =
  | 'waiting'       // 等待开始
  | 'dealing'       // 发牌
  | 'playerTurn'    // 玩家摸牌回合
  | 'aiTurn'        // AI回合
  | 'action'        // 等待玩家吃/碰/杠/荣操作
  | 'scoring'       // 结算
  | 'roundEnd'      // 一局结束
  | 'gameEnd';      // 全局结束

interface GameState {
  phase: GamePhase;
  roundWind: Wind;         // 场风
  roundNumber: number;     // 局数（1-4东、1-4南）
  honba: number;           // 本场数
  riichiSticks: number;    // 场上立直棒数量
  dealer: number;          // 庄家 index
  currentPlayer: number;   // 当前行动玩家
  players: Player[];
  wall: Tile[];            // 牌山
  deadWall: Tile[];        // 王牌（14张）
  doraTiles: Tile[];       // 宝牌指示牌
  lastDiscard?: Tile;      // 最新打出的牌
  lastDiscardPlayer?: number;
  availableActions: Action[]; // 当前可选操作
}

type ActionType = 'chi' | 'pon' | 'kan' | 'ron' | 'tsumo' | 'riichi' | 'skip';

interface Action {
  type: ActionType;
  tiles?: Tile[];          // 吃牌时的组合
}
```

---

## 5. 游戏流程状态机

```
[waiting] → [dealing] → [playerTurn] ←──────────────┐
                              │                       │
                    玩家打牌   ↓                       │
                         [action?] ──无人响应──→ 下家摸牌
                              │
                    有人响应   ↓
                         [吃/碰/杠/荣]
                              │
                    和牌       ↓
                         [scoring] → [roundEnd] → [gameEnd]
```

---

## 6. 安全与性能设计

| 方面 | 方案 |
|------|------|
| 状态不可变 | Zustand immer 中间件，状态更新不可变 |
| AI计算 | Web Worker（防止阻塞UI线程）|
| 响应式 | Tailwind 断点：sm(640) / md(768) / lg(1024) |
| 代码分割 | React.lazy 懒加载弹窗组件 |

---

## 7. 技术风险

| 风险 | 可能性 | 影响 | 缓解措施 |
|------|--------|------|----------|
| 役种判定逻辑 bug | 高 | 高 | 充分单元测试，覆盖边界用例 |
| 移动端手牌显示过小 | 中 | 高 | 横屏模式 + 动态字体缩放 |
| AI出牌卡死（死循环） | 低 | 高 | 超时兜底机制，强制出牌 |
