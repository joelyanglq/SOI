# 花样滑冰经理 - 游戏设计文档

## 📖 目录

1. [游戏概述](#游戏概述)
2. [核心玩法系统](#核心玩法系统)
3. [数据结构设计](#数据结构设计)
4. [游戏机制详解](#游戏机制详解)
5. [ISU规则实现](#isu规则实现)
6. [平衡性设计](#平衡性设计)

---

## 游戏概述

### 游戏类型
**花样滑冰经理**是一款结合养成、策略和模拟经营的单机游戏，玩家扮演花样滑冰选手的经纪人/教练，通过训练、比赛和资源管理，将选手从新手培养成世界冠军。

### 核心循环
```
月度训练 → 制定计划 → 消耗体力 → 提升属性
    ↓
参加比赛 → 配置节目 → 执行动作 → 获得积分/奖金
    ↓
购买装备 → 聘请教练 → 签约赞助 → 提升能力
    ↓
世界排名 → 解锁赛事 → 冲击冠军 → 创造记录
```

### 游戏目标
- **短期目标**：提升选手五维属性，解锁更高难度的技术动作
- **中期目标**：获得赛事积分，提升世界排名，解锁顶级赛事
- **长期目标**：赢得世锦赛/奥运会冠军，打破历史记录

---

## 核心玩法系统

### 1. 选手养成系统

#### 1.1 五维属性系统

**属性定义**
```typescript
interface PlayerAttributes {
  jump: number;       // 跳跃能力 (0-100)
  spin: number;       // 旋转能力 (0-100)
  step: number;       // 步法能力 (0-100)
  perf: number;       // 表现力 (0-100)
  endurance: number;  // 耐力 (0-100)
}
```

**属性作用**
- **jump**: 影响跳跃动作的解锁和成功率（如4T需要jump≥80）
- **spin**: 影响旋转动作的等级和稳定性
- **step**: 影响接续步的质量和GOE加分
- **perf**: 影响艺术编排得分和PCS加成
- **endurance**: 减少体力消耗（训练50%/比赛40%），提升训练效率（最多+20%），影响衍生属性计算

**衍生属性**（加权计算）
```typescript
// 技术能力（跳跃占40%，旋转30%，步法20%，耐力10%）
tec: number = (jump × 0.4) + (spin × 0.3) + (step × 0.2) + (endurance × 0.1)

// 艺术感悟（表现力占50%，步法30%，耐力20%）
art: number = (perf × 0.5) + (step × 0.3) + (endurance × 0.2)
```

**成长机制**
- 基础成长：每周根据训练计划增长 0.1-2.0 点
- 年龄影响：
  - 18岁以下：成长速度 × 1.3（黄金成长期）
  - 18-23岁：成长速度 × 1.0（正常期）
  - 23岁以上：成长速度 × 0.6（衰退期）
- 教练加成：不同教练提供 1.0-1.8 倍加成
- 装备加成：装备提供固定属性加成（如冰鞋 +5 jump）

#### 1.2 体力系统

**数据结构**
```typescript
skater: {
  sta: number;  // 当前体力 (0-100)
}
```

**体力消耗**
- **训练消耗**：每项训练任务消耗 5-30 点
  - 四周跳训练：-22
  - 柔韧旋转：-12
  - 步法滑行：-14
  - 表现力：-12
  - 核心耐力：-18
  - 深度理疗：+28（恢复）

- **比赛消耗**：参赛消耗 5-20 点（基于耐力减免）
  ```typescript
  // 训练系统（50%减免）
  trainingStaCost = baseStaCost × (1 - endurance / 200)
  // 耐力100时可减少50%消耗
  
  // 比赛系统（40%减免）
  matchStaCost = baseStaCost × (1 - endurance / 250)
  // 耐力100时可减少40%消耗
  ```

**体力影响**
- 体力 < 20：训练效率仅30%，比赛表现严重下降
- 体力 < 30：训练效率85%，比赛疲劳惩罚
- 体力 ≥ 30：正常训练和比赛

#### 1.3 训练计划系统

**每周7格训练槽**
```typescript
schedule: TrainingTaskType[];  // 长度为7的数组
// 示例: ['jump', 'spin', 'rest', 'perf', 'endurance', 'step', 'rest']
```

**训练任务表**
```typescript
{
  jump: { 
    targetAttr: 'jump', 
    baseGain: 1.2,      // 基础成长值
    staCost: 22,        // 体力消耗
    desc: "突破极限"
  },
  spin: { targetAttr: 'spin', baseGain: 0.9, staCost: 12 },
  step: { targetAttr: 'step', baseGain: 0.9, staCost: 14 },
  perf: { targetAttr: 'perf', baseGain: 1.0, staCost: 12 },
  endurance: { targetAttr: 'endurance', baseGain: 0.8, staCost: 18 },
  rest: { baseGain: 0, staCost: -28 }  // 恢复体力
}
```

**训练效果计算**
```typescript
最终增长 = baseGain × 教练系数 × 年龄系数 × 效率系数
```

其中：
- 教练系数：1.0-1.8（基础教练到传奇教练）
- 年龄系数：0.6-1.3（见上文）
- 效率系数：
  - 体力≥30：1.0-1.2（含耐力加成）
  - 体力<30：0.85
  - 体力≤0：0.3

---

### 2. 比赛系统（基于ISU规则）

#### 2.1 比赛赛制

**三种赛制模板**
```typescript
MATCH_STRUCTURES = {
  low: {
    name: '地区赛制（简化）',
    phases: ['jump_solo', 'jump_combo', 'jump_axel', 'spin1', 'spin2', 'step']
    // 6个要素
  },
  mid: {
    name: '标准赛制 (ISU)',
    phases: ['jump_solo', 'jump_combo', 'jump_axel', 'spin1', 'spin2', 'spin3', 'step']
    // 7个要素（完整ISU规则）
  },
  high: {
    name: '锦标赛制 (ISU)',
    phases: ['jump_solo', 'jump_combo', 'jump_axel', 'spin1', 'spin2', 'spin3', 'step']
    // 7个要素（完整ISU规则）
  }
}
```

**赛事类别**
| 赛事名称 | 基础分 | 积分 | 排名要求 | 人数 | 奖金 | 赛制 |
|---------|-------|------|---------|------|------|------|
| 挑战赛 | 35 | 300 | 0 | 12 | ¥2,000 | low |
| 大奖赛站赛 | 70 | 400 | 1,000-1,200 | 12 | ¥10,000 | mid |
| 大奖赛总决赛 | 70 | 800 | 2,000 | 12 | ¥10,000 | high |
| 全国锦标赛 | 90 | 840 | 600 | 24 | ¥30,000 | mid |
| 世界锦标赛 | 120 | 1,200 | 1,500 | 24 | ¥50,000 | high |
| 冬季奥运会 | 140 | 1,200 | 2,500 | 30 | ¥150,000 | high |

**积分系统说明（ISU标准1:1比例）**
- 积分数值完全对应ISU官方标准
- World Championships/Olympics: 1,200分（冠军）
- Four Continents/Europeans: 840分
- Grand Prix Final: 800分
- Grand Prix站赛: 400分
- Challenger Series: 300分
- Rolling积分 = 当前赛季100% + 上赛季70%
- 世界第一约5,000-5,500分（需3个赛季积累）
- 世界前10约3,000-4,500分
- 世界前50约1,500-3,000分

#### 2.2 技术动作库（ISU官方分值）

**跳跃动作（25个）**

*单跳系列*
```typescript
{ id: 'j_2t', name: '2T', baseScore: 1.3, risk: 0.03, reqStats: { jump: 15 } }
{ id: 'j_3lz', name: '3Lz', baseScore: 5.9, risk: 0.25, reqStats: { jump: 65 } }
{ id: 'j_4t', name: '4T', baseScore: 9.5, risk: 0.45, reqStats: { jump: 80 } }
{ id: 'j_4lz', name: '4Lz', baseScore: 11.5, risk: 0.60, reqStats: { jump: 92 } }
```

*阿克塞尔系列*（独立槽位，因为前刃起跳）
```typescript
{ id: 'a_1a', name: '1A', baseScore: 1.1, risk: 0.02, reqStats: {} }
{ id: 'a_2a', name: '2A', baseScore: 3.3, risk: 0.10, reqStats: { jump: 35 } }
{ id: 'a_3a', name: '3A', baseScore: 8.0, risk: 0.40, reqStats: { jump: 75 } }
{ id: 'a_4a', name: '4A', baseScore: 12.5, risk: 0.70, reqStats: { jump: 98 } }
```

*连跳组合*
```typescript
{ id: 'c_3lz3t', name: '3Lz+3T', baseScore: 10.1, cost: 22, risk: 0.35 }
{ id: 'c_4lz3t', name: '4Lz+3T', baseScore: 15.7, cost: 40, risk: 0.70 }
```

**旋转动作（18个）**
```typescript
// 旋转槽位1：直立旋转
{ id: 's1_upright', name: 'USp', baseScore: 1.0, reqStats: {} }
{ id: 's1_upright4', name: 'USp4', baseScore: 2.4, reqStats: { spin: 60 } }

// 旋转槽位2：蹲踞旋转
{ id: 's2_sit', name: 'SSp', baseScore: 1.1, reqStats: {} }
{ id: 's2_sit4', name: 'SSp4', baseScore: 2.5, reqStats: { spin: 65 } }

// 旋转槽位3：燕式/联合/跳接旋转
{ id: 's3_camel4', name: 'CSp4', baseScore: 2.6, reqStats: { spin: 70 } }
{ id: 's3_combo4', name: 'CoSp4', baseScore: 3.5, reqStats: { spin: 80 } }
{ id: 's3_fly', name: 'FCSp4', baseScore: 3.2, reqStats: { spin: 75, jump: 40 } }
```

**接续步（4个）**
```typescript
{ id: 'st_base', name: 'StSq1', baseScore: 1.8, reqStats: {} }
{ id: 'st_mid', name: 'StSq2', baseScore: 2.6, reqStats: { step: 35 } }
{ id: 'st_high', name: 'StSq3', baseScore: 3.3, reqStats: { step: 60 } }
{ id: 'st_pro', name: 'StSq4', baseScore: 3.9, reqStats: { step: 85 } }
```

#### 2.3 ISU计分系统

**计分公式**
```typescript
// 元素得分 = 基础分 (BV) + GOE值
// GOE值 = BV × 10% × GOE等级

GOE等级范围：-5（摔倒）到 +5（完美）

// 最终得分 = 元素得分 + PCS加成
finalScore = (baseValue + goeValue) + (perf × 0.03)
```

**GOE等级计算**
```typescript
if (摔倒) {
  goeGrade = -5;
} else {
  skillFactor = (平均属性 - 40) / 12;      // -3.33 to +5
  fatiguePenalty = (1 - 疲劳系数) × -8;     // 最多 -1.6
  randomness = (random - 0.5) × 1.5;       // ±0.75
  
  goeGrade = clamp(skillFactor + fatiguePenalty + randomness, -4, 5);
}

goeValue = baseValue × (goeGrade × 0.10);
```

**失误率计算**
```typescript
baseFailChance = (动作风险 × 100) - (平均属性 × 0.6);
failChance = clamp(baseFailChance, 2, 90);

// AI选手失误率降低60%
if (!isPlayer) failChance × 0.4;
```

**疲劳惩罚**
```typescript
if (体力 < 15) fatigueFactor = 0.6;      // 严重疲劳
else if (体力 < 30) fatigueFactor = 0.85; // 轻微疲劳
else fatigueFactor = 1.0;                 // 正常
```

#### 2.4 节目配置系统

**数据结构**
```typescript
interface ProgramElement {
  phase: MatchPhaseType;  // 技术要素类型
  actionId: string;        // 选择的具体动作
}

interface ProgramConfig {
  elements: ProgramElement[];  // 有序数组，可拖拽调整
}

// 示例配置
{
  elements: [
    { phase: 'jump_solo', actionId: 'j_3lz' },      // #1 单跳: 3Lz
    { phase: 'jump_combo', actionId: 'c_3lz3t' },   // #2 连跳: 3Lz+3T
    { phase: 'jump_axel', actionId: 'a_2a' },       // #3 阿克塞尔: 2A
    { phase: 'spin1', actionId: 's1_upright3' },    // #4 旋转1: USp3
    { phase: 'spin2', actionId: 's2_sit4' },        // #5 旋转2: SSp4
    { phase: 'spin3', actionId: 's3_combo4' },      // #6 旋转3: CoSp4
    { phase: 'step', actionId: 'st_high' }          // #7 步法: StSq3
  ]
}
```

**三种配置策略**
```typescript
// 1. 保守策略
{
  maxRisk: 0.25,           // 失误率≤25%
  选择逻辑: "在可用动作中选择最高BV且风险≤25%的"
}

// 2. 默认策略（平衡）
{
  maxRisk: 0.40,           // 失误率≤40%
  选择逻辑: "最大化 BV / (1 + risk × 2) 比率"
}

// 3. 激进策略
{
  maxRisk: 0.70,           // 不限制风险
  选择逻辑: "选择最高BV动作"
}
```

**自定义配置**
- 点击"调整"按钮修改单个要素的动作
- 拖拽卡片调整执行顺序（不受类别限制）
- 修改后自动标记为"自定义"策略

**拖拽实现**
```typescript
// 拖拽处理
handleDragOver(draggedIndex, targetIndex) {
  const newElements = [...elements];
  const draggedElement = newElements.splice(draggedIndex, 1)[0];
  newElements.splice(targetIndex, 0, draggedElement);
  setProgramConfig({ elements: newElements });
}
```

---

### 3. 经济系统

#### 3.1 资金来源

**比赛奖金**
```typescript
event.prize: number;  // 地区赛 ¥2,000 → 奥运会 ¥150,000
```

**赞助收入**
```typescript
interface Sponsorship {
  monthlyPay: number;      // 月薪 (¥5,000-¥50,000)
  signingBonus: number;    // 签约奖金
  duration: number;        // 合约月数
  minFame: number;         // 名望要求
}

// 示例赞助
{
  name: "区域品牌",
  monthlyPay: 5000,
  signingBonus: 10000,
  duration: 6,
  minFame: 50
}
```

**随机事件**
```typescript
{ 
  id: 'ev_viral_video', 
  name: '短视频爆火',
  effect: { money: 8000, fame: 150 }
}
```

#### 3.2 资金支出

**教练工资（月结）**
```typescript
{
  基础教练: ¥1,000/月,  加成 1.0×
  专业教练: ¥3,500/月,  加成 1.15-1.25×
  国家级教练: ¥8,000/月,  加成 1.4×
  传奇教练: ¥20,000/月, 加成 1.7-1.8×
}
```

**装备购买（一次性）**
```typescript
interface Equipment {
  price: number;           // 价格 ¥3,000-¥50,000
  jumpBonus: number;       // 跳跃加成 +0-8
  spinBonus: number;       // 旋转加成 +0-8
  stepBonus: number;       // 步法加成 +0-8
  perfBonus: number;       // 表现力加成 +0-8
  enduranceBonus: number;  // 耐力加成 +0-5
  lifespan: number;        // 耐久度（月数）
}

// 示例装备
{
  name: "专业冰鞋",
  type: "skate",
  price: 12000,
  jumpBonus: 5,
  stepBonus: 3,
  enduranceBonus: 2,
  lifespan: 12
}
```

**编排设计**
```typescript
{
  name: "高定编排",
  cost: 15000,
  baseArt: 55  // 提升节目艺术基础分
}
```

---

### 4. AI生态系统

#### 4.1 AI选手生成

**初始化（150名AI）**
```typescript
// 分层生成（按照ISU真实世界排名分布）
elite (前15名): {
  baseStat: 80,
  initialPoints: 3500-5500 (世界顶尖水平，按排名递减)
  // 第1名约5500分，第15名约3500分
}

pro (16-50名): {
  baseStat: 60,
  initialPoints: 1500-3500 (职业选手水平)
  // 第16名约3500分，第50名约1500分
}

rookie (51-150名): {
  baseStat: 35,
  initialPoints: 200-1500 (新手/发展中选手)
  // 第51名约1500分，第150名约200分
}
```

**成长机制**
```typescript
// 每月成长
ai.tec += (age < 23) ? 0.15 : 0.05;
ai.art += (age < 23) ? 0.15 : 0.05;
```

**退役机制**
```typescript
// 退役条件
if (age > 33) retire = true;
if (age > 28 && random() < 0.05) retire = true;

// 新人补充
if (retire) {
  生成新AI {
    age: 14 + random() × 2,
    baseStat: 35 + random() × 20,
    pointsLast: 0
  }
}
```

#### 4.2 AI比赛模拟

**参赛筛选**
```typescript
// 低级赛事（地区赛）
if (event.req === 0) {
  排除Top 50选手;  // 避免顶级选手碾压
  从51-150名中选取参赛者;
}

// 标准赛事
else {
  筛选 rolling ≥ event.req × 0.8 的选手;
  按ranking排序，取前 event.max 名;
}
```

**AI程序配置**
```typescript
simulateAIProgram(skater, template) {
  let totalScore = 0;
  let currentSta = 100;
  
  template.phases.forEach(phase => {
    // 选择最优动作
    const action = getBestActionForStats(phase, skater.attributes);
    
    // 计算得分（使用统一引擎）
    const result = calculateActionScore(action, stats, currentSta, false);
    totalScore += result.score;
    currentSta -= result.cost;
  });
  
  // 裁判偏差 ±5%
  return totalScore × (0.95 + random() × 0.1);
}
```

**积分分配**
```typescript
// 按成绩排名分配积分
matchResults.sort((a,b) => b.matchScore - a.matchScore);

matchResults.forEach((res, rankIdx) => {
  const rank = rankIdx + 1;
  const pts = Math.floor(event.pts / (rank × 0.4 + 0.6));
  res.ai.pointsCurrent += pts;
});
```

#### 4.3 世界排名系统

**Rolling积分**（ISU标准：最近两个赛季加权）
```typescript
// 当前赛季100% + 上赛季70%（ISU官方规则）
skater.rolling = skater.pointsCurrent + (skater.pointsLast × 0.7);

// 每年12月赛季重置
if (month === 12) {
  skater.pointsLast = skater.pointsCurrent;
  skater.pointsCurrent = 0;
}
```

**排名影响**（基于ISU真实门槛）
- 挑战赛：无门槛（rolling ≥ 0）
- 全国锦标赛：rolling ≥ 600
- 大奖赛站赛：rolling ≥ 1,000-1,200
- 大奖赛总决赛：rolling ≥ 2,000
- 世界锦标赛：rolling ≥ 1,500（约世界前30名）
- 冬季奥运会：rolling ≥ 2,500（约世界前15-20名）

**真实世界排名参考**
- 世界第1名：5,000-5,500分（需2-3个赛季积累）
- 世界前3名：4,500-5,500分
- 世界前10名：3,000-4,500分
- 世界前30名：1,500-3,000分
- 世界前50名：800-1,500分

**积分获取示例**
- 奥运会冠军：1,200分（一次）
- 世锦赛冠军：1,200分
- 大奖赛总决赛冠军：800分
- 大奖赛站赛冠军：400分
- 全国赛冠军：840分

**达到世界第一路径示例**
- 第1年：世锦赛冠军(1200) + GPF冠军(800) + GP冠军×2(800) = 2,800分
- 第2年：奥运冠军(1200) + 全国赛冠军(840) + GP冠军×2(800) = 2,840分
- 第2年rolling = 2,840 + (2,800×0.7) = 4,800分（世界前5）
- 第3年持续表现可达到5,000+分（世界第一）

---

### 5. 随机事件系统

#### 5.1 事件触发

**每月触发概率**
```typescript
RANDOM_EVENTS.forEach(event => {
  if (random() < event.chance) {
    触发事件;
  }
});
```

#### 5.2 事件效果

**正面事件**
```typescript
{ 
  name: '传奇大师课',
  chance: 0.04,        // 4%触发率
  isRare: true,
  effect: { 
    jump: +3, 
    spin: +3, 
    step: +3, 
    perf: +3 
  }
}

{ 
  name: '奢侈品代言',
  chance: 0.05,
  effect: { 
    money: +60000, 
    fame: +80 
  }
}
```

**负面事件**
```typescript
{ 
  name: '严重扭伤',
  chance: 0.03,
  effect: { 
    jump: -5, 
    step: -5, 
    injuryMonths: 4  // 禁赛4个月
  }
}

{ 
  name: '赛前焦虑',
  chance: 0.4,
  effect: { 
    sta: -20, 
    endurance: -2 
  }
}
```

---

## 数据结构设计

### 完整游戏状态

```typescript
interface GameState {
  // 时间系统
  year: number;          // 当前年份
  month: number;         // 当前月份 (1-12)
  
  // 玩家选手
  skater: Skater;
  
  // 经济数据
  money: number;         // 当前资金
  fame: number;          // 名望值
  
  // 训练系统
  schedule: TrainingTaskType[];  // 本周训练计划（7格）
  
  // 比赛系统
  hasCompeted: boolean;  // 本月是否已比赛
  
  // AI生态
  aiSkaters: Skater[];   // 150名AI选手
  
  // 资产系统
  inventory: Equipment[];         // 已购买装备
  activeCoachId: string | null;   // 当前教练ID
  activeSponsor: Sponsorship | null;  // 当前赞助商
  
  // 市场系统
  market: {
    coaches: Coach[];              // 可聘请教练（3名）
    equipment: Equipment[];         // 可购买装备（3件）
    choreographers: {...}[];        // 可购买编排（3个）
  };
  
  // 历史记录
  history: {
    month: string;
    tec: number;
    art: number;
    rank: number;
    fame: number;
    points: number;
  }[];
  
  // 活跃事件
  activeEvent: {
    event: RandomEvent;
    narrative: string;
  } | null;
  
  // UI状态
  lastGrowth?: { tec: number; art: number };  // 上周成长量
}
```

### 选手完整数据

```typescript
interface Skater {
  // 基础信息
  id: string;
  name: string;
  age: number;          // 精确到小数（每月 +0.083）
  isPlayer: boolean;
  retired: boolean;
  
  // 属性系统
  attributes: PlayerAttributes;  // 五维基础属性
  tec: number;          // 技术能力（衍生）
  art: number;          // 艺术感悟（衍生）
  sta: number;          // 当前体力 (0-100)
  
  // 状态系统
  injuryMonths: number; // 剩余伤病月数
  pQual: number;        // 品质系数（保留字段）
  pAge: number;         // 年龄惩罚（保留字段）
  
  // 积分系统
  pointsCurrent: number;  // 本赛季积分
  pointsLast: number;     // 上赛季积分
  rolling: number;        // 两赛季总积分（世界排名依据）
  
  // 荣誉系统
  titles: string[];       // 冠军头衔列表
  honors: HonorRecord[];  // 详细荣誉记录
  
  // 节目系统
  activeProgram: {
    name: string;         // 节目名称
    baseArt: number;      // 艺术基础分 (30-70)
    freshness: number;    // 新鲜度 (0-100，影响表现)
  };
}
```

### 荣誉记录

```typescript
interface HonorRecord {
  year: number;
  month: number;
  eventName: string;     // "世界锦标赛"
  rank: number;          // 名次 (1-30)
  points: number;        // 获得积分
}

// 记录条件：重大赛事前三名或常规赛冠军
```

---

## 游戏机制详解

### 月度推进机制

```typescript
nextMonth() {
  // 1. 时间推进
  month += 1;
  if (month > 12) { month = 1; year += 1; }
  
  // 2. 计算训练效果
  const { finalSta, gains, artPlanPoints } = calculateWeeklyStats(
    schedule, skater.sta, coach, skater.age, skater.endurance
  );
  
  // 3. 应用属性成长
  skater.attributes.jump += gains.jump;
  skater.attributes.spin += gains.spin;
  // ... 其他属性
  
  // 4. 更新体力
  skater.sta = finalSta;
  
  // 5. 年龄增长
  skater.age += 0.083;  // 约一个月
  
  // 6. 装备耐久度衰减
  inventory.forEach(item => {
    item.lifespan -= 1;
    if (item.lifespan <= 0) 移除装备;
  });
  
  // 7. 赞助合约更新
  if (activeSponsor) {
    activeSponsor.remainingMonths -= 1;
    money += activeSponsor.monthlyPay;
    if (remainingMonths <= 0) activeSponsor = null;
  }
  
  // 8. 教练工资
  money -= coach.salary;
  
  // 9. 随机事件判定
  if (random() < EVENT_CHANCE) {
    触发随机事件;
    应用事件效果;
  }
  
  // 10. AI生态更新
  aiSkaters.forEach(ai => {
    // 年龄成长
    ai.age += 0.083;
    
    // 属性成长
    ai.tec += (ai.age < 23) ? 0.15 : 0.05;
    ai.art += (ai.age < 23) ? 0.15 : 0.05;
    
    // 伤病恢复
    if (ai.injuryMonths > 0) ai.injuryMonths -= 1;
    
    // 参加本月赛事
    if (符合赛事要求) {
      const score = simulateAIProgram(ai, event.template);
      比赛排名并分配积分;
    }
    
    // 退役判定
    if (shouldRetire) {
      替换为新AI;
    }
  });
  
  // 11. 赛季重置
  if (month === 12) {
    skater.pointsLast = skater.pointsCurrent;
    skater.pointsCurrent = 0;
    aiSkaters.forEach(ai => {
      ai.pointsLast = ai.pointsCurrent;
      ai.pointsCurrent = 0;
      ai.rolling = calculateRolling(ai);
    });
  }
  
  // 12. 刷新市场
  market = generateMarket(activeCoachId, currentMarket);
  
  // 13. 重新计算衍生属性
  const totalAttrs = getTotalAttributes(skater.attributes, inventory);
  const derived = calcDerivedStats(totalAttrs);
  skater.tec = derived.tec;
  skater.art = derived.art;
  skater.rolling = calculateRolling(skater);
  
  // 14. 记录历史
  history.push({
    month: `${year}.${month}`,
    tec: skater.tec,
    art: skater.art,
    rank: skater.rolling,
    fame: fame,
    points: skater.pointsCurrent
  });
  
  // 15. 重置比赛标记
  hasCompeted = false;
}
```

### 比赛流程机制

```typescript
// 阶段1: 入冰仪式
stage = 'intro';
显示赛事名称、赛制描述;

// 阶段2: 节目配置
stage = 'config';

// 2.1 选择策略
if (点击"保守策略") {
  programConfig = generateProgramConfig(stats, phases, 'conservative');
  configStrategy = 'conservative';
}

// 2.2 自定义调整
if (点击"调整"按钮) {
  显示该要素的所有可用动作;
  筛选条件：满足属性要求;
  点击动作后更新配置;
  configStrategy = 'custom';
}

// 2.3 拖拽排序
if (拖动卡片) {
  实时更新elements数组顺序;
  configStrategy = 'custom';
}

// 2.4 确认配置
总BV = sum(elements.map(e => getAction(e).baseScore));
平均风险 = avg(elements.map(e => getAction(e).risk));

// 阶段3: 生成参赛者
participants = [
  ...筛选后的AI选手（已模拟得分）,
  玩家选手（得分初始为0）
];

// 阶段4: 执行比赛
stage = 'active';
phaseIndex = 0;
playerMatchSta = skater.sta;
playerAccumulatedScore = 0;

for (element of programConfig.elements) {
  // 显示当前要素信息
  显示动作卡片(element);
  
  // 等待玩家点击"执行动作"
  await 玩家点击;
  
  // 计算得分
  const action = getActionFromElement(element);
  const result = calculateActionScore(
    action, 
    skater.attributes, 
    playerMatchSta, 
    true  // isPlayer
  );
  
  // 更新状态
  playerAccumulatedScore += result.score;
  playerMatchSta -= result.cost;
  
  // 记录历史
  history.push({
    name: action.name,
    score: result.score,
    desc: result.isFail ? "摔倒 (GOE -5)" : `GOE ${result.goe.toFixed(1)}`,
    phaseName: PHASE_META[element.phase].name
  });
  
  // 更新进度
  phaseIndex += 1;
}

// 阶段5: 结算
stage = 'results';

// 5.1 排名
participants.find(p => p.isPlayer).score = playerAccumulatedScore;
sortedParticipants = participants.sort((a,b) => b.score - a.score);
playerRank = sortedParticipants.findIndex(p => p.isPlayer) + 1;

// 5.2 积分奖励
const pts = Math.floor(event.pts / (playerRank * 0.4 + 0.6));
skater.pointsCurrent += pts;

// 5.3 奖金
money += event.prize;

// 5.4 名望增长
fame += Math.floor(event.pts / 100) + (playerRank === 1 ? 20 : 0);

// 5.5 荣誉记录
if (playerRank <= 3 || (event重大 && playerRank === 1)) {
  skater.honors.push({
    year, month, 
    eventName: event.name, 
    rank: playerRank, 
    points: pts
  });
}

// 5.6 冠军头衔
if (playerRank === 1) {
  skater.titles.push(event.name);
}

// 5.7 体力消耗
skater.sta -= finalStaCost;

// 5.8 节目新鲜度衰减
skater.activeProgram.freshness -= 18;
```

---

## ISU规则实现

### 自由滑7要素规则

**ISU规定**
> 成年组自由滑必须包含：
> - 不超过7个跳跃要素（其中最多3个可以是联合跳跃或连续跳跃）
> - 3个不同姿态的旋转
> - 1个步法序列或编排步法序列

**游戏实现**
```typescript
phases: [
  'jump_solo',    // 跳跃要素1（单跳）
  'jump_combo',   // 跳跃要素2（连跳/序列跳）
  'jump_axel',    // 跳跃要素3（阿克塞尔单独槽位）
  'spin1',        // 旋转要素1
  'spin2',        // 旋转要素2
  'spin3',        // 旋转要素3
  'step'          // 步法序列
]
```

### 基础分值（Base Value）

**数据来源**：ISU Scale of Values 2024-25

**跳跃示例**
| 动作 | ISU BV | 游戏BV | 偏差 |
|------|--------|--------|------|
| 2A | 3.30 | 3.3 | 0% |
| 3T | 4.20 | 4.2 | 0% |
| 3Lz | 5.90 | 5.9 | 0% |
| 4T | 9.50 | 9.5 | 0% |
| 3A | 8.00 | 8.0 | 0% |
| 3Lz+3T | 10.10 | 10.1 | 0% |

**旋转示例**
| 动作 | ISU BV | 游戏BV |
|------|--------|--------|
| USp1 | 1.00 | 1.0 |
| USp4 | 2.40 | 2.4 |
| SSp4 | 2.50 | 2.5 |
| CoSp4 | 3.50 | 3.5 |
| FCSp4 | 3.20 | 3.2 |

**步法示例**
| 动作 | ISU BV | 游戏BV |
|------|--------|--------|
| StSq1 | 1.80 | 1.8 |
| StSq2 | 2.60 | 2.6 |
| StSq3 | 3.30 | 3.3 |
| StSq4 | 3.90 | 3.9 |

### GOE评分系统

**ISU规则**
- GOE范围：-5 到 +5
- 每级GOE约为BV的10%
- 摔倒：-5 GOE（自动）

**游戏实现**
```typescript
GOE计算因素：
1. 技术质量（40%）= (平均属性 - 40) / 12
2. 疲劳状态（30%）= (1 - 疲劳系数) × -8
3. 随机波动（30%）= ±0.75

最终GOE = clamp(技术质量 + 疲劳 + 随机, -4, +5)
```

### PCS（Program Component Score）

**简化实现**
```typescript
// ISU中PCS是独立的5项评分（SS/TR/PE/CO/IN）
// 游戏中简化为表现力属性的加成

pcsBonus = (skater.perf × 0.03);  // 约 0.9-3.0 分/要素
totalPCS = pcsBonus × 7要素;       // 约 6-21 分总加成
```

---

## 平衡性设计

### 分数区间设计

**新手阶段**（属性 30-40）
```
配置：低难度（2A, 2T+2T, USp1, StSq1）
总BV：约 15-20
预期得分：18-28 分
对应排名：地区赛 8-12名
```

**职业阶段**（属性 50-65）
```
配置：中等难度（3T, 3Lz, 3T+3T, 2A, CoSp3, StSq3）
总BV：约 35-45
预期得分：40-60 分
对应排名：大奖赛 4-8名
```

**精英阶段**（属性 70-85）
```
配置：高难度（3Lz, 3Lz+3T, 3A, 满级旋转, StSq4）
总BV：约 55-65
预期得分：70-95 分
对应排名：世锦赛 3-6名
```

**世界顶尖**（属性 85-100）
```
配置：极限难度（4T, 4T+3T, 3A, 满级旋转+步法）
总BV：约 70-85
预期得分：95-120 分
对应排名：奥运会 1-3名
```

### 经济平衡

**收入曲线**
```
赛季1（新手）: ¥10,000-30,000
  - 地区赛奖金 + 区域赞助

赛季2-3（职业）: ¥50,000-150,000
  - 大奖赛奖金 + 品牌赞助

赛季4-6（精英）: ¥200,000-500,000
  - 世锦赛奖金 + 全国赞助 + 代言

赛季7+（冠军）: ¥500,000+
  - 奥运会奖金 + 国际赞助 + 顶级代言
```

**支出曲线**
```
基础阶段: ¥15,000/月
  - 基础教练 ¥1,000
  - 低级装备 ¥8,000（一次性）
  - 基础编排 ¥5,000

成长阶段: ¥40,000/月
  - 专业教练 ¥3,500
  - 中级装备 ¥25,000（一次性）
  - 进阶编排 ¥10,000

冲刺阶段: ¥100,000/月
  - 国家级教练 ¥8,000
  - 高级装备 ¥50,000（一次性）
  - 高定编排 ¥30,000

巅峰阶段: ¥250,000/月
  - 传奇教练 ¥20,000
  - 顶级装备多件
  - 定制编排 ¥80,000
```

### 难度曲线

**新手保护**
- 地区赛无排名要求（req = 0）
- 排除Top 50选手参赛
- 初始属性足够完成基础动作

**成长期挑战**
- 大奖赛要求 rolling ≥ 2,500
- 需要稳定训练2-3个赛季
- 装备和教练投资开始重要

**冲刺期压力**
- 世锦赛要求 rolling ≥ 4,000
- 需要高风险高难度配置
- AI顶尖选手竞争激烈

**巅峰期目标**
- 奥运会要求 rolling ≥ 10,000
- 必须掌握4周跳和3A
- 与世界前30名争夺奖牌

---

## 附录

### 常量配置表

**时间系统**
```typescript
OLYMPIC_BASE_YEAR = 2026;  // 奥运会年份基准
月份 = 1-12;
每月 = 1周训练 + 可选比赛;
```

**训练系统**
```typescript
TRAIN_MAX_GAIN = 2.0;        // 单次训练最大增长
TRAIN_SD_RATIO = 0.5;        // 标准差比率
FATIGUE_SLOPE = 0.04;        // 疲劳影响斜率
FATIGUE_CAP = 0.85;          // 疲劳惩罚上限
```

**比赛系统**
```typescript
MATCH_STAMINA_COST = 20;     // 基础比赛体力消耗
每场比赛 = 7个技术要素;
GOE范围 = -5 to +5;
失误率基准 = 动作风险 × 100 - 属性 × 0.6;
```

### 文件结构

```
SOI/
├── types.ts              # 类型定义
│   ├── PlayerAttributes  # 五维属性
│   ├── Skater            # 选手数据
│   ├── GameState         # 游戏状态
│   ├── MatchAction       # 技术动作
│   └── ProgramConfig     # 节目配置
│
├── constants.tsx         # 常量配置
│   ├── ACTION_LIBRARY    # 50个ISU动作
│   ├── MATCH_STRUCTURES  # 3种赛制模板
│   ├── PHASE_META        # 要素元数据
│   ├── TRAINING_TASKS    # 训练任务表
│   ├── RANDOM_EVENTS     # 随机事件库
│   └── generateProgramConfig()  # 配置生成器
│
└── App.tsx               # 主游戏逻辑
    ├── 月度推进系统
    ├── 训练计算系统
    ├── 比赛引擎系统
    ├── AI生态系统
    ├── 经济管理系统
    └── UI渲染系统
```

---

## 版本历史

**v3.0.0** (Current)
- ✅ 完整ISU规则实现（7要素）
- ✅ 50+官方动作（ISU BV）
- ✅ GOE评分系统（-5 to +5）
- ✅ 拖拽排序节目配置
- ✅ 三种自动配置策略
- ✅ AI生态模拟系统
- ✅ 每周7格训练槽位
- ✅ 加权衍生属性系统（包含耐力影响）

**v2.0.0**
- 五维属性系统
- 装备加成系统
- 赞助合约系统
- 随机事件系统

**v1.0.0**
- 基础训练系统
- 简化比赛系统
- 静态AI对手

---

**文档编写日期**: 2026年1月29日  
**文档更新日期**: 2026年2月8日（修正训练系统和衍生属性描述）  
**游戏版本**: v3.0.0  
**ISU规则版本**: 2024-25赛季

