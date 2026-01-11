
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis 
} from 'recharts';
import { 
  Skater, GameState, LogEntry, LogType, GameEvent, Equipment, Coach, RandomEvent, Sponsorship, HonorRecord, TrainingTaskType, PlayerAttributes 
} from './types';
import { 
  SURNAME, GIVEN, COACHES, CITIES, RANDOM_EVENTS, EQUIP_NAMES, CHOREO_NAMES,
  MATCH_STAMINA_COST, OLYMPIC_BASE_YEAR, LOADING_QUOTES, COMMENTARY_CORPUS, EVENT_NARRATIVES, TRAINING_TASKS 
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
  const tec = (attrs.jump * 0.5) + (attrs.spin * 0.3) + (attrs.step * 0.2);
  const art = (attrs.perf * 0.6) + (attrs.step * 0.4);
  return { tec: clamp(tec), art: clamp(art) };
};

const generateInitialAI = (): Skater[] => {
  return Array.from({ length: 150 }).map((_, i) => {
    // Distribute stats to create different tiers of skaters
    const tier = i < 15 ? 'elite' : i < 50 ? 'pro' : 'rookie';
    const baseStat = tier === 'elite' ? 75 : tier === 'pro' ? 55 : 30;
    const s = {
      id: `ai_${Date.now()}_${i}`,
      name: SURNAME[Math.floor(Math.random() * SURNAME.length)] + GIVEN[Math.floor(Math.random() * GIVEN.length)],
      age: 15 + Math.random() * 12, 
      tec: baseStat + Math.random() * 20, 
      art: baseStat + Math.random() * 20, 
      sta: 100,
      pointsCurrent: 0, 
      // Seed elite players with high enough points to maintain their tier
      pointsLast: tier === 'elite' ? 6000 + Math.random() * 4000 : (tier === 'pro' ? 2000 + Math.random() * 2000 : Math.random() * 1000), 
      titles: [], 
      honors: [], 
      pQual: 1.0, 
      pAge: 0, 
      injuryMonths: 0, 
      isPlayer: false, 
      retired: false,
      activeProgram: { name: "AI Program", baseArt: 35 + (tier === 'elite' ? 30 : 0), freshness: 100 }
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
    { id: 'skate_' + Math.random().toString(36).substr(2, 9), name: EQUIP_NAMES.skate[Math.floor(Math.random() * EQUIP_NAMES.skate.length)], type: 'skate', price: 2500, tecBonus: 2, artBonus: 0, staBonus: 5, owned: false, lifespan: 12, maxLifespan: 12 },
    { id: 'blade_' + Math.random().toString(36).substr(2, 9), name: EQUIP_NAMES.blade[Math.floor(Math.random() * EQUIP_NAMES.blade.length)], type: 'blade', price: 5500, tecBonus: 4, artBonus: 0, staBonus: 0, owned: false, lifespan: 10, maxLifespan: 10 },
    { id: 'costume_' + Math.random().toString(36).substr(2, 9), name: EQUIP_NAMES.costume[Math.floor(Math.random() * EQUIP_NAMES.costume.length)], type: 'costume', price: 15000, tecBonus: 0, artBonus: 10, staBonus: -2, owned: false, lifespan: 8, maxLifespan: 8 },
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
      // Migration: Ensure schedule and attributes exist
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
        // Migration from Aura to Perf
        parsed.skater.attributes.perf = parsed.skater.attributes.aura;
        delete parsed.skater.attributes.aura;
      }
      // Migrate schedule tasks
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
    cal[12].push({ name: "全国锦标赛", base: 90, pts: 1800, req: 800, max: 24, prize: 30000 });
    cal[3].push({ name: "世锦赛", base: 120, pts: 5000, req: 4000, max: 24, prize: 50000 });
    if (game.year % 4 === OLYMPIC_BASE_YEAR % 4) {
      cal[2].push({ name: "冬季奥运会", base: 140, pts: 12000, req: 10000, max: 30, prize: 150000 });
    }
    const regularEvents = [
        { m: 10, name: "大奖赛·北美站", req: 2500, pts: 1200 },
        { m: 11, name: "大奖赛·日本站", req: 3000, pts: 1200 },
        { m: 11, name: "大奖赛·总决赛", req: 6000, pts: 3000 },
    ];
    regularEvents.forEach(e => cal[e.m].push({ name: e.name, base: 70, pts: e.pts, req: e.req, max: 12, prize: 10000 }));
    for (let m = 1; m <= 12; m++) {
        if (cal[m].length === 0) {
            cal[m].push({ name: `${CITIES[m % CITIES.length]} 挑战赛`, base: 35, pts: 600, req: 0, max: 12, prize: 2000 });
        }
    }
    return cal;
  }, [game.year]);

  useEffect(() => { localStorage.setItem('FS_MANAGER_V11_PRO', JSON.stringify(game)); }, [game]);

  const calculateWeeklyStats = useCallback((currentSchedule: TrainingTaskType[], startSta: number, currentCoach: Coach, skaterAge: number) => {
    let tempSta = startSta;
    let gains: Record<string, number> = { jump: 0, spin: 0, step: 0, perf: 0, endurance: 0 };
    let artPlanPoints = 0; 

    const ageMod = skaterAge < 18 ? 1.3 : (skaterAge <= 23 ? 1.0 : 0.6);

    for (const taskId of currentSchedule) {
      const task = TRAINING_TASKS[taskId];
      
      let efficiency = 1.0;
      if (tempSta <= 0) efficiency = 0;
      else if (tempSta < 20) efficiency = 0.3;

      if (task.targetAttr) {
        // TEC mod for jump/spin/step/endurance? ART mod for perf/step?
        // Simplifying: TecMod applies to Jump/Spin/Endurance, ArtMod to Perf, Mixed to Step
        let coachMod = 1.0;
        if (['jump', 'spin', 'endurance'].includes(task.targetAttr)) coachMod = currentCoach.tecMod;
        else if (task.targetAttr === 'perf') coachMod = currentCoach.artMod;
        else if (task.targetAttr === 'step') coachMod = (currentCoach.tecMod + currentCoach.artMod) / 2;

        gains[task.targetAttr] += task.baseGain * coachMod * ageMod * efficiency;
      }
      
      if (task.targetAttr === 'perf' || task.targetAttr === 'step') artPlanPoints += task.baseGain; 

      tempSta = clamp(tempSta - task.staCost, 0, 100);
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
      
      // Calculate growth based on schedule
      const { finalSta, gains, artPlanPoints } = calculateWeeklyStats(prev.schedule, prev.skater.sta, currentCoach, prev.skater.age);

      // Apply growth to attributes
      const currentAttrs = { ...prev.skater.attributes! };
      const attrKeys = Object.keys(currentAttrs) as (keyof PlayerAttributes)[];
      
      attrKeys.forEach(k => {
        const rawGain = gains[k] || 0;
        const gain = clamp(randNormal(rawGain, 0.1), 0, 3.0);
        currentAttrs[k] = clamp(currentAttrs[k] + gain, 0, 100);
      });

      const derived = calcDerivedStats(currentAttrs);

      const updatedInventory = prev.inventory.map(item => ({ ...item, lifespan: item.lifespan - 1 }));
      const remainingInventory = updatedInventory.filter(item => item.lifespan > 0);

      // Apply Equipment Bonus to derived stats (Equipment still targets TEC/ART globally for now or I'd need to refactor Equipment too. Let's keep Equipment adding to global TEC/ART on top of derived for simplicity, OR distribute equip bonus. 
      // User said "Update attributes refactoring", implying deep change.
      // But Equipment interface has tecBonus/artBonus.
      // Let's apply Equipment bonus to the *derived* totals.
      let equipTec = 0, equipArt = 0;
      remainingInventory.forEach(eq => { equipTec += eq.tecBonus; equipArt += eq.artBonus; });

      let updatedSkater = { ...prev.skater, 
        attributes: currentAttrs,
        tec: clamp(derived.tec + equipTec, 0, 100), 
        art: clamp(derived.art + equipArt, 0, 100),
        sta: finalSta,
        age: prev.skater.age + 0.083,
        activeProgram: { 
          ...prev.skater.activeProgram, 
          // Adjust freshness based on intensity of art training roughly
          freshness: clamp(prev.skater.activeProgram.freshness + (artPlanPoints * 2.0) - 5.0, 0, 100) 
        }
      };

      if (prev.month === 12) {
        updatedSkater.pointsLast = updatedSkater.pointsCurrent;
        updatedSkater.pointsCurrent = 0;
      }
      updatedSkater.rolling = calculateRolling(updatedSkater);

      const aiSkaters = prev.aiSkaters.map(ai => {
        let aiUp = { ...ai, age: ai.age + 0.083 };
        if (aiUp.injuryMonths > 0) aiUp.injuryMonths -= 1;
        if (prev.month === 12) { aiUp.pointsLast = aiUp.pointsCurrent; aiUp.pointsCurrent = 0; }
        
        const currentMonthEvents = [...(seasonCalendar[prev.month] || [])].sort((a,b) => b.pts - a.pts);
        const targetEvent = currentMonthEvents.find(ev => (aiUp.rolling || 0) >= ev.req);
        
        if (targetEvent && aiUp.injuryMonths === 0) {
            const baseProb = aiUp.rolling! > 5000 ? 0.95 : 0.65;
            if (Math.random() < baseProb) {
                const totalStat = aiUp.tec + aiUp.art;
                const skillFactor = clamp((200 - totalStat) / 200, 0, 1);
                const biasedMean = (targetEvent.max * skillFactor * 0.7) + 1;
                const rank = clamp(Math.floor(randNormal(biasedMean, targetEvent.max * 0.15)), 1, targetEvent.max);
                aiUp.pointsCurrent += Math.floor(targetEvent.pts / (rank * 0.4 + 0.6));
            }
        }
        aiUp.tec = clamp(aiUp.tec + (aiUp.age < 23 ? 0.15 : 0.05), 0, 100);
        aiUp.art = clamp(aiUp.art + (aiUp.age < 23 ? 0.15 : 0.05), 0, 100);
        aiUp.rolling = calculateRolling(aiUp);

        const shouldRetire = (aiUp.age > 33) || (aiUp.age > 28 && Math.random() < 0.05);
        if (shouldRetire) {
          const newAi = {
            id: `ai_${Date.now()}_${Math.random()}`,
            name: SURNAME[Math.floor(Math.random() * SURNAME.length)] + GIVEN[Math.floor(Math.random() * GIVEN.length)],
            age: 14 + Math.random() * 2,
            tec: 25 + Math.random() * 15,
            art: 25 + Math.random() * 15,
            sta: 100, isPlayer: false, retired: false,
            pointsLast: 0, pointsCurrent: 0, rolling: 0, titles: [], honors: [], pQual: 1, pAge: 0, injuryMonths: 0,
            activeProgram: { name: "Gen Program", baseArt: 35, freshness: 100 }
          };
          return { ...newAi, rolling: calculateRolling(newAi) };
        }
        return aiUp;
      });

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
        // Event effect still targets tec/art directly. Let's distribute it to attributes if possible or just keep global bonus?
        // For simplicity, let's say events affect specific attributes slightly or just rely on derived recalc.
        // Actually, let's apply event effect to Jump/Perf as proxy for Tec/Art.
        if (e.tec) updatedSkater.attributes!.jump = clamp(updatedSkater.attributes!.jump + e.tec, 0, 100);
        if (e.art) updatedSkater.attributes!.perf = clamp(updatedSkater.attributes!.perf + e.art, 0, 100);
        if (e.sta) updatedSkater.sta = clamp(updatedSkater.sta + e.sta, 0, 100);
        
        // Recalc after event
        const d = calcDerivedStats(updatedSkater.attributes!);
        updatedSkater.tec = clamp(d.tec + equipTec, 0, 100);
        updatedSkater.art = clamp(d.art + equipArt, 0, 100);
      }

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

      // Calculate last growth for display (derived)
      const tecGain = updatedSkater.tec - prev.skater.tec;
      const artGain = updatedSkater.art - prev.skater.art;

      return { 
        ...prev, year: ny, month: nm, 
        money: prev.money - currentCoach.salary + sponsorIncome + moneyBonus, 
        fame: Math.max(0, prev.fame + fameBonus), 
        skater: updatedSkater, aiSkaters, activeSponsor: updatedSponsor, 
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
        // Recalc stats with new item
        const newInv = [...prev.inventory, { ...item, owned: true }];
        let equipTec = 0, equipArt = 0;
        newInv.forEach(eq => { if(eq.lifespan > 0) { equipTec += eq.tecBonus; equipArt += eq.artBonus; }});
        const d = calcDerivedStats(prev.skater.attributes!);
        
        return { 
            ...prev, 
            money: prev.money - item.price, 
            inventory: newInv,
            skater: { 
                ...prev.skater, 
                tec: clamp(d.tec + equipTec, 0, 100), 
                art: clamp(d.art + equipArt, 0, 100) 
            } 
        };
    });
    addLog(`购入器材: ${item.name}`, 'shop');
  };

  const [showMatch, setShowMatch] = useState<{ event: GameEvent, idx: number } | null>(null);

  const statsPreview = useMemo(() => {
    const currentCoach = game.market.coaches.find(c => c.id === game.activeCoachId) || game.market.coaches[0];
    return calculateWeeklyStats(game.schedule, game.skater.sta, currentCoach, game.skater.age);
  }, [game.schedule, game.skater.sta, game.activeCoachId, game.skater.age, calculateWeeklyStats]);

  const radarData = useMemo(() => {
    if (!game.skater.attributes) return [];
    return [
      { subject: '爆发 JUMP', A: game.skater.attributes.jump, fullMark: 100 },
      { subject: '表现 PERF', A: game.skater.attributes.perf, fullMark: 100 },
      { subject: '耐力 END', A: game.skater.attributes.endurance, fullMark: 100 },
      { subject: '步法 STEP', A: game.skater.attributes.step, fullMark: 100 },
      { subject: '旋转 SPIN', A: game.skater.attributes.spin, fullMark: 100 },
    ];
  }, [game.skater.attributes]);

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
              {game.skater.attributes && (
                <div className="grid grid-cols-5 gap-2 mb-2">
                   {[
                     { label: 'JUMP', val: game.skater.attributes.jump, color: 'text-red-400', border: 'border-red-500/20', bg: 'bg-red-500/5' },
                     { label: 'SPIN', val: game.skater.attributes.spin, color: 'text-indigo-400', border: 'border-indigo-500/20', bg: 'bg-indigo-500/5' },
                     { label: 'STEP', val: game.skater.attributes.step, color: 'text-cyan-400', border: 'border-cyan-500/20', bg: 'bg-cyan-500/5' },
                     { label: 'PERF', val: game.skater.attributes.perf, color: 'text-purple-400', border: 'border-purple-500/20', bg: 'bg-purple-500/5' },
                     { label: 'END', val: game.skater.attributes.endurance, color: 'text-amber-400', border: 'border-amber-500/20', bg: 'bg-amber-500/5' },
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
                              <div className="flex gap-4 mt-2">
                                {item.tecBonus > 0 && <span className="text-[8px] font-black text-blue-400">TEC +{item.tecBonus}</span>}
                                {item.artBonus > 0 && <span className="text-[8px] font-black text-purple-400">ART +{item.artBonus}</span>}
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

                {careerSubTab === 'honors' && (
                  <div className="bg-slate-900 border border-slate-800 rounded-[2.5rem] overflow-hidden shadow-2xl">
                    <div className="p-6 bg-slate-800/30 border-b border-slate-800 flex justify-between items-center">
                       <h3 className="text-xs font-black uppercase text-white tracking-widest">生涯荣誉记录簿</h3>
                       <span className="text-[10px] text-slate-500 italic">仅记录重大赛事前三及常规赛冠军</span>
                    </div>
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-800/50 text-[10px] font-black uppercase text-slate-500 tracking-widest">
                          <th className="px-8 py-6">年份/月</th>
                          <th className="px-8 py-6">赛事全称</th>
                          <th className="px-8 py-6">名次成绩</th>
                          <th className="px-8 py-6 text-right">获得积分</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/50">
                        {game.skater.honors.slice().reverse().map((h, i) => (
                          <tr key={i} className="hover:bg-slate-800/30 transition-all group">
                            <td className="px-8 py-5 text-sm font-mono text-slate-400 group-hover:text-white transition-colors">{h.year}.{h.month}</td>
                            <td className="px-8 py-5 text-sm font-bold text-white italic tracking-tight">{h.eventName}</td>
                            <td className="px-8 py-5">
                               <span className={`text-[9px] font-black uppercase px-3 py-1 rounded-lg ${h.rank === 1 ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/30' : h.rank === 2 ? 'bg-slate-300 text-slate-900' : h.rank === 3 ? 'bg-orange-800 text-white' : 'bg-slate-800 text-slate-400'}`}>
                                 {h.rank === 1 ? '🥇 Winner' : h.rank === 2 ? '🥈 Silver' : h.rank === 3 ? '🥉 Bronze' : `Rank ${h.rank}`}
                               </span>
                            </td>
                            <td className="px-8 py-5 text-right font-mono font-black text-blue-400 text-sm">+{h.points.toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {game.skater.honors.length === 0 && (
                       <div className="py-32 text-center opacity-30 italic text-sm">记录薄上一片空白，等待你的首枚奖牌...</div>
                    )}
                  </div>
                )}

                {careerSubTab === 'stats' && (
                  <div className="space-y-6">
                    <div className="bg-slate-900 border border-slate-800 p-10 rounded-[3rem] shadow-2xl">
                      <h3 className="text-xs font-black uppercase text-slate-500 mb-8 tracking-widest">能力演化轨迹 (保留两位小数)</h3>
                      <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={game.history}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                            <XAxis dataKey="month" stroke="#475569" fontSize={9} axisLine={false} tickLine={false} />
                            <YAxis stroke="#475569" fontSize={9} axisLine={false} tickLine={false} domain={[0, 100]} />
                            <Tooltip 
                               formatter={(v: any) => Number(v).toFixed(2)}
                               contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '16px' }} 
                            />
                            <Legend />
                            <Area type="monotone" dataKey="tec" name="技术能力 (TEC)" stroke="#3b82f6" strokeWidth={3} fill="#3b82f622" dot={false} />
                            <Area type="monotone" dataKey="art" name="艺术感悟 (ART)" stroke="#a855f7" strokeWidth={3} fill="#a855f722" dot={false} />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    <div className="bg-slate-900 border border-slate-800 p-10 rounded-[3rem] shadow-2xl">
                      <h3 className="text-xs font-black uppercase text-slate-500 mb-8 tracking-widest">商业价值趋势 (ISU积分 / 核心名望)</h3>
                      <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={game.history}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                            <XAxis dataKey="month" stroke="#475569" fontSize={9} axisLine={false} tickLine={false} />
                            <YAxis yAxisId="left" stroke="#3b82f6" fontSize={9} axisLine={false} tickLine={false} />
                            <YAxis yAxisId="right" orientation="right" stroke="#f59e0b" fontSize={9} axisLine={false} tickLine={false} />
                            <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '16px' }} />
                            <Legend />
                            <Area yAxisId="left" type="stepAfter" dataKey="rank" name="世界排名总分" stroke="#3b82f6" strokeWidth={2} fill="#3b82f611" dot={false} />
                            <Area yAxisId="right" type="monotone" dataKey="fame" name="公众影响力" stroke="#f59e0b" strokeWidth={2} fill="#f59e0b11" dot={false} />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
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
        <div className="fixed inset-0 z-[200] bg-slate-950/95 backdrop-blur-2xl flex items-center justify-center p-8 animate-in fade-in duration-500"><div className="max-w-lg w-full bg-slate-900 border border-slate-800 rounded-[3rem] p-12 shadow-2xl relative overflow-hidden"><div className={`absolute top-0 left-0 w-full h-1.5 ${game.activeEvent.event.type === 'positive' ? 'bg-emerald-500' : game.activeEvent.event.type === 'negative' ? 'bg-red-500' : 'bg-blue-500'}`}></div><h2 className="text-3xl font-black text-white italic mb-6 uppercase tracking-tighter text-center">{game.activeEvent.event.name}</h2><div className="bg-slate-950/50 p-8 rounded-[2rem] mb-8 text-left italic text-slate-300 font-serif text-sm leading-relaxed border border-slate-800">"{game.activeEvent.narrative}"</div><div className="mb-10 space-y-3"><p className="text-[10px] font-black text-slate-500 uppercase tracking-widest text-center mb-4">属性变动</p><div className="grid grid-cols-2 gap-3">{Object.entries(game.activeEvent.event.effect).map(([key, val]) => { if (val === 0) return null; const labelMap: any = { tec: 'TEC', art: 'ART', sta: 'STA', money: '资金', fame: '名望', injuryMonths: '伤病' }; const isPositive = (val as number) > 0; return ( <div key={key} className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 flex justify-between items-center"><span className="text-[10px] font-bold text-slate-400">{labelMap[key] || key}</span><span className={`font-black text-xs ${isPositive ? 'text-emerald-400' : 'text-red-400'}`}>{(val as number) > 0 ? '+' : ''}{val}</span></div> ); })}</div></div><button onClick={() => setGame(prev => ({ ...prev, activeEvent: null }))} className="w-full bg-white text-slate-950 py-5 rounded-2xl font-black text-xl active:scale-95 transition-all shadow-xl uppercase tracking-tighter">确认</button></div></div>
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
            
            // Endurance reduces STA consumption
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
  const [currentIdx, setCurrentIdx] = useState(0);
  const [participants, setParticipants] = useState<any[]>([]);
  const [commentary, setCommentary] = useState<string>("广播中：下一位选手请进入场地...");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isAutoMode, setIsAutoMode] = useState(false);
  const [fastSim, setFastSim] = useState(false);
  const [lastScoreDetail, setLastScoreDetail] = useState<{tes: number, pcs: number, fail: boolean} | null>(null);

  useEffect(() => {
    const pool = aiSkaters
        .filter(ai => (ai.rolling || 0) >= event.req * 0.8 && ai.injuryMonths === 0)
        .sort((a,b) => (b.rolling || 0) - (a.rolling || 0))
        .slice(0, event.max - 1);
    const pList = [...pool, { ...skater, isPlayer: true }]
      .map(p => ({ ...p, score: 0 }))
      .sort(() => 0.5 - Math.random());
    setParticipants(pList);
    setCurrentIdx(0);
    setIsProcessing(false);
  }, []);

  const runTurn = useCallback(async (risk: number) => {
    if (isProcessing) return;
    const p = participants[currentIdx];
    if (!p) return;
    setIsProcessing(true);
    let finalScore = 0;
    
    if (p.isPlayer) {
      const freshnessMod = Math.max(0.4, p.activeProgram.freshness / 100);
      
      // Endurance reduces fatigue impact
      const enduranceBonus = p.attributes ? (p.attributes.endurance * 0.05) : 0;
      const staFactor = Math.min(1.0, 0.92 + (p.sta / 100) * 0.08 + (enduranceBonus / 100));
      
      const failChance = clamp(risk * 50 - p.tec * 0.4, 5, 95);
      const isFail = Math.random() * 100 < failChance;
      
      const tes = (event.base + risk * 30) + (p.tec * 0.9) + (Math.random() * 15);
      const pcs = (p.art * 1.1 + (p.activeProgram?.baseArt || 30)) * freshnessMod;
      
      finalScore = ((tes * (isFail ? 0.6 : 1.0)) + pcs) * staFactor;
      setLastScoreDetail({ tes: tes * (isFail ? 0.6 : 1.0) * staFactor, pcs: pcs * staFactor, fail: isFail });
    } else {
      finalScore = (event.base + (p.tec * 0.85) + (p.art * 0.75) + Math.random() * 15) * (0.95 + Math.random() * 0.05);
    }
    
    const updated = [...participants]; 
    updated[currentIdx].score = finalScore;
    setParticipants(updated);
    setIsProcessing(false);
    
    if (currentIdx < participants.length - 1) {
      setCurrentIdx(prev => prev + 1);
    } else {
      const sortedRes = [...updated].sort((a,b) => b.score - a.score);
      const pRank = sortedRes.findIndex(r => r.isPlayer) + 1;
      setCommentary(generateLocalCommentary(pRank));
      setStage('results');
    }
  }, [currentIdx, participants, isProcessing, event.base, skater.activeProgram.freshness]);

  const instantCompleteAI = () => {
    const updated = [...participants];
    for (let i = currentIdx; i < updated.length; i++) {
      const p = updated[i];
      if (p.isPlayer && p.score === 0) {
          setCurrentIdx(i);
          return;
      }
      if (p.score === 0) {
        p.score = (event.base + (p.tec * 0.85) + (p.art * 0.75) + Math.random() * 15) * (0.95 + Math.random() * 0.05);
      }
    }
    const sortedRes = [...updated].sort((a,b) => b.score - a.score);
    const pRank = sortedRes.findIndex(r => r.isPlayer) + 1;
    setParticipants(updated);
    setCommentary(generateLocalCommentary(pRank));
    setStage('results');
  };

  useEffect(() => {
    if (stage === 'active' && participants[currentIdx] && !participants[currentIdx].isPlayer && !isProcessing && isAutoMode) {
      const delay = fastSim ? 50 : 500;
      const timer = setTimeout(() => runTurn(1.0), delay);
      return () => clearTimeout(timer);
    }
  }, [stage, currentIdx, isProcessing, isAutoMode, fastSim, runTurn]);

  const sorted = [...participants].sort((a,b) => b.score - a.score);
  const playerRank = sorted.findIndex(r => r.isPlayer) + 1;

  return (
    <div className="fixed inset-0 z-[100] bg-slate-950/98 backdrop-blur-3xl flex items-center justify-center p-8 animate-in fade-in duration-500 overflow-hidden text-slate-200 font-sans">
      <div className="max-w-6xl w-full grid grid-cols-1 lg:grid-cols-3 gap-8 h-full max-h-[85vh]">
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-[3rem] p-12 shadow-2xl relative flex flex-col overflow-hidden">
          <p className="text-[10px] font-black uppercase text-slate-500 mb-6 tracking-[0.6em] shrink-0 text-center">{event.name}</p>
          <div className="flex-1 flex flex-col justify-center items-center overflow-y-auto px-4 py-2 custom-scrollbar">
            {stage === 'intro' && (
              <div className="text-center animate-in zoom-in duration-500">
                <h2 className="text-6xl font-black text-white italic mb-12 tracking-tighter uppercase">入冰仪式</h2>
                <div className="flex gap-4 justify-center">
                    <button onClick={() => setStage('active')} className="bg-blue-600 hover:bg-blue-500 px-24 py-6 rounded-2xl font-black text-2xl shadow-2xl transition-all active:scale-95 text-white">开始热身</button>
                    <button onClick={() => { setStage('active'); setFastSim(true); setIsAutoMode(true); }} className="bg-slate-800 hover:bg-slate-700 px-10 py-6 rounded-2xl font-black text-sm uppercase tracking-widest text-slate-400">快速过场</button>
                </div>
              </div>
            )}
            {stage === 'active' && participants[currentIdx] && (
              <div className="animate-in fade-in duration-300 w-full flex flex-col items-center">
                <h3 className="text-5xl font-black text-white italic tracking-tighter mb-4">{participants[currentIdx].name}</h3>
                <p className="text-blue-500 font-black uppercase text-xs tracking-widest mb-10 italic">{participants[currentIdx].isPlayer ? '正在展现表演 - 请选择策略' : '正在展现表演 - 裁判观察中'}</p>
                {participants[currentIdx].isPlayer ? (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full max-w-2xl">
                    {[ {r: 0.8, l: "保守发挥", d: "低风险 / 稳定"}, {r: 1.3, l: "标准发挥", d: "均衡 / 全力"}, {r: 2.2, l: "挑战自我", d: "极限 / 冲击"} ].map(b => (
                      <button key={b.l} disabled={isProcessing} onClick={() => runTurn(b.r)} className="bg-slate-950 border-2 border-slate-800 p-8 rounded-3xl hover:border-blue-500 hover:scale-105 transition-all shadow-xl group text-left">
                        <p className="text-lg font-black text-blue-400 group-hover:text-blue-300 mb-1">{b.l}</p>
                        <p className="text-[8px] text-slate-600 font-bold uppercase">{b.d}</p>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="py-20 flex flex-col items-center">
                    <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-8"></div>
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest animate-pulse">{fastSim ? '极速评分中...' : '正在打分...'}</p>
                  </div>
                )}
              </div>
            )}
            {stage === 'results' && (
              <div className="text-center animate-in zoom-in duration-700 w-full">
                <div className="inline-block p-1 bg-gradient-to-tr from-amber-500 to-amber-200 rounded-3xl mb-8">
                  <div className="bg-slate-900 px-16 py-8 rounded-[1.4rem]">
                    <h2 className="text-9xl font-black italic text-white tracking-tighter">#{playerRank}</h2>
                  </div>
                </div>
                
                {lastScoreDetail && (
                  <div className="grid grid-cols-2 gap-4 max-w-md mx-auto mb-8 animate-in slide-in-from-bottom-4 duration-1000">
                    <div className="bg-slate-950 p-6 rounded-2xl border border-blue-500/20">
                      <p className="text-[10px] text-slate-500 font-black uppercase mb-1">技术分 (TES)</p>
                      <p className={`text-2xl font-black ${lastScoreDetail.fail ? 'text-red-400' : 'text-blue-400'}`}>
                        {lastScoreDetail.tes.toFixed(2)}
                        {lastScoreDetail.fail && <span className="text-[10px] block font-bold">FALL DETECTED</span>}
                      </p>
                    </div>
                    <div className="bg-slate-950 p-6 rounded-2xl border border-purple-500/20">
                      <p className="text-[10px] text-slate-500 font-black uppercase mb-1">内容分 (PCS)</p>
                      <p className="text-2xl font-black text-purple-400">{lastScoreDetail.pcs.toFixed(2)}</p>
                    </div>
                  </div>
                )}

                <div className="bg-slate-950 p-8 rounded-3xl border border-slate-800 mb-10 text-slate-300 font-serif italic max-w-xl mx-auto shadow-2xl relative">"{commentary}"</div>
                <button onClick={() => onClose(sorted)} className="bg-white text-slate-950 px-24 py-6 rounded-2xl font-black text-xl hover:scale-105 active:scale-95 transition-all shadow-xl uppercase tracking-tighter">确认排名</button>
              </div>
            )}
          </div>
        </div>
        <div className="bg-slate-900/50 border border-slate-800 rounded-[3rem] p-10 flex flex-col shadow-2xl overflow-hidden h-full">
          <div className="flex flex-col gap-2 border-b border-slate-800 pb-5 mb-8">
            <div className="flex justify-between items-center">
                <h3 className="text-[10px] font-black uppercase text-slate-500 tracking-[0.4em]">实时积分榜</h3>
                <button onClick={() => { setIsAutoMode(!isAutoMode); if(!isAutoMode) setFastSim(false); }} className={`text-[8px] px-3 py-1.5 rounded-lg font-black uppercase tracking-widest transition-all ${isAutoMode && !fastSim ? 'bg-blue-600 text-white shadow-lg' : 'bg-slate-800 text-slate-500 hover:text-slate-300'}`}>⏯ 自动模式</button>
            </div>
            <div className="flex gap-2">
                <button onClick={() => { setFastSim(!fastSim); setIsAutoMode(true); }} className={`flex-1 text-[8px] py-2 rounded-lg font-black uppercase tracking-widest transition-all ${fastSim ? 'bg-amber-500 text-black shadow-lg' : 'bg-slate-800 text-slate-500'}`}>{fastSim ? '⚡ 极速模式' : '⚡ 开启极速'}</button>
                <button onClick={instantCompleteAI} className="flex-1 text-[8px] py-2 rounded-lg font-black uppercase tracking-widest bg-red-600/10 text-red-500 border border-red-600/20 hover:bg-red-600 hover:text-white transition-all">⏩ 跳过等待</button>
            </div>
          </div>
          <div className="flex-1 space-y-3 overflow-y-auto pr-2 custom-scrollbar">
            {participants.filter(p => p.score > 0).sort((a,b) => b.score - a.score).map((p, i) => (
              <div key={i} className={`flex justify-between items-center p-5 rounded-2xl border transition-all animate-in slide-in-from-top-2 duration-300 ${p.isPlayer ? 'bg-blue-600/20 border-blue-500 shadow-lg' : 'bg-slate-950 border-slate-800'}`}>
                <div className="flex items-center gap-4"><span className="text-[10px] font-black text-slate-600 w-5">{i+1}.</span><span className={`text-xs font-bold ${p.isPlayer ? 'text-blue-400 font-black' : 'text-slate-300'}`}>{p.name}</span></div>
                <span className="font-mono text-xs text-white font-black italic">{p.score.toFixed(2)}</span>
              </div>
            ))}
            {participants.filter(p => p.score === 0).length > 0 && (
                <p className="text-[8px] text-slate-600 text-center uppercase tracking-widest py-4">还有 {participants.filter(p => p.score === 0).length} 位选手等待出场</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
