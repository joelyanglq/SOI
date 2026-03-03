import { Skater, MatchAction, PlayerAttributes, MatchPhaseType, SkaterTechnique } from '../types';
import { ACTION_LIBRARY, MATCH_STRUCTURES, canPerformAction } from './data/actions';
import { calculateActionScore } from './scoring';
import { createAITechnique } from './data/technique';
import { getVariant } from './data/variants';
import { createTraitMatchState, updateTraitMatchState, getTraitFailRateMod, getTraitPCSMod, hasTrait } from './data/traits';

// Helper to find the best action a skater can perform in a phase
export const getBestAction = (phase: MatchPhaseType, stats: PlayerAttributes, technique?: SkaterTechnique): MatchAction => {
  const validActions = ACTION_LIBRARY.filter(a => {
    if (a.type !== phase) return false;
    if (technique) {
      return canPerformAction(technique, a);
    }
    // Legacy fallback
    for (const [key, val] of Object.entries(a.reqStats)) {
      if ((stats[key as keyof PlayerAttributes] || 0) < (val as number)) return false;
    }
    return true;
  });

  if (validActions.length === 0) {
    return ACTION_LIBRARY.find(a => a.type === phase) || ACTION_LIBRARY[0];
  }
  return validActions.sort((a, b) => b.baseScore - a.baseScore)[0];
};

// Legacy alias
export const getBestActionForStats = getBestAction;

// Pick best variant for an action given technique
const pickAIVariant = (action: MatchAction, technique: SkaterTechnique): string | undefined => {
  const req = action.techReq;
  if (!req) return undefined;

  if (req.jumpType && req.rotation) {
    const card = technique.jumps[req.jumpType];
    if (card && card.variants.length > 0) {
      // Pick the variant with highest BV multiplier that the AI has
      let best: { id: string; mult: number } | undefined;
      for (const vId of card.variants) {
        const vDef = getVariant(vId);
        if (vDef && vDef.category === 'jump') {
          if (!best || vDef.bvMultiplier > best.mult) {
            best = { id: vId, mult: vDef.bvMultiplier };
          }
        }
      }
      return best?.id;
    }
  }

  if (req.spinType && req.spinLevel) {
    const card = technique.spins[req.spinType];
    if (card && card.variants.length > 0) {
      let best: { id: string; mult: number } | undefined;
      for (const vId of card.variants) {
        const vDef = getVariant(vId);
        if (vDef && vDef.category === 'spin') {
          if (!best || vDef.bvMultiplier > best.mult) {
            best = { id: vId, mult: vDef.bvMultiplier };
          }
        }
      }
      return best?.id;
    }
  }

  return undefined;
};

// AI Simulation Logic
export const simulateAIProgram = (skater: Skater, templateId: string): number => {
  const template = MATCH_STRUCTURES[templateId] || MATCH_STRUCTURES['low'];

  const baseStats: PlayerAttributes = skater.attributes || {
    jump: skater.tec,
    spin: skater.tec,
    step: (skater.tec + skater.art) / 2,
    perf: skater.art,
    endurance: skater.tec * 0.9
  };

  // slow_starter: simplified for AI (30% chance treated as "SP bottom half" → attrs +5%)
  const traits = skater.traits || [];
  let stats = baseStats;
  if (hasTrait(traits, 'slow_starter') && Math.random() < 0.3) {
    stats = {
      jump: baseStats.jump * 1.05,
      spin: baseStats.spin * 1.05,
      step: baseStats.step * 1.05,
      perf: baseStats.perf * 1.05,
      endurance: baseStats.endurance * 1.05,
    };
  }

  // Use technique if available, otherwise generate from stats
  const technique = skater.technique || createAITechnique(skater.tec, skater.art);

  let totalScore = 0;
  let currentSta = 100;
  let matchState = createTraitMatchState();
  const totalPhases = template.phases.length;

  template.phases.forEach((phase, index) => {
    const bestAction = getBestAction(phase, stats, technique);
    const variant = pickAIVariant(bestAction, technique);

    // Trait modifiers
    const failMod = getTraitFailRateMod(traits, matchState, bestAction);
    const pcsMod = getTraitPCSMod(traits, matchState, index, totalPhases);

    const res = calculateActionScore(bestAction, stats, currentSta, false, technique, variant, failMod, pcsMod, skater.programV2);
    totalScore += res.score;

    // iron_stamina: reduce cost in second half
    const costMul = (hasTrait(traits, 'iron_stamina') && index >= totalPhases / 2) ? 0.8 : 1.0;
    currentSta -= res.cost * costMul;

    // Update match state
    matchState = updateTraitMatchState(matchState, res, bestAction, index, totalPhases);
  });

  return totalScore * (0.95 + Math.random() * 0.1);
};
