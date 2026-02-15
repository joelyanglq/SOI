# FS Manager (FSM)

**FS Manager** 是一款高深度的职业花样滑冰模拟经营游戏。玩家将扮演一名选手的核心经纪人与教练，负责从日常排程、团队组建到比赛策略的全方位决策，目标是冲击 ISU 世界排名第一。

## 前

爱好者做来玩玩的，主要靠ai生成内容，代码质量参差不齐，请勿用于商业用途。

## ⛸️ 核心功能

- **深度养成系统**：五维属性 (跳跃、旋转、步法、表现力、耐力) 构成技术 (TEC) 与艺术 (ART) 能力，体力 (STA) 作为核心限制资源。
- **动态排程**：每月 7 个训练槽位，合理分配跳跃练习、旋转、步法、表现力、耐力与体能修复。
- **ISU 竞技引擎**：模拟真实的技术分 (TES) 与节目内容分 (PCS)，支持保守、标准、挑战三种比赛策略。
- **世界排名生态**：拥有 150 名真实模拟的 AI 选手，采用 ISU 滚动积分制（Rolling Points），选手会自动衰老与退役。
- **商业与团队**：
    - **教练市场**：不同等级的教练提供不同的属性成长加成。
    - **器材维护**：冰鞋与冰刀有寿命限制，需及时更换以维持属性加成。
    - **编舞系统**：聘请大师级编舞提升节目的艺术底蕴。

## 🛠️ 技术栈

- **框架**：React 19
- **语言**：TypeScript
- **样式**：Tailwind CSS
- **图表**：Recharts (用于渲染属性成长趋势)
- **构建工具**：Vite
- **数据持久化**：LocalStorage (Key: FS_MANAGER_V11_PRO)

## 📂 工程结构

```
src/
├── App.tsx                    # 主应用入口 / UI渲染
├── types.ts                   # TypeScript 类型定义
├── index.tsx                  # React 入口
│
├── hooks/
│   └── useGameState.ts        # 游戏状态Hook (完整游戏逻辑)
│
├── game/                      # 游戏逻辑模块
│   ├── config.ts              # 数值常量配置
│   ├── training.ts             # 训练计算系统
│   ├── scoring.ts              # ISU计分系统 (BV + GOE)
│   ├── ranking.ts              # 排名与属性计算
│   ├── match.ts                # 比赛模拟引擎
│   ├── ai.ts                   # AI选手生成
│   ├── economy.ts              # 经济系统 (赞助/市场)
│   ├── events.ts               # 事件系统 (解说/叙事)
│   │
│   └── data/                  # 静态数据
│       ├── actions.ts          # 50+ ISU动作库
│       ├── training.ts         # 训练任务定义
│       ├── events.ts           # 随机事件库
│       └── equipment.ts        # 装备/教练/城市数据
│
├── data/
│   └── text.ts                 # 文案数据 (解说词/事件叙事)
│
├── components/                 # UI组件
│   ├── Sidebar.tsx
│   ├── EventTab.tsx
│   ├── DevelopmentTab.tsx
│   ├── CareerTab.tsx
│   ├── RankingTab.tsx
│   ├── MatchEngine.tsx
│   ├── LogPanel.tsx
│   ├── SponsorshipModal.tsx
│   └── EventNoticeModal.tsx
│
└── utils/
    └── math.ts                 # 数学工具函数 (clamp/randNormal)
```

## 🔧 核心模块说明

| 模块 | 导出函数 | 功能 |
|------|----------|------|
| `game/config.ts` | `MATCH_STAMINA_COST`, `TRAIN_MAX_GAIN`, `STORAGE_KEY` | 数值常量配置 |
| `game/training.ts` | `calculateWeeklyStats()` | 计算训练效果（含教练/年龄/耐力加成） |
| `game/scoring.ts` | `calculateActionScore()` | ISU计分: Base Value + GOE + PCS |
| `game/ranking.ts` | `calcDerivedStats()`, `calculateRolling()`, `getTotalAttributes()` | 衍生属性计算、滚动积分、装备加成 |
| `game/match.ts` | `simulateAIProgram()`, `getBestActionForStats()` | AI比赛模拟 |
| `game/ai.ts` | `generateInitialAI()` | 生成150名AI选手（精英/职业/新秀分层） |
| `game/economy.ts` | `generateSponsorshipOptions()`, `generateMarket()` | 赞助生成、装备市场 |
| `game/events.ts` | `generateLocalCommentary()`, `generateLocalNarrative()` | 解说生成、事件叙事 |
| `hooks/useGameState.ts` | `useGameState()` | 完整游戏状态管理、月度推进逻辑 |

## 🚀 快速开始

1. **安装依赖**：
   ```bash
   npm install
   ```
2. **启动开发服务器**：
   ```bash
   npm run dev
   ```
3. **访问地址**：打开浏览器访问 `http://localhost:5173`。

## ⚖️ 游戏规则摘要

- **体力影响**：体力低于 20% 时，训练效率降至 30%；体力为 0 时无法获得任何成长。
- **得分公式**：总分 = ((技术分 × 摔倒惩罚) + 艺术分) × 体力系数。
- **排名逻辑**：世界排名总分 = 本赛季积分 + (上赛季积分 × 0.7)。

## 📖 详细文档

- `files/GAME_DESIGN.md`: 完整游戏设计文档
- `files/rules.md`: 核心得分公式与计算逻辑
- `files/README_FEATURES.md`: 详细功能介绍
