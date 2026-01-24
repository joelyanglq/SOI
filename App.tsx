
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis 
} from 'recharts';
import { 
  Skater, GameState, LogEntry, LogType, GameEvent, Equipment, Coach, RandomEvent, Sponsorship, HonorRecord, TrainingTaskType, PlayerAttributes, MatchAction, MatchPhaseType 
} from './types';
import { 
  SURNAME, GIVEN, COACHES, CITIES, RANDOM_EVENTS, EQUIP_NAMES, CHOREO_NAMES,
  MATCH_STAMINA_COST, OLYMPIC_BASE_YEAR, LOADING_QUOTES, COMMENTARY_CORPUS, EVENT_NARRATIVES, TRAINING_TASKS,
  ACTION_LIBRARY, MATCH_STRUCTURES, PHASE_META
} from './constants';

const randNormal = (mean = 0, sd = 1) => {
  let u = 0, v = 0;
  while(u === 0) u = Math.random();
  while(v === 0) v = Math.random();
  let z = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
  return z * sd + mean;
};

const clamp = (v: number, min = 0, max = 100) => Math.max(min, Math.min(max, v));

const calculateRolling = (s: { pointsCurrent: number, pointsLast: number }) => {
  return Math.floor(s.pointsCurrent + (s.pointsLast * 0.7));
};

const calcDerivedStats = (attrs: PlayerAttributes) => {
  const tec = (attrs.jump * 0.4) + (attrs.spin * 0.3) + (attrs.step * 0.2) + (attrs.endurance * 0.1);
  const art = (attrs.perf * 0.5) + (attrs.step * 0.3) + (attrs.endurance * 0.2);
  return { tec: clamp(tec), art: clamp(art) };
};

// --- CORE SCORING ENGINE ---

// 1. Helper to find the best action an AI/Player can perform in a phase
const getBestActionForStats = (phase: MatchPhaseType, stats: PlayerAttributes): MatchAction => {
  const validActions = ACTION_LIBRARY.filter(a => {
    if (a.type !== phase) return false;
    for (const [key, val] of Object.entries(a.reqStats)) {
      // @ts-ignore
      if ((stats[key] || 0) < val) return false;
    }
    return true;
  });

  if (validActions.length === 0) {
    // Fallback: easiest action
    return ACTION_LIBRARY.find(a => a.type === phase) || ACTION_LIBRARY[0];
  }
  // AI picks the highest base score action available to them
  return validActions.sort((a,b) => b.baseScore - a.baseScore)[0];
};

// 2. Unified Score Calculator
const calculateActionScore = (
  action: MatchAction, 
  stats: PlayerAttributes, 
  currentSta: number, 
  isPlayer: boolean
): { score: number, cost: number, isFail: boolean, fatigueFactor: number, raw: number } => {
  
  // Stamina Cost
  const end = stats.endurance || 30;
  const costReduction = end / 250; 
  const realCost = Math.max(1, action.cost * (1 - costReduction));

  // Attribute Average
  const meta = PHASE_META[action.type];
  let attrSum = 0;
  meta.relevantAttrs.forEach(k => { attrSum += (stats[k] || 0); });
  const attrAvg = attrSum / meta.relevantAttrs.length;

  // Failure Chance
  const baseFailChance = clamp((action.risk * 100) - (attrAvg * 0.6), 2, 90);
  // AI fails less often to simulate consistency, player has normal risk
  const failChance = isPlayer ? baseFailChance : baseFailChance * 0.4;
  const isFail = Math.random() * 100 < failChance;

  // Fatigue
  let fatigueFactor = 1.0;
  if (currentSta < 15) fatigueFactor = 0.5;
  else if (currentSta < 30) fatigueFactor = 0.8;

  // --- SCORING FORMULA CALIBRATION (REBALANCED) ---
  // New Balance Goal:
  // Beginner (Attr 35, Base 1.5) -> 3 actions -> ~40-50 pts total.
  // Pro (Attr 60, Base 4.0) -> 3 actions -> ~100-120 pts total.
  // Elite (Attr 80, Base 8.0) -> 3 actions -> ~180-200 pts total.
  
  // New Weights: High Base Multiplier, Low Attribute Multiplier
  // This ensures Difficulty matters more than just raw stats.
  let rawScore = (action.baseScore * 6.0) + (attrAvg * 0.2);
  
  // Example Waltz (1.0, Attr 35): 6.0 + 7.0 = 13.0 pts.
  // Example 2A (3.3, Attr 40): 19.8 + 8.0 = 27.8 pts.
  
  let goeMod = 1.0;
  if (isFail) {
    goeMod = 0.5; // Fall penalty
  } else {
    // GOE Bonus for exceeding requirements
    const overhead = Math.max(0, attrAvg - 60);
    goeMod = 1.0 + (Math.random() * 0.1) + (overhead * 0.003); 
  }

  const finalScore = rawScore * goeMod * fatigueFactor;

  return { score: finalScore, cost: realCost, isFail, fatigueFactor, raw: rawScore };
};

// 3. AI Simulation Logic
const simulateAIProgram = (skater: Skater, templateId: string): number => {
  const template = MATCH_STRUCTURES[templateId] || MATCH_STRUCTURES['low'];
  
  // Map generic AI stats to detailed attributes if missing
  const stats: PlayerAttributes = skater.attributes || {
    jump: skater.tec,
    spin: skater.tec,
    step: (skater.tec + skater.art) / 2,
    perf: skater.art,
    endurance: skater.tec * 0.9 // AI usually has good endurance
  };

  let totalScore = 0;
  let currentSta = 100;

  template.phases.forEach(phase => {
    const bestAction = getBestActionForStats(phase, stats);
    const res = calculateActionScore(bestAction, stats, currentSta, false);
    totalScore += res.score;
    currentSta -= res.cost;
  });

  // Small random variance for judging (±5%)
  return totalScore * (0.95 + Math.random() * 0.1);
};

// --- END CORE SCORING ENGINE ---

const generateInitialAI = (): Skater[] => {
  return Array.from({ length: 150 }).map((_, i) => {
    const tier = i < 15 ? 'elite' : i < 50 ? 'pro' : 'rookie';
    const baseStat = tier === 'elite' ? 80 : tier === 'pro' ? 60 : 35;
    
    // Simulate initial points based on their tier capability in a standard match
    const mockStats = { jump: baseStat, spin: baseStat, step: baseStat, perf: baseStat, endurance: baseStat };
    const mockSkaterForSim: any = { tec: baseStat, art: baseStat, attributes: mockStats };
    const oneMatchScore = simulateAIProgram(mockSkaterForSim, 'mid'); 
    
    // Annual points roughly = 2 major events + 2 minor (~3.5 matches)
    const initialPoints = Math.floor(oneMatchScore * (tier === 'elite' ? 25 : tier === 'pro' ? 10 : 2));

    const s = {
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

const generateLocalCommentary = (rank: number) => {
  let pool = COMMENTARY_CORPUS.mid;
  if (rank === 1) pool = COMMENTARY_CORPUS.gold;
  else if (rank <= 3) pool = COMMENTARY_CORPUS.podium;
  else if (rank > 10) pool = COMMENTARY_CORPUS.low;
  return pool[Math.floor(Math.random() * pool.length)];
};

const generateLocalNarrative = (event: RandomEvent) => {
  const pool = EVENT_NARRATIVES[event.id];
  return (pool && pool.length > 0) ? pool[Math.floor(Math.random() * pool.length)] : event.description;
};

const generateSponsorshipOptions = (fame: number): Sponsorship[] => {
  const brands = {
    local: ["社区运动会", "冰点奶茶", "城市之光健身", "蓝天护具", "动感滑冰场"],
    brand: ["安踏体育", "李宁冰雪", "华为", "小米健康", "可口可乐"],
    global: ["Rolex", "Red Bull", "Visa", "Omega", "Coca-Cola", "Louis Vuitton", "Samsung", "Toyota"]
  };
  const options: Sponsorship[] = [];
  for (let i = 0; i < 4; i++) {
    let type: 'local' | 'brand' | 'global' = 'local';
    const roll = Math.random();
    if (fame > 1200 && roll > 0.4) type = 'global';
    else if (fame > 400 && roll > 0.3) type = 'brand';
    const brandName = brands[type][Math.floor(Math.random() * brands[type].length)];
    const duration = type === 'global' ? 36 : type === 'brand' ? 24 : 12;
    let bonus = type === 'global' ? 250000 : type === 'brand' ? 30000 : 3000;
    let pay = type === 'global' ? 30000 : type === 'brand' ? 5000 : 800;
    options.push({
      id: `sp_${Date.now()}_${i}`,
      name: brandName, type, duration, remainingMonths: duration,
      signingBonus: bonus + Math.floor(Math.random() * bonus * 0.5),
      monthlyPay: pay + Math.floor(Math.random() * pay * 0.3),
      minFame: type === 'global' ? 1000 : type === 'brand' ? 350 : 0
    });
  }
  return options;
};

const generateMarket = (activeCoachId: string | null = null, currentMarket: any = null) => {
  const newCoaches = COACHES.map(c => ({
    ...c,
    name: (SURNAME[Math.floor(Math.random() * SURNAME.length)] + "·" + GIVEN[Math.floor(Math.random() * GIVEN.length)])
  }));
  if (activeCoachId && currentMarket) {
    const activeOne = currentMarket.coaches.find((c: Coach) => c.id === activeCoachId);
    if (activeOne) newCoaches[0] = activeOne;
  }
  
  const equipment: Equipment[] = [
    { 
      id: 'skate_' + Math.random().toString(36).substr(2, 9), 
      name: EQUIP_NAMES.skate[Math.floor(Math.random() * EQUIP_NAMES.skate.length)], 
      type: 'skate', price: 2500, owned: false, lifespan: 12, maxLifespan: 12,
      jumpBonus: 3, spinBonus: 0, stepBonus: 1, perfBonus: 0, enduranceBonus: 2
    },
    { 
      id: 'blade_' + Math.random().toString(36).substr(2, 9), 
      name: EQUIP_NAMES.blade[Math.floor(Math.random() * EQUIP_NAMES.blade.length)], 
      type: 'blade', price: 5500, owned: false, lifespan: 10, maxLifespan: 10,
      jumpBonus: 1, spinBonus: 3, stepBonus: 2, perfBonus: 0, enduranceBonus: 0
    },
    { 
      id: 'costume_' + Math.random().toString(36).substr(2, 9), 
      name: EQUIP_NAMES.costume[Math.floor(Math.random() * EQUIP_NAMES.costume.length)], 
      type: 'costume', price: 15000, owned: false, lifespan: 8, maxLifespan: 8,
      jumpBonus: 0, spinBonus: 0, stepBonus: 1, perfBonus: 5, enduranceBonus: -1
    },
  ];

  const choreographers = [
    { name: CHOREO_NAMES[Math.floor(Math.random() * CHOREO_NAMES.length)], cost: 5000, base: 45, desc: "富有情感深度的基础编排。" },
    { name: CHOREO_NAMES[Math.floor(Math.random() * CHOREO_NAMES.length)], cost: 15000, base: 65, desc: "展现个人魅力的进阶构造。" },
    { name: CHOREO_NAMES[Math.floor(Math.random() * CHOREO_NAMES.length)], cost: 45000, base: 90, desc: "世界级的高难度艺术杰作。" }
  ];
  return { coaches: newCoaches, equipment, choreographers };
};

const INITIAL_SKATER: Skater = {
  id: 'player_1', name: "未命名选手", age: 14.1, tec: 40.0, art: 35.0, sta: 100.0,
  attributes: { jump: 40, spin: 40, step: 40, perf: 30, endurance: 30 },
  pointsCurrent: 0, pointsLast: 0, rolling: 0, titles: [], honors: [], pQual: 1.0, pAge: 0,
  injuryMonths: 0, isPlayer: true, retired: false,
  activeProgram: { name: "基础短节目", baseArt: 30, freshness: 100 }
};

const DEFAULT_SCHEDULE: TrainingTaskType[] = ['rest', 'rest', 'rest', 'rest', 'rest', 'rest', 'rest'];

const App: React.FC = () => {
  const [game, setGame] = useState<GameState>(() => {
    const saved = localStorage.getItem('FS_MANAGER_V11_PRO');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (!parsed.schedule) parsed.schedule = [...DEFAULT_SCHEDULE];
      if (!parsed.skater.attributes) {
        parsed.skater.attributes = {
          jump: parsed.skater.tec,
          spin: parsed.skater.tec,
          step: (parsed.skater.tec + parsed.skater.art) / 2,
          perf: parsed.skater.art,
          endurance: 40
        };
      } else if ('aura' in parsed.skater.attributes) {
        parsed.skater.attributes.perf = parsed.skater.attributes.aura;
        delete parsed.skater.attributes.aura;
      }
      parsed.schedule = parsed.schedule.map((t: any) => t === 'aura' ? 'perf' : t);
      return parsed;
    }
    const derived = calcDerivedStats(INITIAL_SKATER.attributes!);
    return {
      year: 2025, month: 7, money: 20000, fame: 0, injuryMonths: 0, hasCompeted: false,
      skater: { ...INITIAL_SKATER, tec: derived.tec, art: derived.art, rolling: calculateRolling(INITIAL_SKATER) },
      schedule: [...DEFAULT_SCHEDULE],
      aiSkaters: generateInitialAI(),
      inventory: [], activeCoachId: 'coach_1',
      history: [], activeEvent: null, activeSponsor: null,
      market: generateMarket(),
      lastGrowth: { tec: 0, art: 0 }
    };
  });

  const [isNaming, setIsNaming] = useState(game.skater.name === "未命名选手");
  const [newName, setNewName] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [loadingQuote, setLoadingQuote] = useState("");
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [sponsorOptions, setSponsorOptions] = useState<Sponsorship[]>([]);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [activeTab, setActiveTab] = useState<'event' | 'development' | 'ranking' | 'career'>('event');
  const [devSubTab, setDevSubTab] = useState<'train' | 'coach' | 'equip' | 'choreo'>('train');
  const [careerSubTab, setCareerSubTab] = useState<'profile' | 'honors' | 'stats'>('profile');
  const [draggedTask, setDraggedTask] = useState<TrainingTaskType | null>(null);

  const addLog = useCallback((msg: string, type: LogType = 'sys') => {
    setLogs(prev => [{ id: Math.random().toString(), msg, type, month: game.month }, ...prev].slice(0, 50));
  }, [game.month]);

  useEffect(() => {
    if (game.aiSkaters.length === 0 && !isNaming) {
      setGame(prev => ({ ...prev, aiSkaters: generateInitialAI() }));
    }
  }, [game.aiSkaters.length, isNaming]);

  useEffect(() => {
    if (!game.activeSponsor && sponsorOptions.length === 0 && !isNaming) {
      setSponsorOptions(generateSponsorshipOptions(game.fame));
    }
  }, [game.activeSponsor, game.fame, isNaming]);

  const getTotalAttributes = useCallback((base: PlayerAttributes, inventory: Equipment[]) => {
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
  }, []);

  const handleStartGame = () => {
    if (!newName.trim()) return alert("请输入选手名字");
    const updatedGame = { ...game, skater: { ...game.skater, name: newName.trim() } };
    setGame(updatedGame);
    setIsNaming(false);
  };

  const confirmResetGame = () => {
    localStorage.removeItem('FS_MANAGER_V11_PRO');
    const derived = calcDerivedStats(INITIAL_SKATER.attributes!);
    const resetState: GameState = {
      year: 2025, month: 7, money: 20000, fame: 0, injuryMonths: 0, hasCompeted: false,
      skater: { ...INITIAL_SKATER, tec: derived.tec, art: derived.art, rolling: calculateRolling(INITIAL_SKATER) },
      schedule: [...DEFAULT_SCHEDULE],
      aiSkaters: generateInitialAI(),
      inventory: [], activeCoachId: 'coach_1',
      history: [], activeEvent: null, activeSponsor: null,
      market: generateMarket(),
      lastGrowth: { tec: 0, art: 0 }
    };
    setGame(resetState);
    setIsNaming(true);
    setNewName("");
    setShowResetConfirm(false);
    setLogs([]);
    setSponsorOptions([]);
    setActiveTab('event');
    setCareerSubTab('profile');
  };

  const seasonCalendar = useMemo(() => {
    const cal: Record<number, GameEvent[]> = {};
    for (let m = 1; m <= 12; m++) cal[m] = [];
    cal[12].push({ name: "全国锦标赛", base: 90, pts: 1800, req: 800, max: 24, prize: 30000, template: 'mid' });
    cal[3].push({ name: "世锦赛", base: 120, pts: 5000, req: 4000, max: 24, prize: 50000, template: 'high' });
    if (game.year % 4 === OLYMPIC_BASE_YEAR % 4) {
      cal[2].push({ name: "冬季奥运会", base: 140, pts: 12000, req: 10000, max: 30, prize: 150000, template: 'high' });
    }
    const regularEvents = [
        { m: 10, name: "大奖赛·北美站", req: 2500, pts: 1200 },
        { m: 11, name: "大奖赛·日本站", req: 3000, pts: 1200 },
        { m: 11, name: "大奖赛·总决赛", req: 6000, pts: 3000 },
    ];
    regularEvents.forEach(e => cal[e.m].push({ name: e.name, base: 70, pts: e.pts, req: e.req, max: 12, prize: 10000, template: e.m === 11 && e.name.includes("总决赛") ? 'high' : 'mid' }));
    for (let m = 1; m <= 12; m++) {
        if (cal[m].length === 0) {
            cal[m].push({ name: `${CITIES[m % CITIES.length]} 挑战赛`, base: 35, pts: 600, req: 0, max: 12, prize: 2000, template: 'low' });
        }
    }
    return cal;
  }, [game.year]);

  useEffect(() => { localStorage.setItem('FS_MANAGER_V11_PRO', JSON.stringify(game)); }, [game]);

  const calculateWeeklyStats = useCallback((currentSchedule: TrainingTaskType[], startSta: number, currentCoach: Coach, skaterAge: number, currentEndurance: number) => {
    let tempSta = startSta;
    let gains: Record<string, number> = { jump: 0, spin: 0, step: 0, perf: 0, endurance: 0 };
    let artPlanPoints = 0; 

    const ageMod = skaterAge < 18 ? 1.3 : (skaterAge <= 23 ? 1.0 : 0.6);
    const enduranceCostReduction = currentEndurance / 200;
    const enduranceEfficiencyBonus = currentEndurance / 500;

    for (const taskId of currentSchedule) {
      const task = TRAINING_TASKS[taskId];
      const adjustedStaCost = task.staCost * (1 - enduranceCostReduction);
      let efficiency = 1.0 + enduranceEfficiencyBonus;
      if (tempSta <= 0) efficiency = 0;
      else if (tempSta < 20) efficiency = 0.3 + enduranceEfficiencyBonus;
      efficiency = Math.min(efficiency, 1.2);

      if (task.targetAttr) {
        let coachMod = 1.0;
        if (['jump', 'spin', 'endurance'].includes(task.targetAttr)) coachMod = currentCoach.tecMod;
        else if (task.targetAttr === 'perf') coachMod = currentCoach.artMod;
        else if (task.targetAttr === 'step') coachMod = (currentCoach.tecMod + currentCoach.artMod) / 2;

        gains[task.targetAttr] += task.baseGain * coachMod * ageMod * efficiency;
      }
      if (task.targetAttr === 'perf' || task.targetAttr === 'step') artPlanPoints += task.baseGain; 
      tempSta = clamp(tempSta - adjustedStaCost, 0, 100);
    }
    return { finalSta: tempSta, gains, artPlanPoints };
  }, []);

  const nextMonth = async () => {
    if (isNaming || isProcessing) return;
    setIsProcessing(true);
    setLoadingQuote(LOADING_QUOTES[Math.floor(Math.random() * LOADING_QUOTES.length)]);
    await new Promise(r => setTimeout(r, 1200));

    const currentCoach = game.market.coaches.find(c => c.id === game.activeCoachId) || game.market.coaches[0];
    
    setGame(prev => {
      const nm = prev.month === 12 ? 1 : prev.month + 1;
      const ny = prev.month === 12 ? prev.year + 1 : prev.year;
      
      const { finalSta, gains, artPlanPoints } = calculateWeeklyStats(prev.schedule, prev.skater.sta, currentCoach, prev.skater.age, prev.skater.attributes!.endurance);

      const currentBaseAttrs = { ...prev.skater.attributes! };
      const attrKeys = Object.keys(currentBaseAttrs) as (keyof PlayerAttributes)[];
      
      attrKeys.forEach(k => {
        const rawGain = gains[k] || 0;
        const gain = clamp(randNormal(rawGain, 0.1), 0, 3.0);
        currentBaseAttrs[k] = clamp(currentBaseAttrs[k] + gain, 0, 100);
      });

      const updatedInventory = prev.inventory.map(item => ({ ...item, lifespan: item.lifespan - 1 }));
      const remainingInventory = updatedInventory.filter(item => item.lifespan > 0);

      let updatedSkater = { ...prev.skater, 
        attributes: currentBaseAttrs,
        sta: finalSta,
        age: prev.skater.age + 0.083,
        activeProgram: { 
          ...prev.skater.activeProgram, 
          freshness: clamp(prev.skater.activeProgram.freshness + (artPlanPoints * 2.0) - 5.0, 0, 100) 
        }
      };
      
      let sponsorIncome = prev.activeSponsor ? prev.activeSponsor.monthlyPay : 0;
      let updatedSponsor = prev.activeSponsor ? { ...prev.activeSponsor, remainingMonths: prev.activeSponsor.remainingMonths - 1 } : null;
      if (updatedSponsor && updatedSponsor.remainingMonths <= 0) {
        updatedSponsor = null;
        setTimeout(() => addLog("赞助合约已到期", 'sys'), 200);
      }
      
      let triggeredEvent: RandomEvent | null = null;
      if (Math.random() < 0.2) triggeredEvent = RANDOM_EVENTS[Math.floor(Math.random() * RANDOM_EVENTS.length)];

      let moneyBonus = 0, fameBonus = 0;
      if (triggeredEvent) {
        const e = triggeredEvent.effect;
        if (e.money) moneyBonus += e.money;
        if (e.fame) fameBonus += e.fame;
        if (e.jump) updatedSkater.attributes!.jump = clamp(updatedSkater.attributes!.jump + e.jump, 0, 100);
        if (e.spin) updatedSkater.attributes!.spin = clamp(updatedSkater.attributes!.spin + e.spin, 0, 100);
        if (e.step) updatedSkater.attributes!.step = clamp(updatedSkater.attributes!.step + e.step, 0, 100);
        if (e.perf) updatedSkater.attributes!.perf = clamp(updatedSkater.attributes!.perf + e.perf, 0, 100);
        if (e.endurance) updatedSkater.attributes!.endurance = clamp(updatedSkater.attributes!.endurance + e.endurance, 0, 100);
        if (e.sta) updatedSkater.sta = clamp(updatedSkater.sta + e.sta, 0, 100);
      }

      const totalAttrs = getTotalAttributes(updatedSkater.attributes!, remainingInventory);
      const derived = calcDerivedStats(totalAttrs);
      
      updatedSkater.tec = derived.tec;
      updatedSkater.art = derived.art;

      if (prev.month === 12) {
        updatedSkater.pointsLast = updatedSkater.pointsCurrent;
        updatedSkater.pointsCurrent = 0;
      }
      updatedSkater.rolling = calculateRolling(updatedSkater);

      // --- NEW AI ECOSYSTEM LOGIC ---
      // 1. Prepare AI Skaters (Aging, Growth, Retirement)
      const aiCompetedIds = new Set<string>();
      let workingAiSkaters = prev.aiSkaters.map(ai => {
        let aiUp = { ...ai, age: ai.age + 0.083 };
        if (aiUp.injuryMonths > 0) aiUp.injuryMonths -= 1;
        
        // Stat Growth
        aiUp.tec = clamp(aiUp.tec + (aiUp.age < 23 ? 0.15 : 0.05), 0, 100);
        aiUp.art = clamp(aiUp.art + (aiUp.age < 23 ? 0.15 : 0.05), 0, 100);
        
        // Season Reset
        if (prev.month === 12) { 
            aiUp.pointsLast = aiUp.pointsCurrent; 
            aiUp.pointsCurrent = 0; 
        }
        
        // Calculate Rolling for qualification check
        aiUp.rolling = calculateRolling(aiUp);

        // Retirement Check
        const shouldRetire = (aiUp.age > 33) || (aiUp.age > 28 && Math.random() < 0.05);
        if (shouldRetire) {
          const newAiBaseStat = 35 + Math.random() * 20;
          const newAiStats = { jump: newAiBaseStat, spin: newAiBaseStat, step: newAiBaseStat, perf: newAiBaseStat, endurance: newAiBaseStat };
          const newAi = {
            id: `ai_${Date.now()}_${Math.random()}`,
            name: SURNAME[Math.floor(Math.random() * SURNAME.length)] + GIVEN[Math.floor(Math.random() * GIVEN.length)],
            age: 14 + Math.random() * 2,
            tec: newAiBaseStat, art: newAiBaseStat,
            attributes: newAiStats,
            sta: 100, isPlayer: false, retired: false,
            pointsLast: 0, pointsCurrent: 0, rolling: 0, titles: [], honors: [], pQual: 1, pAge: 0, injuryMonths: 0,
            activeProgram: { name: "Gen Program", baseArt: 35, freshness: 100 }
          };
          return { ...newAi, rolling: calculateRolling(newAi) };
        }
        return aiUp;
      });

      // 2. Event Grouping & Simulation
      const currentMonthEvents = seasonCalendar[prev.month] || [];
      const sortedEvents = [...currentMonthEvents].sort((a,b) => b.pts - a.pts);

      sortedEvents.forEach(ev => {
          // Identify Candidates (Who qualifies?)
          let candidates = workingAiSkaters.filter(ai => 
              !aiCompetedIds.has(ai.id) && 
              ai.injuryMonths === 0
          );

          if (ev.req > 0) {
             // Standard events: Must meet requirements
             candidates = candidates.filter(ai => (ai.rolling || 0) >= ev.req);
          } else {
             // Low tier / Regional (req == 0): Exclude Top 50 ranked skaters to prevent crushing
             // Sort by rolling to find top 50
             const globalRanked = [...workingAiSkaters].sort((a,b) => (b.rolling || 0) - (a.rolling || 0));
             const eliteIds = new Set(globalRanked.slice(0, 50).map(s => s.id));
             candidates = candidates.filter(ai => !eliteIds.has(ai.id));
          }

          // Selection: Only Top N by Ranking from the candidate pool can enter
          candidates.sort((a,b) => (b.rolling || 0) - (a.rolling || 0));
          const participants = candidates.slice(0, ev.max);
          
          // Mark as competed
          participants.forEach(p => aiCompetedIds.add(p.id));

          // Competition: Simulate Match Scores
          const matchResults = participants.map(ai => ({
              ai,
              matchScore: simulateAIProgram(ai, ev.template)
          }));

          // Ranking: Sort by Match Score
          matchResults.sort((a,b) => b.matchScore - a.matchScore);

          // Award Points based on Rank
          matchResults.forEach((res, rankIdx) => {
              const rank = rankIdx + 1;
              // Points curve: Winner gets base pts, others decay
              const pts = Math.floor(ev.pts / (rank * 0.4 + 0.6));
              res.ai.pointsCurrent += pts;
          });
      });

      // 3. Final Rolling Update
      workingAiSkaters.forEach(ai => {
          ai.rolling = calculateRolling(ai);
      });
      // --- END NEW AI LOGIC ---

      const updatedHistory = [...prev.history, { 
        month: `${prev.year}.${prev.month}`, 
        tec: Number(updatedSkater.tec.toFixed(2)), 
        art: Number(updatedSkater.art.toFixed(2)), 
        rank: updatedSkater.rolling || 0,
        fame: prev.fame,
        points: updatedSkater.pointsCurrent
      }].slice(-36);

      const updatedMarket = (nm % 4 === 0) ? generateMarket(prev.activeCoachId, prev.market) : prev.market;

      if (finalSta < 10) {
        setTimeout(() => addLog("由于过度疲劳，部分训练效果严重受损！请务必安排休息。", 'event'), 300);
      }

      const tecGain = updatedSkater.tec - prev.skater.tec;
      const artGain = updatedSkater.art - prev.skater.art;

      return { 
        ...prev, year: ny, month: nm, 
        money: prev.money - currentCoach.salary + sponsorIncome + moneyBonus, 
        fame: Math.max(0, prev.fame + fameBonus), 
        skater: updatedSkater, aiSkaters: workingAiSkaters, activeSponsor: updatedSponsor, 
        history: updatedHistory, hasCompeted: false, 
        activeEvent: triggeredEvent ? { event: triggeredEvent, narrative: generateLocalNarrative(triggeredEvent) } : null, 
        market: updatedMarket, inventory: remainingInventory,
        lastGrowth: { tec: tecGain, art: artGain }
      };
    });
    setIsProcessing(false);
    addLog(`进入 ${game.month === 12 ? game.year + 1 : game.year} 年 ${game.month === 12 ? 1 : game.month + 1} 月`, 'sys');
  };

  const selectSponsor = (sp: Sponsorship) => {
    setGame(prev => ({ ...prev, activeSponsor: sp, money: prev.money + sp.signingBonus }));
    setSponsorOptions([]); 
    addLog(`签约赞助: ${sp.name}`, 'sys');
  };

  const buyItem = (item: Equipment) => {
    if (game.money < item.price) return alert("资金不足");
    setGame(prev => {
        const newInv = [...prev.inventory, { ...item, owned: true }];
        const totalAttrs = getTotalAttributes(prev.skater.attributes!, newInv);
        const d = calcDerivedStats(totalAttrs);
        return { 
            ...prev, 
            money: prev.money - item.price, 
            inventory: newInv,
            skater: { ...prev.skater, tec: d.tec, art: d.art } 
        };
    });
    addLog(`购入器材: ${item.name}`, 'shop');
  };

  const [showMatch, setShowMatch] = useState<{ event: GameEvent, idx: number } | null>(null);

  const statsPreview = useMemo(() => {
    const currentCoach = game.market.coaches.find(c => c.id === game.activeCoachId) || game.market.coaches[0];
    return calculateWeeklyStats(game.schedule, game.skater.sta, currentCoach, game.skater.age, game.skater.attributes!.endurance);
  }, [game.schedule, game.skater.sta, game.activeCoachId, game.skater.age, calculateWeeklyStats, game.skater.attributes!.endurance]);

  const displayAttributes = useMemo(() => {
    if (!game.skater.attributes) return null;
    return getTotalAttributes(game.skater.attributes, game.inventory);
  }, [game.skater.attributes, game.inventory, getTotalAttributes]);

  const radarData = useMemo(() => {
    if (!displayAttributes) return [];
    return [
      { subject: '爆发 JUMP', A: displayAttributes.jump, fullMark: 100 },
      { subject: '表现 PERF', A: displayAttributes.perf, fullMark: 100 },
      { subject: '耐力 END', A: displayAttributes.endurance, fullMark: 100 },
      { subject: '步法 STEP', A: displayAttributes.step, fullMark: 100 },
      { subject: '旋转 SPIN', A: displayAttributes.spin, fullMark: 100 },
    ];
  }, [displayAttributes]);

  if (isNaming) {
    return (
      <div className="fixed inset-0 z-[1000] bg-slate-950 flex items-center justify-center p-8 overflow-hidden">
         <div className="max-w-xl w-full bg-slate-900 border border-slate-800 rounded-[3rem] p-16 shadow-2xl relative z-10 text-center animate-in zoom-in duration-500">
            <h1 className="text-4xl font-black text-white italic tracking-tighter mb-4">FS MANAGER <span className="text-blue-500 italic">ELITE</span></h1>
            <p className="text-slate-500 text-xs font-bold uppercase tracking-[0.3em] mb-12">开启你的世界冠军之路</p>
            <div className="space-y-8 text-left">
               <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">选手姓名</label>
                  <input type="text" value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="例如: 苏小冰" className="w-full bg-slate-950 border border-slate-800 px-8 py-5 rounded-2xl text-white font-bold focus:border-blue-500 outline-none" />
               </div>
               <button onClick={handleStartGame} className="w-full bg-white text-slate-950 py-5 rounded-2xl font-black text-xl hover:scale-105 active:scale-95 transition-all shadow-xl uppercase tracking-tighter">进入冰场</button>
            </div>
         </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 selection:bg-blue-500/30 font-sans">
      <nav className="sticky top-0 z-50 bg-slate-900/90 backdrop-blur-lg border-b border-slate-800 px-8 py-4 flex justify-between items-center shadow-2xl">
        <div className="flex items-center gap-4">
          <div className="bg-gradient-to-tr from-blue-600 to-indigo-600 w-12 h-12 rounded-2xl flex items-center justify-center font-black text-2xl italic text-white">F</div>
          <div>
            <h1 className="text-xl font-black uppercase tracking-tighter">FS Manager <span className="text-blue-500">Elite</span></h1>
            <p className="text-[10px] text-slate-500 font-mono uppercase tracking-widest">{game.year} 年 {game.month} 月</p>
          </div>
        </div>
        <div className="flex items-center gap-10">
          <div className="text-right">
            <p className="text-[10px] text-slate-500 font-bold uppercase">世界排名积分</p>
            <p className="text-xl font-black text-blue-400 font-mono">{(game.skater.rolling || 0).toLocaleString()}</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-slate-500 font-bold uppercase">持有资金</p>
            <p className="text-xl font-black text-emerald-400 font-mono">¥{game.money.toLocaleString()}</p>
          </div>
          <button 
            onClick={nextMonth} 
            disabled={isProcessing}
            className={`bg-blue-600 hover:bg-blue-500 text-white font-black py-4 px-10 rounded-2xl transition-all shadow-xl flex items-center gap-3 active:scale-95 ${game.skater.sta < 10 && statsPreview.finalSta < 10 ? 'bg-red-600 hover:bg-red-500 ring-2 ring-red-500/50' : ''}`}
          >
            {game.skater.sta < 10 && statsPreview.finalSta < 10 ? '体力告急!' : '下个月'}
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M13 5l7 7-7 7M5 5l7 7-7 7"/></svg>
          </button>
        </div>
      </nav>

      {isProcessing && (
        <div className="fixed inset-0 z-[2000] bg-slate-950/90 backdrop-blur-sm flex flex-col items-center justify-center p-12 text-center animate-in fade-in duration-300">
           <div className="w-24 h-24 border-b-4 border-blue-500 rounded-full animate-spin mb-12"></div>
           <p className="text-3xl font-black text-white italic tracking-tighter mb-6 uppercase">时间流逝中...</p>
           <div className="max-w-md bg-slate-900/50 p-6 rounded-3xl border border-slate-800 italic text-slate-400 text-sm">"{loadingQuote}"</div>
        </div>
      )}

      {showResetConfirm && (
        <div className="fixed inset-0 z-[2500] bg-slate-950/95 flex items-center justify-center p-8 animate-in fade-in duration-300">
           <div className="max-w-md w-full bg-slate-900 border border-red-900/30 rounded-[2.5rem] p-10 text-center shadow-2xl">
              <div className="w-16 h-16 bg-red-600/20 text-red-500 rounded-full flex items-center justify-center text-3xl mb-6 mx-auto">⚠️</div>
              <h2 className="text-2xl font-black text-white mb-4 uppercase tracking-tighter">彻底重置生涯？</h2>
              <p className="text-slate-500 text-sm mb-10 leading-relaxed">此操作将清空所有存档数据并重新开始。一旦点击“确认重置”，当前进度将永远丢失。</p>
              <div className="flex gap-4">
                 <button onClick={() => setShowResetConfirm(false)} className="flex-1 bg-slate-800 text-slate-300 py-4 rounded-xl font-black uppercase text-xs">返回</button>
                 <button onClick={confirmResetGame} className="flex-1 bg-red-600 text-white py-4 rounded-xl font-black uppercase text-xs shadow-xl shadow-red-600/20">确认重置</button>
              </div>
           </div>
        </div>
      )}

      <main className="container mx-auto grid grid-cols-12 gap-8 p-8">
        <div className="col-span-3 space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-[3rem] p-8 shadow-2xl relative overflow-hidden group min-h-[500px] flex flex-col">
            <h2 className="text-3xl font-black text-white italic tracking-tighter mb-2">{game.skater.name}</h2>
            <p className="text-[10px] text-slate-500 mb-6 font-bold uppercase tracking-[0.2em]">节目: {game.skater.activeProgram.name}</p>
            
            <div className="flex-1 relative -mx-8 -my-4">
                <ResponsiveContainer width="100%" height={250}>
                    <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                        <PolarGrid stroke="#334155" />
                        <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 9, fontWeight: 900 }} />
                        <PolarRadiusAxis angle={90} domain={[0, 100]} tick={false} axisLine={false} />
                        <Radar name="Skater" dataKey="A" stroke="#3b82f6" strokeWidth={2} fill="#3b82f6" fillOpacity={0.3} />
                    </RadarChart>
                </ResponsiveContainer>
            </div>

            <div className="space-y-4 relative z-10">
              {displayAttributes && (
                <div className="grid grid-cols-5 gap-2 mb-2">
                   {[
                     { label: 'JUMP', val: displayAttributes.jump, color: 'text-red-400', border: 'border-red-500/20', bg: 'bg-red-500/5' },
                     { label: 'SPIN', val: displayAttributes.spin, color: 'text-indigo-400', border: 'border-indigo-500/20', bg: 'bg-indigo-500/5' },
                     { label: 'STEP', val: displayAttributes.step, color: 'text-cyan-400', border: 'border-cyan-500/20', bg: 'bg-cyan-500/5' },
                     { label: 'PERF', val: displayAttributes.perf, color: 'text-purple-400', border: 'border-purple-500/20', bg: 'bg-purple-500/5' },
                     { label: 'END', val: displayAttributes.endurance, color: 'text-amber-400', border: 'border-amber-500/20', bg: 'bg-amber-500/5' },
                   ].map((stat) => (
                     <div key={stat.label} className={`flex flex-col items-center justify-center py-2 rounded-lg border ${stat.border} ${stat.bg} backdrop-blur-sm`}>
                       <span className={`text-[8px] font-black ${stat.color} tracking-wider mb-0.5`}>{stat.label}</span>
                       <span className="text-xs font-black text-white">{stat.val.toFixed(0)}</span>
                     </div>
                   ))}
                </div>
              )}

              <div>
                  <div className="flex justify-between text-[11px] font-bold text-slate-500 mb-1 uppercase tracking-widest">
                    <span>全局体力 STA</span>
                    <span className={game.skater.sta < 20 ? "text-red-500 animate-pulse" : "text-emerald-400"}>{game.skater.sta.toFixed(0)} / 100</span>
                  </div>
                  <div className="h-1.5 bg-slate-950 rounded-full overflow-hidden shadow-inner"><div className={`h-full transition-all duration-1000 ${game.skater.sta < 20 ? 'bg-red-500' : 'bg-emerald-500'}`} style={{ width: `${game.skater.sta}%` }}></div></div>
              </div>
              <div className="grid grid-cols-2 gap-4 text-[10px] text-slate-500 font-bold uppercase">
                  <div className="bg-slate-950 p-2 rounded-xl text-center"><span className="block text-blue-400 font-black text-lg">{game.skater.tec.toFixed(0)}</span>综合技术 TEC</div>
                  <div className="bg-slate-950 p-2 rounded-xl text-center"><span className="block text-purple-400 font-black text-lg">{game.skater.art.toFixed(0)}</span>综合艺术 ART</div>
              </div>
            </div>
          </div>

          <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-6">
             <div className="space-y-4">
                {game.inventory.length > 0 ? game.inventory.map(item => {
                  const percent = (item.lifespan / item.maxLifespan) * 100;
                  const isLow = item.lifespan <= 3;
                  return (
                    <div key={item.id} className="space-y-1.5">
                      <div className="flex justify-between items-center text-[9px] font-bold">
                        <span className="text-slate-300">{item.name}</span>
                        <span className={isLow ? "text-red-500 animate-pulse" : "text-slate-500"}>{item.lifespan}月</span>
                      </div>
                      <div className="h-1 bg-slate-950 rounded-full overflow-hidden">
                        <div className={`h-full transition-all duration-500 ${isLow ? 'bg-red-500' : percent < 50 ? 'bg-amber-500' : 'bg-emerald-500'}`} style={{ width: `${percent}%` }}></div>
                      </div>
                    </div>
                  );
                }) : <p className="text-[10px] text-slate-600 text-center py-4 italic">无活跃装备</p>}
             </div>
          </div>
        </div>

        <div className="col-span-6 space-y-6">
          <div className="bg-slate-900/50 p-2 rounded-2xl border border-slate-800 flex gap-2 shadow-inner">
            {[ { k: 'event', l: '竞技赛事' }, { k: 'development', l: '能力成长' }, { k: 'ranking', l: '世界排名' }, { k: 'career', l: '选手信息' } ].map(t => (
              <button key={t.k} onClick={() => setActiveTab(t.k as any)} className={`flex-1 py-4 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === t.k ? 'bg-blue-600 text-white shadow-xl scale-105' : 'text-slate-500 hover:bg-slate-800'}`}>{t.l}</button>
            ))}
          </div>
          
          <div className="min-h-[600px]">
            {activeTab === 'event' && (
              <div className="space-y-4 animate-in fade-in duration-500">
                {(seasonCalendar[game.month] || []).map((ev, i) => {
                  const locked = (game.skater.rolling || 0) < ev.req || game.skater.sta < MATCH_STAMINA_COST;
                  return (
                    <div key={i} className={`bg-slate-900 border border-slate-800 p-8 rounded-[2.5rem] flex justify-between items-center group transition-all hover:border-blue-500/40 shadow-xl ${locked ? 'opacity-60 grayscale-[0.5]' : ''}`}>
                      <div className="flex gap-6 items-center"><div className={`w-16 h-16 rounded-2xl flex items-center justify-center font-black text-2xl text-white shadow-lg ${locked ? 'bg-slate-800' : 'bg-gradient-to-br from-blue-500 to-indigo-600'}`}>{ev.name[0]}</div><div><h4 className="text-xl font-bold text-white mb-1">{ev.name} {locked && '🔒'}</h4><p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">入围积分: {ev.req} | 奖励总分: {ev.pts} pts | 难度: {ev.base}</p></div></div>
                      <button disabled={locked || game.hasCompeted} onClick={() => setShowMatch({ event: ev, idx: i })} className={`px-10 py-4 rounded-2xl font-black transition-all ${locked || game.hasCompeted ? 'bg-slate-800 text-slate-600 cursor-not-allowed' : 'bg-white text-slate-950 hover:scale-105 active:scale-95 shadow-xl'}`}>{game.hasCompeted ? '已完赛' : locked ? '积分不足' : '报名'}</button>
                    </div>
                  );
                })}
              </div>
            )}

            {activeTab === 'development' && (
              <div className="space-y-6 animate-in fade-in duration-500">
                <div className="flex gap-4 mb-4">{[ { k: 'train', l: '训练' }, { k: 'coach', l: '团队' }, { k: 'equip', l: '装备' }, { k: 'choreo', l: '编排' } ].map(s => (
                    <button key={s.k} onClick={() => setDevSubTab(s.k as any)} className={`px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${devSubTab === s.k ? 'bg-white text-slate-950 shadow-lg' : 'bg-slate-900 text-slate-500 hover:text-slate-300'}`}>{s.l}</button>
                ))}</div>
                {devSubTab === 'train' && (
                  <div className="bg-slate-900 border border-slate-800 p-10 rounded-[3rem] shadow-2xl">
                    <h3 className="text-sm font-black uppercase text-slate-400 mb-6 tracking-widest flex items-center gap-3">月度排程 (7天) <div className="flex-1 h-px bg-slate-800"></div></h3>
                    
                    <div className="mb-8 p-4 bg-slate-950/50 rounded-2xl border border-slate-800 flex justify-between items-center">
                        <div>
                            <p className="text-[10px] font-black text-slate-500 uppercase">预计下月体力</p>
                            <p className={`text-xl font-mono font-black ${statsPreview.finalSta < 20 ? 'text-red-500' : 'text-emerald-400'}`}>{statsPreview.finalSta.toFixed(0)}%</p>
                        </div>
                        <div className="text-right">
                             <p className="text-[10px] font-black text-slate-500 uppercase">重点强化属性</p>
                             <div className="flex gap-2 justify-end">
                                {Object.entries(statsPreview.gains).filter(([k,v]) => v > 0).slice(0, 3).map(([k,v]) => (
                                    <span key={k} className="text-[10px] font-black bg-slate-800 px-2 py-0.5 rounded text-white uppercase">{k} +{v.toFixed(1)}</span>
                                ))}
                                {Object.keys(statsPreview.gains).every(k => statsPreview.gains[k] <= 0) && <span className="text-[10px] text-slate-600 italic">休整期</span>}
                             </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-7 gap-2 mb-8 p-2 bg-slate-950 rounded-2xl border border-slate-800 min-h-[80px]">
                         {game.schedule.map((taskId, idx) => {
                             const taskDef = TRAINING_TASKS[taskId];
                             return (
                                 <div 
                                    key={idx}
                                    onDragOver={(e) => e.preventDefault()}
                                    onDrop={(e) => {
                                        e.preventDefault();
                                        if (draggedTask) {
                                            const newSchedule = [...game.schedule];
                                            newSchedule[idx] = draggedTask;
                                            setGame(prev => ({ ...prev, schedule: newSchedule }));
                                        }
                                    }}
                                    onClick={() => {
                                        const newSchedule = [...game.schedule];
                                        newSchedule[idx] = 'rest';
                                        setGame(prev => ({ ...prev, schedule: newSchedule }));
                                    }}
                                    className={`relative group rounded-xl flex items-center justify-center cursor-pointer transition-all hover:scale-105 active:scale-95 ${taskDef.color} shadow-lg`}
                                 >
                                    <span className="text-[10px] font-black text-white text-center leading-tight p-1">{taskDef.name}</span>
                                    <div className="absolute inset-0 bg-white/0 group-hover:bg-white/10 rounded-xl transition-colors"></div>
                                 </div>
                             );
                         })}
                    </div>

                    <h4 className="text-[10px] font-black uppercase text-slate-500 mb-4 tracking-widest">训练项目 (拖拽至上方槽位)</h4>
                    <div className="grid grid-cols-3 gap-4">
                        {Object.values(TRAINING_TASKS).map(task => (
                            <div 
                                key={task.id}
                                draggable
                                onDragStart={() => setDraggedTask(task.id)}
                                onDragEnd={() => setDraggedTask(null)}
                                className="bg-slate-950 p-4 rounded-2xl border border-slate-800 cursor-grab active:cursor-grabbing hover:border-slate-600 transition-all group"
                            >
                                <div className="flex items-center gap-3 mb-2">
                                    <div className={`w-3 h-3 rounded-full ${task.color}`}></div>
                                    <span className="text-xs font-bold text-white">{task.name}</span>
                                </div>
                                <p className="text-[8px] text-slate-500 mb-2 h-6 overflow-hidden leading-tight">{task.desc}</p>
                                <div className="flex gap-2 text-[8px] font-mono font-black">
                                    {task.targetAttr && <span className="text-blue-400 uppercase">{task.targetAttr}</span>}
                                    <span className={task.staCost > 0 ? 'text-red-500' : 'text-emerald-500'}>STA{task.staCost > 0 ? '-' : '+'}{Math.abs(task.staCost)}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                  </div>
                )}
                {devSubTab === 'coach' && (
                  <div className="bg-slate-900 border border-slate-800 p-10 rounded-[3rem] shadow-2xl"><h3 className="text-sm font-black uppercase text-slate-400 mb-8 tracking-widest">教练市场 (每 4 个月刷新)</h3><div className="space-y-4">{game.market.coaches.map(c => (
                        <div key={c.id} className={`p-6 rounded-2xl border-2 flex justify-between items-center transition-all ${game.activeCoachId === c.id ? 'bg-blue-600/10 border-blue-500 shadow-xl' : 'bg-slate-950 border-slate-800'}`}><div><div className="flex items-center gap-3"><span className="font-black text-white text-lg">{c.name}</span><span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded ${c.tier === 'legend' ? 'bg-amber-500 text-black' : c.tier === 'pro' ? 'bg-blue-500 text-white' : 'bg-slate-700 text-slate-300'}`}>{c.tier}</span></div><p className="text-[10px] text-slate-500 font-bold uppercase mt-1">系数: TEC x{c.tecMod} | ART x{c.artMod} | 月薪: ¥{c.salary.toLocaleString()}</p></div><button onClick={() => setGame(prev => ({ ...prev, activeCoachId: c.id }))} className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${game.activeCoachId === c.id ? 'bg-blue-600 text-white cursor-default' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}>{game.activeCoachId === c.id ? "签约中" : "聘请"}</button></div>
                      ))}</div></div>
                )}
                {devSubTab === 'choreo' && (
                  <div className="bg-slate-900 border border-slate-800 p-10 rounded-[3rem] shadow-2xl"><h3 className="text-sm font-black uppercase text-slate-400 mb-8 tracking-widest">节目编排</h3><div className="space-y-4">{game.market.choreographers.map((ch, idx) => (
                        <div key={idx} className="p-6 bg-slate-950 border border-slate-800 rounded-2xl flex justify-between items-center transition-all"><div><p className="font-black text-white text-lg mb-1 italic">《{ch.name}》</p><p className="text-[10px] text-slate-500 font-bold uppercase">{ch.desc}</p><p className="text-[8px] text-purple-400 font-black uppercase mt-1">艺术底蕴: {ch.base}</p></div><button onClick={() => { if (game.money >= ch.cost) { setGame(p => ({ ...p, money: p.money - ch.cost, skater: { ...p.skater, activeProgram: { name: ch.name, baseArt: ch.base, freshness: 100 } } })); addLog(`完成编舞: 《${ch.name}》`, 'art'); } else alert("资金不足"); }} className="bg-purple-600 hover:bg-purple-500 text-white px-8 py-4 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg active:scale-95">¥{ch.cost.toLocaleString()}</button></div>
                      ))}</div></div>
                )}
                {devSubTab === 'equip' && (
                  <div className="bg-slate-900 border border-slate-800 p-10 rounded-[3rem] shadow-2xl">
                    <h3 className="text-sm font-black uppercase text-slate-400 mb-8 tracking-widest">器材更新</h3>
                    <div className="grid grid-cols-2 gap-4">
                      {game.market.equipment.map(item => { 
                        const alreadyOwned = game.inventory.some(inv => inv.name === item.name);
                        return (
                          <div key={item.id} className={`p-6 bg-slate-950 rounded-2xl border border-slate-800 flex flex-col justify-between transition-all ${alreadyOwned ? 'opacity-50' : 'hover:border-emerald-500/30'}`}>
                            <div className="mb-4">
                              <p className="text-[8px] text-slate-600 font-black uppercase mb-1">{item.type} | 耐用度: {item.lifespan}月</p>
                              <p className="text-sm font-bold text-white">{item.name}</p>
                              <div className="flex gap-2 mt-2 flex-wrap">
                                {item.jumpBonus > 0 && <span className="text-[8px] font-black text-red-400">JUMP +{item.jumpBonus}</span>}
                                {item.spinBonus > 0 && <span className="text-[8px] font-black text-indigo-400">SPIN +{item.spinBonus}</span>}
                                {item.stepBonus > 0 && <span className="text-[8px] font-black text-cyan-400">STEP +{item.stepBonus}</span>}
                                {item.perfBonus > 0 && <span className="text-[8px] font-black text-purple-400">PERF +{item.perfBonus}</span>}
                                {item.enduranceBonus > 0 && <span className="text-[8px] font-black text-amber-400">END +{item.enduranceBonus}</span>}
                              </div>
                            </div>
                            <button disabled={alreadyOwned} onClick={() => buyItem(item)} className={`text-[10px] w-full py-4 rounded-xl font-black transition-all uppercase tracking-widest ${alreadyOwned ? 'bg-slate-800 text-slate-500 cursor-not-allowed' : 'bg-emerald-600 text-white hover:scale-105 active:scale-95'}`}>
                              {alreadyOwned ? '已在使用' : `¥${item.price.toLocaleString()}`}
                            </button>
                          </div>
                        ); 
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'ranking' && (
              <div className="bg-slate-900 border border-slate-800 rounded-[3rem] overflow-hidden shadow-2xl animate-in fade-in duration-500"><div className="p-8 bg-slate-800/40 border-b border-slate-800 flex justify-between items-center"><h3 className="text-sm font-black uppercase text-white tracking-widest">ISU 世界排名公告板</h3><span className="text-[10px] text-slate-500 font-mono">150 名注册选手中</span></div><div className="h-[550px] overflow-y-auto divide-y divide-slate-800/50 px-4 custom-scrollbar">{[...game.aiSkaters, game.skater].sort((a,b) => (b.rolling || 0) - (a.rolling || 0)).map((s, idx) => (
                    <div key={s.id || idx} className={`flex justify-between items-center p-5 rounded-2xl ${s.isPlayer ? 'bg-blue-600/10 border border-blue-500/20 my-2 shadow-lg' : 'hover:bg-slate-800/30 transition-all'}`}><div className="flex items-center gap-5"><span className={`font-black text-sm w-8 ${idx === 0 ? 'text-amber-500' : idx === 1 ? 'text-slate-300' : idx === 2 ? 'text-amber-700' : 'text-slate-600'}`}>{idx + 1}.</span><div><span className={`font-bold ${s.isPlayer ? 'text-blue-400 font-black' : 'text-slate-300'}`}>{s.name} {s.injuryMonths > 0 && <span className="text-[10px] text-red-500 font-black ml-2">INJURED</span>}</span><p className="text-[8px] text-slate-500 font-bold uppercase tracking-widest">年龄: {s.age.toFixed(1)} | 总分: {s.pointsCurrent + s.pointsLast}</p></div></div><div className="text-right"><span className="font-mono text-white text-base font-black italic">{(s.rolling || 0).toLocaleString()}</span><p className="text-[9px] text-slate-600 font-bold uppercase">Points</p></div></div>
                  ))}</div></div>
            )}

            {activeTab === 'career' && (
              <div className="space-y-6 animate-in fade-in duration-500">
                <div className="flex gap-4 mb-4">{[ { k: 'profile', l: '档案' }, { k: 'honors', l: '荣誉' }, { k: 'stats', l: '趋势' } ].map(s => (
                    <button key={s.k} onClick={() => setCareerSubTab(s.k as any)} className={`px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${careerSubTab === s.k ? 'bg-white text-slate-950 shadow-lg' : 'bg-slate-900 text-slate-500 hover:text-slate-300'}`}>{s.l}</button>
                ))}</div>

                {careerSubTab === 'profile' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-slate-900 border border-slate-800 p-8 rounded-[2.5rem] shadow-2xl">
                       <h3 className="text-xs font-black uppercase text-slate-500 mb-6 tracking-widest">商业代言</h3>
                       {game.activeSponsor ? (
                         <div className="bg-slate-950 p-6 rounded-2xl border border-blue-500/30">
                            <p className="text-lg font-black text-white italic mb-2 tracking-tight">{game.activeSponsor.name}</p>
                            <div className="space-y-2">
                               <div className="flex justify-between items-center text-[10px] uppercase font-bold text-slate-500"><span>月度收益</span><span className="text-emerald-400">¥{game.activeSponsor.monthlyPay.toLocaleString()}</span></div>
                               <div className="flex justify-between items-center text-[10px] uppercase font-bold text-slate-500"><span>剩余合约</span><span className="text-blue-400">{game.activeSponsor.remainingMonths} 个月</span></div>
                            </div>
                         </div>
                       ) : (
                         <div className="space-y-4">
                            <p className="text-[10px] text-amber-500 font-black uppercase mb-4 text-center">当前可签协议 ({sponsorOptions.length})</p>
                            <div className="space-y-3 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
                               {sponsorOptions.map(sp => {
                                  const disabled = game.fame < sp.minFame;
                                  return (
                                     <button key={sp.id} disabled={disabled} onClick={() => selectSponsor(sp)} className={`w-full p-4 rounded-xl border text-left transition-all ${disabled ? 'bg-slate-950 border-slate-800 opacity-30 cursor-not-allowed' : 'bg-slate-950 border-slate-800 hover:border-blue-500'}`}>
                                        <div className="flex justify-between mb-1"><span className="text-xs font-black text-white">{sp.name}</span><span className="text-[8px] uppercase text-blue-400">{sp.type}</span></div>
                                        <div className="flex justify-between text-[8px] text-slate-500 font-bold"><span>月薪: ¥{sp.monthlyPay}</span><span>签约金: ¥{sp.signingBonus}</span></div>
                                        {disabled && <p className="text-[8px] text-red-500 mt-1 uppercase">需名望: {sp.minFame}</p>}
                                     </button>
                                  );
                               })}
                               {sponsorOptions.length === 0 && <p className="text-xs text-slate-600 text-center py-10 italic">暂无赞助商意向</p>}
                            </div>
                         </div>
                       )}
                    </div>

                    <div className="bg-slate-900 border border-slate-800 p-8 rounded-[2.5rem] shadow-2xl">
                       <h3 className="text-xs font-black uppercase text-slate-500 mb-6 tracking-widest">当前装备库</h3>
                       <div className="space-y-3 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
                          {game.inventory.length > 0 ? game.inventory.map(item => (
                            <div key={item.id} className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex justify-between items-center mb-2">
                               <div><p className="text-xs font-bold text-white">{item.name}</p><p className="text-[8px] text-slate-500 uppercase">{item.type}</p></div>
                               <div className="text-right"><p className="text-[10px] font-black text-emerald-500">{item.lifespan}月</p></div>
                            </div>
                          )) : <p className="text-xs text-slate-600 text-center py-6 italic opacity-50">仓库中目前没有活跃装备</p>}
                       </div>
                    </div>

                    <div className="md:col-span-2 bg-slate-900/50 border border-slate-800 p-10 rounded-[2.5rem] flex flex-col items-center justify-center space-y-6">
                       <div className="text-center">
                          <h3 className="text-xs font-black text-red-500 uppercase tracking-[0.3em] mb-2">危险操作区域</h3>
                          <p className="text-[10px] text-slate-500 max-w-sm">重置后将清除所有选手的成长轨迹、奖牌历史、资产和器材。本操作在沙盒预览环境中即时生效。</p>
                       </div>
                       <button onClick={() => setShowResetConfirm(true)} className="px-12 py-4 bg-red-600/10 border border-red-600/40 hover:bg-red-600 text-white text-[10px] font-black uppercase tracking-widest rounded-2xl transition-all shadow-xl active:scale-95 group overflow-hidden relative">
                          <span className="relative z-10 group-hover:text-white transition-colors">确认重置我的职业生涯</span>
                          <div className="absolute inset-0 bg-red-600 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                       </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
        
        <div className="col-span-3 flex flex-col h-[calc(100vh-160px)]"><h3 className="text-[10px] font-black uppercase text-slate-500 mb-4 tracking-[0.3em] flex items-center gap-2"><span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span> 全球快讯</h3><div className="flex-1 bg-slate-900 border border-slate-800 rounded-[3rem] p-8 overflow-y-auto space-y-5 shadow-inner custom-scrollbar">{logs.map(log => (
              <div key={log.id} className="pb-5 border-b border-slate-800/60 last:border-0 animate-in slide-in-from-right-4 duration-300"><div className="flex justify-between mb-2"><span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded shadow-sm ${log.type === 'train' ? 'bg-blue-600/20 text-blue-400' : log.type === 'comp' ? 'bg-amber-600/20 text-amber-400' : log.type === 'art' ? 'bg-purple-600/20 text-purple-400' : 'bg-slate-800 text-slate-400'}`}>{log.type}</span><span className="text-[8px] text-slate-600 font-mono font-bold">{log.month}月</span></div><p className="text-[11px] text-slate-300 leading-relaxed font-medium">{log.msg}</p></div>
            ))}</div></div>
      </main>

      {game.activeEvent && (
        <div className="fixed inset-0 z-[200] bg-slate-950/95 backdrop-blur-2xl flex items-center justify-center p-8 animate-in fade-in duration-500"><div className="max-w-lg w-full bg-slate-900 border border-slate-800 rounded-[3rem] p-12 shadow-2xl relative overflow-hidden"><div className={`absolute top-0 left-0 w-full h-1.5 ${game.activeEvent.event.type === 'positive' ? 'bg-emerald-500' : game.activeEvent.event.type === 'negative' ? 'bg-red-500' : 'bg-blue-500'}`}></div><h2 className="text-3xl font-black text-white italic mb-6 uppercase tracking-tighter text-center">{game.activeEvent.event.name}</h2><div className="bg-slate-950/50 p-8 rounded-[2rem] mb-8 text-left italic text-slate-300 font-serif text-sm leading-relaxed border border-slate-800">"{game.activeEvent.narrative}"</div><div className="mb-10 space-y-3"><p className="text-[10px] font-black text-slate-500 uppercase tracking-widest text-center mb-4">属性变动</p><div className="grid grid-cols-2 gap-3">{Object.entries(game.activeEvent.event.effect).map(([key, val]) => { if (val === 0) return null; const labelMap: any = { tec: 'TEC', art: 'ART', sta: 'STA', money: '资金', fame: '名望', injuryMonths: '伤病', jump: 'JUMP', spin: 'SPIN', step: 'STEP', perf: 'PERF', endurance: 'END' }; const isPositive = (val as number) > 0; return ( <div key={key} className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 flex justify-between items-center"><span className="text-[10px] font-bold text-slate-400">{labelMap[key] || key}</span><span className={`font-black text-xs ${isPositive ? 'text-emerald-400' : 'text-red-400'}`}>{(val as number) > 0 ? '+' : ''}{val}</span></div> ); })}</div></div><button onClick={() => setGame(prev => ({ ...prev, activeEvent: null }))} className="w-full bg-white text-slate-950 py-5 rounded-2xl font-black text-xl active:scale-95 transition-all shadow-xl uppercase tracking-tighter">确认</button></div></div>
      )}

      {showMatch && (
        <MatchEngine 
          key={`match-${showMatch.event.name}-${Date.now()}`}
          event={showMatch.event} skater={game.skater} aiSkaters={game.aiSkaters}
          onClose={(results) => {
            const rank = results.findIndex(r => r.isPlayer) + 1;
            const pts = Math.floor(showMatch.event.pts / (rank * 0.4 + 0.6));
            const fameGained = Math.max(0, 10 - rank) * 10 + (rank === 1 ? 150 : 0);
            
            const isMajor = showMatch.event.pts >= 2500 || 
                           showMatch.event.name.includes("世锦赛") || 
                           showMatch.event.name.includes("奥运会") || 
                           showMatch.event.name.includes("总决赛");
            
            const enduranceFactor = game.skater.attributes ? (game.skater.attributes.endurance / 200) : 0; 
            const finalStaCost = Math.max(5, MATCH_STAMINA_COST * (1 - enduranceFactor));

            setGame(prev => {
              const shouldRecordHonor = rank === 1 || (isMajor && rank <= 3);
              const honors = [...(prev.skater.honors || [])];
              if (shouldRecordHonor) {
                honors.push({ year: prev.year, month: prev.month, eventName: showMatch.event.name, rank, points: pts });
              }

              const updatedSkater = { 
                ...prev.skater, 
                pointsCurrent: prev.skater.pointsCurrent + pts, 
                sta: clamp(prev.skater.sta - finalStaCost, 0, 100), 
                activeProgram: { ...prev.skater.activeProgram, freshness: clamp(prev.skater.activeProgram.freshness - 18, 0, 100) }, 
                honors: honors,
                titles: rank === 1 ? [...prev.skater.titles, showMatch.event.name] : prev.skater.titles 
              };
              updatedSkater.rolling = calculateRolling(updatedSkater);
              return { ...prev, hasCompeted: true, money: prev.money + (showMatch.event.prize || 0), fame: prev.fame + fameGained, skater: updatedSkater };
            });
            addLog(`${showMatch.event.name} 排名 No.${rank}。积分+${pts}`, 'comp');
            setShowMatch(null);
          }}
        />
      )}
    </div>
  );
};

const MatchEngine: React.FC<{ event: GameEvent, skater: Skater, aiSkaters: Skater[], onClose: (results: any[]) => void }> = ({ event, skater, aiSkaters, onClose }) => {
  const [stage, setStage] = useState<'intro' | 'active' | 'results'>('intro');
  const [phaseIndex, setPhaseIndex] = useState(0); 
  const [participants, setParticipants] = useState<any[]>([]);
  const [commentary, setCommentary] = useState<string>("广播中：下一位选手请进入场地...");
  const [isProcessing, setIsProcessing] = useState(false);
  const [playerMatchSta, setPlayerMatchSta] = useState(0);
  const [playerAccumulatedScore, setPlayerAccumulatedScore] = useState(0);
  const [history, setHistory] = useState<{name: string, score: number, desc: string, phaseName: string}[]>([]);

  const matchTemplate = MATCH_STRUCTURES[event.template] || MATCH_STRUCTURES['low'];
  const phases = matchTemplate.phases;

  useEffect(() => {
    // 1. Filter valid AI
    let pool = aiSkaters
        .filter(ai => ai.injuryMonths === 0);
    
    // Logic for participant selection based on tier
    if (event.req === 0) {
        // Low tier event: Exclude top 50 ranked skaters to simulate regional/rookie level
        const globalRanked = [...pool].sort((a,b) => (b.rolling || 0) - (a.rolling || 0));
        // Take from index 50 onwards
        pool = globalRanked.slice(50);
        // Sort this pool to get the "best of the rest" for a challenge
        pool.sort((a,b) => (b.rolling || 0) - (a.rolling || 0));
    } else {
        // Standard logic: Filter by requirements
        pool = pool.filter(ai => (ai.rolling || 0) >= event.req * 0.8);
        pool.sort((a,b) => (b.rolling || 0) - (a.rolling || 0));
    }

    const selectedAI = pool.slice(0, event.max - 1);
    
    // 2. Setup Participants with Initial State
    // Calculate AI scores immediately to establish the "target"
    const pList = [...selectedAI].map(ai => {
        // Use the unified AI simulation logic
        const score = simulateAIProgram(ai, event.template);
        return { ...ai, score };
    });
    
    // Add Player (Score 0 initially)
    pList.push({ ...skater, isPlayer: true, score: 0 });

    setParticipants(pList);
    setPlayerMatchSta(skater.sta);
    setIsProcessing(false);
  }, []);

  const handleActionSelect = async (action: MatchAction) => {
    if (isProcessing) return;
    setIsProcessing(true);
    await new Promise(r => setTimeout(r, 600));

    // Use unified scoring calculation
    const result = calculateActionScore(action, skater.attributes!, playerMatchSta, true);

    const nextSta = clamp(playerMatchSta - result.cost, 0, 100);
    const finalScore = result.score;
    
    setPlayerMatchSta(nextSta);
    setPlayerAccumulatedScore(prev => prev + finalScore);
    
    setHistory(prev => [...prev, {
        name: action.name,
        score: finalScore,
        desc: result.isFail ? "出现失误 (Fall)" : (result.fatigueFactor < 1 ? "体力不支 (Fatigued)" : "完美发挥 (Clean)"),
        phaseName: PHASE_META[action.type].name
    }]);

    if (phaseIndex < phases.length - 1) {
        setPhaseIndex(prev => prev + 1);
        setIsProcessing(false);
    } else {
        finishMatch(playerAccumulatedScore + finalScore);
    }
  };

  const finishMatch = (finalPlayerScore: number) => {
    const finalParticipants = participants.map(p => {
        if (p.isPlayer) return { ...p, score: finalPlayerScore };
        return p;
    });
    const sortedRes = [...finalParticipants].sort((a,b) => b.score - a.score);
    const pRank = sortedRes.findIndex(r => r.isPlayer) + 1;
    setParticipants(finalParticipants);
    setCommentary(generateLocalCommentary(pRank));
    setStage('results');
    setIsProcessing(false);
  };

  const sorted = [...participants].sort((a,b) => b.score - a.score);
  const playerRank = sorted.findIndex(r => r.isPlayer) + 1;
  const currentPhaseType = phases[phaseIndex];
  const phaseMeta = PHASE_META[currentPhaseType];
  
  const availableActions = ACTION_LIBRARY.filter(a => {
      if (a.type !== currentPhaseType) return false;
      const reqs = a.reqStats;
      for (const [key, val] of Object.entries(reqs)) {
          // @ts-ignore
          if ((skater.attributes?.[key] || 0) < val) return false;
      }
      return true;
  });

  if (availableActions.length === 0 && stage === 'active') {
     availableActions.push({ id: 'fallback', name: '基础滑行', type: currentPhaseType, baseScore: 1.0, cost: 2, risk: 0, reqStats: {}, desc: '能力不足时的临时动作' });
  }

  return (
    <div className="fixed inset-0 z-[100] bg-slate-950/98 backdrop-blur-3xl flex items-center justify-center p-8 animate-in fade-in duration-500 overflow-hidden text-slate-200 font-sans">
      <div className="max-w-7xl w-full grid grid-cols-1 lg:grid-cols-12 gap-8 h-full max-h-[90vh]">
        <div className="lg:col-span-8 bg-slate-900 border border-slate-800 rounded-[3rem] p-10 shadow-2xl relative flex flex-col overflow-hidden">
          <p className="text-[10px] font-black uppercase text-slate-500 mb-6 tracking-[0.6em] shrink-0 text-center">{event.name} - {matchTemplate.name}</p>
          <div className="flex-1 flex flex-col overflow-y-auto px-2 py-2 custom-scrollbar relative">
            {stage === 'intro' && (
              <div className="flex-1 flex flex-col justify-center items-center text-center animate-in zoom-in duration-500">
                <h2 className="text-6xl font-black text-white italic mb-8 tracking-tighter uppercase">入冰仪式</h2>
                <div className="max-w-md text-slate-400 text-sm mb-12 leading-relaxed">{matchTemplate.desc}</div>
                <button onClick={() => setStage('active')} className="bg-blue-600 hover:bg-blue-500 px-24 py-6 rounded-2xl font-black text-2xl shadow-2xl transition-all active:scale-95 text-white">开始比赛</button>
              </div>
            )}
            {stage === 'active' && (
              <div className="animate-in fade-in duration-300 w-full flex flex-col h-full">
                 <div className="flex items-center justify-between mb-8 px-4 relative">
                    <div className="absolute left-0 right-0 top-1/2 h-0.5 bg-slate-800 -z-0"></div>
                    {phases.map((p, idx) => {
                        const isPast = idx < phaseIndex;
                        const isCurrent = idx === phaseIndex;
                        const pMeta = PHASE_META[p];
                        return (
                            <div key={idx} className={`relative z-10 flex flex-col items-center transition-all duration-500 ${isCurrent ? 'scale-110' : 'scale-90 opacity-60'}`}>
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg border-4 transition-colors ${isPast ? 'bg-emerald-500 border-emerald-600 text-white' : isCurrent ? 'bg-blue-600 border-blue-400 text-white shadow-[0_0_20px_rgba(59,130,246,0.5)]' : 'bg-slate-900 border-slate-700 text-slate-600'}`}>
                                    {isPast ? '✓' : pMeta.icon}
                                </div>
                                <span className={`text-[9px] font-black uppercase mt-2 px-2 py-0.5 rounded-full ${isCurrent ? 'bg-blue-900/50 text-blue-200' : 'text-slate-600 bg-slate-950'}`}>{pMeta.name}</span>
                            </div>
                        );
                    })}
                 </div>

                 <div className="flex justify-between items-end mb-6 bg-slate-950/50 p-6 rounded-3xl border border-slate-800/50">
                    <div>
                        <h3 className="text-3xl font-black text-white italic mb-1">{phaseMeta.name}</h3>
                        <div className="flex gap-2">
                             {phaseMeta.relevantAttrs.map(attr => (
                                 <span key={attr} className="text-[9px] font-black uppercase bg-slate-800 text-slate-400 px-2 py-0.5 rounded">{attr}</span>
                             ))}
                        </div>
                    </div>
                    <div className="text-right">
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">当前得分</p>
                        <p className="text-4xl font-mono font-black text-blue-400">{playerAccumulatedScore.toFixed(2)}</p>
                    </div>
                 </div>

                 <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                     <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">可用技术动作 ({availableActions.length})</p>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {availableActions.map(action => {
                            // Pre-calculate to show preview
                            // Note: This is just a preview, actual calculation repeats inside handler for security/consistency
                            // We use a temp call to get cost
                            const preview = calculateActionScore(action, skater.attributes!, playerMatchSta, true);
                            const isTooExpensive = playerMatchSta < preview.cost;
                            
                            return (
                                <button 
                                    key={action.id} 
                                    disabled={isProcessing} 
                                    onClick={() => handleActionSelect(action)} 
                                    className={`relative group text-left p-5 rounded-2xl border-2 transition-all overflow-hidden ${isTooExpensive ? 'border-red-900/30 bg-red-900/5 hover:border-red-500/50' : 'border-slate-800 bg-slate-950 hover:border-blue-500 hover:shadow-lg active:scale-[0.98]'}`}
                                >
                                   <div className="flex justify-between items-start mb-2 relative z-10">
                                       <span className="font-black text-white text-lg">{action.name}</span>
                                       <span className="font-mono text-xs font-bold text-emerald-400 bg-emerald-900/20 px-2 py-1 rounded">预计: {preview.score.toFixed(1)}</span>
                                   </div>
                                   <p className="text-[10px] text-slate-500 mb-4 relative z-10">{action.desc}</p>
                                   <div className="flex gap-4 border-t border-slate-800/50 pt-3 relative z-10">
                                       <div className="flex flex-col">
                                           <span className="text-[8px] font-black text-slate-600 uppercase">体力消耗</span>
                                           <span className={`text-xs font-black ${isTooExpensive ? 'text-red-500' : 'text-slate-300'}`}>{preview.cost.toFixed(0)}</span>
                                       </div>
                                       <div className="flex flex-col">
                                           <span className="text-[8px] font-black text-slate-600 uppercase">失误风险</span>
                                           <span className={`text-xs font-black ${action.risk > 0.4 ? 'text-amber-500' : 'text-slate-300'}`}>{(action.risk * 100).toFixed(0)}%</span>
                                       </div>
                                   </div>
                                   {isTooExpensive && <div className="absolute inset-0 bg-red-500/5 pointer-events-none"></div>}
                                </button>
                            );
                        })}
                     </div>
                 </div>

                 <div className="mt-6">
                    <div className="flex justify-between text-[10px] font-bold uppercase text-slate-500 mb-2">
                        <span>剩余体力</span>
                        <span className={playerMatchSta < 20 ? "text-red-500 animate-pulse" : "text-emerald-400"}>{playerMatchSta.toFixed(0)}%</span>
                    </div>
                    <div className="h-2 bg-slate-900 rounded-full overflow-hidden"><div className={`h-full transition-all duration-500 ${playerMatchSta < 20 ? 'bg-red-500' : 'bg-emerald-500'}`} style={{ width: `${playerMatchSta}%` }}></div></div>
                 </div>
              </div>
            )}
            {stage === 'results' && (
              <div className="flex-1 flex flex-col justify-center items-center text-center animate-in zoom-in duration-700">
                <div className="inline-block p-1 bg-gradient-to-tr from-amber-500 to-amber-200 rounded-3xl mb-8">
                  <div className="bg-slate-900 px-16 py-8 rounded-[1.4rem]">
                    <h2 className="text-9xl font-black italic text-white tracking-tighter">#{playerRank}</h2>
                  </div>
                </div>
                
                <div className="bg-slate-950 p-8 rounded-3xl border border-slate-800 mb-10 text-slate-300 font-serif italic max-w-xl mx-auto shadow-2xl relative">"{commentary}"</div>
                <button onClick={() => onClose(sorted)} className="bg-white text-slate-950 px-24 py-6 rounded-2xl font-black text-xl hover:scale-105 active:scale-95 transition-all shadow-xl uppercase tracking-tighter">确认排名</button>
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-4 flex flex-col gap-6 h-full overflow-hidden">
             <div className="flex-1 bg-slate-900/50 border border-slate-800 rounded-[3rem] p-8 flex flex-col shadow-xl overflow-hidden min-h-[300px]">
                <h3 className="text-[10px] font-black uppercase text-slate-500 tracking-[0.4em] mb-6">动作回放</h3>
                <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-3">
                    {history.length === 0 && <p className="text-center text-slate-600 text-xs py-10 italic">比赛即将开始...</p>}
                    {history.map((h, i) => (
                        <div key={i} className="bg-slate-950 border border-slate-800 p-4 rounded-2xl animate-in slide-in-from-right-2">
                            <div className="flex justify-between items-center mb-1">
                                <span className="text-[9px] font-black uppercase bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded">{h.phaseName}</span>
                                <span className="font-mono text-emerald-400 font-bold">+{h.score.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between items-end">
                                <span className="font-bold text-white text-sm">{h.name}</span>
                                <span className="text-[9px] text-slate-500 italic">{h.desc}</span>
                            </div>
                        </div>
                    ))}
                </div>
             </div>

             <div className="h-1/3 bg-slate-900/50 border border-slate-800 rounded-[3rem] p-8 flex flex-col shadow-xl overflow-hidden">
                <h3 className="text-[10px] font-black uppercase text-slate-500 tracking-[0.4em] mb-4">实时榜单</h3>
                <div className="flex-1 space-y-2 overflow-y-auto pr-2 custom-scrollbar">
                    {participants.filter(p => p.score > 0).sort((a,b) => b.score - a.score).map((p, i) => (
                    <div key={i} className={`flex justify-between items-center p-3 rounded-xl border transition-all ${p.isPlayer ? 'bg-blue-600/20 border-blue-500 shadow-lg' : 'bg-slate-950 border-slate-800'}`}>
                        <div className="flex items-center gap-3"><span className="text-[9px] font-black text-slate-600 w-4">{i+1}</span><span className={`text-[10px] font-bold ${p.isPlayer ? 'text-blue-400 font-black' : 'text-slate-300'}`}>{p.name}</span></div>
                        <span className="font-mono text-[10px] text-white font-black">{p.score.toFixed(2)}</span>
                    </div>
                    ))}
                </div>
             </div>
        </div>
      </div>
    </div>
  );
};

export default App;
