import { TrainingTaskType, Coach, PlayerAttributes } from '../types';
import { clamp } from '../utils/math';
import { TRAINING_TASKS } from './data/training';

export const calculateWeeklyStats = (
  currentSchedule: TrainingTaskType[], 
  startSta: number, 
  currentCoach: Coach, 
  skaterAge: number, 
  currentEndurance: number
) => {
  let tempSta = startSta;
  let gains: Record<string, number> = { jump: 0, spin: 0, step: 0, perf: 0, endurance: 0 };
  let artPlanPoints = 0; 

  const ageMod = skaterAge < 18 ? 1.3 : (skaterAge <= 23 ? 1.0 : 0.6);
  const enduranceCostReduction = currentEndurance / 200;
  const enduranceEfficiencyBonus = currentEndurance / 500;

  for (const taskId of currentSchedule) {
    const task = TRAINING_TASKS[taskId];
    const adjustedStaCost = task.staCost * (1 - enduranceCostReduction);
    let efficiency = 1.0 + enduranceEfficiencyBonus;
    if (tempSta <= 0) efficiency = 0;
    else if (tempSta < 20) efficiency = 0.3 + enduranceEfficiencyBonus;
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
