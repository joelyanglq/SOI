
export interface Program {
  name: string;
  baseArt: number;
  freshness: number; // 0 - 100
}

// --- Technique Card System ---
export type JumpType = 'axel' | 'toeloop' | 'salchow' | 'loop' | 'flip' | 'lutz';

export interface JumpCard {
  type: JumpType;
  maxRotation: number;           // highest learned rotation (1-4)
  proficiency: Record<string, number>; // e.g. '3Lz': 72 (0-100)
  goeBonus: number;              // per-type quality modifier (-1.0 to +1.0)
}

export type SpinType = 'upright' | 'sit' | 'camel' | 'combo' | 'flying';

export interface SpinCard {
  type: SpinType;
  level: number;       // 1-4
  proficiency: number; // 0-100
}

export interface StepSkill {
  level: number;       // 1-4
  proficiency: number; // 0-100
}

export interface SkaterTechnique {
  jumps: Record<JumpType, JumpCard>;
  spins: Record<SpinType, SpinCard>;
  steps: StepSkill;
}

export interface HonorRecord {
  year: number;
  month: number;
  eventName: string;
  rank: number;
  points: number;
}

export interface PlayerAttributes {
  jump: number;
  spin: number;
  step: number;
  perf: number; // Renamed from aura
  endurance: number;
}

export interface Skater {
  name: string;
  age: number;
  tec: number; // Calculated from attributes for player, raw for AI
  art: number; // Calculated from attributes for player, raw for AI
  sta: number; // Global Stamina Resource
  attributes?: PlayerAttributes; // Only for player
  technique?: SkaterTechnique; // Card-based technique system
  pointsCurrent: number;
  pointsLast: number;
  rolling?: number;
  titles: string[]; // Legacy support
  honors: HonorRecord[];
  pQual: number;
  pAge: number;
  injuryMonths: number;
  isPlayer: boolean;
  retired: boolean;
  id: string;
  activeProgram: Program;
}

export interface Equipment {
  id: string;
  name: string;
  type: 'skate' | 'blade' | 'costume';
  price: number;
  // 5D Bonus System
  jumpBonus: number;
  spinBonus: number;
  stepBonus: number;
  perfBonus: number;
  enduranceBonus: number;
  
  owned: boolean;
  lifespan: number; 
  maxLifespan: number;
}

export interface Coach {
  id: string;
  name: string;
  tecMod: number;
  artMod: number;
  salary: number;
  tier: 'basic' | 'pro' | 'legend';
}

export interface Sponsorship {
  id: string;
  name: string;
  // Tier indicates brand scale/quality. Duration is independent.
  tier: 'local' | 'brand' | 'global';
  duration: number;
  paymentType: 'monthly' | 'lump-sum';

  // Payment fields: depending on paymentType only one of these is expected to be used.
  signingBonus: number;
  monthlyPay?: number;
  totalPay?: number;

  minFame: number;
  remainingMonths: number;

  // Optional metadata
  discount?: number;
  isRenewal?: boolean;
}

export interface GameEvent {
  name: string;
  base: number;
  pts: number;
  req: number;
  max: number;
  prize?: number;
  template: string; // 'low' | 'mid' | 'high'
  _simulated?: boolean;
}

export interface RandomEvent {
  id: string;
  name: string;
  description: string;
  chance: number;
  isRare: boolean;
  effect: {
    money?: number;
    fame?: number;
    sta?: number;
    injuryMonths?: number;
    // 5D Attribute Effects
    jump?: number;
    spin?: number;
    step?: number;
    perf?: number;
    endurance?: number;
  };
  type: 'positive' | 'negative' | 'neutral';
}

export type TrainingTaskType =
  | 'train_axel' | 'train_toeloop' | 'train_salchow'
  | 'train_loop' | 'train_flip' | 'train_lutz'
  | 'spin' | 'step' | 'perf' | 'endurance'
  | 'rest';

export interface TrainingTaskDefinition {
  id: TrainingTaskType;
  name: string;
  color: string;
  // Body attribute gain (for body ceiling attributes)
  targetAttr?: keyof PlayerAttributes;
  bodyGain: number;
  // Technique card gain
  targetTech?: 'jump' | 'spin' | 'step';
  jumpType?: JumpType;
  baseGain: number;  // proficiency gain for technique cards
  staCost: number; // positive = cost, negative = gain
  desc: string;
}

export interface GameState {
  year: number;
  month: number;
  money: number;
  fame: number;
  injuryMonths: number;
  hasCompeted: boolean;
  skater: Skater;
  schedule: TrainingTaskType[]; // Replaces old plan
  aiSkaters: Skater[];
  inventory: Equipment[];
  activeCoachId: string | null;
  history: { 
    month: string; 
    tec: number; 
    art: number; 
    rank: number;
    fame: number;
    points: number;
  }[];
  activeEvent: { event: RandomEvent; narrative: string } | null;
  activeSponsor: Sponsorship | null;
  market: {
    coaches: Coach[];
    equipment: Equipment[];
    choreographers: { name: string; cost: number; base: number; desc: string }[];
  };
  lastGrowth?: { tec: number; art: number };
}

export type LogType = 'train' | 'comp' | 'med' | 'sys' | 'shop' | 'event' | 'art';

export interface LogEntry {
  id: string;
  msg: string;
  type: LogType;
  month: number;
}

// New Match Engine Types - ISU Compliant
export type MatchPhaseType = 'jump_solo' | 'jump_combo' | 'jump_axel' | 'spin1' | 'spin2' | 'spin3' | 'step';

export interface MatchAction {
  id: string;
  name: string;
  type: MatchPhaseType;
  baseScore: number;
  cost: number;
  risk: number; // 0-1 base failure chance
  reqStats: Partial<PlayerAttributes>; // Legacy: body ceiling requirements
  techReq?: {
    jumpType?: JumpType;
    rotation?: number;
    spinType?: SpinType;
    spinLevel?: number;
    stepLevel?: number;
  };
  desc: string;
}

export interface MatchStructure {
  id: string;
  name: string;
  desc: string;
  phases: MatchPhaseType[];
}

// Program Configuration for Competition
export interface ProgramElement {
  phase: MatchPhaseType;
  actionId: string;
}

export interface ProgramConfig {
  elements: ProgramElement[]; // Ordered list of elements
}

export type ConfigStrategy = 'conservative' | 'balanced' | 'aggressive' | 'custom';
