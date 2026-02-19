import { TrainingTaskType, Coach, PlayerAttributes, SkaterTechnique, JumpType, SpinType } from '../types';
import { clamp } from '../utils/math';
import { TRAINING_TASKS } from './data/training';
import { getJumpKey, ALL_SPIN_TYPES } from './data/technique';

export interface TrainingResult {
  finalSta: number;
  bodyGains: Record<string, number>;
  techGains: {
    jumps: Partial<Record<JumpType, number>>;
    spins: Partial<Record<SpinType, number>>;
    steps: number;
    combo: number;
  };
  goeBonusGains: {
    jumps: Partial<Record<JumpType, number>>;
    spins: number;
    steps: number;
  };
  artPlanPoints: number;
}

export const calculateWeeklyStats = (
  currentSchedule: TrainingTaskType[],
  startSta: number,
  currentCoach: Coach,
  skaterAge: number,
  currentEndurance: number,
  technique?: SkaterTechnique
): TrainingResult => {
  let tempSta = startSta;
  const bodyGains: Record<string, number> = { jump: 0, spin: 0, step: 0, perf: 0, endurance: 0 };
  const techGains: TrainingResult['techGains'] = {
    jumps: {},
    spins: {},
    steps: 0,
    combo: 0,
  };
  const goeBonusGains: TrainingResult['goeBonusGains'] = {
    jumps: {},
    spins: 0,
    steps: 0,
  };
  let artPlanPoints = 0;

  const ageMod = skaterAge < 18 ? 1.3 : (skaterAge <= 23 ? 1.0 : 0.6);
  const enduranceCostReduction = currentEndurance / 200;
  const enduranceEfficiencyBonus = currentEndurance / 500;

  for (const taskId of currentSchedule) {
    const task = TRAINING_TASKS[taskId];
    if (!task) continue;

    const adjustedStaCost = task.staCost * (1 - enduranceCostReduction);
    let efficiency = 1.0 + enduranceEfficiencyBonus;
    if (tempSta <= 0) efficiency = 0;
    else if (tempSta < 20) efficiency = 0.3 + enduranceEfficiencyBonus;
    efficiency = Math.min(efficiency, 1.2);

    // Body attribute gains
    if (task.targetAttr && task.bodyGain > 0) {
      let coachMod = 1.0;
      if (['jump', 'spin', 'endurance'].includes(task.targetAttr)) coachMod = currentCoach.tecMod;
      else if (task.targetAttr === 'perf') coachMod = currentCoach.artMod;
      else if (task.targetAttr === 'step') coachMod = (currentCoach.tecMod + currentCoach.artMod) / 2;

      bodyGains[task.targetAttr] += task.bodyGain * coachMod * ageMod * efficiency;
    }

    // Technique card proficiency gains
    if (task.targetTech && task.baseGain > 0) {
      const profGain = task.baseGain * currentCoach.tecMod * ageMod * efficiency;

      if (task.targetTech === 'jump' && task.jumpType) {
        const jt = task.jumpType;
        techGains.jumps[jt] = (techGains.jumps[jt] || 0) + profGain;
        // goeBonus grows passively during jump training
        goeBonusGains.jumps[jt] = (goeBonusGains.jumps[jt] || 0) + 0.02 * efficiency;
      } else if (task.targetTech === 'spin') {
        // Spin training improves all spins
        for (const st of ALL_SPIN_TYPES) {
          techGains.spins[st] = (techGains.spins[st] || 0) + profGain;
        }
        // goeBonus grows passively during spin training
        goeBonusGains.spins += 0.02 * efficiency;
      } else if (task.targetTech === 'step') {
        techGains.steps += profGain;
        // goeBonus grows passively during step training
        goeBonusGains.steps += 0.02 * efficiency;
      } else if (task.targetTech === 'combo') {
        // Combo training improves combo suffix proficiency
        techGains.combo += profGain;
      }
    }

    if (task.targetAttr === 'perf' || task.targetAttr === 'step') artPlanPoints += task.bodyGain;
    tempSta = clamp(tempSta - adjustedStaCost, 0, 100);
  }

  return { finalSta: tempSta, bodyGains, techGains, goeBonusGains, artPlanPoints };
};
