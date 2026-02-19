import { StyleTagDef, PlayerAttributes } from '../../types';

export const STYLE_TAG_LIBRARY: StyleTagDef[] = [
  // === JUMP TAGS ===
  {
    id: 'huge_air',
    name: '大跳高度',
    nameEn: 'Huge Air',
    description: '跳跃时获得惊人的高度，给裁判留下深刻印象',
    goeImpact: 0.3,
    category: 'jump',
    rarity: 'common',
    requirement: { minProficiency: 75, minBodyAttr: { jump: 60 } }
  },
  {
    id: 'feather_landing',
    name: '轻盈落冰',
    nameEn: 'Feather Landing',
    description: '落冰动作极其轻盈流畅，几乎无声',
    goeImpact: 0.3,
    category: 'jump',
    rarity: 'common',
    requirement: { minProficiency: 75 }
  },
  {
    id: 'effortless_rotation',
    name: '轻松旋转',
    nameEn: 'Effortless Rotation',
    description: '空中旋转看起来毫不费力',
    goeImpact: 0.2,
    category: 'jump',
    rarity: 'common',
    requirement: { minProficiency: 75 }
  },
  {
    id: 'delayed_rotation',
    name: '延迟旋转',
    nameEn: 'Delayed Rotation',
    description: '起跳后展现优美的延迟旋转技巧',
    goeImpact: 0.4,
    category: 'jump',
    rarity: 'rare',
    requirement: { minProficiency: 85, minBodyAttr: { jump: 70 } }
  },
  {
    id: 'spread_eagle_entry',
    name: '大鹏展翅入跳',
    nameEn: 'Spread Eagle Entry',
    description: '用大鹏展翅步法引入跳跃，增加艺术感',
    goeImpact: 0.35,
    category: 'jump',
    rarity: 'rare',
    requirement: { minProficiency: 80, minBodyAttr: { step: 50 } }
  },
  {
    id: 'creative_exit',
    name: '创意出跳',
    nameEn: 'Creative Exit',
    description: '跳跃后衔接独特的身体动作',
    goeImpact: 0.25,
    category: 'jump',
    rarity: 'common',
    requirement: { minProficiency: 75, minBodyAttr: { perf: 40 } }
  },
  {
    id: 'ice_coverage',
    name: '冰面覆盖',
    nameEn: 'Ice Coverage',
    description: '跳跃覆盖大面积冰面，展现力量感',
    goeImpact: 0.2,
    category: 'jump',
    rarity: 'common',
    requirement: { minProficiency: 75, minBodyAttr: { endurance: 50 } }
  },

  // === SPIN TAGS ===
  {
    id: 'centered_spin',
    name: '中心旋转',
    nameEn: 'Centered Spin',
    description: '旋转始终保持在一个点上，不偏移',
    goeImpact: 0.3,
    category: 'spin',
    rarity: 'common',
    requirement: { minProficiency: 75 }
  },
  {
    id: 'fast_rotation',
    name: '极速旋转',
    nameEn: 'Fast Rotation',
    description: '旋转速度极快，令人目眩',
    goeImpact: 0.25,
    category: 'spin',
    rarity: 'common',
    requirement: { minProficiency: 75, minBodyAttr: { spin: 55 } }
  },
  {
    id: 'graceful_position',
    name: '优雅姿态',
    nameEn: 'Graceful Position',
    description: '旋转中展示优美的身体线条',
    goeImpact: 0.3,
    category: 'spin',
    rarity: 'common',
    requirement: { minProficiency: 75, minBodyAttr: { perf: 45 } }
  },
  {
    id: 'creative_entry',
    name: '创意入转',
    nameEn: 'Creative Entry',
    description: '用独特的方式进入旋转',
    goeImpact: 0.35,
    category: 'spin',
    rarity: 'rare',
    requirement: { minProficiency: 80, minBodyAttr: { spin: 60 } }
  },
  {
    id: 'speed_variation',
    name: '速度变化',
    nameEn: 'Speed Variation',
    description: '旋转中展示明显的速度变化',
    goeImpact: 0.2,
    category: 'spin',
    rarity: 'common',
    requirement: { minProficiency: 75 }
  },
  {
    id: 'difficult_position',
    name: '高难姿态',
    nameEn: 'Difficult Position',
    description: '旋转中保持高难度的身体位置',
    goeImpact: 0.4,
    category: 'spin',
    rarity: 'rare',
    requirement: { minProficiency: 85, minBodyAttr: { spin: 70 } }
  },

  // === STEP TAGS ===
  {
    id: 'deep_edges',
    name: '深刃滑行',
    nameEn: 'Deep Edges',
    description: '步法中展示深刃技巧',
    goeImpact: 0.3,
    category: 'step',
    rarity: 'common',
    requirement: { minProficiency: 75, minBodyAttr: { step: 50 } }
  },
  {
    id: 'musical_interpretation',
    name: '音乐诠释',
    nameEn: 'Musical Interpretation',
    description: '步法完美契合音乐节奏',
    goeImpact: 0.35,
    category: 'step',
    rarity: 'rare',
    requirement: { minProficiency: 80, minBodyAttr: { perf: 55 } }
  },
  {
    id: 'upper_body',
    name: '上身表达',
    nameEn: 'Upper Body Expression',
    description: '步法中充分运用上身动作增强表现力',
    goeImpact: 0.25,
    category: 'step',
    rarity: 'common',
    requirement: { minProficiency: 75, minBodyAttr: { perf: 40 } }
  },
  {
    id: 'complex_turns',
    name: '复杂转体',
    nameEn: 'Complex Turns',
    description: '步法中包含多种复杂转体',
    goeImpact: 0.3,
    category: 'step',
    rarity: 'common',
    requirement: { minProficiency: 75, minBodyAttr: { step: 55 } }
  },
  {
    id: 'full_ice_coverage',
    name: '全场覆盖',
    nameEn: 'Full Ice Coverage',
    description: '步法序列覆盖整个冰面',
    goeImpact: 0.2,
    category: 'step',
    rarity: 'common',
    requirement: { minProficiency: 75, minBodyAttr: { endurance: 45 } }
  },

  // === GENERAL / LEGENDARY TAGS ===
  {
    id: 'signature_style',
    name: '招牌风格',
    nameEn: 'Signature Style',
    description: '形成了独特的个人标志性技术风格',
    goeImpact: 0.5,
    category: 'general',
    rarity: 'legendary',
    requirement: { minProficiency: 90, minBodyAttr: { perf: 70 } }
  },
  {
    id: 'crowd_pleaser',
    name: '观众宠儿',
    nameEn: 'Crowd Pleaser',
    description: '每次表演都能引发观众热烈反应',
    goeImpact: 0.4,
    category: 'general',
    rarity: 'rare',
    requirement: { minProficiency: 85, minBodyAttr: { perf: 60 } }
  },
];

export const getStyleTag = (id: string): StyleTagDef | undefined =>
  STYLE_TAG_LIBRARY.find(t => t.id === id);

export const getStyleTagCandidates = (
  category: 'jump' | 'spin' | 'step',
  proficiency: number,
  bodyAttrs: PlayerAttributes,
  existingTags: string[]
): StyleTagDef[] => {
  return STYLE_TAG_LIBRARY.filter(tag => {
    if (existingTags.includes(tag.id)) return false;
    if (tag.category !== category && tag.category !== 'general') return false;
    const req = tag.requirement;
    if (!req) return true;
    if (req.minProficiency && proficiency < req.minProficiency) return false;
    if (req.minBodyAttr) {
      for (const [attr, minVal] of Object.entries(req.minBodyAttr)) {
        if ((bodyAttrs[attr as keyof PlayerAttributes] || 0) < (minVal as number)) return false;
      }
    }
    return true;
  });
};
