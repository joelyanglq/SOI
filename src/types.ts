
export interface Program {
  name: string;
  baseArt: number;
  freshness: number; // 0 - 100
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

export type TrainingTaskType = 'jump' | 'spin' | 'step' | 'perf' | 'endurance' | 'rest';

export interface TrainingTaskDefinition {
  id: TrainingTaskType;
  name: string;
  color: string;
  targetAttr?: keyof PlayerAttributes;
  baseGain: number;
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
  reqStats: Partial<PlayerAttributes>; // Requirements to unlock
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
