// 数值常量 - 集中管理所有魔法数字
export const MATCH_STAMINA_COST = 20;
export const TRAIN_MAX_GAIN = 2.0;
export const TRAIN_SD_RATIO = 0.5;
export const TRAIN_SD_MIN = 0.2;
export const SCORE_MIN = 0;
export const OLYMPIC_BASE_YEAR = 2026;
export const P_AGE_START = 6;
export const FATIGUE_SLOPE = 0.04;
export const FATIGUE_CAP = 0.85;
export const PCS_MIN = 0.15;

export const STORAGE_KEY = 'FS_MANAGER_V11_PRO';

// 隐藏属性初始值
export const HIDDEN_STATS_INITIAL = {
  mental: 60,
  stress: 30,
  public: 50,
};

// 心态系数 (乘数)
export const MENTAL_MULTIPLIERS = {
  peak: 1.1,
  normal: 1.0,
  tight: 0.85,
  broken: 0.7,
};

// 心态巅峰时 GOE 波动加成
export const MENTAL_PEAK_GOE_BONUS = {
  min: 0.3,
  max: 1.0,
};

// 压力效率系数
export const STRESS_EFFICIENCY = {
  relaxed: 1.0,
  relaxedBonus: 0.1,
  moderate: 0.8,
  tense: 0.6,
  burnout: 0.4,
};

// Burnout 配置
export const BURNOUT_CONFIG = {
  warningThreshold: 80,
  maxThreshold: 100,
  declineChance: 0.3,
};

// 舆论影响赞助
export const PUBLIC_CONFIG = {
  positiveThreshold: 80,
  negativeThreshold: 30,
  crisisThreshold: 20,
  sponsorshipBonus: 0.3,
  sponsorshipPenalty: 0.2,
  terminationChance: 0.1,
};

// 压力变化配置
export const STRESS_CHANGE = {
  maxTraining: 25,
  highTraining: 15,
  normalTraining: 5,
  lowTraining: -10,
  competition: 10,
  rest: -20,
  negativeEvent: 15,
};

// 心态变化配置
export const MENTAL_CHANGE = {
  firstMajor: -20,
  overtraining: -5,
  win: 15,
  fail: -10,
};

// 舆论变化配置
export const PUBLIC_CHANGE = {
  win: 20,
  fail: -5,
  positiveEvent: 10,
  negativeEvent: -15,
};
