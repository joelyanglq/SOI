import { ProgramCostume, CostumeTheme, MusicMood } from '../../types';

// --- Costume module definitions ---

interface CostumeModule<T extends string> {
  id: T;
  label: string;
  fragment: string;           // description fragment
  themeWeight: Partial<Record<CostumeTheme, number>>;
}

// Silhouettes
const SILHOUETTES: CostumeModule<string>[] = [
  { id: 'dress', label: '裙装', fragment: '', themeWeight: { elegant: 2, ethereal: 1 } },
  { id: 'jumpsuit', label: '连体衣', fragment: '修身连体剪裁', themeWeight: { fierce: 2, classic: 1 } },
  { id: 'skirt_short', label: '短裙', fragment: '轻盈的短裙', themeWeight: { energetic: 1 } as any },
  { id: 'pants', label: '裤装', fragment: '利落的裤装廓形', themeWeight: { fierce: 2 } },
];

// Primary colors
interface ColorModule {
  id: string;
  label: string;
  fragment: string;
  themeWeight: Partial<Record<CostumeTheme, number>>;
  moodAffinity: MusicMood[];
}

const COLORS: ColorModule[] = [
  { id: 'midnight_blue', label: '午夜蓝', fragment: '深邃的午夜蓝', themeWeight: { elegant: 2, ethereal: 1 }, moodAffinity: ['melancholic', 'ethereal'] },
  { id: 'crimson', label: '正红', fragment: '夺目的正红色', themeWeight: { fierce: 3 }, moodAffinity: ['dramatic', 'energetic'] },
  { id: 'pure_white', label: '纯白', fragment: '纯净的白色', themeWeight: { ethereal: 3, classic: 1 }, moodAffinity: ['ethereal', 'lyrical'] },
  { id: 'obsidian', label: '墨黑', fragment: '深沉的黑色', themeWeight: { fierce: 2, elegant: 1 }, moodAffinity: ['dramatic', 'melancholic'] },
  { id: 'gold', label: '金色', fragment: '华贵的金色', themeWeight: { elegant: 3 }, moodAffinity: ['dramatic', 'energetic'] },
  { id: 'silver', label: '银色', fragment: '清冷的银色', themeWeight: { ethereal: 2, classic: 1 }, moodAffinity: ['ethereal', 'lyrical'] },
  { id: 'emerald', label: '翡翠绿', fragment: '沉稳的翡翠绿', themeWeight: { classic: 2, elegant: 1 }, moodAffinity: ['lyrical', 'melancholic'] },
  { id: 'lavender', label: '薰衣草紫', fragment: '柔美的薰衣草紫', themeWeight: { ethereal: 2, elegant: 1 }, moodAffinity: ['lyrical', 'ethereal'] },
  { id: 'rose', label: '玫瑰粉', fragment: '温柔的玫瑰粉', themeWeight: { elegant: 1, ethereal: 1 }, moodAffinity: ['lyrical'] },
  { id: 'burgundy', label: '酒红', fragment: '浓郁的酒红色', themeWeight: { elegant: 2, fierce: 1 }, moodAffinity: ['dramatic', 'melancholic'] },
];

// Materials
interface MaterialModule {
  id: string;
  label: string;
  fragment: string;
  themeWeight: Partial<Record<CostumeTheme, number>>;
  moodAffinity: MusicMood[];
}

const MATERIALS: MaterialModule[] = [
  { id: 'velvet', label: '丝绒', fragment: '丝绒面料在灯光下泛着低调的光泽', themeWeight: { elegant: 2, classic: 1 }, moodAffinity: ['melancholic', 'dramatic'] },
  { id: 'silk', label: '真丝', fragment: '真丝面料如流水般服帖', themeWeight: { elegant: 2, ethereal: 1 }, moodAffinity: ['lyrical', 'ethereal'] },
  { id: 'mesh', label: '网纱', fragment: '轻薄的网纱若隐若现', themeWeight: { ethereal: 2, fierce: 1 }, moodAffinity: ['ethereal'] },
  { id: 'stretch', label: '弹力面料', fragment: '弹力面料紧贴身体线条', themeWeight: { fierce: 2 }, moodAffinity: ['energetic', 'dramatic'] },
  { id: 'chiffon', label: '雪纺', fragment: '雪纺面料随动作飘逸', themeWeight: { ethereal: 2, classic: 1 }, moodAffinity: ['lyrical', 'ethereal'] },
  { id: 'satin', label: '缎面', fragment: '光滑的缎面折射出冷冽的光芒', themeWeight: { elegant: 1, classic: 2 }, moodAffinity: ['dramatic', 'lyrical'] },
];

// Embellishments
const EMBELLISHMENTS: CostumeModule<string>[] = [
  { id: 'none', label: '无', fragment: '', themeWeight: { classic: 1 } },
  { id: 'crystals', label: '水钻', fragment: '缀满碎钻，每一次移动都折射出细碎的光', themeWeight: { elegant: 2, ethereal: 1 } },
  { id: 'sequins', label: '亮片', fragment: '亮片在灯光下闪烁如星', themeWeight: { fierce: 1, elegant: 1 } },
  { id: 'feathers', label: '羽毛', fragment: '边缘点缀着轻盈的羽毛', themeWeight: { ethereal: 2 } },
  { id: 'embroidery', label: '刺绣', fragment: '精致的手工刺绣铺陈在面料上', themeWeight: { classic: 2, elegant: 1 } },
  { id: 'beadwork', label: '串珠', fragment: '手工串珠勾勒出优雅的纹路', themeWeight: { elegant: 2, classic: 1 } },
];

// Cuts (design highlights)
const CUTS: CostumeModule<string>[] = [
  { id: 'deep_v_back', label: '深V背线', fragment: '背后一道从颈到腰的大胆剪裁', themeWeight: { fierce: 2, elegant: 1 } },
  { id: 'asymmetric_shoulder', label: '不对称单肩', fragment: '不对称的单肩设计打破了对称的沉闷', themeWeight: { fierce: 1 } },
  { id: 'high_collar', label: '高领', fragment: '高领设计衬托出修长的颈线', themeWeight: { classic: 2, elegant: 1 } },
  { id: 'flowing_sleeves', label: '飘带袖', fragment: '飘逸的长袖随手臂舞动如翼', themeWeight: { ethereal: 3 } },
  { id: 'layered_skirt', label: '层叠裙摆', fragment: '层叠的裙摆在旋转时如花绽放', themeWeight: { elegant: 2, ethereal: 1 } },
  { id: 'cutout_waist', label: '镂空腰线', fragment: '腰侧的镂空设计展现力量感', themeWeight: { fierce: 2 } },
];

// --- Generation logic ---

const pick = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

function deriveTheme(weights: Partial<Record<CostumeTheme, number>>[]): CostumeTheme {
  const totals: Record<CostumeTheme, number> = { elegant: 0, fierce: 0, ethereal: 0, classic: 0 };
  for (const w of weights) {
    for (const [k, v] of Object.entries(w)) {
      totals[k as CostumeTheme] += v as number;
    }
  }
  let best: CostumeTheme = 'elegant';
  let bestVal = 0;
  for (const [k, v] of Object.entries(totals)) {
    if (v > bestVal) { best = k as CostumeTheme; bestVal = v; }
  }
  return best;
}

function deriveMoodAffinity(color: ColorModule, material: MaterialModule): MusicMood[] {
  const set = new Set<MusicMood>([...color.moodAffinity, ...material.moodAffinity]);
  return Array.from(set).slice(0, 3);
}

function assembleDescription(
  color: ColorModule,
  material: MaterialModule,
  embellishment: CostumeModule<string>,
  cut: CostumeModule<string>
): string {
  const parts = [
    `${color.fragment}${material.fragment ? '，' + material.fragment : ''}`,
    embellishment.fragment,
    cut.fragment,
  ].filter(Boolean);
  return parts.join('。') + '。';
}

function calculatePrice(
  material: MaterialModule,
  embellishment: CostumeModule<string>,
  quality: 1 | 2 | 3
): number {
  const base = quality === 3 ? 35000 : quality === 2 ? 18000 : 4000;
  const materialMod = ['velvet', 'silk'].includes(material.id) ? 1.3 : 1.0;
  const embMod = embellishment.id === 'none' ? 0.8 : embellishment.id === 'crystals' ? 1.4 : 1.1;
  return Math.floor(base * materialMod * embMod);
}

// Costume name banks
const COSTUME_NAMES_PREFIX = [
  '暗夜', '晨曦', '烈焰', '冰霜', '月华', '星辰', '深海', '极光',
  '玫瑰', '天鹅', '凤凰', '幽兰', '苍穹', '雪影', '翡翠',
];
const COSTUME_NAMES_SUFFIX = [
  '星河', '之翼', '红唇', '华裳', '幻梦', '战衣', '颂歌', '绮罗',
  '光影', '倒影', '薄纱', '铠甲', '挽歌', '诗篇',
];

export const generateCostume = (): ProgramCostume => {
  const silhouette = pick(SILHOUETTES);
  const color = pick(COLORS);
  const material = pick(MATERIALS);
  const embellishment = pick(EMBELLISHMENTS);
  const cut = pick(CUTS);
  const quality = (Math.random() < 0.2 ? 3 : Math.random() < 0.5 ? 2 : 1) as 1 | 2 | 3;

  const theme = deriveTheme([
    silhouette.themeWeight, color.themeWeight,
    material.themeWeight, embellishment.themeWeight, cut.themeWeight,
  ]);
  const moodAffinity = deriveMoodAffinity(color, material);
  const description = assembleDescription(color, material, embellishment, cut);
  const price = calculatePrice(material, embellishment, quality);
  const name = pick(COSTUME_NAMES_PREFIX) + pick(COSTUME_NAMES_SUFFIX);

  return {
    id: `costume_${Date.now()}_${Math.floor(Math.random() * 10000)}`,
    name,
    description,
    theme,
    moodAffinity,
    quality,
    price,
  };
};

export const generateCostumeMarket = (count: number): ProgramCostume[] => {
  return Array.from({ length: count }, () => generateCostume());
};

export const THEME_LABELS: Record<CostumeTheme, string> = {
  elegant: '优雅', fierce: '强势', ethereal: '空灵', classic: '古典',
};

export const THEME_COLORS: Record<CostumeTheme, string> = {
  elegant: 'bg-rose-700', fierce: 'bg-red-700', ethereal: 'bg-cyan-700', classic: 'bg-amber-700',
};
