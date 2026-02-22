import { TrainingTaskType, Coach, PlayerAttributes, SkaterTechnique, JumpType, SpinType, TrainingFocus } from '../types';
import { clamp } from '../utils/math';
import { TRAINING_TASKS } from './data/training';
import { ALL_JUMP_TYPES, ALL_SPIN_TYPES } from './data/technique';

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

// Training mode multipliers for jump training
const MODE_MODS: Record<string, { prof: number; goe: number }> = {
  stability:  { prof: 1.2, goe: 0.5 },
  balanced:   { prof: 1.0, goe: 1.0 },
  refinement: { prof: 0.6, goe: 2.0 },
};

export const calculateWeeklyStats = (
  currentSchedule: TrainingTaskType[],
  startSta: number,
  currentCoach: Coach,
  skaterAge: number,
  currentEndurance: number,
  technique?: SkaterTechnique,
  trainingFocus?: TrainingFocus
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

  // Resolve focus with defaults
  const focus: TrainingFocus = trainingFocus || { primaryJump: 'lutz', secondaryJump: 'flip', mode: 'balanced' };
  const modeMod = MODE_MODS[focus.mode] || MODE_MODS.balanced;

  for (const taskId of currentSchedule) {
    const task = TRAINING_TASKS[taskId];
    if (!task) continue;

    const adjustedStaCost = task.staCost * (1 - enduranceCostReduction);
    let efficiency = 1.0 + enduranceEfficiencyBonus;
    if (tempSta <= 0) efficiency = 0;
    else if (tempSta < 20) efficiency = 0.3 + enduranceEfficiencyBonus;
    efficiency = Math.min(efficiency, 1.2);

    // Body attribute gains (NOT affected by training mode)
    if (task.targetAttr && task.bodyGain > 0) {
      let coachMod = 1.0;
      if (['jump', 'spin', 'endurance'].includes(task.targetAttr)) coachMod = currentCoach.tecMod;
      else if (task.targetAttr === 'perf') coachMod = currentCoach.artMod;
      else if (task.targetAttr === 'step') coachMod = (currentCoach.tecMod + currentCoach.artMod) / 2;

      bodyGains[task.targetAttr] += task.bodyGain * coachMod * ageMod * efficiency;
    }

    // Technique card proficiency gains
    if (task.targetTech && task.baseGain > 0) {
      const baseProfGain = task.baseGain * currentCoach.tecMod * ageMod * efficiency;

      if (task.targetTech === 'jump') {
        // === Jump training: distribute via TrainingFocus ===
        const profGain = baseProfGain * modeMod.prof;
        const baseGoeGain = 0.02 * efficiency * modeMod.goe;

        // Primary: 60%, Secondary: 30%, Others: 2.5% each
        for (const jt of ALL_JUMP_TYPES) {
          let share: number;
          if (jt === focus.primaryJump) share = 0.6;
          else if (jt === focus.secondaryJump) share = 0.3;
          else share = 0.025;
          techGains.jumps[jt] = (techGains.jumps[jt] || 0) + profGain * share;
        }

        // GOE: primary 70%, secondary 30%
        goeBonusGains.jumps[focus.primaryJump] = (goeBonusGains.jumps[focus.primaryJump] || 0) + baseGoeGain * 0.7;
        goeBonusGains.jumps[focus.secondaryJump] = (goeBonusGains.jumps[focus.secondaryJump] || 0) + baseGoeGain * 0.3;

        // Combo: passive gain from jump training (not affected by mode)
        techGains.combo += baseProfGain * 0.5;

      } else if (task.targetTech === 'spin') {
        for (const st of ALL_SPIN_TYPES) {
          techGains.spins[st] = (techGains.spins[st] || 0) + baseProfGain;
        }
        goeBonusGains.spins += 0.02 * efficiency;

      } else if (task.targetTech === 'step') {
        techGains.steps += baseProfGain;
        goeBonusGains.steps += 0.02 * efficiency;
      }
    }

    if (task.targetAttr === 'perf' || task.targetAttr === 'step') artPlanPoints += task.bodyGain;
    tempSta = clamp(tempSta - adjustedStaCost, 0, 100);
  }

  return { finalSta: tempSta, bodyGains, techGains, goeBonusGains, artPlanPoints };
};
