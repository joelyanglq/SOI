import { describe, it, expect } from 'vitest';
import { calculateSynergy, getMaturityModifier, assembleProgramV2 } from '../program';
import { Music, ChoreographerNPC, ProgramCostume } from '../../types';

// --- Helpers ---

const makeMusic = (overrides?: Partial<Music>): Music => ({
  id: 'mus_test',
  name: 'Test Music',
  description: 'A test piece',
  mood: 'lyrical',
  structure: 'gradual',
  complexity: 2,
  energyCurve: [1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0],
  ...overrides,
});

const makeChoreo = (overrides?: Partial<ChoreographerNPC>): ChoreographerNPC => ({
  id: 'choreo_test',
  name: 'Test Choreo',
  quote: 'Test',
  type: 'classical',
  tier: 'master',
  preferredMoods: ['lyrical', 'melancholic'],
  cost: 50000,
  transitionQuality: 0.9,
  choreoQuality: 0.95,
  portrait: '🎼',
  ...overrides,
});

const makeCostume = (overrides?: Partial<ProgramCostume>): ProgramCostume => ({
  id: 'costume_test',
  name: 'Test Costume',
  description: 'A test costume',
  theme: 'elegant',
  moodAffinity: ['lyrical', 'ethereal'],
  quality: 2,
  price: 5000,
  ...overrides,
});

// --- Tests ---

describe('calculateSynergy', () => {
  it('music-choreo mood match gives +1 star', () => {
    // Choreo prefers 'lyrical', music mood is 'lyrical' → match
    const synergy = calculateSynergy(
      makeMusic({ mood: 'lyrical' }),
      makeChoreo({ preferredMoods: ['lyrical'] }),
      makeCostume({ moodAffinity: [], theme: 'fierce' }), // no other matches
    );
    expect(synergy.stars).toBeGreaterThanOrEqual(1);
    expect(synergy.details.length).toBeGreaterThanOrEqual(1);
  });

  it('music-costume mood match gives +1 star', () => {
    const synergy = calculateSynergy(
      makeMusic({ mood: 'lyrical' }),
      makeChoreo({ preferredMoods: ['energetic'] }), // no choreo match
      makeCostume({ moodAffinity: ['lyrical'], theme: 'fierce' }), // mood match, no theme match
    );
    expect(synergy.stars).toBeGreaterThanOrEqual(1);
  });

  it('choreo type × costume theme match gives +1 star', () => {
    // Need to know the CHOREO_COSTUME_SYNERGY mapping
    // classical → ['elegant', 'classic'] typically
    const synergy = calculateSynergy(
      makeMusic({ mood: 'energetic' }), // no mood matches
      makeChoreo({ preferredMoods: ['dramatic'], type: 'classical' }),
      makeCostume({ moodAffinity: [], theme: 'elegant' }),
    );
    expect(synergy.stars).toBeGreaterThanOrEqual(1);
  });

  it('all three paths = 3 stars', () => {
    const synergy = calculateSynergy(
      makeMusic({ mood: 'lyrical' }),
      makeChoreo({ preferredMoods: ['lyrical'], type: 'classical' }),
      makeCostume({ moodAffinity: ['lyrical'], theme: 'elegant' }),
    );
    expect(synergy.stars).toBe(3);
    expect(synergy.multiplier).toBeCloseTo(1.20, 2);
  });

  it('no matches = 0 stars, multiplier 1.0', () => {
    // theatrical synergy = ['fierce', 'elegant'], so use 'classic' theme to avoid match
    const synergy = calculateSynergy(
      makeMusic({ mood: 'energetic' }),
      makeChoreo({ preferredMoods: ['melancholic'], type: 'theatrical' }),
      makeCostume({ moodAffinity: ['lyrical'], theme: 'classic' }),
    );
    expect(synergy.stars).toBe(0);
    expect(synergy.multiplier).toBe(1.0);
  });
});

describe('getMaturityModifier', () => {
  it('maturity 0 → modifier 0.7', () => {
    expect(getMaturityModifier(0)).toBeCloseTo(0.7, 2);
  });

  it('maturity 30 → modifier 0.9 (boundary)', () => {
    expect(getMaturityModifier(30)).toBeCloseTo(0.9, 2);
  });

  it('maturity 50 → modifier ~0.94', () => {
    const mod = getMaturityModifier(50);
    expect(mod).toBeGreaterThan(0.9);
    expect(mod).toBeLessThan(1.0);
    // 0.9 + (20/50)*0.1 = 0.94
    expect(mod).toBeCloseTo(0.94, 2);
  });

  it('maturity 80 → modifier 1.0 (boundary)', () => {
    expect(getMaturityModifier(80)).toBeCloseTo(1.0, 2);
  });

  it('maturity 100 → modifier 1.05', () => {
    expect(getMaturityModifier(100)).toBeCloseTo(1.05, 2);
  });

  it('modifier increases monotonically', () => {
    let prev = getMaturityModifier(0);
    for (let m = 10; m <= 100; m += 10) {
      const curr = getMaturityModifier(m);
      expect(curr).toBeGreaterThanOrEqual(prev);
      prev = curr;
    }
  });
});

describe('assembleProgramV2', () => {
  it('correctly assembles all fields', () => {
    const music = makeMusic();
    const choreo = makeChoreo();
    const costume = makeCostume();

    const program = assembleProgramV2(music, choreo, costume);

    expect(program.name).toBe(music.name);
    expect(program.music).toBe(music);
    expect(program.choreographerId).toBe(choreo.id);
    expect(program.costume).toBe(costume);
    expect(program.blueprint).toBeDefined();
    expect(program.blueprint.segments.length).toBeGreaterThan(0);
    expect(program.synergy).toBeDefined();
    expect(program.synergy.stars).toBeGreaterThanOrEqual(0);
    expect(program.synergy.stars).toBeLessThanOrEqual(3);
    expect(program.maturity).toBe(0);
    expect(program.totalRuns).toBe(0);
  });

  it('uses custom phases when provided', () => {
    const program = assembleProgramV2(
      makeMusic(), makeChoreo(), makeCostume(),
      ['jump_solo', 'spin1', 'step'],
    );

    // Blueprint should have element segments for 3 phases
    const elementSegments = program.blueprint.segments.filter(s => s.type === 'element');
    expect(elementSegments.length).toBe(3);
  });
});
