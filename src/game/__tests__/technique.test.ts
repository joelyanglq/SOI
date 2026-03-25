import { describe, it, expect } from 'vitest';
import {
  autoUnlockTechnique,
  autoUnlockVariants,
  createInitialTechnique,
  getMaxUnlockableRotation,
  getMaxUnlockableSpinLevel,
  JUMP_ROTATION_THRESHOLDS,
  SPIN_LEVEL_THRESHOLDS,
  ROTATION_UNLOCK_PROFICIENCY,
} from '../data/technique';
import { SkaterTechnique } from '../../types';

// --- Tests ---

describe('autoUnlockTechnique', () => {
  it('jump=45 unlocks toeloop 3R but not lutz 3R (needs 65)', () => {
    const tech = createInitialTechnique();
    // Give toeloop 1R high proficiency so it can auto-unlock 2R first
    tech.jumps.toeloop.proficiency['1T'] = 80;
    tech.jumps.toeloop.maxRotation = 2;
    tech.jumps.toeloop.proficiency['2T'] = 70; // >= 60 unlock threshold

    tech.jumps.lutz.proficiency['1Lz'] = 80;
    tech.jumps.lutz.maxRotation = 2;
    tech.jumps.lutz.proficiency['2Lz'] = 70;

    const result = autoUnlockTechnique(tech, { jump: 45, spin: 30, step: 30 });

    // toeloop 3R threshold = 45, jump=45 ≥ 45, current prof=70 ≥ 60 → should unlock
    expect(result.jumps.toeloop.maxRotation).toBe(3);
    // lutz 3R threshold = 65, jump=45 < 65 → should NOT unlock
    expect(result.jumps.lutz.maxRotation).toBe(2);
  });

  it('requires proficiency >= 60 to unlock next rotation', () => {
    const tech = createInitialTechnique();
    tech.jumps.toeloop.maxRotation = 1;
    tech.jumps.toeloop.proficiency['1T'] = 50; // below ROTATION_UNLOCK_PROFICIENCY (60)

    // toeloop 2R threshold = 15, body jump = 50 ≥ 15 (allowed)
    // but proficiency at 1T = 50 < 60 → should NOT unlock
    const result = autoUnlockTechnique(tech, { jump: 50, spin: 30, step: 30 });
    expect(result.jumps.toeloop.maxRotation).toBe(1);

    // Now set proficiency >= 60
    tech.jumps.toeloop.proficiency['1T'] = 65;
    const result2 = autoUnlockTechnique(tech, { jump: 50, spin: 30, step: 30 });
    expect(result2.jumps.toeloop.maxRotation).toBe(2);
  });

  it('spin=60 unlocks upright Lv4 but not camel Lv4 (needs 70)', () => {
    const tech = createInitialTechnique();
    // Set upright and camel to Lv3 with high proficiency
    tech.spins.upright.level = 3;
    tech.spins.upright.proficiency = 70; // >= 60

    tech.spins.camel.level = 3;
    tech.spins.camel.proficiency = 70; // >= 60

    const result = autoUnlockTechnique(tech, { jump: 30, spin: 60, step: 30 });

    // upright Lv4 threshold = 60, spin=60 ≥ 60 → unlock
    expect(result.spins.upright.level).toBe(4);
    // camel Lv4 threshold = 70, spin=60 < 70 → NOT unlock
    expect(result.spins.camel.level).toBe(3);
  });

  it('newly unlocked rotation starts with proficiency 10', () => {
    const tech = createInitialTechnique();
    tech.jumps.salchow.maxRotation = 1;
    tech.jumps.salchow.proficiency['1S'] = 65;

    const result = autoUnlockTechnique(tech, { jump: 50, spin: 30, step: 30 });
    expect(result.jumps.salchow.maxRotation).toBe(2);
    expect(result.jumps.salchow.proficiency['2S']).toBe(10);
  });
});

describe('autoUnlockVariants', () => {
  it('prof >= 70 unlocks tano jump variant', () => {
    const tech = createInitialTechnique();
    tech.jumps.lutz.maxRotation = 3;
    tech.jumps.lutz.proficiency['3Lz'] = 75; // >= 70 for tano

    const result = autoUnlockVariants(tech, { jump: 60, spin: 60, step: 50 });
    expect(result.jumps.lutz.variants).toContain('tano');
  });

  it('prof >= 80 unlocks rippon jump variant', () => {
    const tech = createInitialTechnique();
    tech.jumps.lutz.maxRotation = 3;
    tech.jumps.lutz.proficiency['3Lz'] = 85;

    const result = autoUnlockVariants(tech, { jump: 60, spin: 60, step: 50 });
    expect(result.jumps.lutz.variants).toContain('rippon');
  });

  it('biellmann: prof >= 70 + spin >= 60 unlocks on upright', () => {
    const tech = createInitialTechnique();
    tech.spins.upright.proficiency = 75; // >= 70
    // bodySpin >= 60

    const result = autoUnlockVariants(tech, { jump: 50, spin: 65, step: 50 });
    expect(result.spins.upright.variants).toContain('biellmann');
  });

  it('biellmann NOT unlocked with insufficient spin body attr', () => {
    const tech = createInitialTechnique();
    tech.spins.upright.proficiency = 75; // prof OK
    // bodySpin = 50 < 60

    const result = autoUnlockVariants(tech, { jump: 50, spin: 50, step: 50 });
    expect(result.spins.upright.variants).not.toContain('biellmann');
  });
});

describe('createInitialTechnique', () => {
  it('returns correct initial structure', () => {
    const tech = createInitialTechnique();

    // All 6 jump types present
    expect(Object.keys(tech.jumps)).toHaveLength(6);
    expect(tech.jumps.toeloop).toBeDefined();
    expect(tech.jumps.axel).toBeDefined();

    // All jumps start at maxRotation 1
    for (const jt of Object.values(tech.jumps)) {
      expect(jt.maxRotation).toBe(1);
      expect(jt.goeBonus).toBe(0);
      expect(jt.styleTags).toEqual([]);
      expect(jt.variants).toEqual([]);
    }

    // Axel 1R starts at 30, others at 50
    expect(tech.jumps.axel.proficiency['1A']).toBe(30);
    expect(tech.jumps.toeloop.proficiency['1T']).toBe(50);

    // All 5 spin types
    expect(Object.keys(tech.spins)).toHaveLength(5);
    expect(tech.spins.upright.proficiency).toBe(50);
    expect(tech.spins.sit.proficiency).toBe(30);

    // Steps
    expect(tech.steps.level).toBe(1);
    expect(tech.steps.proficiency).toBe(40);

    // Combo proficiency
    expect(tech.comboProficiency['+2T']).toBe(40);
    expect(tech.comboProficiency['+3T']).toBe(0);
    expect(tech.comboProficiency['+2Lo']).toBe(20);
  });
});

describe('getMaxUnlockableRotation', () => {
  it('matches threshold table', () => {
    // toeloop: [0, 15, 45, 80]
    expect(getMaxUnlockableRotation('toeloop', 0)).toBe(1);
    expect(getMaxUnlockableRotation('toeloop', 14)).toBe(1);
    expect(getMaxUnlockableRotation('toeloop', 15)).toBe(2);
    expect(getMaxUnlockableRotation('toeloop', 44)).toBe(2);
    expect(getMaxUnlockableRotation('toeloop', 45)).toBe(3);
    expect(getMaxUnlockableRotation('toeloop', 80)).toBe(4);
  });
});

describe('getMaxUnlockableSpinLevel', () => {
  it('matches threshold table', () => {
    // upright: [0, 20, 40, 60]
    expect(getMaxUnlockableSpinLevel('upright', 0)).toBe(1);
    expect(getMaxUnlockableSpinLevel('upright', 19)).toBe(1);
    expect(getMaxUnlockableSpinLevel('upright', 20)).toBe(2);
    expect(getMaxUnlockableSpinLevel('upright', 60)).toBe(4);
  });
});
