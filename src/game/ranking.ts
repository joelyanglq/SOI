import { PlayerAttributes, Equipment } from '../types';
import { clamp } from '../utils/math';

export const calculateRolling = (s: { pointsCurrent: number, pointsLast: number }) => {
  return Math.floor(s.pointsCurrent + (s.pointsLast * 0.7));
};

export const calcDerivedStats = (attrs: PlayerAttributes) => {
  const tec = (attrs.jump * 0.4) + (attrs.spin * 0.3) + (attrs.step * 0.2) + (attrs.endurance * 0.1);
  const art = (attrs.perf * 0.5) + (attrs.step * 0.3) + (attrs.endurance * 0.2);
  return { tec: clamp(tec), art: clamp(art) };
};

export const getTotalAttributes = (base: PlayerAttributes, inventory: Equipment[]) => {
  let total = { ...base };
  inventory.forEach(item => {
    if(item.lifespan > 0 && item.owned) {
      total.jump += item.jumpBonus || 0;
      total.spin += item.spinBonus || 0;
      total.step += item.stepBonus || 0;
      total.perf += item.perfBonus || 0;
      total.endurance += item.enduranceBonus || 0;
    }
  });
  (Object.keys(total) as (keyof PlayerAttributes)[]).forEach(k => {
    total[k] = clamp(total[k]);
  });
  return total;
};
