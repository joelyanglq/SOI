import { MatchAction, PlayerAttributes, SkaterTechnique } from '../types';
import { PHASE_META } from './data/actions';
import { getJumpKey } from './data/technique';
import { clamp } from '../utils/math';

// ISU-Compliant Score Calculator (Base Value + GOE) - Proficiency-Based
export const calculateActionScore = (
  action: MatchAction,
  stats: PlayerAttributes,    // body attrs (for PCS, endurance cost)
  currentSta: number,
  isPlayer: boolean,
  technique?: SkaterTechnique  // for proficiency-based scoring
): { score: number, cost: number, isFail: boolean, fatigueFactor: number, raw: number, goe: number } => {

  // Stamina Cost (Endurance reduces cost by up to 40%)
  const end = stats.endurance || 30;
  const costReduction = end / 250;
  const realCost = Math.max(1, action.cost * (1 - costReduction));

  // Fatigue Factor (Stamina < 30 affects execution)
  let fatigueFactor = 1.0;
  if (currentSta < 15) fatigueFactor = 0.6;
  else if (currentSta < 30) fatigueFactor = 0.85;

  // --- Get proficiency for this action ---
  let proficiency = 50; // default fallback

  if (technique && action.techReq) {
    const req = action.techReq;
    if (req.jumpType && req.rotation) {
      const key = getJumpKey(req.jumpType, req.rotation);
      proficiency = technique.jumps[req.jumpType]?.proficiency[key] || 20;
    } else if (req.spinType && req.spinLevel) {
      proficiency = technique.spins[req.spinType]?.proficiency || 30;
    } else if (req.stepLevel) {
      proficiency = technique.steps?.proficiency || 30;
    }
  } else {
    // Legacy fallback: use body attribute average
    const meta = PHASE_META[action.type];
    let attrSum = 0;
    meta.relevantAttrs.forEach(k => { attrSum += (stats[k] || 0); });
    proficiency = attrSum / meta.relevantAttrs.length;
  }

  // Failure Chance: proficiency-based instead of body-attr-based
  const baseFailChance = clamp(action.risk * 100 * (1 - proficiency / 120), 2, 90);
  const failChance = isPlayer ? baseFailChance : baseFailChance * 0.4;
  const isFail = Math.random() * 100 < failChance;

  // --- ISU SCORING SYSTEM: BV + GOE ---
  const baseValue = action.baseScore;

  let goeGrade = 0; // -5 to +5

  if (isFail) {
    goeGrade = -5;
  } else {
    // GOE: proficiency-based + jump-specific goeBonus
    const skillFactor = (proficiency - 50) / 15;

    let goeBonus = 0;
    if (technique && action.techReq?.jumpType) {
      goeBonus = technique.jumps[action.techReq.jumpType]?.goeBonus || 0;
    }

    const fatiguePenalty = (1 - fatigueFactor) * -8;
    const randomness = (Math.random() - 0.5) * 1.5;
    goeGrade = clamp(skillFactor + goeBonus + fatiguePenalty + randomness, -4, 5);
  }

  const goeValue = baseValue * (goeGrade * 0.10);
  const elementScore = baseValue + goeValue;

  // PCS-like component based on perf attribute (unchanged)
  const pcsBonus = (stats.perf || 30) * 0.03;

  const finalScore = Math.max(0, elementScore + pcsBonus);

  return {
    score: finalScore,
    cost: realCost,
    isFail,
    fatigueFactor,
    raw: baseValue,
    goe: goeGrade
  };
};
