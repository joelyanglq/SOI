import React, { useState, useEffect } from 'react';
import { GameEvent, Skater, PlayerAttributes, ProgramConfig, ConfigStrategy, ProgramElement, MatchPhaseType, SkaterTechnique, MatchAction } from '../types';
import { MATCH_STRUCTURES, PHASE_META, ACTION_LIBRARY, generateProgramConfig, getActionFromElement, calculateConfigTotalBV, calculateConfigAvgRisk, canPerformAction } from '../game/data/actions';
import { calculateActionScore, estimateSuccessRate } from '../game/scoring';
import { simulateAIProgram } from '../game/match';
import { generateLocalCommentary } from '../game/events';
import { getJumpKey } from '../game/data/technique';
import { getVariant, VARIANT_LIBRARY } from '../game/data/variants';
import { getStyleTag } from '../game/data/styleTags';
import { clamp } from '../utils/math';

interface MatchEngineProps {
  event: GameEvent;
  skater: Skater;
  aiSkaters: Skater[];
  onClose: (results: any[]) => void;
}

const MatchEngine: React.FC<MatchEngineProps> = ({ event, skater, aiSkaters, onClose }) => {
  const [stage, setStage] = useState<'intro' | 'config' | 'active' | 'results'>('intro');
  const [phaseIndex, setPhaseIndex] = useState(0);
  const [participants, setParticipants] = useState<any[]>([]);
  const [commentary, setCommentary] = useState<string>("广播中：下一位选手请进入场地...");
  const [isProcessing, setIsProcessing] = useState(false);
  const [playerMatchSta, setPlayerMatchSta] = useState(0);
  const [playerAccumulatedScore, setPlayerAccumulatedScore] = useState(0);
  const [history, setHistory] = useState<{name: string, score: number, desc: string, phaseName: string}[]>([]);

  const [programConfig, setProgramConfig] = useState<ProgramConfig>({ elements: [] });
  const [configStrategy, setConfigStrategy] = useState<ConfigStrategy>('balanced');
  const [selectedSlotIndex, setSelectedSlotIndex] = useState<number>(0);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [pendingQuickFinish, setPendingQuickFinish] = useState(false);

  const matchTemplate = MATCH_STRUCTURES[event.template] || MATCH_STRUCTURES['low'];
  const phases = matchTemplate.phases;

  useEffect(() => {
    if (programConfig.elements.length === 0 && skater.attributes) {
      const initialConfig = generateProgramConfig(skater.attributes, phases, 'balanced', skater.technique);
      setProgramConfig(initialConfig);
    }
  }, []);

  useEffect(() => {
    if (pendingQuickFinish && stage === 'active' && !isProcessing) {
      setPendingQuickFinish(false);
      executeAllActions();
    }
  }, [pendingQuickFinish, stage]);

  useEffect(() => {
    let pool = aiSkaters.filter(ai => ai.injuryMonths === 0);

    if (event.req === 0) {
      const globalRanked = [...pool].sort((a,b) => (b.rolling || 0) - (a.rolling || 0));
      pool = globalRanked.slice(50);
      pool.sort((a,b) => (b.rolling || 0) - (a.rolling || 0));
    } else {
      pool = pool.filter(ai => (ai.rolling || 0) >= event.req * 0.8);
      pool.sort((a,b) => (b.rolling || 0) - (a.rolling || 0));
    }

    const selectedAI = pool.slice(0, event.max - 1);

    const pList = [...selectedAI].map(ai => {
      const score = simulateAIProgram(ai, event.template);
      return { ...ai, score };
    });

    pList.push({ ...skater, isPlayer: true, score: 0 });

    setParticipants(pList);
    setPlayerMatchSta(skater.sta);
    setIsProcessing(false);
  }, []);

  const executeConfiguredAction = async () => {
    if (isProcessing) return;

    const currentElement = programConfig.elements[phaseIndex];
    const action = getActionFromElement(currentElement);

    if (!action) return;

    setIsProcessing(true);
    await new Promise(r => setTimeout(r, 800));

    const result = calculateActionScore(action, skater.attributes!, playerMatchSta, true, skater.technique, currentElement.variant);

    const nextSta = clamp(playerMatchSta - result.cost, 0, 100);
    const finalScore = result.score;

    setPlayerMatchSta(nextSta);
    setPlayerAccumulatedScore(prev => prev + finalScore);

    setHistory(prev => [...prev, {
      name: action.name,
      score: finalScore,
      desc: result.isFail ? `摔倒 (GOE -5)` : `GOE ${result.goe > 0 ? '+' : ''}${result.goe.toFixed(1)}`,
      phaseName: PHASE_META[action.type].name
    }]);

    if (phaseIndex < programConfig.elements.length - 1) {
      setPhaseIndex(prev => prev + 1);
      setIsProcessing(false);
    } else {
      finishMatch(playerAccumulatedScore + finalScore);
    }
  };

  const executeAllActions = async () => {
    if (isProcessing) return;
    setIsProcessing(true);

    let sta = playerMatchSta;
    let totalScore = playerAccumulatedScore;
    const newHistory: {name: string, score: number, desc: string, phaseName: string}[] = [];

    for (let i = phaseIndex; i < programConfig.elements.length; i++) {
      const element = programConfig.elements[i];
      const action = getActionFromElement(element);
      if (!action) continue;

      const result = calculateActionScore(action, skater.attributes!, sta, true, skater.technique, element.variant);
      const score = result.score;
      sta = clamp(sta - result.cost, 0, 100);
      totalScore += score;

      newHistory.push({
        name: action.name,
        score,
        desc: result.isFail ? `摔倒 (GOE -5)` : `GOE ${result.goe > 0 ? '+' : ''}${result.goe.toFixed(1)}`,
        phaseName: PHASE_META[action.type].name
      });
    }

    setPlayerMatchSta(sta);
    setPlayerAccumulatedScore(totalScore);
    setHistory(prev => [...prev, ...newHistory]);
    setPhaseIndex(programConfig.elements.length - 1);

    await new Promise(r => setTimeout(r, 600));
    finishMatch(totalScore);
  };

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const newElements = [...programConfig.elements];
    const draggedElement = newElements[draggedIndex];
    newElements.splice(draggedIndex, 1);
    newElements.splice(index, 0, draggedElement);

    setProgramConfig({ elements: newElements });
    setDraggedIndex(index);
    setConfigStrategy('custom');
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  // Get available variants for an action based on technique
  const getAvailableVariants = (action: MatchAction | undefined, technique?: SkaterTechnique) => {
    if (!action || !technique || !action.techReq) return [];
    const req = action.techReq;

    if (req.jumpType && req.rotation) {
      const card = technique.jumps[req.jumpType];
      if (!card || !card.variants) return [];
      return card.variants
        .map(vId => getVariant(vId))
        .filter((v): v is NonNullable<typeof v> => v !== undefined && v.category === 'jump');
    }

    if (req.spinType && req.spinLevel) {
      const card = technique.spins[req.spinType];
      if (!card || !card.variants) return [];
      return card.variants
        .map(vId => getVariant(vId))
        .filter((v): v is NonNullable<typeof v> => v !== undefined && v.category === 'spin');
    }

    return [];
  };

  // Toggle variant on a program element
  const toggleVariant = (elementIdx: number, variantId: string | undefined) => {
    const newElements = [...programConfig.elements];
    newElements[elementIdx] = { ...newElements[elementIdx], variant: variantId };
    setProgramConfig({ elements: newElements });
    setConfigStrategy('custom');
  };

  // Get style tags for an action element
  const getElementStyleTags = (action: MatchAction | undefined, technique?: SkaterTechnique) => {
    if (!action || !technique || !action.techReq) return [];
    const req = action.techReq;

    let tags: string[] = [];
    if (req.jumpType && req.rotation) {
      tags = technique.jumps[req.jumpType]?.styleTags || [];
    } else if (req.spinType && req.spinLevel) {
      tags = technique.spins[req.spinType]?.styleTags || [];
    } else if (req.stepLevel) {
      tags = technique.steps?.styleTags || [];
    }

    return tags.map(tId => getStyleTag(tId)).filter((t): t is NonNullable<typeof t> => t !== undefined);
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
  const currentElement = stage === 'active' && programConfig.elements.length > phaseIndex
    ? programConfig.elements[phaseIndex]
    : programConfig.elements[0];
  const phaseMeta = currentElement ? PHASE_META[currentElement.phase] : PHASE_META['jump_solo'];

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
                <button onClick={() => setStage('config')} className="bg-blue-600 hover:bg-blue-500 px-24 py-6 rounded-2xl font-black text-2xl shadow-2xl transition-all active:scale-95 text-white">配置节目</button>
              </div>
            )}

            {stage === 'config' && skater.attributes && (() => {
              const selIdx = selectedSlotIndex;
              const selElement = programConfig.elements[selIdx];
              const selPhase = selElement?.phase;
              const poolActions = selPhase ? ACTION_LIBRARY.filter(a => a.type === selPhase) : [];

              // Estimation calculations
              const totalBV = calculateConfigTotalBV(programConfig);
              const totalCost = programConfig.elements.reduce((s, el) => {
                const a = getActionFromElement(el); return s + (a?.cost || 0);
              }, 0);
              const srs = programConfig.elements.map(el => {
                const a = getActionFromElement(el);
                return a ? estimateSuccessRate(a, skater.technique, el.variant) : 50;
              });
              const avgSR = srs.length > 0 ? Math.round(srs.reduce((a, b) => a + b, 0) / srs.length) : 0;
              const riskPct = 100 - avgSR;
              const lowEst = (totalBV * (avgSR / 100) * 0.9).toFixed(1);
              const highEst = (totalBV * Math.min(avgSR / 100 * 1.35 + 0.08, 1.5)).toFixed(1);

              return (
                <div className="flex-1 flex flex-col animate-in fade-in duration-300 overflow-hidden">
                  {/* Strategy Buttons */}
                  <div className="flex items-center gap-2 mb-3 shrink-0">
                    <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest mr-1">策略</span>
                    {([
                      { k: 'conservative' as ConfigStrategy, l: '🛡️ 保守' },
                      { k: 'balanced' as ConfigStrategy, l: '⚖️ 均衡' },
                      { k: 'aggressive' as ConfigStrategy, l: '⚡ 激进' },
                    ]).map(s => (
                      <button key={s.k} onClick={() => {
                        setConfigStrategy(s.k);
                        setProgramConfig(generateProgramConfig(skater.attributes!, phases, s.k, skater.technique));
                        setSelectedSlotIndex(0);
                      }} className={`px-4 py-1.5 rounded-lg text-[10px] font-black transition-all ${configStrategy === s.k ? 'bg-blue-600 text-white shadow-lg' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}>
                        {s.l}
                      </button>
                    ))}
                  </div>

                  {/* Two-Panel Layout */}
                  <div className="flex-1 grid grid-cols-5 gap-3 min-h-0 overflow-hidden">
                    {/* Left Panel: Action Pool */}
                    <div className="col-span-2 bg-slate-950 border border-slate-800 rounded-2xl p-3 flex flex-col overflow-hidden">
                      <div className="flex items-center gap-2 mb-2 shrink-0">
                        <span className="text-lg">{selPhase ? PHASE_META[selPhase].icon : '📋'}</span>
                        <div>
                          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">动作池</h3>
                          <p className="text-[9px] text-slate-600">{selPhase ? PHASE_META[selPhase].name : ''} · 点击选择</p>
                        </div>
                      </div>
                      <div className="flex-1 overflow-y-auto custom-scrollbar space-y-1">
                        {poolActions.map(action => {
                          const isAvail = skater.technique ? canPerformAction(skater.technique, action) : true;
                          const sr = estimateSuccessRate(action, skater.technique);
                          const isCur = selElement?.actionId === action.id;

                          if (!isAvail) return (
                            <div key={action.id} className="p-2 rounded-lg bg-slate-900/40 border border-slate-800/40 opacity-35">
                              <div className="flex items-center justify-between">
                                <span className="text-[10px] text-slate-500 truncate">{action.name}</span>
                                <span className="text-[9px] text-slate-600 font-mono">BV {action.baseScore.toFixed(1)}</span>
                              </div>
                              <span className="text-[8px] text-red-500/70">🔒 未解锁</span>
                            </div>
                          );

                          return (
                            <button key={action.id} onClick={() => {
                              const newEls = [...programConfig.elements];
                              newEls[selIdx] = { ...newEls[selIdx], actionId: action.id, variant: undefined };
                              setProgramConfig({ elements: newEls });
                              setConfigStrategy('custom');
                            }} className={`w-full text-left p-2.5 rounded-xl border transition-all ${isCur ? 'bg-blue-900/30 border-blue-500/60' : 'bg-slate-900 border-slate-800/60 hover:border-slate-600'}`}>
                              <div className="flex items-center justify-between mb-0.5">
                                <span className={`text-xs font-bold truncate ${isCur ? 'text-blue-300' : 'text-white'}`}>{action.name}</span>
                                {isCur && <span className="text-[8px] text-blue-400 font-black shrink-0 ml-1">✓</span>}
                              </div>
                              <div className="flex gap-3 text-[10px]">
                                <span className="text-blue-400 font-mono font-bold">BV {action.baseScore.toFixed(1)}</span>
                                <span className={`font-bold ${sr >= 80 ? 'text-emerald-400' : sr >= 50 ? 'text-amber-400' : 'text-red-400'}`}>成功 {sr}%</span>
                                <span className="text-slate-600">STA-{action.cost}</span>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Right Panel: Program Sequence */}
                    <div className="col-span-3 bg-slate-950 border border-slate-800 rounded-2xl p-3 flex flex-col overflow-hidden">
                      <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 shrink-0">节目编排 · 点击选中 · 拖拽排序</h3>
                      <div className="flex-1 overflow-y-auto custom-scrollbar space-y-1.5">
                        {programConfig.elements.map((element, idx) => {
                          const action = getActionFromElement(element);
                          const pMeta = PHASE_META[element.phase];
                          const isSel = idx === selIdx;
                          const sr = action ? estimateSuccessRate(action, skater.technique, element.variant) : 0;
                          const variants = getAvailableVariants(action, skater.technique);
                          const tags = getElementStyleTags(action, skater.technique);
                          const adjBV = action ? action.baseScore * (element.variant ? (getVariant(element.variant)?.bvMultiplier || 1) : 1) : 0;

                          return (
                            <div
                              key={idx}
                              draggable
                              onDragStart={() => handleDragStart(idx)}
                              onDragOver={(e) => handleDragOver(e, idx)}
                              onDragEnd={handleDragEnd}
                              onClick={() => setSelectedSlotIndex(idx)}
                              className={`p-2.5 rounded-xl border-2 cursor-pointer transition-all ${
                                isSel ? 'bg-blue-950/40 border-blue-500/50' :
                                draggedIndex === idx ? 'opacity-50 scale-95 border-slate-700' :
                                'bg-slate-900/60 border-slate-800/60 hover:border-slate-600'
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                <span className="text-slate-600 font-mono font-black text-[10px] w-5 shrink-0">#{idx + 1}</span>
                                <span className="text-base shrink-0">{pMeta.icon}</span>
                                <div className="flex-1 min-w-0">
                                  <span className="text-[9px] text-slate-500 font-bold uppercase">{pMeta.name}</span>
                                  {action && <span className="text-xs font-bold text-white ml-2 truncate">{action.name}</span>}
                                </div>
                                {action && (
                                  <div className="flex items-center gap-2 shrink-0 text-[10px]">
                                    <span className="text-blue-400 font-mono font-bold">{adjBV.toFixed(1)}</span>
                                    <span className={`font-bold ${sr >= 80 ? 'text-emerald-400' : sr >= 50 ? 'text-amber-400' : 'text-red-400'}`}>{sr}%</span>
                                    {element.variant && <span className="text-amber-400 font-bold text-[9px]">{getVariant(element.variant)?.name}</span>}
                                  </div>
                                )}
                              </div>
                              {/* Expanded details for selected element */}
                              {isSel && action && (variants.length > 0 || tags.length > 0) && (
                                <div className="mt-2 pt-2 border-t border-slate-800/50 space-y-1">
                                  {variants.length > 0 && (
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                      <span className="text-[8px] text-slate-500 font-bold">变体:</span>
                                      <button onClick={(e) => { e.stopPropagation(); toggleVariant(idx, undefined); }}
                                        className={`text-[8px] px-1.5 py-0.5 rounded font-bold ${!element.variant ? 'bg-slate-600 text-white' : 'bg-slate-800 text-slate-500'}`}>无</button>
                                      {variants.map(v => (
                                        <button key={v.id} onClick={(e) => { e.stopPropagation(); toggleVariant(idx, v.id); }}
                                          className={`text-[8px] px-1.5 py-0.5 rounded font-bold ${element.variant === v.id ? 'bg-amber-600 text-white' : 'bg-slate-800 text-amber-500 hover:bg-amber-900/30'}`}
                                          title={`BV ×${v.bvMultiplier} | 风险+${(v.riskModifier * 100).toFixed(0)}%`}
                                        >{v.name}</button>
                                      ))}
                                    </div>
                                  )}
                                  {tags.length > 0 && (
                                    <div className="flex gap-1 flex-wrap">
                                      {tags.map(t => (
                                        <span key={t.id} className={`text-[7px] px-1.5 py-0.5 rounded font-bold ${t.rarity === 'legendary' ? 'bg-amber-900/30 text-amber-300' : t.rarity === 'rare' ? 'bg-purple-900/30 text-purple-300' : 'bg-purple-900/20 text-purple-400'}`}>{t.name}</span>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Bottom: Estimation Panel */}
                  <div className="shrink-0 mt-3 p-3 bg-slate-950 border border-slate-800 rounded-xl">
                    <div className="grid grid-cols-4 gap-4 items-center">
                      <div className="text-center">
                        <p className="text-[8px] text-slate-500 font-bold uppercase">预估总BV</p>
                        <p className="text-lg font-mono font-black text-blue-400">{totalBV.toFixed(1)}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-[8px] text-slate-500 font-bold uppercase">预估得分</p>
                        <p className="text-base font-mono font-black text-white">{lowEst}<span className="text-slate-600 text-xs">~</span>{highEst}</p>
                      </div>
                      <div>
                        <p className="text-[8px] text-slate-500 font-bold uppercase mb-1">整体风险</p>
                        <div className="flex items-center gap-1.5">
                          <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden">
                            <div className={`h-full rounded-full ${riskPct > 40 ? 'bg-red-500' : riskPct > 25 ? 'bg-amber-500' : 'bg-emerald-500'}`} style={{ width: `${riskPct}%` }}></div>
                          </div>
                          <span className={`text-[10px] font-mono font-bold w-8 text-right ${riskPct > 40 ? 'text-red-400' : riskPct > 25 ? 'text-amber-400' : 'text-emerald-400'}`}>{riskPct}%</span>
                        </div>
                      </div>
                      <div>
                        <p className="text-[8px] text-slate-500 font-bold uppercase mb-1">体力需求</p>
                        <div className="flex items-center gap-1.5">
                          <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden">
                            <div className={`h-full rounded-full ${totalCost > skater.sta ? 'bg-red-500' : totalCost > skater.sta * 0.7 ? 'bg-amber-500' : 'bg-cyan-500'}`} style={{ width: `${Math.min(100, (totalCost / Math.max(skater.sta, 1)) * 100)}%` }}></div>
                          </div>
                          <span className={`text-[10px] font-mono font-bold w-12 text-right ${totalCost > skater.sta ? 'text-red-400' : 'text-slate-300'}`}>{totalCost}<span className="text-slate-600">/{skater.sta.toFixed(0)}</span></span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Bottom Buttons */}
                  <div className="shrink-0 flex gap-3 mt-3">
                    <button onClick={() => setStage('intro')} className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-6 py-3 rounded-xl font-bold text-sm transition-all">返回</button>
                    <button onClick={() => setStage('active')} className="flex-1 bg-blue-600 hover:bg-blue-500 text-white py-3 rounded-xl font-black text-lg transition-all active:scale-95 shadow-xl">确认配置 · 开始比赛</button>
                    <button onClick={() => { setPendingQuickFinish(true); setStage('active'); }}
                      className="bg-slate-800/60 hover:bg-slate-700 text-slate-500 hover:text-white px-5 py-3 rounded-xl font-bold text-[10px] transition-all border border-slate-700/50 uppercase tracking-wider">
                      快速出分 ⏩
                    </button>
                  </div>
                </div>
              );
            })()}

            {stage === 'active' && (
              <div className="animate-in fade-in duration-300 w-full flex flex-col h-full">
                <div className="flex items-center justify-between mb-8 px-4 relative">
                  <div className="absolute left-0 right-0 top-1/2 h-0.5 bg-slate-800 -z-0"></div>
                  {programConfig.elements.map((elem, idx) => {
                    const isPast = idx < phaseIndex;
                    const isCurrent = idx === phaseIndex;
                    const pMeta = PHASE_META[elem.phase];
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

                <div className="flex-1 flex flex-col items-center justify-center">
                  {(() => {
                    const activeElement = programConfig.elements[phaseIndex];
                    if (!activeElement) return <p className="text-red-400">配置错误</p>;

                    const currentAction = getActionFromElement(activeElement);
                    if (!currentAction) return <p className="text-red-400">动作未找到</p>;

                    const preview = calculateActionScore(currentAction, skater.attributes!, playerMatchSta, true, skater.technique, activeElement.variant);
                    const successRate = estimateSuccessRate(currentAction, skater.technique, activeElement.variant);

                    return (
                      <div className="w-full max-w-xl animate-in zoom-in duration-500">
                        <div className="bg-gradient-to-br from-slate-900 to-slate-950 border-2 border-blue-500/50 rounded-3xl p-10 shadow-2xl">
                          <div className="text-center mb-8">
                            <div className="text-6xl mb-4">{PHASE_META[activeElement.phase].icon}</div>
                            <h3 className="text-4xl font-black text-white mb-2">{currentAction.name}</h3>
                            <p className="text-sm text-slate-400">{currentAction.desc}</p>
                          </div>

                          <div className="grid grid-cols-4 gap-4 mb-8">
                            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-center">
                              <p className="text-xs text-slate-500 mb-1">基础分</p>
                              <p className="text-2xl font-black text-blue-400">{currentAction.baseScore.toFixed(1)}</p>
                            </div>
                            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-center">
                              <p className="text-xs text-slate-500 mb-1">体力消耗</p>
                              <p className={`text-2xl font-black ${playerMatchSta < preview.cost ? 'text-red-400' : 'text-slate-300'}`}>{preview.cost.toFixed(0)}</p>
                            </div>
                            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-center">
                              <p className="text-xs text-slate-500 mb-1">成功率</p>
                              <p className={`text-2xl font-black ${successRate >= 80 ? 'text-emerald-400' : successRate >= 50 ? 'text-amber-400' : 'text-red-400'}`}>{successRate}%</p>
                            </div>
                            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-center">
                              <p className="text-xs text-slate-500 mb-1">预计GOE</p>
                              <p className={`text-2xl font-black ${preview.goe > 2 ? 'text-emerald-400' : preview.goe < 0 ? 'text-red-400' : 'text-slate-300'}`}>{preview.goe > 0 ? '+' : ''}{preview.goe.toFixed(1)}</p>
                            </div>
                          </div>

                          {isProcessing ? (
                            <div className="text-center py-8">
                              <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                              <p className="text-sm text-slate-400 animate-pulse">执行中...</p>
                            </div>
                          ) : (
                            <div className="space-y-3">
                              <button onClick={executeConfiguredAction} className="w-full bg-blue-600 hover:bg-blue-500 text-white py-6 rounded-2xl font-black text-2xl shadow-2xl transition-all active:scale-95">执行动作</button>
                              <button onClick={executeAllActions} className="w-full group relative bg-slate-800/80 hover:bg-slate-700/90 text-slate-300 hover:text-white py-3.5 rounded-xl font-bold text-sm transition-all active:scale-[0.98] border border-slate-700/50 hover:border-slate-600">
                                <span className="flex items-center justify-center gap-2">
                                  <svg className="w-4 h-4 opacity-50 group-hover:opacity-100 transition-opacity" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M13 5l7 7-7 7" /><path strokeLinecap="round" strokeLinejoin="round" d="M4 5l7 7-7 7" /></svg>
                                  快速完赛
                                  <span className="text-[10px] opacity-40 font-normal">跳过剩余 {programConfig.elements.length - phaseIndex} 个动作</span>
                                </span>
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })()}
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
              {history.map((h, i) => {
                const isFall = h.desc.includes('摔倒');
                const goeMatch = h.desc.match(/GOE ([+-]?\d+\.?\d*)/);
                const goeValue = goeMatch ? parseFloat(goeMatch[1]) : 0;

                return (
                  <div key={i} className={`border p-4 rounded-2xl animate-in slide-in-from-right-2 ${isFall ? 'bg-red-950/20 border-red-900/50' : 'bg-slate-950 border-slate-800'}`}>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-[9px] font-black uppercase bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded">{h.phaseName}</span>
                      <span className="font-mono text-emerald-400 font-bold">+{h.score.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-end">
                      <span className="font-bold text-white text-sm">{h.name}</span>
                      <span className={`text-[9px] font-bold ${isFall ? 'text-red-400' : goeValue > 3 ? 'text-emerald-400' : 'text-slate-500'}`}>{h.desc}</span>
                    </div>
                  </div>
                );
              })}
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

export default MatchEngine;
