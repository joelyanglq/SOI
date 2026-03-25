import { describe, it, expect } from 'vitest';
import { calculateWeeklyStats } from '../training';
import { TrainingTaskType, Coach, TrainingFocus } from '../../types';

// --- Helpers ---

const defaultCoach: Coach = {
  id: 'coach_test', name: 'Test Coach', tecMod: 1.0, artMod: 1.0, salary: 1000, tier: 'basic',
};

const defaultFocus: TrainingFocus = {
  primaryJump: 'lutz', secondaryJump: 'flip', mode: 'balanced',
};

// --- Tests ---

describe('calculateWeeklyStats', () => {
  it('rest recovers stamina (staCost < 0)', () => {
    const schedule: TrainingTaskType[] = ['rest', 'rest', 'rest', 'rest', 'rest', 'rest', 'rest'];
    const result = calculateWeeklyStats(schedule, 30, defaultCoach, 20, 50);
    expect(result.finalSta).toBeGreaterThan(30);
  });

  it('jump training distributes to primary 60% and secondary 30%', () => {
    const schedule: TrainingTaskType[] = ['jump'];
    const result = calculateWeeklyStats(schedule, 100, defaultCoach, 20, 50, undefined, defaultFocus);

    const primaryGain = result.techGains.jumps.lutz || 0;
    const secondaryGain = result.techGains.jumps.flip || 0;

    // primary should get about double of secondary (60% vs 30%)
    expect(primaryGain).toBeGreaterThan(0);
    expect(secondaryGain).toBeGreaterThan(0);
    expect(primaryGain / secondaryGain).toBeCloseTo(2.0, 0);
  });

  it('refinement mode decreases prof gain, increases goe gain', () => {
    const schedule: TrainingTaskType[] = ['jump'];
    const balancedFocus: TrainingFocus = { ...defaultFocus, mode: 'balanced' };
    const refinementFocus: TrainingFocus = { ...defaultFocus, mode: 'refinement' };

    const balanced = calculateWeeklyStats(schedule, 100, defaultCoach, 20, 50, undefined, balancedFocus);
    const refinement = calculateWeeklyStats(schedule, 100, defaultCoach, 20, 50, undefined, refinementFocus);

    // Refinement: prof multiplier 0.6 (lower), goe multiplier 2.0 (higher)
    const balancedProf = balanced.techGains.jumps.lutz || 0;
    const refinementProf = refinement.techGains.jumps.lutz || 0;
    expect(refinementProf).toBeLessThan(balancedProf);

    const balancedGoe = balanced.goeBonusGains.jumps.lutz || 0;
    const refinementGoe = refinement.goeBonusGains.jumps.lutz || 0;
    expect(refinementGoe).toBeGreaterThan(balancedGoe);
  });

  it('age < 18 gives 1.3x gains', () => {
    const schedule: TrainingTaskType[] = ['jump'];
    const young = calculateWeeklyStats(schedule, 100, defaultCoach, 16, 50, undefined, defaultFocus);
    const adult = calculateWeeklyStats(schedule, 100, defaultCoach, 22, 50, undefined, defaultFocus);

    const youngGain = young.bodyGains.jump;
    const adultGain = adult.bodyGains.jump;

    expect(youngGain / adultGain).toBeCloseTo(1.3, 1);
  });

  it('late_bloomer trait reduces post-23 decay', () => {
    const schedule: TrainingTaskType[] = ['jump'];
    const noTrait = calculateWeeklyStats(schedule, 100, defaultCoach, 26, 50, undefined, defaultFocus, []);
    const withTrait = calculateWeeklyStats(schedule, 100, defaultCoach, 26, 50, undefined, defaultFocus, ['late_bloomer']);

    expect(withTrait.bodyGains.jump).toBeGreaterThan(noTrait.bodyGains.jump);
  });

  it('rehearsal produces maturityGain in 7-15 range', () => {
    const schedule: TrainingTaskType[] = ['rehearsal'];
    const result = calculateWeeklyStats(schedule, 100, defaultCoach, 20, 50);
    expect(result.maturityGain).toBeGreaterThanOrEqual(7);
    expect(result.maturityGain).toBeLessThanOrEqual(15);
  });

  it('exhausted stamina drops efficiency to ≤ 0.3', () => {
    const schedule: TrainingTaskType[] = ['jump'];
    const normal = calculateWeeklyStats(schedule, 100, defaultCoach, 20, 50, undefined, defaultFocus);
    const exhausted = calculateWeeklyStats(schedule, 0, defaultCoach, 20, 50, undefined, defaultFocus);

    // At 0 stamina, efficiency = 0, so gains should be 0
    expect(exhausted.bodyGains.jump).toBe(0);
    expect(exhausted.techGains.jumps.lutz || 0).toBe(0);

    // Normal should have positive gains
    expect(normal.bodyGains.jump).toBeGreaterThan(0);
  });

  it('spin training gives gains to all spin types', () => {
    const schedule: TrainingTaskType[] = ['spin'];
    const result = calculateWeeklyStats(schedule, 100, defaultCoach, 20, 50, undefined, defaultFocus);

    expect(result.techGains.spins.upright).toBeGreaterThan(0);
    expect(result.techGains.spins.sit).toBeGreaterThan(0);
    expect(result.techGains.spins.camel).toBeGreaterThan(0);
    expect(result.techGains.spins.combo).toBeGreaterThan(0);
    expect(result.techGains.spins.flying).toBeGreaterThan(0);
  });

  it('step training gives step proficiency gains', () => {
    const schedule: TrainingTaskType[] = ['step'];
    const result = calculateWeeklyStats(schedule, 100, defaultCoach, 20, 50, undefined, defaultFocus);

    expect(result.techGains.steps).toBeGreaterThan(0);
    expect(result.bodyGains.step).toBeGreaterThan(0);
  });
});
