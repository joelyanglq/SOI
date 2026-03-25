import { TraitDef, TraitId, TraitMatchState } from '../../types';

// ============================================================
// Trait Library
// ============================================================
export const TRAIT_LIBRARY: TraitDef[] = [
  // === PASSIVE TRAITS ===
  {
    id: 'quick_learner',
    name: '速成天才',
    nameEn: 'Quick Learner',
    description: '学习新动作时，前20熟练度获得1.5倍增速',
    trigger: 'passive',
    category: 'training',
    icon: '📚',
  },
  {
    id: 'steel_ankles',
    name: '钢铁脚踝',
    nameEn: 'Steel Ankles',
    description: '受伤概率降低50%',
    trigger: 'passive',
    category: 'constitution',
    icon: '🦶',
  },
  {
    id: 'late_bloomer',
    name: '大器晚成',
    nameEn: 'Late Bloomer',
    description: '23岁后的属性衰减减少40%',
    trigger: 'passive',
    category: 'growth',
    icon: '🌸',
  },
  {
    id: 'glass_cannon',
    name: '玻璃大炮',
    nameEn: 'Glass Cannon',
    description: '四周跳熟练度上限+15，但受伤概率提高50%',
    trigger: 'passive',
    category: 'training',
    icon: '💎',
  },
  {
    id: 'iron_stamina',
    name: '铁人体魄',
    nameEn: 'Iron Stamina',
    description: '节目后半段体力消耗减少20%',
    trigger: 'passive',
    category: 'constitution',
    icon: '🏋️',
  },

  // === CONDITIONAL TRAITS ===
  {
    id: 'momentum_rider',
    name: '越战越勇',
    nameEn: 'Momentum Rider',
    description: '连续2次及以上成功后，后续失误率每次-5%',
    trigger: 'conditional',
    category: 'match',
    icon: '🔥',
  },
  {
    id: 'iron_will',
    name: '钢铁意志',
    nameEn: 'Iron Will',
    description: '失误后下一个动作失误率-15%',
    trigger: 'conditional',
    category: 'match',
    icon: '⚔️',
  },
  {
    id: 'clutch_performer',
    name: '逆境之星',
    nameEn: 'Clutch Performer',
    description: '落后5分以上时，所有失误率-10%',
    trigger: 'conditional',
    category: 'match',
    icon: '⭐',
  },
  {
    id: 'quad_queen',
    name: '四周跳女王',
    nameEn: 'Quad Queen',
    description: '成功完成2+四周跳后，后续四周跳失误率-10%',
    trigger: 'conditional',
    category: 'match',
    icon: '👑',
  },
  {
    id: 'spin_enchanter',
    name: '旋转魔术师',
    nameEn: 'Spin Enchanter',
    description: '完成2+个Level 4旋转后，获得编排分加成',
    trigger: 'conditional',
    category: 'match',
    icon: '🌀',
  },
  {
    id: 'crowd_igniter',
    name: '冰场点燃者',
    nameEn: 'Crowd Igniter',
    description: '前半程零失误时，后半程PCS×1.1',
    trigger: 'conditional',
    category: 'match',
    icon: '🎆',
  },
  {
    id: 'slow_starter',
    name: '厚积薄发',
    nameEn: 'Slow Starter',
    description: '短节目排名下半区时，自由滑全属性+5%',
    trigger: 'conditional',
    category: 'match',
    icon: '🐢',
  },
  {
    id: 'pressure_cracker',
    name: '压力易碎',
    nameEn: 'Pressure Cracker',
    description: '当前排名第一时，失误率+5%',
    trigger: 'conditional',
    category: 'match',
    isNegative: true,
    icon: '😰',
  },
];

// ============================================================
// Helpers
// ============================================================

export const getTrait = (id: TraitId): TraitDef | undefined =>
  TRAIT_LIBRARY.find(t => t.id === id);

export const hasTrait = (traits: TraitId[] | undefined, traitId: TraitId): boolean =>
  (traits || []).includes(traitId);

// ============================================================
// Match State Tracking
// ============================================================

export const createTraitMatchState = (): TraitMatchState => ({
  consecutiveClean: 0,
  lastActionFailed: false,
  successfulQuads: 0,
  level4Spins: 0,
  firstHalfFails: 0,
  firstHalfComplete: false,
  isTrailing: false,
  trailingMargin: 0,
  isCurrentlyFirst: false,
  spRankBottomHalf: false,
});

export const updateTraitMatchState = (
  state: TraitMatchState,
  result: { isFail: boolean },
  action: { techReq?: { rotation?: number; spinLevel?: number } },
  actionIndex: number,
  totalActions: number
): TraitMatchState => {
  const updated = { ...state };

  if (result.isFail) {
    updated.consecutiveClean = 0;
    updated.lastActionFailed = true;
    if (actionIndex < totalActions / 2) {
      updated.firstHalfFails += 1;
    }
  } else {
    updated.consecutiveClean += 1;
    updated.lastActionFailed = false;
    if (action.techReq?.rotation === 4) {
      updated.successfulQuads += 1;
    }
    if (action.techReq?.spinLevel === 4) {
      updated.level4Spins += 1;
    }
  }

  if (actionIndex >= Math.floor(totalActions / 2) - 1) {
    updated.firstHalfComplete = true;
  }

  return updated;
};

// ============================================================
// Trait Effect Calculations
// ============================================================

/** Calculate fail rate modifier from conditional traits. Negative = less fail. */
export const getTraitFailRateMod = (
  traits: TraitId[],
  matchState: TraitMatchState,
  action: { techReq?: { rotation?: number } }
): number => {
  let mod = 0;

  if (hasTrait(traits, 'momentum_rider') && matchState.consecutiveClean >= 2) {
    mod -= 5 * (matchState.consecutiveClean - 1);
    mod = Math.max(mod, -20);
  }

  if (hasTrait(traits, 'iron_will') && matchState.lastActionFailed) {
    mod -= 15;
  }

  if (hasTrait(traits, 'clutch_performer') && matchState.isTrailing && matchState.trailingMargin >= 5) {
    mod -= 10;
  }

  if (hasTrait(traits, 'quad_queen') && matchState.successfulQuads >= 2 && action.techReq?.rotation === 4) {
    mod -= 10;
  }

  if (hasTrait(traits, 'pressure_cracker') && matchState.isCurrentlyFirst) {
    mod += 5;
  }

  return mod;
};

/** Calculate PCS multiplier from conditional traits. 1.0 = no change. */
export const getTraitPCSMod = (
  traits: TraitId[],
  matchState: TraitMatchState,
  actionIndex: number,
  totalActions: number
): number => {
  let mod = 1.0;

  if (hasTrait(traits, 'spin_enchanter') && matchState.level4Spins >= 2) {
    mod *= 1.05;
  }

  if (hasTrait(traits, 'crowd_igniter') && matchState.firstHalfComplete && matchState.firstHalfFails === 0 && actionIndex >= totalActions / 2) {
    mod *= 1.1;
  }

  return mod;
};

// ============================================================
// Trait Generation
// ============================================================

const PASSIVE_POOL: TraitId[] = ['quick_learner', 'steel_ankles', 'late_bloomer', 'glass_cannon', 'iron_stamina'];

/** Roll innate traits for new player creation. */
export const rollInnateTraits = (count: number = 1): TraitId[] => {
  const shuffled = [...PASSIVE_POOL].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
};

/** Roll traits for AI skater based on tier. */
export const rollAITraits = (tier: 'elite' | 'pro' | 'rookie'): TraitId[] => {
  const positiveTraits = TRAIT_LIBRARY.filter(t => !t.isNegative).map(t => t.id);
  const count = tier === 'elite'
    ? 2 + (Math.random() < 0.5 ? 1 : 0)
    : tier === 'pro'
      ? 1 + (Math.random() < 0.5 ? 1 : 0)
      : Math.random() < 0.5 ? 1 : 0;

  const shuffled = [...positiveTraits].sort(() => Math.random() - 0.5);
  const traits = shuffled.slice(0, count);

  // 10% chance for pressure_cracker as additional negative trait
  if (Math.random() < 0.1 && !traits.includes('pressure_cracker')) {
    traits.push('pressure_cracker');
  }

  return traits;
};

// ============================================================
// Training Helpers
// ============================================================

/** Apply quick_learner bonus: 1.5x gain when current proficiency < 20. */
export const applyQuickLearnerBonus = (
  currentProf: number,
  gain: number,
  traits?: TraitId[]
): number => {
  if (!hasTrait(traits, 'quick_learner')) return gain;
  if (currentProf < 20) {
    const belowThreshold = Math.min(gain, 20 - currentProf);
    const aboveThreshold = gain - belowThreshold;
    return belowThreshold * 1.5 + aboveThreshold;
  }
  return gain;
};

// ============================================================
// Trait Activation Description (for UI display)
// ============================================================

/** Get human-readable descriptions of active trait effects for current action. */
export const getActiveTraitDescriptions = (
  traits: TraitId[],
  matchState: TraitMatchState,
  action: { techReq?: { rotation?: number } },
  actionIndex: number,
  totalActions: number
): { traitId: TraitId; effect: string }[] => {
  const activations: { traitId: TraitId; effect: string }[] = [];

  if (hasTrait(traits, 'momentum_rider') && matchState.consecutiveClean >= 2) {
    const reduction = Math.min(5 * (matchState.consecutiveClean - 1), 20);
    activations.push({ traitId: 'momentum_rider', effect: `连续${matchState.consecutiveClean}次成功 失误率-${reduction}%` });
  }

  if (hasTrait(traits, 'iron_will') && matchState.lastActionFailed) {
    activations.push({ traitId: 'iron_will', effect: '失误后反弹 失误率-15%' });
  }

  if (hasTrait(traits, 'clutch_performer') && matchState.isTrailing && matchState.trailingMargin >= 5) {
    activations.push({ traitId: 'clutch_performer', effect: `落后${matchState.trailingMargin.toFixed(1)}分 失误率-10%` });
  }

  if (hasTrait(traits, 'quad_queen') && matchState.successfulQuads >= 2 && action.techReq?.rotation === 4) {
    activations.push({ traitId: 'quad_queen', effect: `已完成${matchState.successfulQuads}个四周跳 失误率-10%` });
  }

  if (hasTrait(traits, 'spin_enchanter') && matchState.level4Spins >= 2) {
    activations.push({ traitId: 'spin_enchanter', effect: 'Lv4旋转×2 编排分+5%' });
  }

  if (hasTrait(traits, 'crowd_igniter') && matchState.firstHalfComplete && matchState.firstHalfFails === 0 && actionIndex >= totalActions / 2) {
    activations.push({ traitId: 'crowd_igniter', effect: '前半程零失误 PCS+10%' });
  }

  if (hasTrait(traits, 'pressure_cracker') && matchState.isCurrentlyFirst) {
    activations.push({ traitId: 'pressure_cracker', effect: '排名第一 压力增大 失误率+5%' });
  }

  return activations;
};
