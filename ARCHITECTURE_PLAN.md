# FS Manager Elite 架构重构方案 v2.0

## 目标
将单文件 App.tsx (2000+ 行) 分解为清晰的模块化架构，保持功能完整的同时提升可维护性和可扩展性。

核心原则：
- **纯函数模块**，不使用 class/DI 模式
- **不改变游戏逻辑**，只重新组织代码
- **localStorage 格式不变**，存档兼容
- **避免过度设计**，文件拆分以实际代码量为依据

---

## 目录结构

```
src/
├── App.tsx                      # 根组件（~300行，纯编排层）
├── index.tsx                    # 入口
├── types.ts                     # 类型定义
│
├── game/                        # 游戏逻辑（纯函数模块）
│   ├── scoring.ts               # calculateActionScore + 体力修正因子
│   ├── match.ts                 # simulateAIProgram, getBestActionForStats
│   ├── ai.ts                    # generateInitialAI, AI月度更新/退役
│   ├── training.ts              # calculateWeeklyStats
│   ├── ranking.ts               # calculateRolling, calcDerivedStats
│   ├── economy.ts               # generateSponsorshipOptions, generateMarket, generateRenewalOptions
│   ├── events.ts                # 随机事件触发逻辑
│   ├── config.ts                # 数值常量 (FATIGUE_SLOPE, MATCH_STAMINA_COST 等)
│   └── data/                    # 静态数据表
│       ├── actions.ts           # ACTION_LIBRARY, MATCH_STRUCTURES, PHASE_META
│       ├── training.ts          # TRAINING_TASKS
│       ├── events.ts            # RANDOM_EVENTS, COACHES
│       └── equipment.ts         # EQUIP_NAMES, CHOREO_NAMES
│
├── components/                  # React 组件
│   ├── MatchEngine.tsx          # 比赛引擎组件
│   ├── EventTab.tsx             # 竞技赛事标签页
│   ├── DevelopmentTab.tsx       # 能力成长标签页（含训练/教练/装备/编舞子面板）
│   ├── RankingTab.tsx           # 世界排名标签页
│   ├── CareerTab.tsx            # 选手信息标签页
│   ├── Sidebar.tsx              # 左侧信息面板
│   ├── LogPanel.tsx             # 右侧快讯面板
│   ├── SponsorshipModal.tsx     # 赞助选择模态框
│   └── EventNoticeModal.tsx     # 随机事件通知弹窗
│
├── hooks/
│   └── useGameState.ts          # 核心状态管理 + nextMonth + localStorage
│
├── utils/
│   └── math.ts                  # randNormal, clamp
│
└── data/
    └── text.ts                  # UI 文本语料库 (COMMENTARY, LOADING_QUOTES 等)
```

---

## 模块职责

### game/scoring.ts - 得分计算
```typescript
// ISU 评分引擎：BV + GOE
export function calculateActionScore(
  action: MatchAction,
  stats: PlayerAttributes,
  currentSta: number,
  isPlayer: boolean
): { score: number; cost: number; isFail: boolean; fatigueFactor: number; raw: number; goe: number }
```

### game/match.ts - 比赛逻辑
```typescript
// AI 最优动作选择
export function getBestActionForStats(phase: MatchPhaseType, stats: PlayerAttributes): MatchAction
// AI 比赛模拟
export function simulateAIProgram(skater: Skater, templateId: string): number
```

### game/ai.ts - AI 管理
```typescript
// 生成 150 名初始 AI 选手
export function generateInitialAI(): Skater[]
```

### game/training.ts - 训练系统
```typescript
// 计算月度训练结果
export function calculateWeeklyStats(
  schedule: TrainingTaskType[],
  startSta: number,
  coach: Coach,
  skaterAge: number,
  currentEndurance: number
): { finalSta: number; gains: Record<string, number>; artPlanPoints: number }
```

### game/ranking.ts - 排名系统
```typescript
export function calculateRolling(s: { pointsCurrent: number; pointsLast: number }): number
export function calcDerivedStats(attrs: PlayerAttributes): { tec: number; art: number }
export function getTotalAttributes(base: PlayerAttributes, inventory: Equipment[]): PlayerAttributes
```

### game/economy.ts - 经济系统
```typescript
export function generateSponsorshipOptions(fame: number): Sponsorship[]
export function generateRenewalOptions(currentSponsor: Sponsorship): Sponsorship[]
export function generateMarket(activeCoachId?: string | null, currentMarket?: any): Market
```

### game/events.ts - 事件系统
```typescript
export function generateLocalCommentary(rank: number): string
export function generateLocalNarrative(event: RandomEvent): string
```

### hooks/useGameState.ts - 状态管理
```typescript
// 整合 game state + nextMonth + localStorage + 所有 UI 状态
export function useGameState(): {
  game: GameState;
  setGame: ...;
  nextMonth: () => Promise<void>;
  // ...其他状态和方法
}
```

---

## 依赖关系

```
App.tsx (编排层)
  ├── useGameState (hook)
  │   ├── game/training.ts
  │   ├── game/ranking.ts
  │   ├── game/ai.ts
  │   ├── game/economy.ts
  │   ├── game/events.ts
  │   └── utils/math.ts
  │
  └── Components
      ├── Sidebar
      ├── LogPanel
      ├── EventTab
      ├── DevelopmentTab
      ├── RankingTab
      ├── CareerTab
      ├── SponsorshipModal
      ├── EventNoticeModal
      └── MatchEngine
          ├── game/scoring.ts
          └── game/match.ts
```

---

## 关键收益

| 方面 | 现状 | 重构后 |
|------|------|--------|
| 文件大小 | App.tsx 2000+ 行 | App.tsx ~300行 + 模块化 |
| 可测试性 | 难以单元测试 | 纯函数可独立测试 |
| 可维护性 | 逻辑混杂 | 职责清晰 |
| 可扩展性 | 新功能需修改 App | 新系统独立创建 |
| 数值调试 | 魔法数字遍布 | 集中在 game/config.ts |

---

## 注意事项

1. **向后兼容**：localStorage key `FS_MANAGER_V11_PRO` 和数据格式不变
2. **不改逻辑**：迁移期间只重新组织代码，不修改游戏逻辑
3. **纯函数优先**：所有游戏逻辑用纯函数导出，不使用 class
4. **命名规范**：函数 camelCase，常量 UPPER_SNAKE_CASE，组件 PascalCase
