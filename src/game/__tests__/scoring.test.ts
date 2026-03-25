import { describe, it, expect } from 'vitest';
import { calculateActionScore, calculatePCS, estimateSuccessRate } from '../scoring';
import { MatchAction, PlayerAttributes, SkaterTechnique, ProgramV2 } from '../../types';

// --- Helpers ---

const makeAttrs = (overrides?: Partial<PlayerAttributes>): PlayerAttributes => ({
  jump: 50, spin: 50, step: 50, perf: 50, endurance: 50,
  ...overrides,
});

const makeAction = (overrides?: Partial<MatchAction>): MatchAction => ({
  id: 'test_3Lz',
  name: '3Lz',
  type: 'jump_solo',
  baseScore: 5.9,
  cost: 15,
  risk: 0.3,
  reqStats: {},
  techReq: { jumpType: 'lutz', rotation: 3 },
  desc: 'test',
  ...overrides,
});

const makeTechnique = (): SkaterTechnique => ({
  jumps: {
    lutz: { type: 'lutz', maxRotation: 3, proficiency: { '3Lz': 80 }, goeBonus: 0.2, styleTags: [], variants: [] },
    toeloop: { type: 'toeloop', maxRotation: 2, proficiency: { '2T': 60 }, goeBonus: 0, styleTags: [], variants: [] },
    salchow: { type: 'salchow', maxRotation: 2, proficiency: { '2S': 60 }, goeBonus: 0, styleTags: [], variants: [] },
    loop: { type: 'loop', maxRotation: 2, proficiency: { '2Lo': 60 }, goeBonus: 0, styleTags: [], variants: [] },
    flip: { type: 'flip', maxRotation: 2, proficiency: { '2F': 60 }, goeBonus: 0, styleTags: [], variants: [] },
    axel: { type: 'axel', maxRotation: 1, proficiency: { '1A': 50 }, goeBonus: 0, styleTags: [], variants: [] },
  },
  spins: {
    upright: { type: 'upright', level: 2, proficiency: 60, goeBonus: 0, styleTags: [], variants: [] },
    sit: { type: 'sit', level: 1, proficiency: 40, goeBonus: 0, styleTags: [], variants: [] },
    camel: { type: 'camel', level: 1, proficiency: 40, goeBonus: 0, styleTags: [], variants: [] },
    combo: { type: 'combo', level: 1, proficiency: 40, goeBonus: 0, styleTags: [], variants: [] },
    flying: { type: 'flying', level: 1, proficiency: 30, goeBonus: 0, styleTags: [], variants: [] },
  },
  steps: { level: 2, proficiency: 55, goeBonus: 0, styleTags: [] },
  comboProficiency: { '+2T': 50, '+3T': 10, '+2Lo': 30 },
});

// --- Tests ---

describe('calculateActionScore', () => {
  it('returns base value as raw field', () => {
    const result = calculateActionScore(makeAction(), makeAttrs(), 100, true, makeTechnique());
    expect(result.raw).toBeCloseTo(5.9, 1);
  });

  it('sets GOE = -5 on fail', () => {
    // Run many trials; whenever isFail is true, goe must be -5
    let sawFail = false;
    for (let i = 0; i < 500; i++) {
      const result = calculateActionScore(makeAction({ risk: 0.9 }), makeAttrs(), 100, true, makeTechnique());
      if (result.isFail) {
        expect(result.goe).toBe(-5);
        sawFail = true;
      }
    }
    expect(sawFail).toBe(true);
  });

  it('higher proficiency leads to lower fail rate (statistical)', () => {
    const action = makeAction({ risk: 0.4 });
    const attrs = makeAttrs();
    const tech = makeTechnique();

    // Low proficiency
    const lowTech = JSON.parse(JSON.stringify(tech)) as SkaterTechnique;
    lowTech.jumps.lutz.proficiency['3Lz'] = 20;

    // High proficiency
    const highTech = JSON.parse(JSON.stringify(tech)) as SkaterTechnique;
    highTech.jumps.lutz.proficiency['3Lz'] = 95;

    let lowFails = 0, highFails = 0;
    const N = 2000;
    for (let i = 0; i < N; i++) {
      if (calculateActionScore(action, attrs, 100, true, lowTech).isFail) lowFails++;
      if (calculateActionScore(action, attrs, 100, true, highTech).isFail) highFails++;
    }
    expect(lowFails).toBeGreaterThan(highFails);
  });

  it('applies variant BV multiplier', () => {
    const tech = makeTechnique();
    tech.jumps.lutz.variants = ['tano'];
    const result = calculateActionScore(makeAction(), makeAttrs(), 100, true, tech, 'tano');
    // tano BV multiplier is 1.10, base = 5.9 → raw ≈ 6.49
    expect(result.raw).toBeCloseTo(5.9 * 1.10, 1);
  });

  it('style tag increases GOE (on success)', () => {
    const tech = makeTechnique();
    tech.jumps.lutz.proficiency['3Lz'] = 95; // high prof reduces fail
    tech.jumps.lutz.styleTags = ['huge_air']; // goeImpact 0.3

    let withTagGoe = 0;
    let withoutTagGoe = 0;
    const techNoTag = JSON.parse(JSON.stringify(tech)) as SkaterTechnique;
    techNoTag.jumps.lutz.styleTags = [];

    const N = 2000;
    let countWith = 0, countWithout = 0;
    for (let i = 0; i < N; i++) {
      const rWith = calculateActionScore(makeAction(), makeAttrs(), 100, true, tech);
      const rWithout = calculateActionScore(makeAction(), makeAttrs(), 100, true, techNoTag);
      if (!rWith.isFail) { withTagGoe += rWith.goe; countWith++; }
      if (!rWithout.isFail) { withoutTagGoe += rWithout.goe; countWithout++; }
    }
    const avgWith = withTagGoe / countWith;
    const avgWithout = withoutTagGoe / countWithout;
    expect(avgWith).toBeGreaterThan(avgWithout);
  });

  it('returns PCS when programV2 is provided', () => {
    const programV2 = {
      synergy: { stars: 2, multiplier: 1.12, details: [] },
      maturity: 60,
      blueprint: { totalTransitionQuality: 0.7, totalChoreoImpression: 0.6 },
    } as unknown as ProgramV2;

    const result = calculateActionScore(makeAction(), makeAttrs(), 100, true, makeTechnique(), undefined, undefined, undefined, programV2);
    expect(result.pcs).toBeDefined();
    expect(result.pcs!.synergyMultiplier).toBe(1.12);
  });

  it('trait fail rate mod correctly adjusts fail chance', () => {
    const action = makeAction({ risk: 0.5 });
    const attrs = makeAttrs();
    const tech = makeTechnique();
    tech.jumps.lutz.proficiency['3Lz'] = 50; // moderate proficiency

    let failsNoMod = 0, failsWithMod = 0;
    const N = 3000;
    for (let i = 0; i < N; i++) {
      if (calculateActionScore(action, attrs, 100, true, tech, undefined, 0).isFail) failsNoMod++;
      if (calculateActionScore(action, attrs, 100, true, tech, undefined, -20).isFail) failsWithMod++;
    }
    // -20 mod should produce fewer fails
    expect(failsWithMod).toBeLessThan(failsNoMod);
  });
});

describe('calculatePCS', () => {
  it('computes three PCS components', () => {
    const pcs = calculatePCS(makeAttrs({ step: 70, perf: 80 }));
    expect(pcs.skatingSkills).toBeGreaterThan(0);
    expect(pcs.transitions).toBeGreaterThan(0);
    expect(pcs.performance).toBeGreaterThan(0);
    expect(pcs.total).toBeCloseTo((pcs.skatingSkills + pcs.transitions + pcs.performance) / 3, 5);
  });

  it('applies synergy multiplier from programV2', () => {
    const programV2 = {
      synergy: { stars: 3, multiplier: 1.20, details: [] },
      maturity: 50,
      blueprint: { totalTransitionQuality: 0.6, totalChoreoImpression: 0.5 },
    } as unknown as ProgramV2;

    const pcs = calculatePCS(makeAttrs(), undefined, programV2);
    expect(pcs.synergyMultiplier).toBe(1.20);
    expect(pcs.final).toBeGreaterThan(pcs.total); // multiplier > 1
  });

  it('maturity modifier three-segment verification', () => {
    const makeProgram = (maturity: number) => ({
      synergy: { stars: 0, multiplier: 1.0, details: [] },
      maturity,
      blueprint: { totalTransitionQuality: 0.5, totalChoreoImpression: 0.5 },
    } as unknown as ProgramV2);

    const pcs0 = calculatePCS(makeAttrs(), undefined, makeProgram(0));
    const pcs50 = calculatePCS(makeAttrs(), undefined, makeProgram(50));
    const pcs100 = calculatePCS(makeAttrs(), undefined, makeProgram(100));

    expect(pcs0.maturityModifier).toBeCloseTo(0.7, 2);
    // maturity 50: 0.9 + (20/50)*0.1 = 0.94
    expect(pcs50.maturityModifier).toBeGreaterThan(0.9);
    expect(pcs50.maturityModifier).toBeLessThan(1.0);
    expect(pcs100.maturityModifier).toBeCloseTo(1.05, 2);
  });
});

describe('estimateSuccessRate', () => {
  it('returns value between 10 and 98', () => {
    const action = makeAction();
    const tech = makeTechnique();

    const rate = estimateSuccessRate(action, tech);
    expect(rate).toBeGreaterThanOrEqual(10);
    expect(rate).toBeLessThanOrEqual(98);
  });

  it('higher proficiency yields higher success rate', () => {
    const action = makeAction();
    const lowTech = makeTechnique();
    lowTech.jumps.lutz.proficiency['3Lz'] = 20;
    const highTech = makeTechnique();
    highTech.jumps.lutz.proficiency['3Lz'] = 95;

    expect(estimateSuccessRate(action, highTech)).toBeGreaterThan(estimateSuccessRate(action, lowTech));
  });

  it('variant increases risk, reducing success rate', () => {
    const action = makeAction();
    const tech = makeTechnique();
    tech.jumps.lutz.variants = ['tano'];

    const noVariant = estimateSuccessRate(action, tech);
    const withVariant = estimateSuccessRate(action, tech, 'tano');
    expect(withVariant).toBeLessThan(noVariant);
  });

  it('returns 50 without technique', () => {
    expect(estimateSuccessRate(makeAction())).toBe(50);
  });
});
