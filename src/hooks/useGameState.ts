import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { GameState, LogEntry, LogType, GameEvent, Equipment, Sponsorship, TrainingTaskType, PlayerAttributes, Skater, Coach } from '../types';
import { clamp, randNormal } from '../utils/math';
import { STORAGE_KEY, MATCH_STAMINA_COST, OLYMPIC_BASE_YEAR } from '../game/config';
import { RANDOM_EVENTS } from '../game/data/events';
import { CITIES } from '../game/data/equipment';
import { LOADING_QUOTES } from '../data/text';
import { calculateWeeklyStats } from '../game/training';
import { calculateRolling, calcDerivedStats, getTotalAttributes } from '../game/ranking';
import { generateInitialAI } from '../game/ai';
import { generateSponsorshipOptions, generateRenewalOptions, generateMarket } from '../game/economy';
import { generateLocalNarrative } from '../game/events';
import { simulateAIProgram } from '../game/match';
import { SURNAME, GIVEN } from '../game/data/equipment';

const INITIAL_SKATER: Skater = {
  id: 'player_1', name: "未命名选手", age: 14.1, tec: 40.0, art: 35.0, sta: 100.0,
  attributes: { jump: 40, spin: 40, step: 40, perf: 30, endurance: 30 },
  pointsCurrent: 0, pointsLast: 0, rolling: 0, titles: [], honors: [], pQual: 1.0, pAge: 0,
  injuryMonths: 0, isPlayer: true, retired: false,
  activeProgram: { name: "基础短节目", baseArt: 30, freshness: 100 }
};

const DEFAULT_SCHEDULE: TrainingTaskType[] = ['rest', 'rest', 'rest', 'rest', 'rest', 'rest', 'rest'];

export function useGameState() {
  const [game, setGame] = useState<GameState>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
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
  const [showSponsorshipModal, setShowSponsorshipModal] = useState(false);
  const [sponsorshipModalMode, setSponsorshipModalMode] = useState<'selection' | 'expired'>('selection');
  const [sponsorshipRenewalOptions, setSponsorshipRenewalOptions] = useState<Sponsorship[]>([]);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [activeTab, setActiveTab] = useState<'event' | 'development' | 'ranking' | 'career'>('event');
  const [devSubTab, setDevSubTab] = useState<'train' | 'coach' | 'equip' | 'choreo'>('train');
  const [careerSubTab, setCareerSubTab] = useState<'profile' | 'honors' | 'stats'>('profile');
  const [draggedTask, setDraggedTask] = useState<TrainingTaskType | null>(null);
  const [showMatch, setShowMatch] = useState<{ event: GameEvent, idx: number } | null>(null);
  const previousSponsorRef = useRef<Sponsorship | null>(null);

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

  useEffect(() => { localStorage.setItem(STORAGE_KEY, JSON.stringify(game)); }, [game]);

  const seasonCalendar = useMemo(() => {
    const cal: Record<number, GameEvent[]> = {};
    for (let m = 1; m <= 12; m++) cal[m] = [];
    cal[12].push({ name: "全国锦标赛", base: 90, pts: 840, req: 600, max: 24, prize: 30000, template: 'mid' });
    cal[3].push({ name: "世锦赛", base: 120, pts: 1200, req: 1500, max: 24, prize: 50000, template: 'high' });
    if (game.year % 4 === OLYMPIC_BASE_YEAR % 4) {
      cal[2].push({ name: "冬季奥运会", base: 140, pts: 1200, req: 2500, max: 30, prize: 150000, template: 'high' });
    }
    const regularEvents = [
      { m: 10, name: "大奖赛·北美站", req: 1000, pts: 400 },
      { m: 11, name: "大奖赛·日本站", req: 1200, pts: 400 },
      { m: 11, name: "大奖赛·总决赛", req: 2000, pts: 800 },
    ];
    regularEvents.forEach(e => cal[e.m].push({ name: e.name, base: 70, pts: e.pts, req: e.req, max: 12, prize: 10000, template: e.m === 11 && e.name.includes("总决赛") ? 'high' : 'mid' }));
    for (let m = 1; m <= 12; m++) {
      if (cal[m].length === 0) {
        cal[m].push({ name: `${CITIES[m % CITIES.length]} 挑战赛`, base: 35, pts: 300, req: 0, max: 12, prize: 2000, template: 'low' });
      }
    }
    return cal;
  }, [game.year]);

  const statsPreview = useMemo(() => {
    const currentCoach = game.market.coaches.find(c => c.id === game.activeCoachId) || game.market.coaches[0];
    return calculateWeeklyStats(game.schedule, game.skater.sta, currentCoach, game.skater.age, game.skater.attributes!.endurance);
  }, [game.schedule, game.skater.sta, game.activeCoachId, game.skater.age, game.skater.attributes]);

  const displayAttributes = useMemo(() => {
    if (!game.skater.attributes) return null;
    return getTotalAttributes(game.skater.attributes, game.inventory);
  }, [game.skater.attributes, game.inventory]);

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

  const handleStartGame = () => {
    if (!newName.trim()) return alert("请输入选手名字");
    const updatedGame = { ...game, skater: { ...game.skater, name: newName.trim() } };
    setGame(updatedGame);
    setIsNaming(false);
  };

  const confirmResetGame = () => {
    localStorage.removeItem(STORAGE_KEY);
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

  const selectSponsor = (sp: Sponsorship) => {
    setGame(prev => ({ 
      ...prev, 
      activeSponsor: sp, 
      money: prev.money + sp.signingBonus + (sp.paymentType === 'lump-sum' ? (sp.totalPay || 0) : 0)
    }));
    setSponsorOptions([]);
    setShowSponsorshipModal(false);
    setSponsorshipRenewalOptions([]);
    addLog(`签约赞助: ${sp.name}`, 'sys');
  };

  const handleSponsorshipModalClose = (selectedSponsor?: Sponsorship) => {
    if (selectedSponsor) {
      selectSponsor(selectedSponsor);
    } else {
      setShowSponsorshipModal(false);
      setSponsorshipRenewalOptions([]);
    }
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
      
      let sponsorIncome = 0;
      if (prev.activeSponsor) {
        sponsorIncome = prev.activeSponsor.paymentType === 'monthly' ? (prev.activeSponsor.monthlyPay || 0) : 0;
      }
      let updatedSponsor = prev.activeSponsor ? { ...prev.activeSponsor, remainingMonths: prev.activeSponsor.remainingMonths - 1 } : null;
      if (updatedSponsor && updatedSponsor.remainingMonths <= 0) {
        updatedSponsor = null;
        setTimeout(() => addLog("赞助合约已到期", 'sys'), 200);
      }
      
      let triggeredEvent = null;
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

      // --- AI ECOSYSTEM LOGIC ---
      const aiCompetedIds = new Set<string>();
      let workingAiSkaters = prev.aiSkaters.map(ai => {
        let aiUp = { ...ai, age: ai.age + 0.083 };
        if (aiUp.injuryMonths > 0) aiUp.injuryMonths -= 1;
        
        aiUp.tec = clamp(aiUp.tec + (aiUp.age < 23 ? 0.15 : 0.05), 0, 100);
        aiUp.art = clamp(aiUp.art + (aiUp.age < 23 ? 0.15 : 0.05), 0, 100);
        
        if (prev.month === 12) { 
          aiUp.pointsLast = aiUp.pointsCurrent; 
          aiUp.pointsCurrent = 0; 
        }
        
        aiUp.rolling = calculateRolling(aiUp);

        const shouldRetire = (aiUp.age > 33) || (aiUp.age > 28 && Math.random() < 0.05);
        if (shouldRetire) {
          const newAiBaseStat = 35 + Math.random() * 20;
          const newAiStats = { jump: newAiBaseStat, spin: newAiBaseStat, step: newAiBaseStat, perf: newAiBaseStat, endurance: newAiBaseStat };
          const newAi: Skater = {
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

      const currentMonthEvents = seasonCalendar[prev.month] || [];
      const sortedEvents = [...currentMonthEvents].sort((a,b) => b.pts - a.pts);

      sortedEvents.forEach(ev => {
        let candidates = workingAiSkaters.filter(ai => 
          !aiCompetedIds.has(ai.id) && ai.injuryMonths === 0
        );

        if (ev.req > 0) {
          candidates = candidates.filter(ai => (ai.rolling || 0) >= ev.req);
        } else {
          const globalRanked = [...workingAiSkaters].sort((a,b) => (b.rolling || 0) - (a.rolling || 0));
          const eliteIds = new Set(globalRanked.slice(0, 50).map(s => s.id));
          candidates = candidates.filter(ai => !eliteIds.has(ai.id));
        }

        candidates.sort((a,b) => (b.rolling || 0) - (a.rolling || 0));
        const participants = candidates.slice(0, ev.max);
        participants.forEach(p => aiCompetedIds.add(p.id));

        const matchResults = participants.map(ai => ({
          ai,
          matchScore: simulateAIProgram(ai, ev.template)
        }));

        matchResults.sort((a,b) => b.matchScore - a.matchScore);

        matchResults.forEach((res, rankIdx) => {
          const rank = rankIdx + 1;
          const pts = Math.floor(ev.pts / (rank * 0.4 + 0.6));
          res.ai.pointsCurrent += pts;
        });
      });

      workingAiSkaters.forEach(ai => {
        ai.rolling = calculateRolling(ai);
      });

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

    setTimeout(() => {
      setGame(prev => {
        if (!prev.activeSponsor) {
          setSponsorshipModalMode('selection');
          setSponsorOptions(generateSponsorshipOptions(prev.fame));
          setShowSponsorshipModal(true);
        } else if (prev.activeSponsor.remainingMonths <= 0) {
          const renewalOpts = generateRenewalOptions(prev.activeSponsor);
          setSponsorshipRenewalOptions(renewalOpts);
          setSponsorshipModalMode('expired');
          setSponsorOptions(generateSponsorshipOptions(prev.fame));
          setShowSponsorshipModal(true);
        }
        return prev;
      });
    }, 100);
  };

  return {
    game, setGame,
    isNaming, setIsNaming, newName, setNewName,
    isProcessing, loadingQuote,
    showResetConfirm, setShowResetConfirm,
    sponsorOptions, showSponsorshipModal, sponsorshipModalMode, sponsorshipRenewalOptions,
    logs,
    activeTab, setActiveTab,
    devSubTab, setDevSubTab,
    careerSubTab, setCareerSubTab,
    draggedTask, setDraggedTask,
    showMatch, setShowMatch,
    seasonCalendar, statsPreview, displayAttributes, radarData,
    addLog,
    handleStartGame, confirmResetGame, selectSponsor, handleSponsorshipModalClose,
    buyItem, nextMonth,
    MATCH_STAMINA_COST,
  };
}
