
import React from 'react';
import { Equipment, Coach, RandomEvent, Sponsorship, TrainingTaskDefinition, MatchAction, MatchStructure, MatchPhaseType, PlayerAttributes, ProgramConfig, ConfigStrategy, ProgramElement } from './types';

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

// ISU Compliant Phase Metadata (7 Elements)
export const PHASE_META: Record<MatchPhaseType, { name: string; icon: string; relevantAttrs: (keyof PlayerAttributes)[] }> = {
  jump_solo: { name: "单跳", icon: "🚀", relevantAttrs: ['jump'] },
  jump_combo: { name: "连跳组合", icon: "⛓️", relevantAttrs: ['jump', 'endurance'] },
  jump_axel: { name: "阿克塞尔跳", icon: "💫", relevantAttrs: ['jump'] },
  spin1: { name: "旋转一", icon: "🌪️", relevantAttrs: ['spin'] },
  spin2: { name: "旋转二", icon: "🌀", relevantAttrs: ['spin'] },
  spin3: { name: "旋转三", icon: "💠", relevantAttrs: ['spin'] },
  step: { name: "接续步", icon: "👣", relevantAttrs: ['step', 'perf'] }
};

// ISU Compliant Match Structures (All 7 Elements)
export const MATCH_STRUCTURES: Record<string, MatchStructure> = {
  low: { 
    id: 'low', 
    name: '地区赛制 (简化)', 
    desc: '简化版本，降低旋转要求，适合新人练习。',
    phases: ['jump_solo', 'jump_combo', 'jump_axel', 'spin1', 'spin2', 'step'] 
  },
  mid: { 
    id: 'mid', 
    name: '标准赛制 (ISU)', 
    desc: '完整的ISU规则：3跳（单跳+连跳+阿克塞尔）+ 3旋转 + 接续步',
    phases: ['jump_solo', 'jump_combo', 'jump_axel', 'spin1', 'spin2', 'spin3', 'step'] 
  },
  high: { 
    id: 'high', 
    name: '锦标赛制 (ISU)', 
    desc: '完整的ISU规则：3跳（单跳+连跳+阿克塞尔）+ 3旋转 + 接续步',
    phases: ['jump_solo', 'jump_combo', 'jump_axel', 'spin1', 'spin2', 'spin3', 'step'] 
  }
};

// ISU Official Action Library (Base Values from ISU Scale of Values 2024-25)
export const ACTION_LIBRARY: MatchAction[] = [
  // --- Solo Jumps (Non-Axel) ---
  { id: 'j_1t', name: '后外点冰一周 (1T)', type: 'jump_solo', baseScore: 0.4, cost: 2, risk: 0.0, reqStats: {}, desc: "BV: 0.40 - 最基础的跳跃" },
  { id: 'j_1s', name: '内结环一周 (1S)', type: 'jump_solo', baseScore: 0.4, cost: 2, risk: 0.0, reqStats: {}, desc: "BV: 0.40 - 入门级跳跃" },
  { id: 'j_1lo', name: '后外结环一周 (1Lo)', type: 'jump_solo', baseScore: 0.5, cost: 3, risk: 0.0, reqStats: {}, desc: "BV: 0.50 - 基础单周跳" },
  { id: 'j_1f', name: '后内点冰一周 (1F)', type: 'jump_solo', baseScore: 0.5, cost: 3, risk: 0.0, reqStats: {}, desc: "BV: 0.50 - 基础单周跳" },
  { id: 'j_1lz', name: '勾手一周 (1Lz)', type: 'jump_solo', baseScore: 0.6, cost: 3, risk: 0.0, reqStats: {}, desc: "BV: 0.60 - 单周跳中最难" },
  
  { id: 'j_2t', name: '后外点冰两周 (2T)', type: 'jump_solo', baseScore: 1.3, cost: 5, risk: 0.03, reqStats: { jump: 15 }, desc: "BV: 1.30 - 两周跳入门" },
  { id: 'j_2s', name: '内结环两周 (2S)', type: 'jump_solo', baseScore: 1.3, cost: 5, risk: 0.03, reqStats: { jump: 15 }, desc: "BV: 1.30 - 常见两周跳" },
  { id: 'j_2lo', name: '后外结环两周 (2Lo)', type: 'jump_solo', baseScore: 1.7, cost: 6, risk: 0.05, reqStats: { jump: 20 }, desc: "BV: 1.70 - 进阶两周跳" },
  { id: 'j_2f', name: '后内点冰两周 (2F)', type: 'jump_solo', baseScore: 1.8, cost: 6, risk: 0.05, reqStats: { jump: 25 }, desc: "BV: 1.80 - 常用两周跳" },
  { id: 'j_2lz', name: '勾手两周 (2Lz)', type: 'jump_solo', baseScore: 2.1, cost: 7, risk: 0.08, reqStats: { jump: 30 }, desc: "BV: 2.10 - 两周跳最高难度" },
  
  { id: 'j_3t', name: '后外点冰三周 (3T)', type: 'jump_solo', baseScore: 4.2, cost: 10, risk: 0.15, reqStats: { jump: 45 }, desc: "BV: 4.20 - 三周跳入门" },
  { id: 'j_3s', name: '内结环三周 (3S)', type: 'jump_solo', baseScore: 4.3, cost: 10, risk: 0.15, reqStats: { jump: 45 }, desc: "BV: 4.30 - 常见三周跳" },
  { id: 'j_3lo', name: '后外结环三周 (3Lo)', type: 'jump_solo', baseScore: 4.9, cost: 12, risk: 0.20, reqStats: { jump: 55 }, desc: "BV: 4.90 - 进阶三周跳" },
  { id: 'j_3f', name: '后内点冰三周 (3F)', type: 'jump_solo', baseScore: 5.3, cost: 13, risk: 0.22, reqStats: { jump: 60 }, desc: "BV: 5.30 - 常用三周跳" },
  { id: 'j_3lz', name: '勾手三周 (3Lz)', type: 'jump_solo', baseScore: 5.9, cost: 15, risk: 0.25, reqStats: { jump: 65 }, desc: "BV: 5.90 - 三周跳最高难度" },
  
  { id: 'j_4t', name: '后外点冰四周 (4T)', type: 'jump_solo', baseScore: 9.5, cost: 22, risk: 0.45, reqStats: { jump: 80 }, desc: "BV: 9.50 - 四周跳入门" },
  { id: 'j_4s', name: '内结环四周 (4S)', type: 'jump_solo', baseScore: 9.7, cost: 23, risk: 0.45, reqStats: { jump: 82 }, desc: "BV: 9.70 - 常见四周跳" },
  { id: 'j_4lo', name: '后外结环四周 (4Lo)', type: 'jump_solo', baseScore: 10.5, cost: 25, risk: 0.50, reqStats: { jump: 85 }, desc: "BV: 10.50 - 进阶四周跳" },
  { id: 'j_4f', name: '后内点冰四周 (4F)', type: 'jump_solo', baseScore: 11.0, cost: 27, risk: 0.55, reqStats: { jump: 88 }, desc: "BV: 11.00 - 高难度四周跳" },
  { id: 'j_4lz', name: '勾手四周 (4Lz)', type: 'jump_solo', baseScore: 11.5, cost: 30, risk: 0.60, reqStats: { jump: 92 }, desc: "BV: 11.50 - 四周跳最高难度" },

  // --- Axel Jumps (Special Category) ---
  { id: 'a_1a', name: '阿克塞尔一周 (1A)', type: 'jump_axel', baseScore: 1.1, cost: 4, risk: 0.02, reqStats: {}, desc: "BV: 1.10 - 阿克塞尔入门" },
  { id: 'a_2a', name: '阿克塞尔两周 (2A)', type: 'jump_axel', baseScore: 3.3, cost: 8, risk: 0.10, reqStats: { jump: 35 }, desc: "BV: 3.30 - 职业选手门槛" },
  { id: 'a_3a', name: '阿克塞尔三周 (3A)', type: 'jump_axel', baseScore: 8.0, cost: 20, risk: 0.40, reqStats: { jump: 75 }, desc: "BV: 8.00 - 王牌级三周半" },
  { id: 'a_4a', name: '阿克塞尔四周 (4A)', type: 'jump_axel', baseScore: 12.5, cost: 35, risk: 0.70, reqStats: { jump: 98 }, desc: "BV: 12.50 - 人类极限(羽生结弦)" },

  // --- Jump Combos ---
  { id: 'c_2t2t', name: '2T+2T', type: 'jump_combo', baseScore: 2.6, cost: 8, risk: 0.05, reqStats: { jump: 20, endurance: 10 }, desc: "BV: 2.60 - 基础连跳" },
  { id: 'c_2a2t', name: '2A+2T', type: 'jump_combo', baseScore: 4.6, cost: 12, risk: 0.12, reqStats: { jump: 40, endurance: 15 }, desc: "BV: 4.60 - 常见连跳" },
  { id: 'c_3t2t', name: '3T+2T', type: 'jump_combo', baseScore: 5.5, cost: 15, risk: 0.18, reqStats: { jump: 50, endurance: 20 }, desc: "BV: 5.50 - 稳健连跳" },
  { id: 'c_3s3t', name: '3S+3T', type: 'jump_combo', baseScore: 8.5, cost: 18, risk: 0.25, reqStats: { jump: 60, endurance: 30 }, desc: "BV: 8.50 - 三周连跳" },
  { id: 'c_3t3t', name: '3T+3T', type: 'jump_combo', baseScore: 8.4, cost: 18, risk: 0.28, reqStats: { jump: 60, endurance: 30 }, desc: "BV: 8.40 - 经典连跳" },
  { id: 'c_3f3t', name: '3F+3T', type: 'jump_combo', baseScore: 9.5, cost: 20, risk: 0.30, reqStats: { jump: 65, endurance: 35 }, desc: "BV: 9.50 - 高分连跳" },
  { id: 'c_3lz3t', name: '3Lz+3T', type: 'jump_combo', baseScore: 10.1, cost: 22, risk: 0.35, reqStats: { jump: 70, endurance: 40 }, desc: "BV: 10.10 - 顶级三周连跳" },
  { id: 'c_3a3t', name: '3A+3T', type: 'jump_combo', baseScore: 12.2, cost: 28, risk: 0.45, reqStats: { jump: 80, endurance: 50 }, desc: "BV: 12.20 - 王牌连跳" },
  { id: 'c_4t3t', name: '4T+3T', type: 'jump_combo', baseScore: 13.7, cost: 32, risk: 0.55, reqStats: { jump: 85, endurance: 60 }, desc: "BV: 13.70 - 四周连跳" },
  { id: 'c_4s3t', name: '4S+3T', type: 'jump_combo', baseScore: 13.9, cost: 33, risk: 0.55, reqStats: { jump: 87, endurance: 60 }, desc: "BV: 13.90 - 高难度连跳" },
  { id: 'c_4lz3t', name: '4Lz+3T', type: 'jump_combo', baseScore: 15.7, cost: 40, risk: 0.70, reqStats: { jump: 95, endurance: 75 }, desc: "BV: 15.70 - 传奇级连跳" },

  // --- Spins (All 3 Slots) ---
  { id: 's1_upright', name: '直立旋转 (USp)', type: 'spin1', baseScore: 1.0, cost: 4, risk: 0.0, reqStats: {}, desc: "BV: 1.00 (Base Lv1) - 基础旋转" },
  { id: 's1_upright2', name: '直立旋转Lv2 (USp2)', type: 'spin1', baseScore: 1.5, cost: 5, risk: 0.05, reqStats: { spin: 20 }, desc: "BV: 1.50 - 进阶直立" },
  { id: 's1_upright3', name: '直立旋转Lv3 (USp3)', type: 'spin1', baseScore: 1.9, cost: 6, risk: 0.08, reqStats: { spin: 40 }, desc: "BV: 1.90 - 高级直立" },
  { id: 's1_upright4', name: '直立旋转Lv4 (USp4)', type: 'spin1', baseScore: 2.4, cost: 7, risk: 0.10, reqStats: { spin: 60 }, desc: "BV: 2.40 - 满级直立" },
  
  { id: 's2_sit', name: '蹲踞旋转 (SSp)', type: 'spin2', baseScore: 1.1, cost: 5, risk: 0.02, reqStats: {}, desc: "BV: 1.10 (Base Lv1) - 基础蹲踞" },
  { id: 's2_sit2', name: '蹲踞旋转Lv2 (SSp2)', type: 'spin2', baseScore: 1.6, cost: 6, risk: 0.05, reqStats: { spin: 25 }, desc: "BV: 1.60 - 进阶蹲踞" },
  { id: 's2_sit3', name: '蹲踞旋转Lv3 (SSp3)', type: 'spin2', baseScore: 2.1, cost: 7, risk: 0.08, reqStats: { spin: 45 }, desc: "BV: 2.10 - 高级蹲踞" },
  { id: 's2_sit4', name: '蹲踞旋转Lv4 (SSp4)', type: 'spin2', baseScore: 2.5, cost: 8, risk: 0.10, reqStats: { spin: 65 }, desc: "BV: 2.50 - 满级蹲踞" },
  
  { id: 's3_camel', name: '燕式旋转 (CSp)', type: 'spin3', baseScore: 1.1, cost: 5, risk: 0.02, reqStats: {}, desc: "BV: 1.10 (Base Lv1) - 基础燕式" },
  { id: 's3_camel2', name: '燕式旋转Lv2 (CSp2)', type: 'spin3', baseScore: 1.8, cost: 6, risk: 0.05, reqStats: { spin: 25 }, desc: "BV: 1.80 - 进阶燕式" },
  { id: 's3_camel3', name: '燕式旋转Lv3 (CSp3)', type: 'spin3', baseScore: 2.3, cost: 7, risk: 0.08, reqStats: { spin: 50 }, desc: "BV: 2.30 - 高级燕式" },
  { id: 's3_camel4', name: '燕式旋转Lv4 (CSp4)', type: 'spin3', baseScore: 2.6, cost: 8, risk: 0.10, reqStats: { spin: 70 }, desc: "BV: 2.60 - 满级燕式" },
  { id: 's3_combo', name: '联合旋转 (CoSp)', type: 'spin3', baseScore: 1.5, cost: 6, risk: 0.05, reqStats: { spin: 30 }, desc: "BV: 1.50 (Lv1) - 姿态变化" },
  { id: 's3_combo4', name: '联合旋转Lv4 (CoSp4)', type: 'spin3', baseScore: 3.5, cost: 10, risk: 0.15, reqStats: { spin: 80 }, desc: "BV: 3.50 - 顶级联合旋转" },
  { id: 's3_fly', name: '跳接旋转Lv4 (FCSp4)', type: 'spin3', baseScore: 3.2, cost: 9, risk: 0.12, reqStats: { spin: 75, jump: 40 }, desc: "BV: 3.20 - 跳接燕式" },

  // --- Step Sequences ---
  { id: 'st_base', name: '接续步Lv1 (StSq1)', type: 'step', baseScore: 1.8, cost: 8, risk: 0.05, reqStats: {}, desc: "BV: 1.80 - 基础步法" },
  { id: 'st_mid', name: '接续步Lv2 (StSq2)', type: 'step', baseScore: 2.6, cost: 12, risk: 0.10, reqStats: { step: 35 }, desc: "BV: 2.60 - 进阶步法" },
  { id: 'st_high', name: '接续步Lv3 (StSq3)', type: 'step', baseScore: 3.3, cost: 16, risk: 0.15, reqStats: { step: 60 }, desc: "BV: 3.30 - 高级步法" },
  { id: 'st_pro', name: '接续步Lv4 (StSq4)', type: 'step', baseScore: 3.9, cost: 20, risk: 0.20, reqStats: { step: 85 }, desc: "BV: 3.90 - 满级步法" },
];

export const TRAINING_TASKS: Record<string, TrainingTaskDefinition> = {
  jump: { id: 'jump', name: '四周跳', color: 'bg-red-600', targetAttr: 'jump', baseGain: 1.2, staCost: 22, desc: "突破极限 (消耗大)" },
  spin: { id: 'spin', name: '柔韧旋转', color: 'bg-indigo-500', targetAttr: 'spin', baseGain: 0.9, staCost: 12, desc: "提升稳定与柔韧" },
  step: { id: 'step', name: '步法滑行', color: 'bg-cyan-600', targetAttr: 'step', baseGain: 0.9, staCost: 14, desc: "双修技术与艺术" },
  perf: { id: 'perf', name: '表现力', color: 'bg-purple-600', targetAttr: 'perf', baseGain: 1.0, staCost: 12, desc: "增强感染力 (PCS)" },
  endurance: { id: 'endurance', name: '核心耐力', color: 'bg-amber-600', targetAttr: 'endurance', baseGain: 0.8, staCost: 18, desc: "抗疲劳与减耗" },
  rest: { id: 'rest', name: '深度理疗', color: 'bg-slate-700', baseGain: 0, staCost: -28, desc: "恢复大量体力" }
};

export const LOADING_QUOTES = [
  "正在打磨冰刀，极致的锋利是稳定的基础。",
  "四周跳不仅是技术，更是对地心引力的宣战。",
  "你知道吗？一场高强度的自由滑消耗的能量相当于跑完十公里。",
  "考斯滕上的每一颗水钻，都是选手个性的延伸。",
  "正在清理冰面，好的冰面才能做出完美的接续步。",
  "教练正在场边喝咖啡，顺便观察你的用刃是否准确。",
  "音乐响起前的那一秒，全世界都是安静的。",
  "摔倒并不可怕，可怕的是不敢再次起跳。",
  "选手在冰上的每一次旋转，都是对时间和空间的挑战。",
  "冰面反射的光芒，是对努力最温柔的奖赏。",
  "连跳前的那一瞬间，心跳和呼吸都像节拍器一样精准。",
  "舞步的每一次滑行，都在讲述一个关于坚持的故事。",
  "训练的汗水，最终都会在比赛的光芒中闪耀。",
  "冰刀划过的痕迹，是短暂却美丽的艺术线条。",
  "心理稳定比技术动作更难掌控，但同样重要。",
  "每一次完美的落冰，都是对训练日复一日的回报。",
  "裁判打分的瞬间，你会感受到冰上努力的重量。",
  "准备起跳时，请想象风都在为你让路。",
  "每一次旋转结束的平衡，都是对力量和柔韧的考验。",
  "冰场上的每一分每一秒，都在为下一次精彩铺路。"
];

// 本地解说语料库（扩展版）
export const COMMENTARY_CORPUS = {
  gold: [
    "完美无瑕！这不仅仅是一场比赛，更是一场冰上的史诗级演出！",
    "全场起立鼓舞！我们见证了一个新传奇的诞生，这枚金牌实至名归。",
    "每一个跳跃都像精确的钟表一样准确，今晚的冰场属于你！",
    "裁判打出了惊人的高分！这套节目将被载入花滑史册。",
    "你是冰面上的主宰，这种统治力让对手感到绝望。",
    "旋转如同风中飞舞的叶子，动作流畅到每一帧都令人屏息。",
    "每一次跳跃都充满力量与艺术的完美结合，堪称教科书级表现。",
    "今晚，你不仅赢得了分数，更赢得了观众的心。"
  ],
  podium: [
    "非常稳健的发挥，领奖台上已经为你留好了位置。",
    "虽然有一点点小瑕疵，但整体的艺术感染力征服了全场。",
    "这是一场高水平的较量，你证明了自己属于世界顶尖行列。",
    "极其富有张力的表演，这枚奖牌是对你刻苦训练的最好回报。",
    "你的滑行如丝般顺滑，恭喜你再次站在了聚光灯中心。",
    "每一个动作都充满自信，你的努力已经得到应有的认可。",
    "稳中带美的演出，让人忍不住为你的未来充满期待。",
    "这枚奖牌不仅是成绩的象征，更是坚持与激情的结晶。"
  ],
  mid: [
    "中规中矩的演出，虽然没有大错，但也缺乏一些亮眼的爆点。",
    "基本完成了预定的难度，但艺术分的潜力还有待进一步挖掘。",
    "在强手如林的比赛中保持了这个位次，是一个扎实的进步。",
    "体能似乎在后半程有所下滑，但核心动作都保住了，继续努力！",
    "这是一次宝贵的经验，你已经离顶级梯队越来越近了。",
    "动作完成度一般，但表现力仍然可圈可点，继续磨练细节。",
    "小小的失误未能掩盖整体节目的完整性，值得肯定。",
    "每一次落冰和旋转都在积累经验，为下一场比赛打下基础。"
  ],
  low: [
    "今天似乎不在状态，几次跳跃的落冰都显得有些挣扎。",
    "比赛就是这样有起有伏，不要因为一次的失利而否定自己的努力。",
    "冰面今天对你来说似乎有些滑，没关系，回去调整好心态再出发。",
    "技术动作出现了严重失误，但你坚持完成了比赛，这份韧性值得尊重。",
    "下一次，我们会以更强的姿态回到这个冰场。",
    "动作连贯性不足，但你在努力把控节奏，这是成长的一部分。",
    "精神状态稍显紧张，但整体完成度还算稳妥，继续打磨。",
    "今天的表现提醒我们，比赛不仅仅是技巧，更是心理和策略的较量。"
  ]
};


// 事件描述语料库
export const EVENT_NARRATIVES: Record<string, string[]> = {
  ev_fan_letter: [
    "清晨，训练场门口堆满了五颜六色的信封，每一封都承载着冰迷的爱。",
    "你读着那些笔触稚嫩的鼓励信，感觉训练的疲劳瞬间烟消云散。"
  ],
  ev_ice_quality: [
    "冰场管理员今天心情大好，把冰面浇得像镜子一样完美。",
    "当冰刀划过刚浇好的冰面，那种无阻力的快感让你沉醉。"
  ],
  ev_stretch: [
    "瑜伽老师的‘折磨’虽然让你惨叫连连，但身体确实变得轻盈了许多。",
    "每一次拉伸都在突破极限，你的动作线条变得更加优美动人。"
  ],
  ev_night_practice: [
    "黑暗中只有一束聚光灯，你在寂静中完成了无数次起跳。",
    "凌晨三点的冰场很冷，但你内心的火焰烧得正旺。"
  ],
  ev_viral_video: [
    "你在练习时的神级落冰被路人拍下，点赞量瞬间突破了百万！",
    "一夜之间，你成了社交媒体上的‘冰上精灵’，私信被塞满了。"
  ],
  ev_bad_sleep: [
    "时钟滴答作响，比赛的压力让你在床上翻来覆去无法入眠。",
    "带着黑眼圈踏上冰场，感觉双腿像灌了铅一样沉重。"
  ],
  ev_major_injury: [
    "冰场上响起了清脆的一声，随后是钻心的疼痛。所有人都围了过来...",
    "医生的诊断证明像一张沉重的判决书，你不得不暂时告别心爱的冰场。"
  ],
  ev_masterclass: [
    "曾经的奥运冠军指着你的用刃点拨了几句，让你瞬间茅塞顿开。",
    "那种只有顶级选手才懂的‘冰感’，在这一刻传达到了你的心中。"
  ]
};

export const COACHES: Coach[] = [
  { id: 'coach_1', name: '基础教练', tecMod: 1.0, artMod: 1.0, salary: 1000, tier: 'basic' },
  { id: 'coach_2', name: '专业教练', tecMod: 1.25, artMod: 1.15, salary: 3500, tier: 'pro' },
  { id: 'coach_3', name: '国家级教练', tecMod: 1.4, artMod: 1.4, salary: 8000, tier: 'pro' },
  { id: 'coach_4', name: '传奇教练', tecMod: 1.7, artMod: 1.8, salary: 20000, tier: 'legend' },
];

export const RANDOM_EVENTS: RandomEvent[] = [
  { id: 'ev_fan_letter', name: '冰迷的鼓励', description: '收到了一大叠来自世界各地冰迷的信件，心情大好。', chance: 0.5, isRare: false, type: 'positive', effect: { sta: 10, fame: 2 } },
  { id: 'ev_ice_quality', name: '完美冰面', description: '今天的冰场刚刚浇过冰，滑行感觉从未如此丝滑。', chance: 0.4, isRare: false, type: 'positive', effect: { jump: 1, step: 2 } },
  { id: 'ev_stretch', name: '深度瑜伽课', description: '在教练的建议下参加了高强度拉伸，身体柔韧性有所提升。', chance: 0.4, isRare: false, type: 'positive', effect: { spin: 2, perf: 1, sta: -5 } },
  { id: 'ev_night_practice', name: '深夜加练', description: '灯光熄灭后的冰场只有你一人，这一晚你的跳跃格外稳定。', chance: 0.3, isRare: false, type: 'positive', effect: { jump: 3, sta: -15 } },
  { id: 'ev_music_insp', name: '旋律灵感', description: '在漫步时听到一段旋律，突然对节目的表现力有了新感悟。', chance: 0.3, isRare: false, type: 'positive', effect: { perf: 3 } },
  { id: 'ev_local_news', name: '地方媒体报道', description: '当地体育报纸对你进行了专访。', chance: 0.3, isRare: false, type: 'positive', effect: { fame: 5, money: 1000 } },
  { id: 'ev_bad_sleep', name: '赛前焦虑', description: '持续失眠导致训练时精神难以集中，感觉身体异常沉重。', chance: 0.4, isRare: false, type: 'negative', effect: { sta: -20, endurance: -2 } },
  { id: 'ev_blade_dull', name: '冰刀变钝', description: '训练中发现冰刀由于磨损失去了抓地力，几个动作出现了失误。', chance: 0.3, isRare: false, type: 'negative', effect: { jump: -2, step: -1, money: -500 } },
  { id: 'ev_cold', name: '突发感冒', description: '换季期间不慎感冒，只能带病坚持训练。', chance: 0.3, isRare: false, type: 'negative', effect: { sta: -25, endurance: -3 } },
  { id: 'ev_costume_rip', name: '服装损坏', description: '考斯滕在试穿时意外勾破，修补费用不菲。', chance: 0.2, isRare: false, type: 'negative', effect: { perf: -2, money: -2000 } },
  { id: 'ev_nutrition', name: '饮食违规', description: '一时没忍住吃了油腻食物，体重微增影响了起跳。', chance: 0.3, isRare: false, type: 'negative', effect: { jump: -1, endurance: -1, sta: -10 } },
  { id: 'ev_sponsor_watch', name: '奢侈品代言', description: '顶级腕表品牌决定签下你作为他们的冰上大使。', chance: 0.05, isRare: true, type: 'positive', effect: { money: 60000, fame: 80 } },
  { id: 'ev_major_injury', name: '严重扭伤', description: '在尝试高难度跳跃时落地不稳，脚踝发出了令人不安的声音。', chance: 0.03, isRare: true, type: 'negative', effect: { jump: -5, step: -5, injuryMonths: 4 } },
  { id: 'ev_viral_video', name: '短视频爆火', description: '你的训练视频配上热门乐曲在社交媒体疯狂传播，粉丝数激增。', chance: 0.08, isRare: true, type: 'positive', effect: { fame: 150, money: 8000 } },
  { id: 'ev_masterclass', name: '传奇大师课', description: '一位退役的奥运冠军偶然路过冰场，给了你一些终身受用的点拨。', chance: 0.04, isRare: true, type: 'positive', effect: { jump: 3, spin: 3, step: 3, perf: 3 } },
  { id: 'ev_equipment_failure', name: '冰鞋断裂', description: '使用了很久的冰鞋在落地时彻底断裂，这对新赛季是巨大的打击。', chance: 0.02, isRare: true, type: 'negative', effect: { jump: -4, step: -2, money: -5000, sta: -15 } },
  { id: 'ev_mental_breakthrough', name: '心境突破', description: '你终于克服了对四周跳的恐惧，在心理上跨出了一大步。', chance: 0.06, isRare: true, type: 'positive', effect: { jump: 5, perf: 3 } },
];

export const SURNAME = [
  // 中文姓
  "金","陈","刘","王","李","张","赵","彭","朱","闫","隋","何","林","杨","高","周","郑","胡","蒋","吴","孙","徐","曹","董","韩","赖","冯","曾","姚","范","方","谢","许","邓",
  // 日本姓
  "宇野","羽生","键山","宫原","本田","纪平","三宅","佐藤","坂本","小林","高桥","村元","樋口","中野","加藤","铃木","田中","松本","森","山本","吉田","石川","川口","清水","藤井",
  // 俄罗斯姓
  "谢尔巴科娃","特鲁索娃","瓦利耶娃","图克塔米舍娃","科斯托娜娅","扎吉托娃","普鲁申科","伊格纳托娃","卡萨托诺娃","库兹涅佐娃","帕夫柳琴科","萨夫琴科","舒斯托娃","奥布拉佐娃",
  // 欧洲/美洲姓
  "戈尔德","哈贝尔","费尔南德斯","帕帕达吉斯","布朗","拜尔斯","内森","文森特","麦迪逊","凯文","哈维尔","约翰逊","史密斯","威尔逊","泰勒","安德森","乔治","亚当斯","克里斯蒂","霍尔"
];

export const GIVEN = [
  // 中文名
  "博洋","巍","一帆","子涵","天一","梦洁","文静","聪","程","梨花","俊焕","诗涵","佳宁","雨辰","依然","思远","子墨","若水","欣怡","睿","嘉豪","晓琳","梓涵","思琪","佳琦","浩然","俊杰","婉婷","文轩","晓东",
  // 日本名
  "昌磨","结弦","优真","花织","真央","舞","樱","光","翔","步","健","奈","葵","大翔","海斗","凉介","瑞希","仁美","和也","悠人","悠真","爱菜","由纪","彩花","理沙","遥","琴音","葵","直人","蓮",
  // 俄罗斯名
  "安娜","伊利亚","亚历山德拉","伊丽莎白","玛丽亚","叶卡捷琳娜","丹尼尔","米哈伊尔","奥列格","维克多","斯维特拉娜","娜塔莉亚","尤里","奥尔加","阿列克谢","瓦伦丁","伊戈尔","安德烈","伊琳娜","索菲亚","尤利娅","安东","列夫","妮可","丹娜","米拉","奥克萨娜","尼基塔",
  // 欧美名
  "内森","文森特","麦迪逊","哈维尔","凯文","约翰","艾米丽","莎拉","克里斯","丹尼尔","莉莉","本杰明","亚当","艾伦","奥利维亚","詹姆斯","露西","查理","艾玛","伊桑","汉娜","索菲","亨利","伊莎贝拉","索尔","克莱尔","诺亚","莱拉","亚历克斯","丽贝卡","杰森"
];

export const CITIES = ["北京", "上海", "东京", "巴黎", "莫斯科", "纽约", "米兰", "首尔", "温哥华"];
export const REGIONS = ["东亚", "欧洲", "北美", "大洋洲"];

export const EQUIP_NAMES = {
  skate: ["冰鞋", "专业靴", "定制皮靴", "钛金支撑靴"],
  blade: ["冰刀", "碳纤维钢刀", "黄金利刃", "极光之刃"],
  costume: ["考斯滕", "演出服", "高定华服", "丝绸战衣"]
};

export const CHOREO_NAMES = [
  "一步之遥", "月光", "黑天鹅", "图兰朵", "辛德勒名单",
  "秋日私语", "歌剧魅影", "波莱罗", "冬", "春之祭",
  "天鹅湖", "卡门", "蓝色多瑙河", "红与黑", "梦幻旋律",
  "夜的钢琴曲", "黎明前的舞步", "孤独的旅人", "冰雪奇缘", "夜空之歌",
  "风之影", "星河彼岸", "深海之心", "烈焰之舞", "流光溢彩",
  "镜中花", "落叶归根", "流沙", "樱花纷飞", "幽灵圆舞曲",
  "黑夜序曲", "晨曦的呼吸", "黄昏的旋律", "云端之舞", "梦境漫步",
  "水墨情缘", "极光之恋", "雪夜交响", "海潮之歌", "暗香浮动",
  "静谧时光", "焰火与冰霜"
];

// Program Configuration Helper Functions

/**
 * Generate automatic program configuration based on strategy
 * @param stats - Player attributes
 * @param phases - Match phases (default order)
 * @param strategy - conservative | balanced | aggressive
 * @returns ProgramConfig with ordered elements
 */
export const generateProgramConfig = (
  stats: PlayerAttributes,
  phases: MatchPhaseType[],
  strategy: ConfigStrategy
): ProgramConfig => {
  const elements: ProgramElement[] = [];
  
  // Risk thresholds for each strategy
  const riskThresholds = {
    conservative: 0.25,  // Max 25% fail chance
    balanced: 0.40,      // Max 40% fail chance
    aggressive: 0.70     // Max 70% fail chance
  };
  
  const maxRisk = strategy === 'custom' ? 0.40 : riskThresholds[strategy];
  
  phases.forEach(phase => {
    // Get all valid actions for this phase
    const validActions = ACTION_LIBRARY.filter(a => {
      if (a.type !== phase) return false;
      
      // Check attribute requirements
      for (const [key, val] of Object.entries(a.reqStats)) {
        if ((stats[key as keyof PlayerAttributes] || 0) < val) return false;
      }
      
      // Check risk level (for jumps primarily)
      if (strategy !== 'aggressive' && (phase.includes('jump') || phase.includes('axel'))) {
        if (a.risk > maxRisk) return false;
      }
      
      return true;
    });
    
    let selectedAction;
    
    if (validActions.length === 0) {
      // Fallback: pick easiest action for this phase
      const fallback = ACTION_LIBRARY.find(act => act.type === phase);
      selectedAction = fallback;
    } else {
      // Select action based on strategy
      if (strategy === 'conservative') {
        // Pick highest BV with acceptable risk
        selectedAction = validActions
          .filter(a => a.risk <= maxRisk)
          .sort((a, b) => b.baseScore - a.baseScore)[0];
        
        if (!selectedAction) {
          selectedAction = validActions.sort((a, b) => a.risk - b.risk)[0];
        }
      } else if (strategy === 'aggressive') {
        // Pick highest BV regardless of risk
        selectedAction = validActions.sort((a, b) => b.baseScore - a.baseScore)[0];
      } else {
        // Balanced: Pick best score/risk ratio
        selectedAction = validActions
          .map(a => ({
            action: a,
            score: a.baseScore / (1 + a.risk * 2) // Penalty for high risk
          }))
          .sort((a, b) => b.score - a.score)[0].action;
      }
    }
    
    if (selectedAction) {
      elements.push({ phase, actionId: selectedAction.id });
    }
  });
  
  return { elements };
};

/**
 * Get action details from config by element index
 */
export const getActionFromElement = (element: ProgramElement) => {
  return ACTION_LIBRARY.find(a => a.id === element.actionId);
};

/**
 * Calculate total Base Value of a program configuration
 */
export const calculateConfigTotalBV = (config: ProgramConfig): number => {
  let total = 0;
  config.elements.forEach(elem => {
    const action = getActionFromElement(elem);
    if (action) total += action.baseScore;
  });
  return total;
};

/**
 * Calculate average risk of a program configuration
 */
export const calculateConfigAvgRisk = (config: ProgramConfig): number => {
  let totalRisk = 0;
  let count = 0;
  config.elements.forEach(elem => {
    const action = getActionFromElement(elem);
    if (action) {
      totalRisk += action.risk;
      count++;
    }
  });
  return count > 0 ? totalRisk / count : 0;
};
