import { ChoreographerNPC, ChoreographerType, CostumeTheme, Music, MusicMood } from '../../types';

export const CHOREOGRAPHER_LIBRARY: ChoreographerNPC[] = [
  // --- Master (3) ---
  {
    id: 'choreo_liang', name: '梁安诺',
    quote: '冰面就是画布，你的身体就是画笔。',
    type: 'classical', tier: 'master',
    preferredMoods: ['lyrical', 'melancholic'],
    cost: 50000, transitionQuality: 0.90, choreoQuality: 0.95,
    portrait: '🎼',
  },
  {
    id: 'choreo_viktor', name: '维克托·索科洛夫',
    quote: '我的节目只有一个要求——观众必须从椅子上站起来。',
    type: 'theatrical', tier: 'master',
    preferredMoods: ['dramatic', 'energetic'],
    cost: 55000, transitionQuality: 0.80, choreoQuality: 0.95,
    portrait: '🎭',
  },
  {
    id: 'choreo_yuki', name: '雪村透',
    quote: '留白，是最高级的表达。',
    type: 'minimalist', tier: 'master',
    preferredMoods: ['ethereal', 'lyrical'],
    cost: 48000, transitionQuality: 0.95, choreoQuality: 0.85,
    portrait: '🌙',
  },

  // --- Established (4) ---
  {
    id: 'choreo_nova', name: '诺瓦·彼得罗夫',
    quote: '规则是用来打破的，但你得先了解规则。',
    type: 'modern', tier: 'established',
    preferredMoods: ['energetic', 'dramatic'],
    cost: 30000, transitionQuality: 0.75, choreoQuality: 0.80,
    portrait: '⚡',
  },
  {
    id: 'choreo_sakura', name: '樱井舞',
    quote: '静谧中蕴含最深的力量。',
    type: 'classical', tier: 'established',
    preferredMoods: ['melancholic', 'ethereal'],
    cost: 28000, transitionQuality: 0.80, choreoQuality: 0.75,
    portrait: '🌸',
  },
  {
    id: 'choreo_marco', name: '马可·罗西',
    quote: '每一秒都是一个故事，每一个动作都是一句台词。',
    type: 'theatrical', tier: 'established',
    preferredMoods: ['dramatic', 'melancholic'],
    cost: 32000, transitionQuality: 0.70, choreoQuality: 0.85,
    portrait: '🎬',
  },
  {
    id: 'choreo_aiko', name: '相川爱子',
    quote: '音乐不是背景，音乐才是主角。',
    type: 'modern', tier: 'established',
    preferredMoods: ['lyrical', 'energetic'],
    cost: 26000, transitionQuality: 0.75, choreoQuality: 0.75,
    portrait: '🎵',
  },

  // --- Rising (3) ---
  {
    id: 'choreo_lin', name: '林芷柔',
    quote: '最微小的手指动作也能让观众屏息。',
    type: 'minimalist', tier: 'rising',
    preferredMoods: ['ethereal', 'lyrical'],
    cost: 6000, transitionQuality: 0.65, choreoQuality: 0.60,
    portrait: '✨',
  },
  {
    id: 'choreo_dima', name: '迪玛·卡萨耶夫',
    quote: '要么轰动全场，要么毫无意义。',
    type: 'theatrical', tier: 'rising',
    preferredMoods: ['energetic', 'dramatic'],
    cost: 7000, transitionQuality: 0.55, choreoQuality: 0.65,
    portrait: '🔥',
  },
  {
    id: 'choreo_mina', name: '闵秀雅',
    quote: '古典不是守旧，是对永恒之美的追求。',
    type: 'classical', tier: 'rising',
    preferredMoods: ['lyrical', 'melancholic'],
    cost: 5000, transitionQuality: 0.60, choreoQuality: 0.55,
    portrait: '🦢',
  },
];

// --- Music-Choreographer compatibility ---
const MISMATCH_MAP: Record<ChoreographerType, MusicMood[]> = {
  classical: ['energetic'],
  modern: [],
  theatrical: ['ethereal'],
  minimalist: ['energetic', 'dramatic'],
};

export const getChoreographerReaction = (
  choreo: ChoreographerNPC,
  music: Music
): 'match' | 'neutral' | 'mismatch' => {
  if (choreo.preferredMoods.includes(music.mood)) return 'match';
  if (MISMATCH_MAP[choreo.type]?.includes(music.mood)) return 'mismatch';
  return 'neutral';
};

// Per-choreographer reaction texts
const REACTION_TEXTS: Record<string, Record<'match' | 'neutral' | 'mismatch', string>> = {
  choreo_liang: {
    match: '这首曲子……我已经能看到那个开场了。',
    neutral: '可以的，让我想想怎么处理。',
    mismatch: '这不太是我的领域，建议你考虑其他人选。',
  },
  choreo_viktor: {
    match: '完美！我脑子里已经炸开了烟花！',
    neutral: '嗯……能用，但我需要花点时间找到突破口。',
    mismatch: '这首曲子太安静了，我需要更多能量。',
  },
  choreo_yuki: {
    match: '很好。这首曲子懂得呼吸。',
    neutral: '让我听几遍，也许能找到留白的空间。',
    mismatch: '太满了。我的风格需要更多空间。',
  },
  choreo_nova: {
    match: '这节奏！我已经开始编了！',
    neutral: '有潜力，让我试试不同的角度。',
    mismatch: '这首曲子对我来说有点太传统了。',
  },
  choreo_sakura: {
    match: '这首曲子让我想起了京都的雪夜。',
    neutral: '我能做，但可能需要调整我的习惯思路。',
    mismatch: '恕我直言，这不适合我的编排风格。',
  },
  choreo_marco: {
    match: '太好了！这首曲子本身就是一部电影。',
    neutral: '我得想想怎么给它加一层叙事。',
    mismatch: '嗯……我更擅长有故事感的音乐。',
  },
  choreo_aiko: {
    match: '我已经听到了身体要怎么跟着音乐走。',
    neutral: '有意思，让我研究一下。',
    mismatch: '说实话，这首曲子和我的节奏感不太对。',
  },
  choreo_lin: {
    match: '简单而美丽。我喜欢。',
    neutral: '可以试试，我会尽力的。',
    mismatch: '这首曲子太满了，我会很难发挥。',
  },
  choreo_dima: {
    match: '就是它了！全场都会记住这套节目！',
    neutral: '让我想想怎么把它变得更炸。',
    mismatch: '这……太温柔了，不是我的菜。',
  },
  choreo_mina: {
    match: '这首曲子有古典的优雅。我很喜欢。',
    neutral: '我会尽量找到它的古典内核。',
    mismatch: '这太跳脱了，我可能驾驭不了。',
  },
};

export const getReactionText = (choreoId: string, reaction: 'match' | 'neutral' | 'mismatch'): string => {
  return REACTION_TEXTS[choreoId]?.[reaction] || '……（沉思中）';
};

// --- Choreographer type × Costume theme synergy table ---
export const CHOREO_COSTUME_SYNERGY: Record<ChoreographerType, CostumeTheme[]> = {
  classical: ['elegant', 'classic'],
  modern: ['fierce', 'ethereal'],
  theatrical: ['fierce', 'elegant'],
  minimalist: ['classic', 'ethereal'],
};

export const CHOREO_TYPE_LABELS: Record<ChoreographerType, string> = {
  classical: '古典派', modern: '现代派', theatrical: '戏剧派', minimalist: '极简派',
};

export const CHOREO_TIER_LABELS: Record<string, string> = {
  rising: '新锐', established: '成熟', master: '大师',
};

export const getChoreographerById = (id: string): ChoreographerNPC | undefined => {
  return CHOREOGRAPHER_LIBRARY.find(c => c.id === id);
};

const pick = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

/** Pick n random unique choreographers for market display — guarantees at least 1 rising tier */
export const pickMarketChoreographers = (count: number): ChoreographerNPC[] => {
  const rising = CHOREOGRAPHER_LIBRARY.filter(c => c.tier === 'rising');
  const others = CHOREOGRAPHER_LIBRARY.filter(c => c.tier !== 'rising');

  // Always include 1 random rising-tier choreographer
  const guaranteed = pick(rising);
  const pool = [...others, ...rising.filter(c => c.id !== guaranteed.id)];
  const shuffled = pool.sort(() => Math.random() - 0.5);
  const rest = shuffled.slice(0, Math.min(count - 1, shuffled.length));

  const result = [guaranteed, ...rest];
  // Shuffle final order so rising isn't always first
  return result.sort(() => Math.random() - 0.5);
};
