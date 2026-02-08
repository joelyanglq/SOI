import { Skater } from '../types';
import { randNormal } from '../utils/math';
import { SURNAME, GIVEN } from './data/equipment';
import { calculateRolling } from './ranking';

export const generateInitialAI = (): Skater[] => {
  return Array.from({ length: 150 }).map((_, i) => {
    const tier = i < 15 ? 'elite' : i < 50 ? 'pro' : 'rookie';
    const baseStat = tier === 'elite' ? 80 : tier === 'pro' ? 60 : 35;
    
    let initialPoints = 0;
    if (tier === 'elite') {
      initialPoints = Math.floor(5500 - (i * 133) + (Math.random() - 0.5) * 300);
    } else if (tier === 'pro') {
      initialPoints = Math.floor(3500 - ((i - 15) * 57) + (Math.random() - 0.5) * 200);
    } else {
      initialPoints = Math.floor(1500 - ((i - 50) * 13) + (Math.random() - 0.5) * 150);
    }

    const s: Skater = {
      id: `ai_${Date.now()}_${i}`,
      name: SURNAME[Math.floor(Math.random() * SURNAME.length)] + GIVEN[Math.floor(Math.random() * GIVEN.length)],
      age: 15 + Math.random() * 12, 
      tec: baseStat + randNormal(0, 5), 
      art: baseStat + randNormal(0, 5), 
      sta: 100,
      pointsCurrent: 0, 
      pointsLast: initialPoints, 
      titles: [], honors: [], pQual: 1.0, pAge: 0, injuryMonths: 0, 
      isPlayer: false, retired: false,
      activeProgram: { name: "AI Program", baseArt: 35, freshness: 100 }
    };
    return { ...s, rolling: calculateRolling(s) };
  });
};
