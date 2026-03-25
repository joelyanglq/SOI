import { describe, it, expect } from 'vitest';
import { calculateRolling, calcDerivedStats, getTotalAttributes } from '../ranking';
import { PlayerAttributes, Equipment } from '../../types';

// --- Helpers ---

const makeAttrs = (overrides?: Partial<PlayerAttributes>): PlayerAttributes => ({
  jump: 50, spin: 50, step: 50, perf: 50, endurance: 50,
  ...overrides,
});

const makeEquipment = (overrides?: Partial<Equipment>): Equipment => ({
  id: 'eq_test',
  name: 'Test Equipment',
  type: 'skate',
  price: 1000,
  jumpBonus: 0,
  spinBonus: 0,
  stepBonus: 0,
  perfBonus: 0,
  enduranceBonus: 0,
  owned: true,
  lifespan: 10,
  maxLifespan: 12,
  ...overrides,
});

// --- Tests ---

describe('calculateRolling', () => {
  it('rolling = current + last × 0.7', () => {
    const result = calculateRolling({ pointsCurrent: 1000, pointsLast: 500 });
    expect(result).toBe(Math.floor(1000 + 500 * 0.7)); // 1350
  });

  it('returns 0 when both are 0', () => {
    expect(calculateRolling({ pointsCurrent: 0, pointsLast: 0 })).toBe(0);
  });

  it('floors the result', () => {
    // 100 + 33 * 0.7 = 100 + 23.1 = 123.1 → floor → 123
    expect(calculateRolling({ pointsCurrent: 100, pointsLast: 33 })).toBe(123);
  });
});

describe('calcDerivedStats', () => {
  it('tec = jump×0.4 + spin×0.3 + step×0.2 + endurance×0.1', () => {
    const attrs = makeAttrs({ jump: 80, spin: 60, step: 40, endurance: 20 });
    const { tec } = calcDerivedStats(attrs);
    const expected = 80 * 0.4 + 60 * 0.3 + 40 * 0.2 + 20 * 0.1;
    expect(tec).toBeCloseTo(expected, 5);
  });

  it('art = perf×0.5 + step×0.3 + endurance×0.2', () => {
    const attrs = makeAttrs({ perf: 70, step: 50, endurance: 30 });
    const { art } = calcDerivedStats(attrs);
    const expected = 70 * 0.5 + 50 * 0.3 + 30 * 0.2;
    expect(art).toBeCloseTo(expected, 5);
  });

  it('results are clamped to 0-100', () => {
    // All at 100 → tec = 100, art = 100 (no overflow)
    const { tec, art } = calcDerivedStats(makeAttrs({
      jump: 100, spin: 100, step: 100, perf: 100, endurance: 100,
    }));
    expect(tec).toBeLessThanOrEqual(100);
    expect(art).toBeLessThanOrEqual(100);

    // All at 0
    const zero = calcDerivedStats(makeAttrs({ jump: 0, spin: 0, step: 0, perf: 0, endurance: 0 }));
    expect(zero.tec).toBeGreaterThanOrEqual(0);
    expect(zero.art).toBeGreaterThanOrEqual(0);
  });
});

describe('getTotalAttributes', () => {
  it('equipment bonuses stack correctly', () => {
    const base = makeAttrs({ jump: 50, spin: 40 });
    const eq1 = makeEquipment({ jumpBonus: 5, spinBonus: 3 });
    const eq2 = makeEquipment({ id: 'eq2', jumpBonus: 3, spinBonus: 2 });

    const total = getTotalAttributes(base, [eq1, eq2]);
    expect(total.jump).toBe(58); // 50 + 5 + 3
    expect(total.spin).toBe(45); // 40 + 3 + 2
  });

  it('does not exceed 100', () => {
    const base = makeAttrs({ jump: 95 });
    const eq = makeEquipment({ jumpBonus: 10 });
    const total = getTotalAttributes(base, [eq]);
    expect(total.jump).toBe(100); // clamped
  });

  it('ignores equipment with lifespan <= 0', () => {
    const base = makeAttrs({ jump: 50 });
    const expired = makeEquipment({ jumpBonus: 10, lifespan: 0 });
    const total = getTotalAttributes(base, [expired]);
    expect(total.jump).toBe(50); // no bonus applied
  });

  it('ignores unowned equipment', () => {
    const base = makeAttrs({ jump: 50 });
    const notOwned = makeEquipment({ jumpBonus: 10, owned: false });
    const total = getTotalAttributes(base, [notOwned]);
    expect(total.jump).toBe(50);
  });

  it('does not mutate the base attributes', () => {
    const base = makeAttrs({ jump: 50 });
    const eq = makeEquipment({ jumpBonus: 5 });
    getTotalAttributes(base, [eq]);
    expect(base.jump).toBe(50); // unchanged
  });
});
