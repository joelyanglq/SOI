# FS Manager - 游戏设计文档

本文档描述 FS Manager 的核心设计理念、公式推导、模块架构和运行逻辑，与代码实现保持完全同步。

---

## 1. 游戏概述

### 1.1 游戏类型与目标

FS Manager 是一款结合养成、策略和模拟经营的单机游戏。玩家扮演花样滑冰选手的经纪人/教练，通过训练、比赛和资源管理，将选手从新手培养成世界冠军。

**核心循环**：
```
月度训练 → 消耗体力 → 提升属性+技术卡牌 → 编排节目 → 参加比赛 → 获取积分/奖金
      ↓                                            ↓
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
| Vitest | 单元测试框架 |
| LocalStorage | 数据持久化 |

### 1.3 工程结构

```
src/
├── App.tsx                    # 主应用入口 / UI渲染
├── types.ts                   # TypeScript 类型定义 (全部类型)
├── index.tsx                  # React 入口
│
├── hooks/
│   └── useGameState.ts        # 游戏状态Hook (状态管理 + 迁移 + 月度推进)
│
├── game/                      # 游戏逻辑模块
│   ├── config.ts              # 数值常量配置
│   ├── training.ts            # 训练计算 (双轨增益: body + tech + goeBonus)
│   ├── scoring.ts             # ISU计分 (proficiency-based + 9参数 + 三分量PCS)
│   ├── ranking.ts             # 排名与属性计算
│   ├── match.ts               # 比赛模拟引擎 (含 trait state tracking)
│   ├── ai.ts                  # AI选手生成 (含 technique + traits + programV2)
│   ├── program.ts             # ProgramV2 组装、Synergy 计算、Maturity modifier
│   ├── economy.ts             # 经济系统
│   ├── events.ts              # 事件叙事生成
│   │
│   ├── data/                  # 静态数据 & 数据驱动逻辑
│   │   ├── actions.ts         # 50+ ISU动作库 (含 techReq 字段)
│   │   ├── training.ts        # 7 种训练任务定义
│   │   ├── technique.ts       # 技术卡牌常量 (解锁阈值, auto-unlock, 迁移)
│   │   ├── variants.ts        # Variant 定义 (tano/rippon/biellmann 等)
│   │   ├── styleTags.ts       # 21 个 Style Tag 定义 + 候选逻辑
│   │   ├── traits.ts          # 13 个特质定义 + match state + 效果计算
│   │   ├── music.ts           # 音乐生成 (mood/structure/energyCurve)
│   │   ├── choreographers.ts  # 10 个 NPC 编舞师 + synergy 表
│   │   ├── costumes.ts        # 模块化服装生成
│   │   ├── blueprint.ts       # Blueprint 生成 (情感节拍 + 过渡 + 元素槽)
│   │   ├── events.ts          # 随机事件库
│   │   └── equipment.ts       # 装备/教练/城市数据
│   │
│   └── __tests__/             # Vitest 单元测试
│       ├── scoring.test.ts
│       ├── training.test.ts
│       ├── program.test.ts
│       ├── technique.test.ts
│       └── ranking.test.ts
│
├── components/                # UI组件
│   ├── Sidebar.tsx            # 侧边栏导航
│   ├── EventTab.tsx           # 事件/赛事页
│   ├── DevelopmentTab.tsx     # 训练开发页
│   ├── ProgramTab.tsx         # 节目管理页
│   ├── ProgramCreator.tsx     # 4步节目创建向导 (音乐→编舞→服装→确认)
│   ├── TechProfile.tsx        # 技术卡牌档案面板
│   ├── SynergyDisplay.tsx     # 0-3★ 协同度组件
│   ├── ClubTab.tsx            # 俱乐部管理页
│   ├── CareerTab.tsx          # 生涯/排名页
│   ├── RankingTab.tsx         # (旧) 排名标签
│   ├── MatchEngine.tsx        # 比赛引擎UI
│   ├── LogPanel.tsx           # 日志面板
│   ├── SponsorshipModal.tsx   # 赞助弹窗
│   └── EventNoticeModal.tsx   # 事件通知弹窗
│
├── data/
│   └── text.ts                # 文案数据
│
└── utils/
    └── math.ts                # 数学工具 (clamp, randNormal)
```

---

## 2. 核心公式

### 2.1 衍生属性计算

**文件**: `src/game/ranking.ts`

选手拥有五维基础属性 (PlayerAttributes)，通过加权计算得出技术分 (TEC) 和艺术分 (ART)：

```
TEC = jump × 0.4 + spin × 0.3 + step × 0.2 + endurance × 0.1
ART = perf × 0.5 + step × 0.3 + endurance × 0.2
```

**装备加成**：
```
totalAttr[attr] = clamp(baseAttr + sum(ownedEquipment[attr]Bonus), 0, 100)
```
仅计算 `owned=true && lifespan>0` 的装备。所有属性上限为 100。

### 2.2 ISU 计分系统

**文件**: `src/game/scoring.ts`

比赛得分采用 proficiency-based 系统：基础分 (BV) + 执行分 (GOE) + 节目内容分 (PCS)。

`calculateActionScore()` 接受 9 个参数：
```typescript
(action, stats, currentSta, isPlayer, technique?, activeVariant?,
 traitFailRateMod?, traitPCSMod?, programV2?)
```

#### 2.2.1 体力消耗

```
costReduction = endurance / 250
realCost = max(1, action.cost × (1 - costReduction))
```

耐力 100 时可减少 40% 体力消耗。

#### 2.2.2 体力系数

```
if (currentSta < 15) fatigueFactor = 0.6      // 严重疲劳
else if (currentSta < 30) fatigueFactor = 0.85 // 轻微疲劳
else fatigueFactor = 1.0                        // 正常
```

#### 2.2.3 Variant 修正

```
bvMultiplier = variant.bvMultiplier      // e.g. tano=1.10, rippon=1.12
variantRiskMod = variant.riskModifier    // e.g. tano=0.05
adjustedRisk = action.risk + variantRiskMod
baseValue = action.baseScore × bvMultiplier
```

#### 2.2.4 失误率计算 (Proficiency-Based)

```
proficiency = technique.jumps[type].proficiency[key]  // 0-100
baseFailChance = clamp(adjustedRisk × 100 × (1 - proficiency / 120), 2, 90)
traitAdjustedFail = clamp(baseFailChance + traitFailRateMod, 2, 90)
failChance = isPlayer ? traitAdjustedFail : baseFailChance × 0.4
```

- AI 失误率仅为玩家的 40%，模拟职业选手稳定性
- 失误率范围：2% - 90%
- Combo 动作：proficiency = avg(firstJumpProf, comboProficiency[suffix])

#### 2.2.5 GOE 计算

```
if (isFail):
  goeGrade = -5
else:
  skillFactor = (proficiency - 50) / 15
  styleTagBonus = min(sum(tag.goeImpact for tag in styleTags), 1.5)
  fatiguePenalty = (1 - fatigueFactor) × -8
  randomness = (random() - 0.5) × 1.5
  goeGrade = clamp(skillFactor + goeBonus + styleTagBonus + fatiguePenalty + randomness, -4, 5)

goeValue = baseValue × (goeGrade × 0.10)
```

- GOE 范围：-5 到 +5
- 每级 GOE 约为 BV 的 10%
- 摔倒时 GOE 强制为 -5
- `goeBonus` 来自技术卡牌的训练积累
- `styleTagBonus` 来自已获得的风格标签，上限 1.5

#### 2.2.6 三分量 PCS

```typescript
calculatePCS(stats, technique?, programV2?, traitPCSMod?)
```

```
skatingSkills = (step × 0.6 + stepProficiency × 0.4) / 100 × 3.0
transitions = blueprint.totalTransitionQuality × 3.0
performance = ((perf / 100) × 0.5 + blueprint.totalChoreoImpression × 0.5) × 3.0

total = (skatingSkills + transitions + performance) / 3

synergyMultiplier = programV2.synergy.multiplier     // 1.0 ~ 1.20
maturityModifier = getMaturityModifier(maturity)      // 0.7 ~ 1.05
final = total × synergyMultiplier × maturityModifier × traitPCSMod
```

#### 2.2.7 最终得分

```
elementScore = baseValue + goeValue
pcsBonus = programV2 ? pcs.final : perf × 0.03 × traitPCSMod
finalScore = max(0, elementScore + pcsBonus)
```

#### 2.2.8 成功率预估 (UI 展示用)

```typescript
estimateSuccessRate(action, technique?, activeVariant?)
// 返回 Math.round(100 - failChance), 范围 10-98
```

### 2.3 滚动积分制

**文件**: `src/game/ranking.ts`

```
rolling = floor(pointsCurrent + pointsLast × 0.7)
```

- 当前赛季积分 100%
- 上赛季积分 70%
- 每年 12 月赛季重置

### 2.4 训练效果计算

**文件**: `src/game/training.ts`

```typescript
calculateWeeklyStats(schedule, startSta, coach, skaterAge, endurance,
                     technique?, trainingFocus?, traits?)
→ TrainingResult { finalSta, bodyGains, techGains, goeBonusGains, artPlanPoints, maturityGain }
```

#### 2.4.1 年龄与效率修正

```
baseAgeMod = age < 18 ? 1.3 : age <= 23 ? 1.0 : 0.6
ageMod = late_bloomer && age > 23 ? 1.0 - (1.0 - baseAgeMod) × 0.6 : baseAgeMod

enduranceCostReduction = endurance / 200
enduranceEfficiencyBonus = endurance / 500

efficiency = 1.0 + enduranceEfficiencyBonus
if (sta <= 0) efficiency = 0
else if (sta < 20) efficiency = 0.3 + enduranceEfficiencyBonus
efficiency = min(efficiency, 1.2)
```

#### 2.4.2 Body 属性增益 (天花板属性)

```
bodyGain = task.bodyGain × coachMod × ageMod × efficiency
```

**教练加成规则**：
- jump/spin/endurance：使用 `coach.tecMod`
- perf：使用 `coach.artMod`
- step：使用 `(tecMod + artMod) / 2`

#### 2.4.3 Tech 卡牌增益 (TrainingFocus)

跳跃训练受 `TrainingFocus { primaryJump, secondaryJump, mode }` 控制：

```
profGain = baseGain × coach.tecMod × ageMod × efficiency × modeMod.prof
goeGain  = 0.02 × efficiency × modeMod.goe
```

**Training Mode 乘数**：

| Mode | prof 乘数 | goe 乘数 |
|------|----------|----------|
| stability | 1.2 | 0.5 |
| balanced | 1.0 | 1.0 |
| refinement | 0.6 | 2.0 |

**跳跃分配**：
- Primary jump: 60% profGain
- Secondary jump: 30% profGain
- 其余 4 种: 各 2.5% profGain
- GOE: primary 70%, secondary 30%
- Combo proficiency: 被动获得 baseProfGain × 0.5

**旋转/步法**: 均匀分配到所有子类型。

#### 2.4.4 Rehearsal (节目合练)

```
maturityGain += 7 + random() × 8   // 每次 rehearsal 7-15 点
```

### 2.5 技术卡牌系统

**文件**: `src/game/data/technique.ts`, `src/game/data/variants.ts`, `src/game/data/styleTags.ts`

#### 2.5.1 SkaterTechnique 结构

```typescript
interface SkaterTechnique {
  jumps: Record<JumpType, JumpCard>;     // 6 种跳跃
  spins: Record<SpinType, SpinCard>;     // 5 种旋转
  steps: StepSkill;                       // 步法
  comboProficiency: Record<string, number>; // '+2T', '+3T', '+2Lo'
}
```

每张跳跃卡牌 (JumpCard) 包含：
- `maxRotation`: 已解锁最高圈数 (1-4)
- `proficiency`: 各圈数熟练度 (0-100)
- `goeBonus`: GOE 质量加成 (-1.0 ~ +1.0)
- `styleTags`: 已获得的风格标签 ID
- `variants`: 已解锁的变体 ID

#### 2.5.2 解锁阈值

**跳跃 (body.jump ≥ threshold)**:

| 类型 | 1R | 2R | 3R | 4R |
|------|----|----|----|----|
| toeloop | 0 | 15 | 45 | 80 |
| salchow | 0 | 15 | 45 | 82 |
| loop | 0 | 20 | 55 | 85 |
| flip | 0 | 25 | 60 | 88 |
| lutz | 0 | 30 | 65 | 92 |
| axel | 0 | 35 | 75 | 98 |

**旋转 (body.spin ≥ threshold)**:

| 类型 | Lv1 | Lv2 | Lv3 | Lv4 |
|------|-----|-----|-----|-----|
| upright | 0 | 20 | 40 | 60 |
| sit | 0 | 25 | 45 | 65 |
| camel | 0 | 25 | 50 | 70 |
| combo | 0 | 30 | 55 | 80 |
| flying | 0 | 40 | 60 | 75 |

**步法**: Lv1=0, Lv2=35, Lv3=60, Lv4=85 (body.step)

#### 2.5.3 Auto-Unlock 规则

- 当前圈数 proficiency ≥ 60 **且** body 属性达到下一圈阈值 → 解锁下一圈 (初始 proficiency=10)
- 旋转/步法：同理，升级后 proficiency 减 20 (最低 15)

#### 2.5.4 Variant 系统

| Variant | 类型 | BV乘数 | 风险 | 解锁条件 |
|---------|------|--------|------|----------|
| tano | jump | ×1.10 | +0.05 | prof ≥ 70 |
| rippon | jump | ×1.12 | +0.08 | prof ≥ 80 |
| biellmann | spin(upright) | ×1.15 | +0.03 | prof ≥ 70, spin ≥ 60 |
| candle_biellmann | spin(upright) | ×1.25 | +0.06 | prof ≥ 85, spin ≥ 80, 需先有 biellmann |
| donut | spin(camel) | ×1.10 | +0.03 | prof ≥ 65, spin ≥ 55 |
| i_spin | spin(upright) | ×1.15 | +0.04 | prof ≥ 75, spin ≥ 70 |
| haircutter | spin(sit) | ×1.10 | +0.03 | prof ≥ 60, spin ≥ 50 |

#### 2.5.5 Style Tag 系统

21 个风格标签 (7 jump + 6 spin + 5 step + 2 general/legendary)。

**获取时机** (在月度推进中检查)：
- proficiency ≥ 75 且当前 0 标签 → 获得第 1 个
- proficiency ≥ 90 且当前 1 标签 → 获得第 2 个

每次提供 3 个候选标签供玩家选择。每个标签有 `goeImpact` (0.1-0.5)，在 GOE 计算中叠加，上限 1.5。

### 2.6 ProgramV2 系统

**文件**: `src/game/program.ts`, `src/game/data/music.ts`, `src/game/data/choreographers.ts`, `src/game/data/costumes.ts`, `src/game/data/blueprint.ts`

#### 2.6.1 节目创建流程

4 步向导 (ProgramCreator.tsx)：

```
1. 选择音乐 (Music)    → mood + structure + complexity + energyCurve
2. 选择编舞师 (NPC)     → type + tier + preferredMoods + quality
3. 选择服装 (Costume)   → theme + moodAffinity + quality
4. 确认 → assembleProgramV2() → ProgramV2
```

#### 2.6.2 Music

```typescript
interface Music {
  mood: 'lyrical' | 'dramatic' | 'energetic' | 'melancholic' | 'ethereal';
  structure: 'gradual' | 'explosive' | 'cyclic' | 'narrative';
  complexity: 1 | 2 | 3;
  energyCurve: number[];  // 7 values, 0.8-1.2
}
```

- 每月 25% 概率发现新曲目
- 曲库最多 20 首 (FIFO 淘汰)

#### 2.6.3 Choreographer NPC

10 位编舞师，分 3 档：

| 档位 | 人数 | transitionQuality | choreoQuality | 费用 |
|------|------|-------------------|---------------|------|
| master | 3 | 0.80-0.95 | 0.85-0.95 | 48,000-55,000 |
| established | 4 | 0.55-0.65 | 0.60-0.70 | 20,000-28,000 |
| rising | 3 | 0.35-0.45 | 0.45-0.55 | 5,000-8,000 |

4 种风格类型: classical / modern / theatrical / minimalist

每位编舞师有 `preferredMoods` 列表，用于 Synergy 匹配。

#### 2.6.4 Costume

模块化服装生成: color × material × embellishment × cut → 成品。

```typescript
interface ProgramCostume {
  theme: 'elegant' | 'fierce' | 'ethereal' | 'classic';
  moodAffinity: MusicMood[];
  quality: 1 | 2 | 3;
}
```

#### 2.6.5 Blueprint

由编舞师 + 音乐结构自动生成，包含：
- **ChoreographicSequence**: 情感节拍 (5 种: calm_opening / rising / climax / introspection / return)，动作词汇按编舞师风格选择
- **BlueprintTransition**: 元素间的过渡描述 + 质量分
- **Element Slot**: 7 个技术元素槽位 + 推荐文案

最终计算：
```
totalTransitionQuality = avg(所有 transition.quality)
totalChoreoImpression = avg(所有 choreo.impressionScore)
```

#### 2.6.6 Synergy (0-3★)

三条独立路径，各贡献 1★：

| 路径 | 条件 |
|------|------|
| 音乐-编舞 | music.mood ∈ choreo.preferredMoods |
| 音乐-服装 | music.mood ∈ costume.moodAffinity |
| 编舞-服装 | costume.theme ∈ CHOREO_COSTUME_SYNERGY[choreo.type] |

**Synergy → 编舞风格对应服装主题**:
```
classical  → ['elegant', 'classic']
modern     → ['fierce', 'ethereal']
theatrical → ['fierce', 'elegant']
minimalist → ['classic', 'ethereal']
```

**Synergy 乘数**:

| Stars | Multiplier |
|-------|-----------|
| 0★ | 1.00× |
| 1★ | 1.05× |
| 2★ | 1.12× |
| 3★ | 1.20× |

#### 2.6.7 Maturity (成熟度)

```
getMaturityModifier(maturity):
  if maturity < 30:  0.7 + (maturity / 30) × 0.2        // 0.7 ~ 0.9
  if maturity < 80:  0.9 + ((maturity - 30) / 50) × 0.1  // 0.9 ~ 1.0
  else:              1.0 + ((maturity - 80) / 20) × 0.05  // 1.0 ~ 1.05
```

- **增长**: rehearsal 训练 +7~15 / 次
- **衰减**: totalRuns > 8 后，每月 maturity -= (totalRuns - 8) × 2
- **比赛使用**: totalRuns 递增

### 2.7 特质系统

**文件**: `src/game/data/traits.ts`

#### 2.7.1 特质库 (13 个, 最多持有 4 个)

**被动特质 (5 个)**:

| ID | 名称 | 效果 |
|----|------|------|
| quick_learner | 速成天才 | 熟练度 < 20 时获得 1.5× 增速 |
| steel_ankles | 钢铁脚踝 | 受伤概率 -50% |
| late_bloomer | 大器晚成 | 23+ 岁属性衰减减少 40% |
| glass_cannon | 玻璃大炮 | 四周跳熟练度上限 +15, 受伤概率 +50% |
| iron_stamina | 铁人体魄 | 节目后半段体力消耗 -20% |

**条件特质 (8 个, 比赛中触发)**:

| ID | 名称 | 触发条件 | 效果 |
|----|------|----------|------|
| momentum_rider | 越战越勇 | 连续 ≥ 2 次成功 | 失误率每次 -5% (上限 -20%) |
| iron_will | 钢铁意志 | 上一动作失误 | 下一动作失误率 -15% |
| clutch_performer | 逆境之星 | 落后 ≥ 5 分 | 失误率 -10% |
| quad_queen | 四周跳女王 | 已成功 ≥ 2 个四周跳 | 后续四周跳失误率 -10% |
| spin_enchanter | 旋转魔术师 | ≥ 2 个 Lv4 旋转 | PCS ×1.05 |
| crowd_igniter | 冰场点燃者 | 前半程零失误 | 后半程 PCS ×1.1 |
| slow_starter | 厚积薄发 | SP 排名下半区 | 自由滑全属性 +5% |
| pressure_cracker | 压力易碎 | 当前排名第一 | 失误率 +5% (负面) |

#### 2.7.2 TraitMatchState

比赛中逐动作维护的状态：
```typescript
interface TraitMatchState {
  consecutiveClean: number;    // 连续成功计数
  lastActionFailed: boolean;   // 上一动作是否失误
  successfulQuads: number;     // 成功四周跳计数
  level4Spins: number;         // Lv4 旋转计数
  firstHalfFails: number;      // 前半程失误次数
  firstHalfComplete: boolean;  // 前半程是否结束
  isTrailing: boolean;         // 是否落后
  trailingMargin: number;      // 落后分差
  isCurrentlyFirst: boolean;   // 是否当前第一
  spRankBottomHalf: boolean;   // SP 排名是否下半区
}
```

#### 2.7.3 特质生成

- 新建角色: 从被动池随机抽取 1 个
- AI: elite 2-3 个, pro 1-2 个, rookie 0-1 个 (仅正面) + 10% 概率获得 pressure_cracker

---

## 3. 模块说明

### 3.1 training.ts - 训练系统

**导出函数**: `calculateWeeklyStats()`

**输入**:
- `schedule: TrainingTaskType[]` — 7 个训练槽位
- `startSta` — 初始体力
- `currentCoach` — 当前教练
- `skaterAge` — 选手年龄
- `currentEndurance` — 耐力属性
- `technique?` — 技术卡牌 (可选, 兼容旧存档)
- `trainingFocus?` — 跳跃焦点 + 训练模式
- `traits?` — 特质列表

**输出** (`TrainingResult`):
```typescript
{
  finalSta: number;
  bodyGains: Record<string, number>;       // 五维属性增益
  techGains: {                              // 技术卡牌熟练度增益
    jumps: Partial<Record<JumpType, number>>;
    spins: Partial<Record<SpinType, number>>;
    steps: number;
    combo: number;
  };
  goeBonusGains: {                          // GOE 质量增益
    jumps: Partial<Record<JumpType, number>>;
    spins: number;
    steps: number;
  };
  artPlanPoints: number;
  maturityGain: number;                     // rehearsal 产生的成熟度
}
```

**7 种训练任务**:

| 任务 | 体力 | 身体增益 | 技术增益 | 说明 |
|------|------|----------|----------|------|
| jump | 20 | jump+0.3 | jump prof | 受 TrainingFocus 分配 |
| spin | 12 | spin+0.9 | spin prof | 均匀分配所有旋转 |
| step | 14 | step+0.9 | step prof | |
| perf | 12 | perf+1.0 | — | 纯艺术属性 |
| endurance | 18 | endurance+0.8 | — | 纯体能 |
| rest | -28 | — | — | 恢复体力 |
| rehearsal | 15 | perf+0.3 | — | 产生 maturityGain 7-15 |

### 3.2 scoring.ts - ISU 计分系统

**导出函数**:

| 函数 | 功能 |
|------|------|
| `calculateActionScore()` | 9 参数计算单个技术动作得分 |
| `calculatePCS()` | 三分量 PCS 计算 |
| `estimateSuccessRate()` | UI 展示用成功率预估 |

**`calculateActionScore` 返回**:
```typescript
{
  score: number;         // 最终得分
  cost: number;          // 体力消耗
  isFail: boolean;       // 是否摔倒
  fatigueFactor: number; // 体力系数
  raw: number;           // 基础分 BV (含 variant multiplier)
  goe: number;           // GOE 等级 (-5 ~ +5)
  pcs?: PCSComponents;   // 仅 programV2 存在时返回
}
```

### 3.3 ranking.ts - 排名与属性系统

**导出函数**:

| 函数 | 功能 |
|------|------|
| `calculateRolling()` | 计算滚动积分 |
| `calcDerivedStats()` | 计算衍生属性 TEC/ART |
| `getTotalAttributes()` | 计算含装备加成的总属性 |

### 3.4 program.ts - 节目系统

**导出函数**:

| 函数 | 功能 |
|------|------|
| `calculateSynergy(music, choreo, costume)` | 计算三路径协同度 (0-3★) |
| `getMaturityModifier(maturity)` | 三段式成熟度修正 (0.7-1.05) |
| `assembleProgramV2(music, choreo, costume, phases?)` | 组装完整 ProgramV2 |
| `createDefaultProgramV2(oldProgram?)` | 创建默认节目 (迁移用) |

### 3.5 match.ts - 比赛模拟引擎

**导出函数**:

| 函数 | 功能 |
|------|------|
| `getBestAction(phase, stats, technique?)` | 根据技术卡牌选择最佳动作 |
| `simulateAIProgram(skater, templateId)` | 模拟 AI 完整节目 |

**AI 比赛模拟**:
```
totalScore = 0
matchState = createTraitMatchState()
for each (phase, index) in template.phases:
  action = getBestAction(phase, stats, technique)
  variant = pickAIVariant(action, technique)
  failMod = getTraitFailRateMod(traits, matchState, action)
  pcsMod = getTraitPCSMod(traits, matchState, index, total)
  result = calculateActionScore(action, stats, sta, false, technique, variant, failMod, pcsMod, programV2)
  totalScore += result.score
  matchState = updateTraitMatchState(matchState, result, action, index, total)

return totalScore × (0.95 + random() × 0.1)
```

### 3.6 ai.ts - AI 生态系统

**导出函数**: `generateInitialAI()`

**AI 分层生成**:

| 层级 | 排名范围 | 基础属性 | 初始积分 | 特质数 |
|------|----------|----------|----------|--------|
| elite | 1-15 | 80 | 3500-5500 | 2-3 |
| pro | 16-50 | 60 | 1500-3500 | 1-2 |
| rookie | 51-150 | 35 | 200-1500 | 0-1 |

每个 AI 自动生成 `technique` (createAITechnique), `traits` (rollAITraits), `programV2` (createDefaultProgramV2)。

### 3.7 data/traits.ts - 特质系统

**导出函数**:

| 函数 | 功能 |
|------|------|
| `hasTrait(traits, id)` | 检查是否拥有特质 |
| `createTraitMatchState()` | 创建比赛中特质追踪状态 |
| `updateTraitMatchState()` | 每个动作后更新状态 |
| `getTraitFailRateMod()` | 计算失误率修正 (负=减少) |
| `getTraitPCSMod()` | 计算 PCS 乘数 (1.0=无变化) |
| `rollInnateTraits()` | 新建角色抽被动特质 |
| `rollAITraits(tier)` | AI 特质生成 |
| `applyQuickLearnerBonus()` | quick_learner 训练增速 |
| `getActiveTraitDescriptions()` | UI 展示用触发描述 |

### 3.8 economy.ts - 经济系统

**导出函数**:

| 函数 | 功能 |
|------|------|
| `generateSponsorshipOptions()` | 生成赞助选项 |
| `generateRenewalOptions()` | 生成续约选项 |
| `generateMarket()` | 生成市场 (教练/装备/编舞/服装) |

---

## 4. 运行逻辑

### 4.1 月度推进流程

**文件**: `src/hooks/useGameState.ts` — `nextMonth()`

```
1. 时间推进
   month += 1 (跨年则 year += 1)

2. 计算训练效果
   calculateWeeklyStats(schedule, sta, coach, age, endurance,
                        technique, trainingFocus, traits)
   → { finalSta, bodyGains, techGains, goeBonusGains, maturityGain }

3. 应用 Body 属性成长
   attributes[key] += clamp(randNormal(gain, 0.1), 0, 3.0)

4. 应用 Tech 卡牌增益
   - 跳跃: proficiency[maxRotKey] += gain (含 quick_learner 加速)
   - 旋转: proficiency += gain
   - 步法: proficiency += gain
   - Combo: +2T/+3T/+2Lo 各按比例增长
   - goeBonus: 按 goeBonusGains 累加 (clamp -1.0 ~ 1.0)
   - glass_cannon: 四周跳 proficiency 上限 115

5. Auto-unlock 检查
   autoUnlockTechnique(technique, bodyAttrs)  // 新圈数/等级
   autoUnlockVariants(technique, bodyAttrs)   // 新变体

6. Style Tag 获取检查
   prof ≥ 75 (第1标签) 或 prof ≥ 90 (第2标签) → 生成候选 → 弹窗选择

7. 更新体力 & 年龄
   sta = finalSta; age += 0.083

8. 更新 ProgramV2 成熟度
   maturity += maturityGain - (totalRuns > 8 ? (totalRuns - 8) × 2 : 0)

9. 音乐发现 (25% 概率)
   playerMusic.push(generateMusic()), 上限 20 首

10. 装备耐久度衰减
    lifespan -= 1, 移除 ≤ 0

11. 赞助收入 + 教练工资扣除

12. 随机事件 (20% 概率)

13. 赛季重置 (12月)
    pointsLast = pointsCurrent; pointsCurrent = 0

14. AI 生态更新
    - 年龄增长 + 属性成长
    - 伤病恢复
    - 参加本月赛事
    - 退役 (33+ 强制, 28+ 5% 概率) / 新人生成

15. 特质获取检查
    age ≥ 18 且当前特质 < 4 → 有概率触发条件特质选择

16. 计算衍生属性 tec/art
17. 记录历史
18. 刷新市场 (每4个月)
19. 重置比赛标记
```

### 4.2 比赛流程

**文件**: `src/components/MatchEngine.tsx`

```
1. 入场仪式
   显示赛事名称、赛制

2. 节目配置
   - 选择策略 (保守/平衡/激进/自定义)
   - 每个 element 可 toggle variant
   - 拖拽排序

3. 生成参赛者
   - 筛选符合条件的 AI
   - simulateAIProgram() (含 trait state tracking + variant picking)

4. 执行动作 (玩家)
   matchState = createTraitMatchState()
   for each element in programConfig:
     - 显示动作卡片 + variant 标记 + 成功率
     - 显示当前触发的 trait 效果
     - 玩家点击执行
     - failMod = getTraitFailRateMod(traits, matchState, action)
     - pcsMod = getTraitPCSMod(traits, matchState, index, total)
     - calculateActionScore(9 params)
     - matchState = updateTraitMatchState(...)
     - 记录得分历史 + 更新累计

5. 结算
   - 排名排序
   - 积分分配 + 奖金 + 名望
   - 荣誉记录
   - 体力消耗
   - programV2.totalRuns += 1
```

---

## 5. 数据结构

### 5.1 Skater / PlayerAttributes

```typescript
interface PlayerAttributes {
  jump: number;       // 跳跃能力 (body ceiling)
  spin: number;       // 旋转能力
  step: number;       // 步法能力
  perf: number;       // 表现力
  endurance: number;  // 耐力
}

interface Skater {
  id: string;
  name: string;
  age: number;
  tec: number;                    // 衍生属性
  art: number;                    // 衍生属性
  sta: number;                    // 当前体力 0-100
  attributes?: PlayerAttributes;  // 仅玩家有 (body ceiling)
  technique?: SkaterTechnique;    // 技术卡牌
  traits?: TraitId[];             // 特质 (最多 4 个)
  pointsCurrent: number;
  pointsLast: number;
  rolling?: number;
  honors: HonorRecord[];
  injuryMonths: number;
  isPlayer: boolean;
  retired: boolean;
  activeProgram: Program;         // 旧版节目 (兼容)
  programV2?: ProgramV2;          // 新版节目系统
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
  schedule: TrainingTaskType[];        // 7 个训练槽位
  trainingFocus: TrainingFocus;        // { primaryJump, secondaryJump, mode }
  aiSkaters: Skater[];
  inventory: Equipment[];
  activeCoachId: string | null;
  history: HistoryRecord[];
  activeEvent: { event: RandomEvent; narrative: string } | null;
  activeSponsor: Sponsorship | null;
  market: {
    coaches: Coach[];
    equipment: Equipment[];
    choreographers: ChoreographerNPC[];
    costumes?: ProgramCostume[];
  };
  playerMusic?: Music[];               // 曲库 (最多20首)
  lastGrowth?: { tec: number; art: number };
  pendingStyleTags?: PendingStyleTagSelection[];   // 待选风格标签
  pendingTraitSelection?: PendingTraitSelection;   // 待选特质
}
```

### 5.3 ProgramV2

```typescript
interface ProgramV2 {
  name: string;
  music: Music;
  choreographerId: string;
  costume: ProgramCostume;
  blueprint: ProgramBlueprint;
  synergy: SynergyResult;        // { stars: 0-3, multiplier, details }
  maturity: number;              // 0-100
  totalRuns: number;             // 比赛使用次数
}
```

### 5.4 动作库

**文件**: `src/game/data/actions.ts`

50+ ISU 官方动作，每个动作携带 `techReq` 字段与技术卡牌关联：

```typescript
interface MatchAction {
  id: string;
  type: MatchPhaseType;
  baseScore: number;
  cost: number;
  risk: number;          // 0-1
  techReq?: {
    jumpType?: JumpType;
    rotation?: number;
    spinType?: SpinType;
    spinLevel?: number;
    stepLevel?: number;
    comboSuffix?: string;   // '+2T' | '+3T' | '+2Lo'
  };
}
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

| 层级 | 人数 | 初始积分 | 特质数 |
|------|------|----------|--------|
| elite | 15 | 3500-5500 | 2-3 |
| pro | 35 | 1500-3500 | 1-2 |
| rookie | 100 | 200-1500 | 0-1 |

---

## 附录

### 测试覆盖

```
src/game/__tests__/
├── scoring.test.ts     # calculateActionScore, calculatePCS, estimateSuccessRate
├── training.test.ts    # calculateWeeklyStats (双轨增益, mode, age, traits)
├── program.test.ts     # calculateSynergy, getMaturityModifier, assembleProgramV2
├── technique.test.ts   # autoUnlockTechnique, autoUnlockVariants, createInitialTechnique
└── ranking.test.ts     # calculateRolling, calcDerivedStats, getTotalAttributes
```

运行: `npm test` (vitest run) / `npm run test:watch` (vitest)

### 代码版本

- **游戏版本**: FSM 3.0.0
- **文档版本**: v2.0.0
- **ISU 规则版本**: 2024-25 赛季
- **最后更新**: 2026年3月10日
