import {
  ProgramBlueprint, BlueprintSegment, ChoreographerNPC, Music,
  MatchPhaseType, ChoreographerType, MusicStructure,
} from '../../types';

// --- Emotional beat vocabulary ---
interface EmotionalBeat {
  id: string;
  label: string;
  templates: string[];
}

const EMOTIONAL_BEATS: EmotionalBeat[] = [
  {
    id: 'calm_opening', label: '宁静开篇',
    templates: [
      '从冰场中央的静止开始，{body}。',
      '一片沉默中，{body}，如同从梦中醒来。',
      '灯光亮起，{body}，世界只剩下冰面和呼吸。',
    ],
  },
  {
    id: 'rising', label: '渐强推进',
    templates: [
      '动作幅度逐渐加大，{skate}。',
      '节奏渐渐加快，{skate}，气场开始扩散。',
      '{body}，速度一点一点攀升。',
    ],
  },
  {
    id: 'climax', label: '戏剧爆发',
    templates: [
      '突然的停顿，然后{burst}！',
      '所有能量在一瞬间释放，{burst}。',
      '{burst}，全场的空气仿佛凝固。',
    ],
  },
  {
    id: 'introspection', label: '情感内收',
    templates: [
      '收拢双臂，{inner}，像在和自己对话。',
      '速度放缓，{inner}，一切归于内心。',
      '{inner}，表情中藏着千言万语。',
    ],
  },
  {
    id: 'return', label: '回归沉静',
    templates: [
      '一切慢下来，最后{ending}。',
      '旋律消散，{ending}，故事到此为止。',
      '{ending}，冰场重新归于寂静。',
    ],
  },
];

// --- Movement vocabulary by choreographer style ---
const MOVEMENT_VOCAB: Record<ChoreographerType, {
  body: string[];
  skate: string[];
  burst: string[];
  inner: string[];
  ending: string[];
}> = {
  classical: {
    body: ['缓缓抬起手臂', '舒展双臂如天鹅展翅', '以优雅的弧线伸展身体'],
    skate: ['一道长弧线横贯冰面', '交叉步如行云流水', '以标准的后外刃滑出优美的弧线'],
    burst: ['旋转中猛然定格', '一个干净利落的转身', '双臂用力向外展开'],
    inner: ['轻轻低下头', '双手交叠于胸前', '以最柔和的动作诉说情感'],
    ending: ['以一个经典的谢幕造型定格', '缓缓单膝触冰', '双臂在身侧如落叶般下沉'],
  },
  modern: {
    body: ['以一个打破常规的姿态开始', '不对称地扭转身体', '用肩膀引领身体的流动'],
    skate: ['节奏感十足的交叉步推进', '蛇形滑行穿过整个冰面', '大幅度的变刃加速'],
    burst: ['从蹲姿弹射而起', '一连串快速的身体波浪', '打破节奏的突然加速'],
    inner: ['用手掌覆住面部', '蜷缩后再次舒展', '以地板动作触碰冰面'],
    ending: ['以一个意料之外的姿态收束', '突然静止，一只手指向远方', '滑行中渐渐降速直到静止'],
  },
  theatrical: {
    body: ['以一个戏剧性的回眸开始', '张开双臂如同拥抱整个世界', '一个充满仪式感的手势'],
    skate: ['带着表演性质的大幅度滑行', '目光扫过全场观众的滑行', '充满力量感的推进'],
    burst: ['猛烈地向天空伸出手臂', '一个震撼全场的旋转入位', '仿佛被音乐击中般的停顿'],
    inner: ['以慢动作回顾来路', '双手颤抖着缓缓下垂', '一个痛苦而美丽的表情'],
    ending: ['仰面朝天张开双臂', '单膝跪地，一只手伸向前方', '以一个戏剧性的造型定格'],
  },
  minimalist: {
    body: ['仅仅是微微侧身', '一个极简的手臂动作', '以最小的动作幅度开始'],
    skate: ['笔直而纯粹的滑行', '以最少的动作横贯冰面', '无声的大弧线'],
    burst: ['突然加速——只有速度的变化', '一个干脆的定格', '仅一个方向的猛然转换'],
    inner: ['闭上眼睛，什么都不做', '仅仅是呼吸', '一个几乎看不见的微笑'],
    ending: ['静静地滑向远方', '在冰场边缘缓缓停下', '保持最后的姿态，不动'],
  },
};

// --- Transition templates ---
interface TransitionTemplate {
  from: string; // 'choreo', 'jump', 'spin', 'step'
  to: string;
  templates: string[];
}

const TRANSITION_TEMPLATES: TransitionTemplate[] = [
  { from: 'choreo', to: 'jump', templates: [
    '编舞段落的最后动作自然转化为助滑', '从表演姿态流畅地过渡到起跳准备', '一段加速滑行连接到起跳点',
  ]},
  { from: 'choreo', to: 'spin', templates: [
    '从编舞的旋律感中自然地旋入', '表演段的最后一个动作变成旋转准备姿态', '一个优雅的转身引入旋转',
  ]},
  { from: 'choreo', to: 'step', templates: [
    '编舞的节奏感无缝衔接到步法', '从自由表演过渡到规定步法', '身体的律动从自由变为精确',
  ]},
  { from: 'jump', to: 'choreo', templates: [
    '落冰后的余速转化为表演滑行', '稳稳落冰后，动作变得柔和', '跳跃的能量在编舞中缓缓释放',
  ]},
  { from: 'spin', to: 'choreo', templates: [
    '旋转收束后顺势展开为表演', '旋转的最后一圈变成一个造型', '从旋转出来，带着余韵滑入表演',
  ]},
  { from: 'step', to: 'choreo', templates: [
    '步法的最后几步自然过渡到自由表演', '精确的步法逐渐放松为编舞', '从规定动作中解放出来',
  ]},
  { from: 'jump', to: 'jump', templates: [
    '落冰后迅速调整重心，准备下一跳', '一个简短的滑行衔接两个跳跃', '利用落冰的惯性直接进入助滑',
  ]},
  { from: 'spin', to: 'spin', templates: [
    '从一个旋转位置变换到另一个', '短暂的滑行连接两组旋转', '旋转间以优雅的过渡衔接',
  ]},
  { from: 'jump', to: 'spin', templates: [
    '跳跃落冰后的旋转余力带入旋转', '落冰后一个小弧线直接进入旋转', '从跳跃的力量过渡到旋转的控制',
  ]},
  { from: 'spin', to: 'jump', templates: [
    '旋转结束后借势加速助滑', '从旋转出来，迅速切换到跳跃准备', '旋转收束后的加速令人屏息',
  ]},
];

// --- Music structure → emotional beat sequence ---
const STRUCTURE_BEAT_MAP: Record<MusicStructure, string[]> = {
  gradual:   ['calm_opening', 'rising', 'rising', 'climax', 'return'],
  explosive: ['climax', 'introspection', 'rising', 'introspection', 'return'],
  cyclic:    ['calm_opening', 'climax', 'introspection', 'climax', 'return'],
  narrative: ['calm_opening', 'rising', 'introspection', 'climax', 'return'],
};

// --- Element recommendations ---
const ELEMENT_RECOMMENDATIONS: Record<MatchPhaseType, string[]> = {
  jump_solo:  ['力量型跳跃', '标志性单跳', '高难度旋转跳'],
  jump_combo: ['最强连跳组合', '稳定连跳', '具有冲击力的连跳'],
  jump_axel:  ['阿克塞尔跳', '签名阿克塞尔'],
  spin1:      ['开场旋转', '抒情旋转', '展示柔韧性的旋转'],
  spin2:      ['技术旋转', '变换姿态旋转', '高速旋转'],
  spin3:      ['收尾旋转', '联合旋转', '最高等级旋转'],
  step:       ['全场步法', '展示滑行技术的步法', '音乐诠释型步法'],
};

// --- Core generation ---

const pick = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

function getPhaseCategory(phase: MatchPhaseType): string {
  if (phase.startsWith('jump')) return 'jump';
  if (phase.startsWith('spin')) return 'spin';
  return 'step';
}

function findTransitionTemplate(from: string, to: string): string {
  const match = TRANSITION_TEMPLATES.find(t => t.from === from && t.to === to);
  if (match) return pick(match.templates);
  // Fallback
  const fallback = TRANSITION_TEMPLATES.find(t => t.from === from);
  if (fallback) return pick(fallback.templates);
  return '一段流畅的过渡衔接';
}

function fillBeatTemplate(template: string, vocab: typeof MOVEMENT_VOCAB['classical']): string {
  return template
    .replace('{body}', pick(vocab.body))
    .replace('{skate}', pick(vocab.skate))
    .replace('{burst}', pick(vocab.burst))
    .replace('{inner}', pick(vocab.inner))
    .replace('{ending}', pick(vocab.ending));
}

export const generateBlueprint = (
  choreo: ChoreographerNPC,
  music: Music,
  phases: MatchPhaseType[]
): ProgramBlueprint => {
  const beatSequence = STRUCTURE_BEAT_MAP[music.structure];
  const vocab = MOVEMENT_VOCAB[choreo.type];

  const segments: BlueprintSegment[] = [];
  const transitions: number[] = [];
  const impressions: number[] = [];

  // Interleave: choreo_beat[0] → transition → element[0] → transition → choreo_beat[1] → ...
  let beatIdx = 0;

  for (let i = 0; i < phases.length; i++) {
    // Insert choreographic sequence before each element (use available beats, cycle if needed)
    if (beatIdx < beatSequence.length) {
      const beatId = beatSequence[beatIdx];
      const beat = EMOTIONAL_BEATS.find(b => b.id === beatId) || EMOTIONAL_BEATS[0];
      const template = pick(beat.templates);
      const description = fillBeatTemplate(template, vocab);
      const baseImpression = choreo.choreoQuality * (0.8 + Math.random() * 0.4);
      const impression = Math.min(1.0, baseImpression);
      impressions.push(impression);

      segments.push({
        type: 'choreo',
        data: { description, emotionalBeat: beat.label, impressionScore: impression },
      });
      beatIdx++;
    }

    // Transition: from choreo/previous-element to current element
    const prevCategory = i === 0 ? 'choreo' : getPhaseCategory(phases[i - 1]);
    const currCategory = getPhaseCategory(phases[i]);
    const transDesc = findTransitionTemplate(
      segments.length > 0 && segments[segments.length - 1].type === 'choreo' ? 'choreo' : prevCategory,
      currCategory
    );
    const baseTransQuality = choreo.transitionQuality * (0.7 + Math.random() * 0.6);
    const transQuality = Math.min(1.0, baseTransQuality);
    transitions.push(transQuality);

    segments.push({
      type: 'transition',
      data: { description: transDesc, quality: transQuality },
    });

    // Element slot
    const recommendation = pick(ELEMENT_RECOMMENDATIONS[phases[i]]);
    segments.push({
      type: 'element',
      slotIndex: i,
      phase: phases[i],
      recommendation,
    });
  }

  // Final choreographic sequence (ending)
  if (beatIdx < beatSequence.length) {
    const beatId = beatSequence[beatIdx];
    const beat = EMOTIONAL_BEATS.find(b => b.id === beatId) || EMOTIONAL_BEATS[EMOTIONAL_BEATS.length - 1];
    const template = pick(beat.templates);
    const description = fillBeatTemplate(template, vocab);
    const impression = Math.min(1.0, choreo.choreoQuality * (0.8 + Math.random() * 0.4));
    impressions.push(impression);
    segments.push({
      type: 'choreo',
      data: { description, emotionalBeat: beat.label, impressionScore: impression },
    });
  }

  const totalTransitionQuality = transitions.length > 0
    ? transitions.reduce((a, b) => a + b, 0) / transitions.length
    : 0.5;
  const totalChoreoImpression = impressions.length > 0
    ? impressions.reduce((a, b) => a + b, 0) / impressions.length
    : 0.5;

  return {
    id: `bp_${Date.now()}_${Math.floor(Math.random() * 10000)}`,
    name: music.name,
    segments,
    totalTransitionQuality,
    totalChoreoImpression,
    choreographerId: choreo.id,
    musicId: music.id,
  };
};
