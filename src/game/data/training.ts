import { TrainingTaskDefinition } from '../../types';

export const TRAINING_TASKS: Record<string, TrainingTaskDefinition> = {
  // Jump training (6 types) - primary: proficiency, secondary: body.jump
  train_axel:    { id: 'train_axel',    name: '阿克塞尔', color: 'bg-rose-600',    targetAttr: 'jump', bodyGain: 0.3, targetTech: 'jump', jumpType: 'axel',    baseGain: 2.0, staCost: 22, desc: "专项阿克塞尔跳跃" },
  train_toeloop: { id: 'train_toeloop', name: '后外点冰', color: 'bg-red-500',     targetAttr: 'jump', bodyGain: 0.3, targetTech: 'jump', jumpType: 'toeloop', baseGain: 2.0, staCost: 18, desc: "专项后外点冰跳跃" },
  train_salchow: { id: 'train_salchow', name: '内结环跳', color: 'bg-orange-600',  targetAttr: 'jump', bodyGain: 0.3, targetTech: 'jump', jumpType: 'salchow', baseGain: 2.0, staCost: 18, desc: "专项内结环跳跃" },
  train_loop:    { id: 'train_loop',    name: '后外结环', color: 'bg-red-700',      targetAttr: 'jump', bodyGain: 0.3, targetTech: 'jump', jumpType: 'loop',    baseGain: 2.0, staCost: 19, desc: "专项后外结环跳跃" },
  train_flip:    { id: 'train_flip',    name: '后内点冰', color: 'bg-pink-600',     targetAttr: 'jump', bodyGain: 0.3, targetTech: 'jump', jumpType: 'flip',    baseGain: 2.0, staCost: 20, desc: "专项后内点冰跳跃" },
  train_lutz:    { id: 'train_lutz',    name: '勾手跳',   color: 'bg-red-800',      targetAttr: 'jump', bodyGain: 0.3, targetTech: 'jump', jumpType: 'lutz',    baseGain: 2.0, staCost: 21, desc: "专项勾手跳跃" },

  // Body training (4 types)
  spin:      { id: 'spin',      name: '柔韧旋转', color: 'bg-indigo-500', targetAttr: 'spin', bodyGain: 0.9, targetTech: 'spin', baseGain: 1.5, staCost: 12, desc: "提升旋转熟练度" },
  step:      { id: 'step',      name: '步法滑行', color: 'bg-cyan-600',   targetAttr: 'step', bodyGain: 0.9, targetTech: 'step', baseGain: 1.5, staCost: 14, desc: "提升步法熟练度" },
  perf:      { id: 'perf',      name: '表现力',   color: 'bg-purple-600', targetAttr: 'perf', bodyGain: 1.0,                      baseGain: 0,   staCost: 12, desc: "增强感染力 (PCS)" },
  endurance: { id: 'endurance', name: '核心耐力', color: 'bg-amber-600',  targetAttr: 'endurance', bodyGain: 0.8,                 baseGain: 0,   staCost: 18, desc: "抗疲劳与减耗" },

  // Recovery
  rest: { id: 'rest', name: '深度理疗', color: 'bg-slate-700', bodyGain: 0, baseGain: 0, staCost: -28, desc: "恢复大量体力" }
};
