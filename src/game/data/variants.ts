import { VariantDef, SpinType } from '../../types';

export const VARIANT_LIBRARY: VariantDef[] = [
  // === JUMP VARIANTS ===
  {
    id: 'tano',
    name: '塔诺',
    nameEn: 'Tano',
    description: '单手举过头顶的跳跃姿势，增加难度系数',
    bvMultiplier: 1.10,
    riskModifier: 0.05,
    category: 'jump',
    requirement: { minProficiency: 70 }
  },
  {
    id: 'rippon',
    name: '利邦',
    nameEn: 'Rippon',
    description: '双手举过头顶的跳跃姿势，难度更高',
    bvMultiplier: 1.12,
    riskModifier: 0.08,
    category: 'jump',
    requirement: { minProficiency: 80 }
  },

  // === SPIN VARIANTS ===
  {
    id: 'biellmann',
    name: '贝尔曼',
    nameEn: 'Biellmann',
    description: '单脚站立，另一脚拉至头顶后方的经典旋转',
    bvMultiplier: 1.15,
    riskModifier: 0.03,
    category: 'spin',
    applicableTo: ['upright'],
    requirement: { minProficiency: 70, minBodySpin: 60 }
  },
  {
    id: 'candle_biellmann',
    name: '蜡烛贝尔曼',
    nameEn: 'Candle Biellmann',
    description: '贝尔曼的高级变体，要求极致柔韧性',
    bvMultiplier: 1.25,
    riskModifier: 0.06,
    category: 'spin',
    applicableTo: ['upright'],
    requirement: { minProficiency: 85, minBodySpin: 80, prerequisiteVariant: 'biellmann' }
  },
  {
    id: 'donut',
    name: '甜甜圈',
    nameEn: 'Donut',
    description: '身体形成环形的燕式旋转变体',
    bvMultiplier: 1.10,
    riskModifier: 0.03,
    category: 'spin',
    applicableTo: ['camel'],
    requirement: { minProficiency: 65, minBodySpin: 55 }
  },
  {
    id: 'i_spin',
    name: 'I字旋转',
    nameEn: 'I-Spin',
    description: '单脚举至头顶形成I字形的直立旋转',
    bvMultiplier: 1.15,
    riskModifier: 0.04,
    category: 'spin',
    applicableTo: ['upright'],
    requirement: { minProficiency: 75, minBodySpin: 70 }
  },
  {
    id: 'haircutter',
    name: '割发旋转',
    nameEn: 'Haircutter',
    description: '蹲踞旋转中将自由腿拉至头部附近',
    bvMultiplier: 1.10,
    riskModifier: 0.03,
    category: 'spin',
    applicableTo: ['sit'],
    requirement: { minProficiency: 60, minBodySpin: 50 }
  },
];

export const getVariant = (id: string): VariantDef | undefined =>
  VARIANT_LIBRARY.find(v => v.id === id);

export const getUnlockableJumpVariants = (proficiency: number): string[] => {
  return VARIANT_LIBRARY
    .filter(v => v.category === 'jump' && proficiency >= v.requirement.minProficiency)
    .map(v => v.id);
};

export const getUnlockableSpinVariants = (
  spinType: SpinType,
  proficiency: number,
  bodySpin: number,
  existingVariants: string[]
): string[] => {
  return VARIANT_LIBRARY
    .filter(v => {
      if (v.category !== 'spin') return false;
      if (v.applicableTo && !v.applicableTo.includes(spinType)) return false;
      if (proficiency < v.requirement.minProficiency) return false;
      if (v.requirement.minBodySpin && bodySpin < v.requirement.minBodySpin) return false;
      if (v.requirement.prerequisiteVariant && !existingVariants.includes(v.requirement.prerequisiteVariant)) return false;
      return true;
    })
    .map(v => v.id);
};
