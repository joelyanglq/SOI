import { Skater, MatchAction, PlayerAttributes, MatchPhaseType, SkaterTechnique } from '../types';
import { ACTION_LIBRARY, MATCH_STRUCTURES, canPerformAction } from './data/actions';
import { calculateActionScore } from './scoring';
import { createAITechnique } from './data/technique';

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

// AI Simulation Logic
export const simulateAIProgram = (skater: Skater, templateId: string): number => {
  const template = MATCH_STRUCTURES[templateId] || MATCH_STRUCTURES['low'];

  const stats: PlayerAttributes = skater.attributes || {
    jump: skater.tec,
    spin: skater.tec,
    step: (skater.tec + skater.art) / 2,
    perf: skater.art,
    endurance: skater.tec * 0.9
  };

  // Use technique if available, otherwise generate from stats
  const technique = skater.technique || createAITechnique(skater.tec, skater.art);

  let totalScore = 0;
  let currentSta = 100;

  template.phases.forEach(phase => {
    const bestAction = getBestAction(phase, stats, technique);
    const res = calculateActionScore(bestAction, stats, currentSta, false, technique);
    totalScore += res.score;
    currentSta -= res.cost;
  });

  return totalScore * (0.95 + Math.random() * 0.1);
};
