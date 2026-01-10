
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

export interface Skater {
  name: string;
  age: number;
  tec: number;
  art: number;
  sta: number;
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
  tecBonus: number;
  artBonus: number;
  staBonus: number;
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
  type: 'brand' | 'local' | 'global';
  duration: number;
  monthlyPay: number;
  signingBonus: number;
  minFame: number;
  remainingMonths: number;
}

export interface GameEvent {
  name: string;
  base: number;
  pts: number;
  req: number;
  max: number;
  prize?: number;
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
    tec?: number;
    art?: number;
    sta?: number;
    injuryMonths?: number;
  };
  type: 'positive' | 'negative' | 'neutral';
}

export interface GameState {
  year: number;
  month: number;
  money: number;
  fame: number;
  injuryMonths: number;
  hasCompeted: boolean;
  skater: Skater;
  plan: { tec: number; art: number; rest: number };
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
