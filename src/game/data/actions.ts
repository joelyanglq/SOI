import { MatchAction, MatchStructure, MatchPhaseType, PlayerAttributes } from '../../types';

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

// Program Configuration Helper Functions
import { ProgramConfig, ProgramElement, ConfigStrategy } from '../../types';

export const generateProgramConfig = (
  stats: PlayerAttributes,
  phases: MatchPhaseType[],
  strategy: ConfigStrategy
): ProgramConfig => {
  const elements: ProgramElement[] = [];
  
  const riskThresholds = {
    conservative: 0.25,
    balanced: 0.40,
    aggressive: 0.70
  };
  
  const maxRisk = strategy === 'custom' ? 0.40 : riskThresholds[strategy];
  
  phases.forEach(phase => {
    const validActions = ACTION_LIBRARY.filter(a => {
      if (a.type !== phase) return false;
      for (const [key, val] of Object.entries(a.reqStats)) {
        if ((stats[key as keyof PlayerAttributes] || 0) < val) return false;
      }
      if (strategy !== 'aggressive' && (phase.includes('jump') || phase.includes('axel'))) {
        if (a.risk > maxRisk) return false;
      }
      return true;
    });
    
    let selectedAction;
    
    if (validActions.length === 0) {
      const fallback = ACTION_LIBRARY.find(act => act.type === phase);
      selectedAction = fallback;
    } else {
      if (strategy === 'conservative') {
        selectedAction = validActions
          .filter(a => a.risk <= maxRisk)
          .sort((a, b) => b.baseScore - a.baseScore)[0];
        if (!selectedAction) {
          selectedAction = validActions.sort((a, b) => a.risk - b.risk)[0];
        }
      } else if (strategy === 'aggressive') {
        selectedAction = validActions.sort((a, b) => b.baseScore - a.baseScore)[0];
      } else {
        selectedAction = validActions
          .map(a => ({
            action: a,
            score: a.baseScore / (1 + a.risk * 2)
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
