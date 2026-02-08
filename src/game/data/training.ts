import { TrainingTaskDefinition } from '../../types';

export const TRAINING_TASKS: Record<string, TrainingTaskDefinition> = {
  jump: { id: 'jump', name: '四周跳', color: 'bg-red-600', targetAttr: 'jump', baseGain: 1.2, staCost: 22, desc: "突破极限 (消耗大)" },
  spin: { id: 'spin', name: '柔韧旋转', color: 'bg-indigo-500', targetAttr: 'spin', baseGain: 0.9, staCost: 12, desc: "提升稳定与柔韧" },
  step: { id: 'step', name: '步法滑行', color: 'bg-cyan-600', targetAttr: 'step', baseGain: 0.9, staCost: 14, desc: "双修技术与艺术" },
  perf: { id: 'perf', name: '表现力', color: 'bg-purple-600', targetAttr: 'perf', baseGain: 1.0, staCost: 12, desc: "增强感染力 (PCS)" },
  endurance: { id: 'endurance', name: '核心耐力', color: 'bg-amber-600', targetAttr: 'endurance', baseGain: 0.8, staCost: 18, desc: "抗疲劳与减耗" },
  rest: { id: 'rest', name: '深度理疗', color: 'bg-slate-700', baseGain: 0, staCost: -28, desc: "恢复大量体力" }
};
