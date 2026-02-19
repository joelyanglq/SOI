import { JumpType, SpinType, JumpCard, SpinCard, StepSkill, SkaterTechnique } from '../../types';
import { clamp } from '../../utils/math';

// Rotation unlock thresholds: body.jump >= threshold to learn that rotation
export const JUMP_ROTATION_THRESHOLDS: Record<JumpType, number[]> = {
  //              1R   2R   3R    4R
  toeloop:     [  0,  15,  45,   80 ],
  salchow:     [  0,  15,  45,   82 ],
  loop:        [  0,  20,  55,   85 ],
  flip:        [  0,  25,  60,   88 ],
  lutz:        [  0,  30,  65,   92 ],
  axel:        [  0,  35,  75,   98 ],
};

// Body.spin >= threshold to unlock spin level
export const SPIN_LEVEL_THRESHOLDS: Record<SpinType, number[]> = {
  //             Lv1  Lv2  Lv3  Lv4
  upright:     [  0,  20,  40,  60 ],
  sit:         [  0,  25,  45,  65 ],
  camel:       [  0,  25,  50,  70 ],
  combo:       [  0,  30,  55,  80 ],
  flying:      [  0,  40,  60,  75 ],
};

// Body.step >= threshold to unlock step level
export const STEP_LEVEL_THRESHOLDS = [ 0, 35, 60, 85 ];  // Lv1-4

// Proficiency needed at current rotation before auto-unlocking next
export const ROTATION_UNLOCK_PROFICIENCY = 60;

export const ALL_JUMP_TYPES: JumpType[] = ['toeloop', 'salchow', 'loop', 'flip', 'lutz', 'axel'];
export const ALL_SPIN_TYPES: SpinType[] = ['upright', 'sit', 'camel', 'combo', 'flying'];

// Get the action key for a jump (e.g., '3Lz', '2A')
export function getJumpKey(jumpType: JumpType, rotation: number): string {
  const shortNames: Record<JumpType, string> = {
    toeloop: 'T', salchow: 'S', loop: 'Lo', flip: 'F', lutz: 'Lz', axel: 'A'
  };
  return `${rotation}${shortNames[jumpType]}`;
}

// Calculate max rotation a skater can learn given their body jump attribute
export function getMaxUnlockableRotation(jumpType: JumpType, bodyJump: number): number {
  const thresholds = JUMP_ROTATION_THRESHOLDS[jumpType];
  let maxRot = 0;
  for (let r = 0; r < thresholds.length; r++) {
    if (bodyJump >= thresholds[r]) maxRot = r + 1;
  }
  return maxRot;
}

// Calculate max spin level given body spin attribute
export function getMaxUnlockableSpinLevel(spinType: SpinType, bodySpin: number): number {
  const thresholds = SPIN_LEVEL_THRESHOLDS[spinType];
  let maxLv = 0;
  for (let l = 0; l < thresholds.length; l++) {
    if (bodySpin >= thresholds[l]) maxLv = l + 1;
  }
  return maxLv;
}

// Calculate max step level given body step attribute
export function getMaxUnlockableStepLevel(bodyStep: number): number {
  let maxLv = 0;
  for (let l = 0; l < STEP_LEVEL_THRESHOLDS.length; l++) {
    if (bodyStep >= STEP_LEVEL_THRESHOLDS[l]) maxLv = l + 1;
  }
  return maxLv;
}

// Default initial technique for new player (age 14)
export function createInitialTechnique(): SkaterTechnique {
  const jumps = {} as Record<JumpType, JumpCard>;
  for (const jt of ALL_JUMP_TYPES) {
    const prof: Record<string, number> = {};
    // New player starts with 1-rotation jumps at moderate proficiency
    prof[getJumpKey(jt, 1)] = jt === 'axel' ? 30 : 50;
    jumps[jt] = {
      type: jt,
      maxRotation: 1,
      proficiency: prof,
      goeBonus: 0,
    };
  }

  const spins = {} as Record<SpinType, SpinCard>;
  for (const st of ALL_SPIN_TYPES) {
    spins[st] = {
      type: st,
      level: 1,
      proficiency: st === 'upright' ? 50 : 30,
    };
  }

  return {
    jumps,
    spins,
    steps: { level: 1, proficiency: 40 },
  };
}

// Create technique from body attributes (for migration from old saves)
export function migrateFromAttributes(attrs: { jump: number; spin: number; step: number }): SkaterTechnique {
  const jumps = {} as Record<JumpType, JumpCard>;

  for (const jt of ALL_JUMP_TYPES) {
    const maxRot = getMaxUnlockableRotation(jt, attrs.jump);
    const prof: Record<string, number> = {};
    const thresholds = JUMP_ROTATION_THRESHOLDS[jt];

    for (let r = 1; r <= maxRot; r++) {
      const key = getJumpKey(jt, r);
      if (r < maxRot) {
        // Lower rotations are well-mastered
        prof[key] = clamp(80 + (attrs.jump - thresholds[r - 1]) * 0.3, 60, 98);
      } else {
        // Current max rotation: proficiency proportional to how far above threshold
        const threshold = thresholds[r - 1];
        const excess = attrs.jump - threshold;
        prof[key] = clamp(40 + excess * 1.5, 30, 85);
      }
    }

    jumps[jt] = {
      type: jt,
      maxRotation: Math.max(1, maxRot),
      proficiency: prof,
      goeBonus: 0,
    };
  }

  const spins = {} as Record<SpinType, SpinCard>;
  for (const st of ALL_SPIN_TYPES) {
    const maxLv = getMaxUnlockableSpinLevel(st, attrs.spin);
    const threshold = SPIN_LEVEL_THRESHOLDS[st][Math.max(0, maxLv - 1)];
    const excess = attrs.spin - threshold;
    spins[st] = {
      type: st,
      level: Math.max(1, maxLv),
      proficiency: clamp(40 + excess * 1.2, 30, 90),
    };
  }

  const stepLv = getMaxUnlockableStepLevel(attrs.step);
  const stepThreshold = STEP_LEVEL_THRESHOLDS[Math.max(0, stepLv - 1)];

  return {
    jumps,
    spins,
    steps: {
      level: Math.max(1, stepLv),
      proficiency: clamp(40 + (attrs.step - stepThreshold) * 1.2, 30, 90),
    },
  };
}

// Generate technique for AI based on their tec/art stats
export function createAITechnique(tec: number, _art: number): SkaterTechnique {
  const jumps = {} as Record<JumpType, JumpCard>;

  // AI body jump is approximated as tec
  const bodyJump = tec;

  for (const jt of ALL_JUMP_TYPES) {
    const maxRot = getMaxUnlockableRotation(jt, bodyJump);
    const prof: Record<string, number> = {};
    const thresholds = JUMP_ROTATION_THRESHOLDS[jt];

    for (let r = 1; r <= maxRot; r++) {
      const key = getJumpKey(jt, r);
      if (r < maxRot) {
        prof[key] = clamp(75 + (tec - thresholds[r - 1]) * 0.4, 60, 95);
      } else {
        const threshold = thresholds[r - 1];
        const excess = tec - threshold;
        prof[key] = clamp(35 + excess * 1.5, 25, 85);
      }
    }

    jumps[jt] = {
      type: jt,
      maxRotation: Math.max(1, maxRot),
      proficiency: prof,
      goeBonus: clamp((tec - 50) / 80, -0.5, 0.5),
    };
  }

  const bodySpin = tec;
  const spins = {} as Record<SpinType, SpinCard>;
  for (const st of ALL_SPIN_TYPES) {
    const maxLv = getMaxUnlockableSpinLevel(st, bodySpin);
    spins[st] = {
      type: st,
      level: Math.max(1, maxLv),
      proficiency: clamp(30 + tec * 0.6, 25, 90),
    };
  }

  const bodyStep = (tec + _art) / 2;
  const stepLv = getMaxUnlockableStepLevel(bodyStep);

  return {
    jumps,
    spins,
    steps: {
      level: Math.max(1, stepLv),
      proficiency: clamp(30 + bodyStep * 0.6, 25, 90),
    },
  };
}

// Auto-unlock new rotations/levels after training gains
export function autoUnlockTechnique(
  technique: SkaterTechnique,
  bodyAttrs: { jump: number; spin: number; step: number }
): SkaterTechnique {
  const updated = JSON.parse(JSON.stringify(technique)) as SkaterTechnique;

  // Auto-unlock jump rotations
  for (const jt of ALL_JUMP_TYPES) {
    const card = updated.jumps[jt];
    const maxAllowed = getMaxUnlockableRotation(jt, bodyAttrs.jump);

    // Check if current max rotation proficiency >= threshold for auto-unlock
    if (card.maxRotation < maxAllowed) {
      const currentKey = getJumpKey(jt, card.maxRotation);
      const currentProf = card.proficiency[currentKey] || 0;

      if (currentProf >= ROTATION_UNLOCK_PROFICIENCY) {
        card.maxRotation = card.maxRotation + 1;
        const newKey = getJumpKey(jt, card.maxRotation);
        if (!card.proficiency[newKey]) {
          card.proficiency[newKey] = 10; // Start new rotation with low proficiency
        }
      }
    }
  }

  // Auto-unlock spin levels
  for (const st of ALL_SPIN_TYPES) {
    const card = updated.spins[st];
    const maxAllowed = getMaxUnlockableSpinLevel(st, bodyAttrs.spin);
    if (card.level < maxAllowed && card.proficiency >= ROTATION_UNLOCK_PROFICIENCY) {
      card.level = card.level + 1;
      card.proficiency = Math.max(card.proficiency - 20, 15); // Reset somewhat for new level
    }
  }

  // Auto-unlock step level
  const maxStepLv = getMaxUnlockableStepLevel(bodyAttrs.step);
  if (updated.steps.level < maxStepLv && updated.steps.proficiency >= ROTATION_UNLOCK_PROFICIENCY) {
    updated.steps.level = updated.steps.level + 1;
    updated.steps.proficiency = Math.max(updated.steps.proficiency - 20, 15);
  }

  return updated;
}
