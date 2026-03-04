import { MatchAction, PlayerAttributes, SkaterTechnique } from '../types';
import { PHASE_META } from './data/actions';
import { getJumpKey } from './data/technique';
import { getVariant } from './data/variants';
import { getStyleTag } from './data/styleTags';
import { clamp } from '../utils/math';

// ISU-Compliant Score Calculator (Base Value + GOE) - Proficiency-Based
export const calculateActionScore = (
  action: MatchAction,
  stats: PlayerAttributes,    // body attrs (for PCS, endurance cost)
  currentSta: number,
  isPlayer: boolean,
  technique?: SkaterTechnique,  // for proficiency-based scoring
  activeVariant?: string        // active variant ID for this element
): { score: number, cost: number, isFail: boolean, fatigueFactor: number, raw: number, goe: number } => {

  // Stamina Cost (Endurance reduces cost by up to 40%)
  const end = stats.endurance || 30;
  const costReduction = end / 250;
  const realCost = Math.max(1, action.cost * (1 - costReduction));

  // Fatigue Factor (Stamina < 30 affects execution)
  let fatigueFactor = 1.0;
  if (currentSta < 15) fatigueFactor = 0.6;
  else if (currentSta < 30) fatigueFactor = 0.85;

  // --- Variant modifiers ---
  let bvMultiplier = 1.0;
  let variantRiskMod = 0;
  if (activeVariant) {
    const vDef = getVariant(activeVariant);
    if (vDef) {
      bvMultiplier = vDef.bvMultiplier;
      variantRiskMod = vDef.riskModifier;
    }
  }

  // --- Get proficiency for this action ---
  let proficiency = 50; // default fallback
  let goeBonus = 0;
  let styleTags: string[] = [];

  if (technique && action.techReq) {
    const req = action.techReq;
    if (req.jumpType && req.rotation) {
      const key = getJumpKey(req.jumpType, req.rotation);
      const jumpProf = technique.jumps[req.jumpType]?.proficiency[key] || 20;

      // Combo proficiency: effective proficiency = avg(firstJumpProf, comboSuffixProf)
      if (req.comboSuffix && technique.comboProficiency) {
        const comboProf = technique.comboProficiency[req.comboSuffix] || 0;
        proficiency = (jumpProf + comboProf) / 2;
      } else {
        proficiency = jumpProf;
      }

      goeBonus = technique.jumps[req.jumpType]?.goeBonus || 0;
      styleTags = technique.jumps[req.jumpType]?.styleTags || [];
    } else if (req.spinType && req.spinLevel) {
      proficiency = technique.spins[req.spinType]?.proficiency || 30;
      goeBonus = technique.spins[req.spinType]?.goeBonus || 0;
      styleTags = technique.spins[req.spinType]?.styleTags || [];
    } else if (req.stepLevel) {
      proficiency = technique.steps?.proficiency || 30;
      goeBonus = technique.steps?.goeBonus || 0;
      styleTags = technique.steps?.styleTags || [];
    }
  } else {
    // Legacy fallback: use body attribute average
    const meta = PHASE_META[action.type];
    let attrSum = 0;
    meta.relevantAttrs.forEach(k => { attrSum += (stats[k] || 0); });
    proficiency = attrSum / meta.relevantAttrs.length;
  }

  // Adjusted risk with variant modifier
  const adjustedRisk = action.risk + variantRiskMod;

  // Failure Chance: proficiency-based instead of body-attr-based
  const baseFailChance = clamp(adjustedRisk * 100 * (1 - proficiency / 120), 2, 90);
  const failChance = isPlayer ? baseFailChance : baseFailChance * 0.4;
  const isFail = Math.random() * 100 < failChance;

  // --- ISU SCORING SYSTEM: BV + GOE ---
  const baseValue = action.baseScore * bvMultiplier;

  let goeGrade = 0; // -5 to +5

  if (isFail) {
    goeGrade = -5;
  } else {
    // GOE: proficiency-based + goeBonus (now for all types)
    const skillFactor = (proficiency - 50) / 15;

    // Style tag bonus: sum of goeImpacts, capped at 1.5
    let styleTagBonus = 0;
    for (const tagId of styleTags) {
      const tagDef = getStyleTag(tagId);
      if (tagDef) styleTagBonus += tagDef.goeImpact;
    }
    styleTagBonus = Math.min(styleTagBonus, 1.5);

    const fatiguePenalty = (1 - fatigueFactor) * -8;
    const randomness = (Math.random() - 0.5) * 1.5;
    goeGrade = clamp(skillFactor + goeBonus + styleTagBonus + fatiguePenalty + randomness, -4, 5);
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
    raw: baseValue, // now includes variant BV multiplier
    goe: goeGrade
  };
};

// Estimate success rate for UI display (deterministic, no randomness)
export const estimateSuccessRate = (
  action: MatchAction,
  technique?: SkaterTechnique,
  activeVariant?: string
): number => {
  if (!technique || !action.techReq) return 50;

  const req = action.techReq;
  let proficiency = 50;

  if (req.jumpType && req.rotation) {
    const key = getJumpKey(req.jumpType, req.rotation);
    const jumpProf = technique.jumps[req.jumpType]?.proficiency[key] || 20;
    if (req.comboSuffix && technique.comboProficiency) {
      const comboProf = technique.comboProficiency[req.comboSuffix] || 0;
      proficiency = (jumpProf + comboProf) / 2;
    } else {
      proficiency = jumpProf;
    }
  } else if (req.spinType && req.spinLevel) {
    proficiency = technique.spins[req.spinType]?.proficiency || 30;
  } else if (req.stepLevel) {
    proficiency = technique.steps?.proficiency || 30;
  }

  let variantRiskMod = 0;
  if (activeVariant) {
    const vDef = getVariant(activeVariant);
    if (vDef) variantRiskMod = vDef.riskModifier;
  }

  const adjustedRisk = action.risk + variantRiskMod;
  const failChance = clamp(adjustedRisk * 100 * (1 - proficiency / 120), 2, 90);
  return Math.round(100 - failChance);
};
