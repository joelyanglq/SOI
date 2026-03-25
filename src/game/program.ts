import {
  Music, ChoreographerNPC, ProgramCostume, SynergyResult, ProgramV2,
  Program, MatchPhaseType,
} from '../types';
import { CHOREO_COSTUME_SYNERGY, CHOREOGRAPHER_LIBRARY, getChoreographerById } from './data/choreographers';
import { generateBlueprint } from './data/blueprint';
import { generateMusic } from './data/music';
import { generateCostume } from './data/costumes';

// --- Synergy calculation ---

const SYNERGY_MULTIPLIERS = [1.0, 1.05, 1.12, 1.20];

export const calculateSynergy = (
  music: Music,
  choreo: ChoreographerNPC,
  costume: ProgramCostume
): SynergyResult => {
  let stars = 0;
  const details: string[] = [];

  // 1. Music mood in choreographer's preferred moods
  if (choreo.preferredMoods.includes(music.mood)) {
    stars++;
    details.push('音乐与编舞师风格契合');
  }

  // 2. Music mood in costume's mood affinity
  if (costume.moodAffinity.includes(music.mood)) {
    stars++;
    details.push('音乐与服装气质一致');
  }

  // 3. Choreographer type × costume theme match
  if (CHOREO_COSTUME_SYNERGY[choreo.type]?.includes(costume.theme)) {
    stars++;
    details.push('编舞风格与服装主题匹配');
  }

  return {
    stars,
    multiplier: SYNERGY_MULTIPLIERS[stars],
    details,
  };
};

// --- Maturity modifier ---

export const getMaturityModifier = (maturity: number): number => {
  if (maturity < 30) return 0.7 + (maturity / 30) * 0.2;         // 0.7-0.9
  if (maturity < 80) return 0.9 + ((maturity - 30) / 50) * 0.1;  // 0.9-1.0
  return 1.0 + ((maturity - 80) / 20) * 0.05;                    // 1.0-1.05
};

// --- Create default ProgramV2 for migration from old Program ---

const DEFAULT_PHASES: MatchPhaseType[] = [
  'jump_solo', 'jump_combo', 'jump_axel', 'spin1', 'spin2', 'spin3', 'step',
];

export const createDefaultProgramV2 = (oldProgram?: Program): ProgramV2 => {
  const music = generateMusic();
  // Use the cheapest choreographer as default
  const choreo = CHOREOGRAPHER_LIBRARY.find(c => c.tier === 'rising') || CHOREOGRAPHER_LIBRARY[0];
  const costume = generateCostume();
  const blueprint = generateBlueprint(choreo, music, DEFAULT_PHASES);
  const synergy = calculateSynergy(music, choreo, costume);

  return {
    name: oldProgram?.name || music.name,
    music,
    choreographerId: choreo.id,
    costume,
    blueprint,
    synergy,
    maturity: oldProgram?.freshness ? Math.min(oldProgram.freshness, 50) : 20,
    totalRuns: 0,
  };
};

// --- Assemble a new ProgramV2 from player choices ---

export const assembleProgramV2 = (
  music: Music,
  choreo: ChoreographerNPC,
  costume: ProgramCostume,
  phases?: MatchPhaseType[]
): ProgramV2 => {
  const usedPhases = phases || DEFAULT_PHASES;
  const blueprint = generateBlueprint(choreo, music, usedPhases);
  const synergy = calculateSynergy(music, choreo, costume);

  return {
    name: music.name,
    music,
    choreographerId: choreo.id,
    costume,
    blueprint,
    synergy,
    maturity: 0,
    totalRuns: 0,
  };
};
