import { TrainingTaskType, Coach, PlayerAttributes } from '../types';
import { clamp } from '../utils/math';
import { TRAINING_TASKS } from './data/training';
import { STRESS_EFFICIENCY } from './config';

export const calculateWeeklyStats = (
  currentSchedule: TrainingTaskType[], 
  startSta: number, 
  currentCoach: Coach, 
  skaterAge: number, 
  currentEndurance: number,
  stress: number = 30
) => {
  let tempSta = startSta;
  let gains: Record<string, number> = { jump: 0, spin: 0, step: 0, perf: 0, endurance: 0 };
  let artPlanPoints = 0; 

  const ageMod = skaterAge < 18 ? 1.3 : (skaterAge <= 23 ? 1.0 : 0.6);
  const enduranceCostReduction = currentEndurance / 200;
  const enduranceEfficiencyBonus = currentEndurance / 500;

  // 压力效率系数
  let stressEfficiency = 1.0;
  if (stress <= 30) {
    stressEfficiency = stress === 0 
      ? STRESS_EFFICIENCY.relaxed + STRESS_EFFICIENCY.relaxedBonus 
      : STRESS_EFFICIENCY.relaxed;
  } else if (stress <= 60) {
    stressEfficiency = STRESS_EFFICIENCY.moderate;
  } else if (stress <= 80) {
    stressEfficiency = STRESS_EFFICIENCY.tense;
  } else {
    stressEfficiency = STRESS_EFFICIENCY.burnout;
  }

  for (const taskId of currentSchedule) {
    const task = TRAINING_TASKS[taskId];
    const adjustedStaCost = task.staCost * (1 - enduranceCostReduction);
    let efficiency = (1.0 + enduranceEfficiencyBonus) * stressEfficiency;
    if (tempSta <= 0) efficiency = 0;
    else if (tempSta < 20) efficiency = (0.3 + enduranceEfficiencyBonus) * stressEfficiency;
    efficiency = Math.min(efficiency, 1.2);

    if (task.targetAttr) {
      let coachMod = 1.0;
      if (['jump', 'spin', 'endurance'].includes(task.targetAttr)) coachMod = currentCoach.tecMod;
      else if (task.targetAttr === 'perf') coachMod = currentCoach.artMod;
      else if (task.targetAttr === 'step') coachMod = (currentCoach.tecMod + currentCoach.artMod) / 2;

      gains[task.targetAttr] += task.baseGain * coachMod * ageMod * efficiency;
    }
    if (task.targetAttr === 'perf' || task.targetAttr === 'step') artPlanPoints += task.baseGain; 
    tempSta = clamp(tempSta - adjustedStaCost, 0, 100);
  }
  return { finalSta: tempSta, gains, artPlanPoints };
};
