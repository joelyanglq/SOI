import { MatchAction, PlayerAttributes, MatchPhaseType } from '../types';
import { PHASE_META } from './data/actions';
import { clamp } from '../utils/math';
import { MENTAL_MULTIPLIERS, MENTAL_PEAK_GOE_BONUS } from './config';

// ISU-Compliant Score Calculator (Base Value + GOE)
export const calculateActionScore = (
  action: MatchAction, 
  stats: PlayerAttributes, 
  currentSta: number, 
  isPlayer: boolean,
  mental: number = 60
): { score: number, cost: number, isFail: boolean, fatigueFactor: number, raw: number, goe: number } => {
  
  // Stamina Cost (Endurance reduces cost by up to 40%)
  const end = stats.endurance || 30;
  const costReduction = end / 250; 
  const realCost = Math.max(1, action.cost * (1 - costReduction));

  // Relevant Attribute Average
  const meta = PHASE_META[action.type];
  let attrSum = 0;
  meta.relevantAttrs.forEach(k => { attrSum += (stats[k] || 0); });
  const attrAvg = attrSum / meta.relevantAttrs.length;

  // Failure Chance (Based on risk and attributes)
  // 心态紧绷或崩溃时，首个动作失误率增加
  let failChanceModifier = 1.0;
  if (mental < 20) failChanceModifier = 1.5;
  else if (mental < 40) failChanceModifier = 1.25;
  
  const baseFailChance = clamp((action.risk * 100) - (attrAvg * 0.6), 2, 90);
  const failChance = isPlayer ? baseFailChance * failChanceModifier : baseFailChance * 0.4; // AI more consistent
  const isFail = Math.random() * 100 < failChance;

  // Fatigue Factor (Stamina < 30 affects execution)
  let fatigueFactor = 1.0;
  if (currentSta < 15) fatigueFactor = 0.6;
  else if (currentSta < 30) fatigueFactor = 0.85;

  // --- ISU SCORING SYSTEM: BV + GOE ---
  const baseValue = action.baseScore;
  
  let goeGrade = 0; // -5 to +5
  
  if (isFail) {
    goeGrade = -5;
  } else {
    const skillFactor = (attrAvg - 40) / 12;
    const fatiguePenalty = (1 - fatigueFactor) * -8;
    let randomness = (Math.random() - 0.5) * 1.5;
    
    // 心态巅峰时，GOE 额外波动加成
    if (mental >= 90) {
      randomness += MENTAL_PEAK_GOE_BONUS.min + Math.random() * (MENTAL_PEAK_GOE_BONUS.max - MENTAL_PEAK_GOE_BONUS.min);
    }
    
    goeGrade = clamp(skillFactor + fatiguePenalty + randomness, -4, 5);
  }
  
  const goeValue = baseValue * (goeGrade * 0.10);
  const elementScore = baseValue + goeValue;
  
  // PCS-like component based on perf attribute
  const pcsBonus = (stats.perf || 30) * 0.03;
  
  let finalScore = Math.max(0, elementScore + pcsBonus);
  
  // 心态系数
  let mentalMultiplier = MENTAL_MULTIPLIERS.normal;
  if (mental >= 90) mentalMultiplier = MENTAL_MULTIPLIERS.peak;
  else if (mental >= 40) mentalMultiplier = MENTAL_MULTIPLIERS.normal;
  else if (mental >= 20) mentalMultiplier = MENTAL_MULTIPLIERS.tight;
  else mentalMultiplier = MENTAL_MULTIPLIERS.broken;
  
  finalScore = finalScore * mentalMultiplier;

  return { 
    score: finalScore, 
    cost: realCost, 
    isFail, 
    fatigueFactor, 
    raw: baseValue,
    goe: goeGrade 
  };
};
