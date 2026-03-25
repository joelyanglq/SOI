
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
  styleTags: string[];           // acquired style tag IDs
  variants: string[];            // unlocked variant IDs (e.g. 'tano', 'rippon')
}

export type SpinType = 'upright' | 'sit' | 'camel' | 'combo' | 'flying';

export interface SpinCard {
  type: SpinType;
  level: number;       // 1-4
  proficiency: number; // 0-100
  goeBonus: number;    // per-type quality modifier (-1.0 to +1.0)
  styleTags: string[]; // acquired style tag IDs
  variants: string[];  // unlocked variant IDs (e.g. 'biellmann', 'donut')
}

export interface StepSkill {
  level: number;       // 1-4
  proficiency: number; // 0-100
  goeBonus: number;    // per-type quality modifier (-1.0 to +1.0)
  styleTags: string[]; // acquired style tag IDs
}

export interface SkaterTechnique {
  jumps: Record<JumpType, JumpCard>;
  spins: Record<SpinType, SpinCard>;
  steps: StepSkill;
  comboProficiency: Record<string, number>; // '+2T': 80, '+3T': 45, '+2Lo': 60
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
  traits?: TraitId[]; // Skater traits (max 4)
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
  programV2?: ProgramV2;
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
  | 'jump' | 'spin' | 'step' | 'perf' | 'endurance' | 'rest' | 'rehearsal';

export type TrainingMode = 'stability' | 'balanced' | 'refinement';

export interface TrainingFocus {
  primaryJump: JumpType;
  secondaryJump: JumpType;
  mode: TrainingMode;
}

export interface TrainingTaskDefinition {
  id: TrainingTaskType;
  name: string;
  color: string;
  // Body attribute gain (for body ceiling attributes)
  targetAttr?: keyof PlayerAttributes;
  bodyGain: number;
  // Technique card gain
  targetTech?: 'jump' | 'spin' | 'step';
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
  trainingFocus: TrainingFocus; // Jump focus + training mode
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
    choreographers: ChoreographerNPC[];
    costumes?: ProgramCostume[];
  };
  playerMusic?: Music[];
  lastGrowth?: { tec: number; art: number };
  pendingStyleTags?: PendingStyleTagSelection[];
  pendingTraitSelection?: PendingTraitSelection;
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
    comboSuffix?: string; // '+2T' | '+3T' | '+2Lo' for combo actions
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
  variant?: string; // active variant ID for this element
}

export interface ProgramConfig {
  elements: ProgramElement[]; // Ordered list of elements
}

export type ConfigStrategy = 'conservative' | 'balanced' | 'aggressive' | 'custom';

// --- Style Tag System ---
export interface StyleTagDef {
  id: string;
  name: string;
  nameEn: string;
  description: string;
  goeImpact: number;        // 0.1 to 0.5
  category: 'jump' | 'spin' | 'step' | 'general';
  rarity: 'common' | 'rare' | 'legendary';
  requirement?: {
    minProficiency?: number;
    minBodyAttr?: Partial<PlayerAttributes>;
  };
}

// --- Variant System ---
export interface VariantDef {
  id: string;
  name: string;
  nameEn: string;
  description: string;
  bvMultiplier: number;      // e.g. 1.10 = +10% BV
  riskModifier: number;      // e.g. 0.05 = +5% added risk
  category: 'jump' | 'spin';
  applicableTo?: SpinType[]; // for spin variants only
  requirement: {
    minProficiency: number;
    minBodySpin?: number;
    prerequisiteVariant?: string;
  };
}

// --- Pending Style Tag Selection ---
export interface PendingStyleTagSelection {
  targetType: 'jump' | 'spin' | 'step';
  targetKey: string;
  proficiencyKey?: string;
  candidates: string[];
}

// --- Trait System ---
export type TraitId =
  // Passive (training/growth/constitution)
  | 'quick_learner'
  | 'steel_ankles'
  | 'late_bloomer'
  | 'glass_cannon'
  | 'iron_stamina'
  // Conditional (match-time)
  | 'momentum_rider'
  | 'iron_will'
  | 'clutch_performer'
  | 'quad_queen'
  | 'spin_enchanter'
  | 'crowd_igniter'
  | 'slow_starter'
  | 'pressure_cracker';

export type TraitTrigger = 'passive' | 'conditional';
export type TraitCategory = 'training' | 'growth' | 'constitution' | 'match';

export interface TraitDef {
  id: TraitId;
  name: string;
  nameEn: string;
  description: string;
  trigger: TraitTrigger;
  category: TraitCategory;
  isNegative?: boolean;
  icon: string;
}

export interface TraitMatchState {
  consecutiveClean: number;
  lastActionFailed: boolean;
  successfulQuads: number;
  level4Spins: number;
  firstHalfFails: number;
  firstHalfComplete: boolean;
  isTrailing: boolean;
  trailingMargin: number;
  isCurrentlyFirst: boolean;
  spRankBottomHalf: boolean;
}

export interface PendingTraitSelection {
  reason: string;
  candidates: TraitId[];
}

// ============================================================
// Program Creation System — Music / Choreographer / Costume / Blueprint
// ============================================================

// --- Music ---
export type MusicMood = 'lyrical' | 'dramatic' | 'energetic' | 'melancholic' | 'ethereal';
export type MusicStructure = 'gradual' | 'explosive' | 'cyclic' | 'narrative';

export interface Music {
  id: string;
  name: string;
  description: string;
  mood: MusicMood;
  structure: MusicStructure;
  complexity: 1 | 2 | 3;
  energyCurve: number[];       // 7 values (one per element slot), 0.8-1.2
}

// --- Choreographer NPC ---
export type ChoreographerType = 'classical' | 'modern' | 'theatrical' | 'minimalist';
export type ChoreographerTier = 'rising' | 'established' | 'master';

export interface ChoreographerNPC {
  id: string;
  name: string;
  quote: string;
  type: ChoreographerType;
  tier: ChoreographerTier;
  preferredMoods: MusicMood[];
  cost: number;
  transitionQuality: number;   // 0.3-1.0
  choreoQuality: number;       // 0.3-1.0
  portrait: string;
}

// --- Costume (Artistic) ---
export type CostumeTheme = 'elegant' | 'fierce' | 'ethereal' | 'classic';

export interface ProgramCostume {
  id: string;
  name: string;
  description: string;
  theme: CostumeTheme;
  moodAffinity: MusicMood[];
  quality: 1 | 2 | 3;
  price: number;
}

// --- Program Blueprint ---
export interface ChoreographicSequence {
  description: string;
  emotionalBeat: string;
  impressionScore: number;     // 0.3-1.0
}

export interface BlueprintTransition {
  description: string;
  quality: number;             // 0.3-1.0
}

export type BlueprintSegment =
  | { type: 'choreo'; data: ChoreographicSequence }
  | { type: 'transition'; data: BlueprintTransition }
  | { type: 'element'; slotIndex: number; phase: MatchPhaseType; recommendation: string };

export interface ProgramBlueprint {
  id: string;
  name: string;
  segments: BlueprintSegment[];
  totalTransitionQuality: number;
  totalChoreoImpression: number;
  choreographerId: string;
  musicId: string;
}

// --- Synergy ---
export interface SynergyResult {
  stars: number;              // 0-3
  multiplier: number;
  details: string[];
}

// --- Enhanced Program ---
export interface ProgramV2 {
  name: string;
  music: Music;
  choreographerId: string;
  costume: ProgramCostume;
  blueprint: ProgramBlueprint;
  synergy: SynergyResult;
  maturity: number;           // 0-100
  totalRuns: number;
}
