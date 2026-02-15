# FS Manager - 游戏设计文档

本文档描述 FS Manager 的核心设计理念、公式推导、模块架构和运行逻辑，与代码实现保持完全同步。

---

## 1. 游戏概述

### 1.1 游戏类型与目标

FS Manager 是一款结合养成、策略和模拟经营的单机游戏。玩家扮演花样滑冰选手的经纪人/教练，通过训练、比赛和资源管理，将选手从新手培养成世界冠军。

**核心循环**：
```
月度训练 → 消耗体力 → 提升属性 → 参加比赛 → 获取积分/奖金
      ↓                                    ↓
  购买装备 ← 聘请教练 ← 签约赞助 ← 世界排名 ← 解锁赛事
```

**游戏目标**：
- 短期目标：提升选手五维属性，解锁更高难度的技术动作
- 中期目标：获得赛事积分，提升世界排名，解锁顶级赛事
- 长期目标：赢得世锦赛/奥运会冠军，冲击 ISU 世界第一

### 1.2 技术栈

| 技术 | 用途 |
|------|------|
| React 19 | UI 框架 |
| TypeScript | 类型安全 |
| Tailwind CSS | 样式系统 |
| Recharts | 属性成长图表 |
| Vite | 构建工具 |
| LocalStorage | 数据持久化 |

### 1.3 工程结构

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
│   ├── training.ts            # 训练计算系统
│   ├── scoring.ts             # ISU计分系统 (BV + GOE)
│   ├── ranking.ts             # 排名与属性计算
│   ├── match.ts               # 比赛模拟引擎
│   ├── ai.ts                  # AI选手生成
│   ├── economy.ts             # 经济系统
│   ├── events.ts              # 事件系统
│   └── data/                  # 静态数据
│       ├── actions.ts         # 50+ ISU动作库
│       ├── training.ts        # 训练任务定义
│       ├── events.ts          # 随机事件库
│       └── equipment.ts       # 装备/教练/城市数据
│
├── data/
│   └── text.ts                # 文案数据
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
    └── math.ts                 # 数学工具函数
```

---

## 2. 核心公式

### 2.1 衍生属性计算

**文件**: `src/game/ranking.ts`

选手拥有五维基础属性，通过加权计算得出技术分 (TEC) 和艺术分 (ART)：

```
TEC = jump × 0.4 + spin × 0.3 + step × 0.2 + endurance × 0.1
ART = perf × 0.5 + step × 0.3 + endurance × 0.2
```

**加权说明**：
- 技术能力：跳跃占 40%，旋转 30%，步法 20%，耐力 10%
- 艺术感悟：表现力占 50%，步法 30%，耐力 20%

**装备加成**：

```
totalAttr[attr] = baseAttr + sum(ownedEquipment[attr]Bonus)
```

所有属性上限为 100。

### 2.2 ISU 计分系统

**文件**: `src/game/scoring.ts`

比赛得分采用 ISU 官方计分规则：基础分 (BV) + 执行分 (GOE) + 节目内容分 (PCS)。

#### 2.2.1 体力消耗

```
costReduction = endurance / 250
realCost = action.cost × (1 - costReduction)
```

耐力 100 时可减少 40% 体力消耗。

#### 2.2.2 失误率计算

```
attrAvg = relevantAttrs.sum() / relevantAttrs.length
baseFailChance = clamp((risk × 100) - (attrAvg × 0.6), 2, 90)
failChance = isPlayer ? baseFailChance : baseFailChance × 0.4
```

- AI 失误率仅为玩家的 40%，模拟职业选手的稳定性
- 失误率范围：2% - 90%

#### 2.2.3 体力系数

```
if (currentSta < 15) fatigueFactor = 0.6      // 严重疲劳
else if (currentSta < 30) fatigueFactor = 0.85 // 轻微疲劳
else fatigueFactor = 1.0                        // 正常
```

#### 2.2.4 GOE 计算

```
skillFactor = (attrAvg - 40) / 12
fatiguePenalty = (1 - fatigueFactor) × -8
randomness = (Math.random() - 0.5) × 1.5

goeGrade = clamp(skillFactor + fatiguePenalty + randomness, -4, 5)
goeValue = baseValue × (goeGrade × 0.10)
```

- GOE 范围：-5 到 +5
- 每级 GOE 约为 BV 的 10%
- 摔倒时 GOE 强制为 -5

#### 2.2.5 最终得分

```
elementScore = baseValue + goeValue
pcsBonus = perf × 0.03
finalScore = max(0, elementScore + pcsBonus)
```

### 2.3 滚动积分制

**文件**: `src/game/ranking.ts`

采用 ISU 官方滚动积分规则：

```
rolling = pointsCurrent + (pointsLast × 0.7)
```

- 当前赛季积分 100%
- 上赛季积分 70%
- 每年 12 月赛季重置

### 2.4 训练效果计算

**文件**: `src/game/training.ts`

```
ageMod = age < 18 ? 1.3 : age <= 23 ? 1.0 : 0.6
enduranceCostReduction = endurance / 200
enduranceEfficiencyBonus = endurance / 500

efficiency = 1.0 + enduranceEfficiencyBonus
if (sta <= 0) efficiency = 0
else if (sta < 20) efficiency = 0.3 + enduranceEfficiencyBonus
efficiency = min(efficiency, 1.2)

gain = baseGain × coachMod × ageMod × efficiency
```

**教练加成规则**：
- jump/spin/endurance：使用 `coach.tecMod`
- perf：使用 `coach.artMod`
- step：使用 `(tecMod + artMod) / 2`

---

## 3. 模块说明

### 3.1 training.ts - 训练系统

**导出函数**: `calculateWeeklyStats()`

**功能**: 计算一周训练后的属性成长和体力消耗

**输入**:
- `schedule`: 7 个训练槽位数组
- `startSta`: 初始体力
- `currentCoach`: 当前教练
- `skaterAge`: 选手年龄
- `endurance`: 耐力属性

**输出**:
- `finalSta`: 最终体力
- `gains`: 各属性成长值
- `artPlanPoints`: 节目新鲜度点数

### 3.2 scoring.ts - ISU 计分系统

**导出函数**: `calculateActionScore()`

**功能**: 计算单个技术动作的得分

**核心逻辑**:
1. 计算体力消耗（受耐力减免）
2. 计算相关属性平均值
3. 判定是否失误
4. 计算 GOE 等级
5. 叠加 PCS 加成

**返回**:
```typescript
{
  score: number,      // 最终得分
  cost: number,      // 体力消耗
  isFail: boolean,   // 是否摔倒
  fatigueFactor: number,
  raw: number,       // 基础分 BV
  goe: number        // GOE 等级
}
```

### 3.3 ranking.ts - 排名与属性系统

**导出函数**:

| 函数 | 功能 |
|------|------|
| `calculateRolling()` | 计算滚动积分 |
| `calcDerivedStats()` | 计算衍生属性 TEC/ART |
| `getTotalAttributes()` | 计算含装备加成的总属性 |

### 3.4 match.ts - 比赛模拟引擎

**导出函数**:

| 函数 | 功能 |
|------|------|
| `getBestActionForStats()` | 根据属性选择最佳动作 |
| `simulateAIProgram()` | 模拟 AI 选手完整节目 |

**AI 比赛模拟**:
```
totalScore = 0
for each phase in template.phases:
  action = getBestActionForStats(phase, stats)
  result = calculateActionScore(action, stats, 100, false)
  totalScore += result.score

return totalScore × (0.95 + random() × 0.1)
```

### 3.5 ai.ts - AI 生态系统

**导出函数**: `generateInitialAI()`

**AI 分层生成**:

| 层级 | 排名范围 | 基础属性 | 初始积分 |
|------|----------|----------|----------|
| elite | 1-15 | 80 | 3500-5500 |
| pro | 16-50 | 60 | 1500-3500 |
| rookie | 51-150 | 35 | 200-1500 |

**AI 成长**:
```
tec += age < 23 ? 0.15 : 0.05
art += age < 23 ? 0.15 : 0.05
```

**退役机制**:
- 年龄 > 33 岁强制退役
- 年龄 > 28 岁有 5% 概率退役

### 3.6 economy.ts - 经济系统

**导出函数**:

| 函数 | 功能 |
|------|------|
| `generateSponsorshipOptions()` | 生成赞助选项 |
| `generateRenewalOptions()` | 生成续约选项 |
| `generateMarket()` | 生成市场（教练/装备/编舞） |

**赞助层级**:

| 层级 | 名望要求 | 签约金 | 月薪 |
|------|----------|--------|------|
| local | 0 | 3,000 | 800 |
| brand | 350 | 30,000 | 5,000 |
| global | 1,000 | 250,000 | 30,000 |

### 3.7 events.ts - 事件系统

**导出函数**:

| 函数 | 功能 |
|------|------|
| `generateLocalCommentary()` | 生成比赛解说 |
| `generateLocalNarrative()` | 生成事件叙事 |

**随机事件**: 定义在 `src/game/data/events.ts`，包含正面、负面、中性事件。

---

## 4. 运行逻辑

### 4.1 月度推进流程

**文件**: `src/hooks/useGameState.ts` - `nextMonth()`

```
1. 时间推进
   month += 1 (跨年则 year += 1)

2. 计算训练效果
   calculateWeeklyStats(schedule, sta, coach, age, endurance)

3. 应用属性成长
   attributes[key] += gains[key]
   (应用随机波动: randNormal(gain, 0.1))

4. 更新体力
   sta = finalSta

5. 年龄增长
   age += 0.083 (约每月)

6. 装备耐久度衰减
   inventory.forEach(item => item.lifespan -= 1)
   移除 lifespan <= 0 的装备

7. 赞助收入
   monthlyPay 或 lump-sum

8. 教练工资扣除

9. 随机事件 (20% 概率)
   应用事件效果

10. 赛季重置 (12月)
    pointsLast = pointsCurrent
    pointsCurrent = 0

11. AI 生态更新
    - 年龄增长
    - 属性成长
    - 伤病恢复
    - 参加本月赛事
    - 退役/新人生成

12. 计算衍生属性
    tec = calcDerivedStats(totalAttrs).tec
    art = calcDerivedStats(totalAttrs).art

13. 记录历史

14. 刷新市场 (每4个月)

15. 重置比赛标记
```

### 4.2 比赛流程

**文件**: `src/components/MatchEngine.tsx`

```
1. 入场仪式
   显示赛事名称、赛制

2. 节目配置
   - 选择策略 (保守/平衡/激进)
   - 或自定义调整
   - 拖拽排序

3. 生成参赛者
   - 筛选符合条件的 AI
   - AI 执行模拟节目

4. 执行动作 (玩家)
   for each element in programConfig:
     - 显示动作卡片
     - 玩家点击执行
     - calculateActionScore()
     - 记录得分历史
     - 更新累计分数

5. 结算
   - 排名排序
   - 积分分配
   - 奖金发放
   - 名望增长
   - 荣誉记录
   - 体力消耗
   - 新鲜度衰减
```

---

## 5. 数据结构

### 5.1 Skater / PlayerAttributes

```typescript
interface PlayerAttributes {
  jump: number;       // 跳跃能力
  spin: number;       // 旋转能力
  step: number;       // 步法能力
  perf: number;       // 表现力
  endurance: number;  // 耐力
}

interface Skater {
  id: string;
  name: string;
  age: number;           // 精确到小数
  tec: number;           // 衍生属性
  art: number;           // 衍生属性
  sta: number;           // 当前体力 0-100
  attributes?: PlayerAttributes; // 仅玩家有
  pointsCurrent: number; // 本赛季积分
  pointsLast: number;    // 上赛季积分
  rolling: number;       // 滚动积分
  honors: HonorRecord[];
  injuryMonths: number;
  isPlayer: boolean;
  retired: boolean;
  activeProgram: Program;
}
```

### 5.2 GameState

```typescript
interface GameState {
  year: number;
  month: number;
  money: number;
  fame: number;
  injuryMonths: number;
  hasCompeted: boolean;
  skater: Skater;
  schedule: TrainingTaskType[];  // 7个训练槽
  aiSkaters: Skater[];
  inventory: Equipment[];
  activeCoachId: string | null;
  history: HistoryRecord[];
  activeEvent: RandomEvent | null;
  activeSponsor: Sponsorship | null;
  market: Market;
  lastGrowth: { tec: number; art: number };
}
```

### 5.3 动作库

**文件**: `src/game/data/actions.ts`

共 50+ ISU 官方动作，按类型分类：

| 类型 | 数量 | 示例 |
|------|------|------|
| 单跳 | 20 | 2T, 3T, 4T, 3Lz |
| 阿克塞尔 | 4 | 1A, 2A, 3A, 4A |
| 连跳 | 10 | 3T+3T, 4Lz+3T |
| 旋转 | 16 | USp, SSp, CoSp |
| 步法 | 4 | StSq1-4 |

### 5.4 训练任务

```typescript
const TRAINING_TASKS = {
  jump:      { baseGain: 1.2, staCost: 22 },
  spin:      { baseGain: 0.9, staCost: 12 },
  step:      { baseGain: 0.9, staCost: 14 },
  perf:      { baseGain: 1.0, staCost: 12 },
  endurance: { baseGain: 0.8, staCost: 18 },
  rest:      { baseGain: 0,   staCost: -28 }  // 恢复体力
};
```

### 5.5 教练数据

```typescript
const COACHES = [
  { id: 'coach_1', name: '基础教练',  tecMod: 1.0, artMod: 1.0, salary: 1000,  tier: 'basic' },
  { id: 'coach_2', name: '专业教练',  tecMod: 1.25, artMod: 1.15, salary: 3500, tier: 'pro' },
  { id: 'coach_3', name: '国家级教练', tecMod: 1.4, artMod: 1.4, salary: 8000,  tier: 'pro' },
  { id: 'coach_4', name: '传奇教练',  tecMod: 1.7, artMod: 1.8, salary: 20000, tier: 'legend' }
];
```

---

## 6. 平衡性设计

### 6.1 分数区间

| 阶段 | 属性 | 总 BV | 预期得分 | 对应赛事 |
|------|------|------|----------|----------|
| 新手 | 30-40 | 15-20 | 18-28 | 地区赛 |
| 职业 | 50-65 | 35-45 | 40-60 | 大奖赛 |
| 精英 | 70-85 | 55-65 | 70-95 | 世锦赛 |
| 顶尖 | 85-100 | 70-85 | 95-120 | 奥运会 |

### 6.2 经济曲线

| 阶段 | 月收入 | 教练开销 | 装备价格 |
|------|--------|----------|----------|
| 新手 | ¥10,000-30,000 | ¥1,000 | ¥3,000-8,000 |
| 职业 | ¥50,000-150,000 | ¥3,500 | ¥8,000-25,000 |
| 精英 | ¥200,000-500,000 | ¥8,000 | ¥25,000-50,000 |
| 冠军 | ¥500,000+ | ¥20,000 | ¥50,000+ |

### 6.3 AI 分层

| 层级 | 人数 | 初始积分 | 年成长 |
|------|------|----------|--------|
| elite | 15 | 3500-5500 | 0.15 |
| pro | 35 | 1500-3500 | 0.15 |
| rookie | 100 | 200-1500 | 0.15 |

---

## 附录

### 代码版本

- **游戏版本**: FSM 3.0.0
- **文档版本**: v1.0.0
- **ISU 规则版本**: 2024-25 赛季
- **最后更新**: 2026年2月15日
