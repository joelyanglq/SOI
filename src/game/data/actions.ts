import { MatchAction, MatchStructure, MatchPhaseType, PlayerAttributes, SkaterTechnique } from '../../types';

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
  { id: 'j_1t', name: '后外点冰一周 (1T)', type: 'jump_solo', baseScore: 0.4, cost: 2, risk: 0.0, reqStats: {}, techReq: { jumpType: 'toeloop', rotation: 1 }, desc: "BV: 0.40 - 最基础的跳跃" },
  { id: 'j_1s', name: '内结环一周 (1S)', type: 'jump_solo', baseScore: 0.4, cost: 2, risk: 0.0, reqStats: {}, techReq: { jumpType: 'salchow', rotation: 1 }, desc: "BV: 0.40 - 入门级跳跃" },
  { id: 'j_1lo', name: '后外结环一周 (1Lo)', type: 'jump_solo', baseScore: 0.5, cost: 3, risk: 0.0, reqStats: {}, techReq: { jumpType: 'loop', rotation: 1 }, desc: "BV: 0.50 - 基础单周跳" },
  { id: 'j_1f', name: '后内点冰一周 (1F)', type: 'jump_solo', baseScore: 0.5, cost: 3, risk: 0.0, reqStats: {}, techReq: { jumpType: 'flip', rotation: 1 }, desc: "BV: 0.50 - 基础单周跳" },
  { id: 'j_1lz', name: '勾手一周 (1Lz)', type: 'jump_solo', baseScore: 0.6, cost: 3, risk: 0.0, reqStats: {}, techReq: { jumpType: 'lutz', rotation: 1 }, desc: "BV: 0.60 - 单周跳中最难" },

  { id: 'j_2t', name: '后外点冰两周 (2T)', type: 'jump_solo', baseScore: 1.3, cost: 5, risk: 0.03, reqStats: { jump: 15 }, techReq: { jumpType: 'toeloop', rotation: 2 }, desc: "BV: 1.30 - 两周跳入门" },
  { id: 'j_2s', name: '内结环两周 (2S)', type: 'jump_solo', baseScore: 1.3, cost: 5, risk: 0.03, reqStats: { jump: 15 }, techReq: { jumpType: 'salchow', rotation: 2 }, desc: "BV: 1.30 - 常见两周跳" },
  { id: 'j_2lo', name: '后外结环两周 (2Lo)', type: 'jump_solo', baseScore: 1.7, cost: 6, risk: 0.05, reqStats: { jump: 20 }, techReq: { jumpType: 'loop', rotation: 2 }, desc: "BV: 1.70 - 进阶两周跳" },
  { id: 'j_2f', name: '后内点冰两周 (2F)', type: 'jump_solo', baseScore: 1.8, cost: 6, risk: 0.05, reqStats: { jump: 25 }, techReq: { jumpType: 'flip', rotation: 2 }, desc: "BV: 1.80 - 常用两周跳" },
  { id: 'j_2lz', name: '勾手两周 (2Lz)', type: 'jump_solo', baseScore: 2.1, cost: 7, risk: 0.08, reqStats: { jump: 30 }, techReq: { jumpType: 'lutz', rotation: 2 }, desc: "BV: 2.10 - 两周跳最高难度" },

  { id: 'j_3t', name: '后外点冰三周 (3T)', type: 'jump_solo', baseScore: 4.2, cost: 10, risk: 0.15, reqStats: { jump: 45 }, techReq: { jumpType: 'toeloop', rotation: 3 }, desc: "BV: 4.20 - 三周跳入门" },
  { id: 'j_3s', name: '内结环三周 (3S)', type: 'jump_solo', baseScore: 4.3, cost: 10, risk: 0.15, reqStats: { jump: 45 }, techReq: { jumpType: 'salchow', rotation: 3 }, desc: "BV: 4.30 - 常见三周跳" },
  { id: 'j_3lo', name: '后外结环三周 (3Lo)', type: 'jump_solo', baseScore: 4.9, cost: 12, risk: 0.20, reqStats: { jump: 55 }, techReq: { jumpType: 'loop', rotation: 3 }, desc: "BV: 4.90 - 进阶三周跳" },
  { id: 'j_3f', name: '后内点冰三周 (3F)', type: 'jump_solo', baseScore: 5.3, cost: 13, risk: 0.22, reqStats: { jump: 60 }, techReq: { jumpType: 'flip', rotation: 3 }, desc: "BV: 5.30 - 常用三周跳" },
  { id: 'j_3lz', name: '勾手三周 (3Lz)', type: 'jump_solo', baseScore: 5.9, cost: 15, risk: 0.25, reqStats: { jump: 65 }, techReq: { jumpType: 'lutz', rotation: 3 }, desc: "BV: 5.90 - 三周跳最高难度" },

  { id: 'j_4t', name: '后外点冰四周 (4T)', type: 'jump_solo', baseScore: 9.5, cost: 22, risk: 0.45, reqStats: { jump: 80 }, techReq: { jumpType: 'toeloop', rotation: 4 }, desc: "BV: 9.50 - 四周跳入门" },
  { id: 'j_4s', name: '内结环四周 (4S)', type: 'jump_solo', baseScore: 9.7, cost: 23, risk: 0.45, reqStats: { jump: 82 }, techReq: { jumpType: 'salchow', rotation: 4 }, desc: "BV: 9.70 - 常见四周跳" },
  { id: 'j_4lo', name: '后外结环四周 (4Lo)', type: 'jump_solo', baseScore: 10.5, cost: 25, risk: 0.50, reqStats: { jump: 85 }, techReq: { jumpType: 'loop', rotation: 4 }, desc: "BV: 10.50 - 进阶四周跳" },
  { id: 'j_4f', name: '后内点冰四周 (4F)', type: 'jump_solo', baseScore: 11.0, cost: 27, risk: 0.55, reqStats: { jump: 88 }, techReq: { jumpType: 'flip', rotation: 4 }, desc: "BV: 11.00 - 高难度四周跳" },
  { id: 'j_4lz', name: '勾手四周 (4Lz)', type: 'jump_solo', baseScore: 11.5, cost: 30, risk: 0.60, reqStats: { jump: 92 }, techReq: { jumpType: 'lutz', rotation: 4 }, desc: "BV: 11.50 - 四周跳最高难度" },

  // --- Axel Jumps (Special Category) ---
  { id: 'a_1a', name: '阿克塞尔一周 (1A)', type: 'jump_axel', baseScore: 1.1, cost: 4, risk: 0.02, reqStats: {}, techReq: { jumpType: 'axel', rotation: 1 }, desc: "BV: 1.10 - 阿克塞尔入门" },
  { id: 'a_2a', name: '阿克塞尔两周 (2A)', type: 'jump_axel', baseScore: 3.3, cost: 8, risk: 0.10, reqStats: { jump: 35 }, techReq: { jumpType: 'axel', rotation: 2 }, desc: "BV: 3.30 - 职业选手门槛" },
  { id: 'a_3a', name: '阿克塞尔三周 (3A)', type: 'jump_axel', baseScore: 8.0, cost: 20, risk: 0.40, reqStats: { jump: 75 }, techReq: { jumpType: 'axel', rotation: 3 }, desc: "BV: 8.00 - 王牌级三周半" },
  { id: 'a_4a', name: '阿克塞尔四周 (4A)', type: 'jump_axel', baseScore: 12.5, cost: 35, risk: 0.70, reqStats: { jump: 98 }, techReq: { jumpType: 'axel', rotation: 4 }, desc: "BV: 12.50 - 人类极限(羽生结弦)" },

  // --- Jump Combos (techReq based on first jump + comboSuffix) ---
  { id: 'c_2t2t', name: '2T+2T', type: 'jump_combo', baseScore: 2.6, cost: 8, risk: 0.05, reqStats: { jump: 20, endurance: 10 }, techReq: { jumpType: 'toeloop', rotation: 2, comboSuffix: '+2T' }, desc: "BV: 2.60 - 基础连跳" },
  { id: 'c_2a2t', name: '2A+2T', type: 'jump_combo', baseScore: 4.6, cost: 12, risk: 0.12, reqStats: { jump: 40, endurance: 15 }, techReq: { jumpType: 'axel', rotation: 2, comboSuffix: '+2T' }, desc: "BV: 4.60 - 常见连跳" },
  { id: 'c_3t2t', name: '3T+2T', type: 'jump_combo', baseScore: 5.5, cost: 15, risk: 0.18, reqStats: { jump: 50, endurance: 20 }, techReq: { jumpType: 'toeloop', rotation: 3, comboSuffix: '+2T' }, desc: "BV: 5.50 - 稳健连跳" },
  { id: 'c_3s3t', name: '3S+3T', type: 'jump_combo', baseScore: 8.5, cost: 18, risk: 0.25, reqStats: { jump: 60, endurance: 30 }, techReq: { jumpType: 'salchow', rotation: 3, comboSuffix: '+3T' }, desc: "BV: 8.50 - 三周连跳" },
  { id: 'c_3t3t', name: '3T+3T', type: 'jump_combo', baseScore: 8.4, cost: 18, risk: 0.28, reqStats: { jump: 60, endurance: 30 }, techReq: { jumpType: 'toeloop', rotation: 3, comboSuffix: '+3T' }, desc: "BV: 8.40 - 经典连跳" },
  { id: 'c_3f3t', name: '3F+3T', type: 'jump_combo', baseScore: 9.5, cost: 20, risk: 0.30, reqStats: { jump: 65, endurance: 35 }, techReq: { jumpType: 'flip', rotation: 3, comboSuffix: '+3T' }, desc: "BV: 9.50 - 高分连跳" },
  { id: 'c_3lz3t', name: '3Lz+3T', type: 'jump_combo', baseScore: 10.1, cost: 22, risk: 0.35, reqStats: { jump: 70, endurance: 40 }, techReq: { jumpType: 'lutz', rotation: 3, comboSuffix: '+3T' }, desc: "BV: 10.10 - 顶级三周连跳" },
  { id: 'c_3a3t', name: '3A+3T', type: 'jump_combo', baseScore: 12.2, cost: 28, risk: 0.45, reqStats: { jump: 80, endurance: 50 }, techReq: { jumpType: 'axel', rotation: 3, comboSuffix: '+3T' }, desc: "BV: 12.20 - 王牌连跳" },
  { id: 'c_4t3t', name: '4T+3T', type: 'jump_combo', baseScore: 13.7, cost: 32, risk: 0.55, reqStats: { jump: 85, endurance: 60 }, techReq: { jumpType: 'toeloop', rotation: 4, comboSuffix: '+3T' }, desc: "BV: 13.70 - 四周连跳" },
  { id: 'c_4s3t', name: '4S+3T', type: 'jump_combo', baseScore: 13.9, cost: 33, risk: 0.55, reqStats: { jump: 87, endurance: 60 }, techReq: { jumpType: 'salchow', rotation: 4, comboSuffix: '+3T' }, desc: "BV: 13.90 - 高难度连跳" },
  { id: 'c_4lz3t', name: '4Lz+3T', type: 'jump_combo', baseScore: 15.7, cost: 40, risk: 0.70, reqStats: { jump: 95, endurance: 75 }, techReq: { jumpType: 'lutz', rotation: 4, comboSuffix: '+3T' }, desc: "BV: 15.70 - 传奇级连跳" },

  // --- Spins (All 3 Slots) ---
  { id: 's1_upright', name: '直立旋转 (USp)', type: 'spin1', baseScore: 1.0, cost: 4, risk: 0.0, reqStats: {}, techReq: { spinType: 'upright', spinLevel: 1 }, desc: "BV: 1.00 (Base Lv1) - 基础旋转" },
  { id: 's1_upright2', name: '直立旋转Lv2 (USp2)', type: 'spin1', baseScore: 1.5, cost: 5, risk: 0.05, reqStats: { spin: 20 }, techReq: { spinType: 'upright', spinLevel: 2 }, desc: "BV: 1.50 - 进阶直立" },
  { id: 's1_upright3', name: '直立旋转Lv3 (USp3)', type: 'spin1', baseScore: 1.9, cost: 6, risk: 0.08, reqStats: { spin: 40 }, techReq: { spinType: 'upright', spinLevel: 3 }, desc: "BV: 1.90 - 高级直立" },
  { id: 's1_upright4', name: '直立旋转Lv4 (USp4)', type: 'spin1', baseScore: 2.4, cost: 7, risk: 0.10, reqStats: { spin: 60 }, techReq: { spinType: 'upright', spinLevel: 4 }, desc: "BV: 2.40 - 满级直立" },

  { id: 's2_sit', name: '蹲踞旋转 (SSp)', type: 'spin2', baseScore: 1.1, cost: 5, risk: 0.02, reqStats: {}, techReq: { spinType: 'sit', spinLevel: 1 }, desc: "BV: 1.10 (Base Lv1) - 基础蹲踞" },
  { id: 's2_sit2', name: '蹲踞旋转Lv2 (SSp2)', type: 'spin2', baseScore: 1.6, cost: 6, risk: 0.05, reqStats: { spin: 25 }, techReq: { spinType: 'sit', spinLevel: 2 }, desc: "BV: 1.60 - 进阶蹲踞" },
  { id: 's2_sit3', name: '蹲踞旋转Lv3 (SSp3)', type: 'spin2', baseScore: 2.1, cost: 7, risk: 0.08, reqStats: { spin: 45 }, techReq: { spinType: 'sit', spinLevel: 3 }, desc: "BV: 2.10 - 高级蹲踞" },
  { id: 's2_sit4', name: '蹲踞旋转Lv4 (SSp4)', type: 'spin2', baseScore: 2.5, cost: 8, risk: 0.10, reqStats: { spin: 65 }, techReq: { spinType: 'sit', spinLevel: 4 }, desc: "BV: 2.50 - 满级蹲踞" },

  { id: 's3_camel', name: '燕式旋转 (CSp)', type: 'spin3', baseScore: 1.1, cost: 5, risk: 0.02, reqStats: {}, techReq: { spinType: 'camel', spinLevel: 1 }, desc: "BV: 1.10 (Base Lv1) - 基础燕式" },
  { id: 's3_camel2', name: '燕式旋转Lv2 (CSp2)', type: 'spin3', baseScore: 1.8, cost: 6, risk: 0.05, reqStats: { spin: 25 }, techReq: { spinType: 'camel', spinLevel: 2 }, desc: "BV: 1.80 - 进阶燕式" },
  { id: 's3_camel3', name: '燕式旋转Lv3 (CSp3)', type: 'spin3', baseScore: 2.3, cost: 7, risk: 0.08, reqStats: { spin: 50 }, techReq: { spinType: 'camel', spinLevel: 3 }, desc: "BV: 2.30 - 高级燕式" },
  { id: 's3_camel4', name: '燕式旋转Lv4 (CSp4)', type: 'spin3', baseScore: 2.6, cost: 8, risk: 0.10, reqStats: { spin: 70 }, techReq: { spinType: 'camel', spinLevel: 4 }, desc: "BV: 2.60 - 满级燕式" },
  { id: 's3_combo', name: '联合旋转 (CoSp)', type: 'spin3', baseScore: 1.5, cost: 6, risk: 0.05, reqStats: { spin: 30 }, techReq: { spinType: 'combo', spinLevel: 1 }, desc: "BV: 1.50 (Lv1) - 姿态变化" },
  { id: 's3_combo4', name: '联合旋转Lv4 (CoSp4)', type: 'spin3', baseScore: 3.5, cost: 10, risk: 0.15, reqStats: { spin: 80 }, techReq: { spinType: 'combo', spinLevel: 4 }, desc: "BV: 3.50 - 顶级联合旋转" },
  { id: 's3_fly', name: '跳接旋转Lv4 (FCSp4)', type: 'spin3', baseScore: 3.2, cost: 9, risk: 0.12, reqStats: { spin: 75, jump: 40 }, techReq: { spinType: 'flying', spinLevel: 4 }, desc: "BV: 3.20 - 跳接燕式" },

  // --- Step Sequences ---
  { id: 'st_base', name: '接续步Lv1 (StSq1)', type: 'step', baseScore: 1.8, cost: 8, risk: 0.05, reqStats: {}, techReq: { stepLevel: 1 }, desc: "BV: 1.80 - 基础步法" },
  { id: 'st_mid', name: '接续步Lv2 (StSq2)', type: 'step', baseScore: 2.6, cost: 12, risk: 0.10, reqStats: { step: 35 }, techReq: { stepLevel: 2 }, desc: "BV: 2.60 - 进阶步法" },
  { id: 'st_high', name: '接续步Lv3 (StSq3)', type: 'step', baseScore: 3.3, cost: 16, risk: 0.15, reqStats: { step: 60 }, techReq: { stepLevel: 3 }, desc: "BV: 3.30 - 高级步法" },
  { id: 'st_pro', name: '接续步Lv4 (StSq4)', type: 'step', baseScore: 3.9, cost: 20, risk: 0.20, reqStats: { step: 85 }, techReq: { stepLevel: 4 }, desc: "BV: 3.90 - 满级步法" },
];

// Program Configuration Helper Functions
import { ProgramConfig, ProgramElement, ConfigStrategy } from '../../types';
import { getJumpKey } from './technique';

// Local success rate estimate (avoids circular import with scoring.ts)
const _successRate = (action: MatchAction, technique?: SkaterTechnique): number => {
  if (!technique || !action.techReq) return 50;
  const req = action.techReq;
  let prof = 50;
  if (req.jumpType && req.rotation) {
    const key = getJumpKey(req.jumpType, req.rotation);
    const jp = technique.jumps[req.jumpType]?.proficiency[key] || 20;
    if (req.comboSuffix && technique.comboProficiency) {
      prof = (jp + (technique.comboProficiency[req.comboSuffix] || 0)) / 2;
    } else {
      prof = jp;
    }
  } else if (req.spinType && req.spinLevel) {
    prof = technique.spins[req.spinType]?.proficiency || 30;
  } else if (req.stepLevel) {
    prof = technique.steps?.proficiency || 30;
  }
  const fail = Math.max(2, Math.min(90, action.risk * 100 * (1 - prof / 120)));
  return Math.round(100 - fail);
};

// Check if a skater's technique allows performing an action
export const canPerformAction = (technique: SkaterTechnique, action: MatchAction): boolean => {
  const req = action.techReq;
  if (!req) return true; // No technique requirement

  if (req.jumpType && req.rotation) {
    const card = technique.jumps[req.jumpType];
    if (!card) return false;
    if (card.maxRotation < req.rotation) return false;
    const key = getJumpKey(req.jumpType, req.rotation);
    if ((card.proficiency[key] || 0) <= 0) return false;
    // Combo suffix check: need comboProficiency > 0 to attempt the combo
    if (req.comboSuffix && technique.comboProficiency) {
      if ((technique.comboProficiency[req.comboSuffix] || 0) <= 0) return false;
    }
    return true;
  }

  if (req.spinType && req.spinLevel) {
    const card = technique.spins[req.spinType];
    if (!card) return false;
    if (card.level < req.spinLevel) return false;
    return true;
  }

  if (req.stepLevel) {
    if (technique.steps.level < req.stepLevel) return false;
    return true;
  }

  return true;
};

export const generateProgramConfig = (
  stats: PlayerAttributes,
  phases: MatchPhaseType[],
  strategy: ConfigStrategy,
  technique?: SkaterTechnique
): ProgramConfig => {
  const elements: ProgramElement[] = [];

  // Success-rate thresholds per strategy (used for filtering)
  const srThresholds = { conservative: 75, balanced: 50, aggressive: 0 };
  const minSR = strategy === 'custom' ? 50 : srThresholds[strategy];

  phases.forEach(phase => {
    // Step 1: get all actions player can technically perform for this phase
    const performable = ACTION_LIBRARY.filter(a => {
      if (a.type !== phase) return false;
      if (technique) {
        return canPerformAction(technique, a);
      } else {
        for (const [key, val] of Object.entries(a.reqStats)) {
          if ((stats[key as keyof PlayerAttributes] || 0) < val) return false;
        }
        return true;
      }
    });

    if (performable.length === 0) {
      const fallback = ACTION_LIBRARY.find(act => act.type === phase);
      if (fallback) elements.push({ phase, actionId: fallback.id });
      return;
    }

    // Step 2: annotate with proficiency-based success rate
    const scored = performable.map(a => ({
      action: a,
      sr: _successRate(a, technique),
      bv: a.baseScore,
    }));

    // Step 3: strategy-specific selection
    let selected: MatchAction;

    if (strategy === 'conservative') {
      // Prefer high success rate first, then BV as tiebreaker
      // Filter to actions with SR >= threshold, pick highest BV among those
      const safe = scored.filter(s => s.sr >= minSR);
      if (safe.length > 0) {
        safe.sort((a, b) => b.sr !== a.sr ? b.sr - a.sr : b.bv - a.bv);
        selected = safe[0].action;
      } else {
        // Nothing meets threshold; pick safest available
        scored.sort((a, b) => b.sr - a.sr);
        selected = scored[0].action;
      }
    } else if (strategy === 'aggressive') {
      // Maximize BV regardless of success rate
      scored.sort((a, b) => b.bv - a.bv);
      selected = scored[0].action;
    } else {
      // Balanced: weighted score = BV * (SR / 100)
      scored.sort((a, b) => (b.bv * b.sr) - (a.bv * a.sr));
      selected = scored[0].action;
    }

    elements.push({ phase, actionId: selected.id });
  });

  return { elements };
};

export const getActionFromElement = (element: ProgramElement) => {
  return ACTION_LIBRARY.find(a => a.id === element.actionId);
};

export const calculateConfigTotalBV = (config: ProgramConfig): number => {
  let total = 0;
  config.elements.forEach(elem => {
    const action = getActionFromElement(elem);
    if (action) total += action.baseScore;
  });
  return total;
};

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
