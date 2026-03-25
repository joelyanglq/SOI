import { Music, MusicMood, MusicStructure } from '../../types';

// --- Name generation word banks ---
const PREFIXES = [
  '月光', '暮色', '晨曦', '星河', '深海', '风雪', '落樱', '极光', '暗夜',
  '黎明', '烈焰', '云端', '幽谷', '流光', '薄暮', '冰霜', '雷鸣', '静谧',
  '花火', '潮汐', '残阳', '碧空', '迷雾', '琥珀', '镜中', '苍穹', '微光',
  '天鹅', '玫瑰', '幻影', '水晶', '长夜',
];

const SUFFIXES = [
  '奏鸣曲', '圆舞曲', '狂想曲', '幻想曲', '叙事诗', '安魂曲',
  '小夜曲', '协奏曲', '交响诗', '变奏曲', '序曲', '挽歌',
  '随想曲', '练习曲', '夜曲', '进行曲',
];

const COMPOSERS = [
  '柴可夫斯基', '肖邦', '德彪西', '拉赫玛尼诺夫', '维瓦尔第',
  '圣桑', '久石让', '坂本龙一', '汉斯·季默', '约翰·威廉姆斯',
  '马克斯·里希特', '�的雅罗·斯维里多夫', '菲利普·格拉斯',
  '埃尼奥·莫里康内', '帕格尼尼', '李斯特',
];

// --- Mood description templates ---
const MOOD_DESCRIPTIONS: Record<MusicMood, string[]> = {
  lyrical: [
    '旋律如溪流般舒缓流淌，温柔而内敛。',
    '琴声低吟，诉说着无需言语的深情。',
    '宁静的旋律中藏着微妙的起伏，如同呼吸。',
  ],
  dramatic: [
    '强烈的节奏对比制造出戏剧性的张力。',
    '音乐中充满了冲突与和解，情绪跌宕起伏。',
    '每一个乐句都像一场内心的风暴。',
  ],
  energetic: [
    '节拍鲜明有力，令人血脉偾张。',
    '充满活力的旋律如同一道闪电划过冰面。',
    '快速而精准的音符堆叠出势不可挡的气势。',
  ],
  melancholic: [
    '带着无法言说的哀愁，音符缓缓坠落。',
    '忧伤的旋律如同冬日薄暮中最后一缕阳光。',
    '每一个音符都承载着回忆的重量。',
  ],
  ethereal: [
    '空灵的音色如同置身云端之上。',
    '若有若无的旋律，仿佛来自另一个世界。',
    '音乐漂浮在空气中，不触碰任何边界。',
  ],
};

// --- Structure definitions (energy curves) ---
const STRUCTURE_META: Record<MusicStructure, {
  desc: string;
  curves: number[][];
}> = {
  gradual: {
    desc: '从低语开始，层层推进，在终章抵达顶峰。',
    curves: [
      [0.80, 0.85, 0.90, 0.95, 1.00, 1.10, 1.15],
      [0.85, 0.85, 0.90, 1.00, 1.05, 1.10, 1.10],
    ],
  },
  explosive: {
    desc: '开篇即是最强音，然后逐渐沉入沉思。',
    curves: [
      [1.15, 1.10, 1.00, 0.90, 0.85, 0.90, 1.05],
      [1.10, 1.05, 0.95, 0.85, 0.90, 0.95, 1.00],
    ],
  },
  cyclic: {
    desc: '三次浪潮，一浪高过一浪。',
    curves: [
      [0.90, 1.10, 0.85, 1.10, 0.85, 1.15, 0.95],
      [0.95, 1.05, 0.90, 1.10, 0.90, 1.10, 1.00],
    ],
  },
  narrative: {
    desc: '起承转合，在沉默后迎来爆发。',
    curves: [
      [0.85, 0.90, 1.00, 0.80, 1.15, 1.10, 0.95],
      [0.90, 0.95, 0.85, 0.80, 1.10, 1.15, 1.00],
    ],
  },
};

const MOODS: MusicMood[] = ['lyrical', 'dramatic', 'energetic', 'melancholic', 'ethereal'];
const STRUCTURES: MusicStructure[] = ['gradual', 'explosive', 'cyclic', 'narrative'];

const pick = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

export const generateMusic = (): Music => {
  const mood = pick(MOODS);
  const structure = pick(STRUCTURES);
  const complexity = (Math.random() < 0.3 ? 3 : Math.random() < 0.5 ? 2 : 1) as 1 | 2 | 3;

  const name = pick(PREFIXES) + pick(SUFFIXES);
  const moodDesc = pick(MOOD_DESCRIPTIONS[mood]);
  const structMeta = STRUCTURE_META[structure];
  const description = `${moodDesc} ${structMeta.desc}`;
  const energyCurve = pick(structMeta.curves);

  return {
    id: `music_${Date.now()}_${Math.floor(Math.random() * 10000)}`,
    name,
    description,
    mood,
    structure,
    complexity,
    energyCurve,
  };
};

export const generateMusicPool = (count: number): Music[] => {
  return Array.from({ length: count }, () => generateMusic());
};

export const MOOD_LABELS: Record<MusicMood, string> = {
  lyrical: '抒情', dramatic: '戏剧', energetic: '激昂',
  melancholic: '忧郁', ethereal: '空灵',
};

export const MOOD_COLORS: Record<MusicMood, string> = {
  lyrical: 'bg-blue-600', dramatic: 'bg-red-600', energetic: 'bg-amber-600',
  melancholic: 'bg-purple-600', ethereal: 'bg-cyan-600',
};

export const STRUCTURE_LABELS: Record<MusicStructure, string> = {
  gradual: '渐进式', explosive: '爆发式', cyclic: '回旋式', narrative: '叙事式',
};

/** Pre-built faded variants for Tailwind JIT compatibility (dynamic `/60` suffixes don't work) */
export const MOOD_COLORS_FADED: Record<MusicMood, string> = {
  lyrical: 'bg-blue-600/60', dramatic: 'bg-red-600/60', energetic: 'bg-amber-600/60',
  melancholic: 'bg-purple-600/60', ethereal: 'bg-cyan-600/60',
};
