import { TrainingTaskDefinition } from '../../types';

export const TRAINING_TASKS: Record<string, TrainingTaskDefinition> = {
  // Jump training — proficiency distributed via TrainingFocus (primary/secondary)
  jump:      { id: 'jump',      name: '跳跃训练', color: 'bg-rose-600',    targetAttr: 'jump', bodyGain: 0.3, targetTech: 'jump', baseGain: 2.0, staCost: 20, desc: "跳跃专项训练，收益由训练重心分配" },

  // Spin / Step — broad proficiency
  spin:      { id: 'spin',      name: '旋转训练', color: 'bg-indigo-500', targetAttr: 'spin', bodyGain: 0.9, targetTech: 'spin', baseGain: 1.5, staCost: 12, desc: "提升旋转熟练度与等级" },
  step:      { id: 'step',      name: '步法训练', color: 'bg-cyan-600',   targetAttr: 'step', bodyGain: 0.9, targetTech: 'step', baseGain: 1.5, staCost: 14, desc: "提升步法熟练度与等级" },

  // Pure body attribute training
  perf:      { id: 'perf',      name: '表现力',   color: 'bg-purple-600', targetAttr: 'perf', bodyGain: 1.0,                      baseGain: 0,   staCost: 12, desc: "增强感染力，提升节目成绩分 (PCS)" },
  endurance: { id: 'endurance', name: '体能训练', color: 'bg-amber-600',  targetAttr: 'endurance', bodyGain: 0.8,                 baseGain: 0,   staCost: 18, desc: "提升耐力，降低训练/比赛体力消耗" },

  // Recovery
  rest:      { id: 'rest',      name: '深度理疗', color: 'bg-slate-700',  bodyGain: 0, baseGain: 0, staCost: -28, desc: "恢复大量体力" }
};
