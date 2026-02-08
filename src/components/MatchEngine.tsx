import React, { useState, useEffect } from 'react';
import { GameEvent, Skater, PlayerAttributes, ProgramConfig, ConfigStrategy, ProgramElement, MatchPhaseType } from '../types';
import { MATCH_STRUCTURES, PHASE_META, ACTION_LIBRARY, generateProgramConfig, getActionFromElement, calculateConfigTotalBV, calculateConfigAvgRisk } from '../game/data/actions';
import { calculateActionScore } from '../game/scoring';
import { simulateAIProgram } from '../game/match';
import { generateLocalCommentary } from '../game/events';
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
  const [editingElementIndex, setEditingElementIndex] = useState<number | null>(null);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const matchTemplate = MATCH_STRUCTURES[event.template] || MATCH_STRUCTURES['low'];
  const phases = matchTemplate.phases;
  
  useEffect(() => {
    if (programConfig.elements.length === 0 && skater.attributes) {
      const initialConfig = generateProgramConfig(skater.attributes, phases, 'balanced');
      setProgramConfig(initialConfig);
    }
  }, []);

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

    const result = calculateActionScore(action, skater.attributes!, playerMatchSta, true);

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

            {stage === 'config' && skater.attributes && (
              <div className="flex-1 flex flex-col animate-in fade-in duration-300">
                <h2 className="text-3xl font-black text-white italic mb-2 tracking-tighter">节目配置</h2>
                <p className="text-xs text-slate-500 mb-6">选择策略或自定义每个技术要素的动作</p>

                <div className="grid grid-cols-3 gap-4 mb-8">
                  <button
                    onClick={() => {
                      setConfigStrategy('conservative');
                      setProgramConfig(generateProgramConfig(skater.attributes!, phases, 'conservative'));
                    }}
                    className={`p-6 rounded-2xl border-2 transition-all ${configStrategy === 'conservative' ? 'bg-emerald-900/30 border-emerald-500' : 'bg-slate-950 border-slate-800 hover:border-slate-600'}`}
                  >
                    <div className="text-2xl mb-2">🛡️</div>
                    <h3 className="text-lg font-black text-white mb-1">保守策略</h3>
                    <p className="text-xs text-slate-500">优先稳定，降低失误风险</p>
                    <p className="text-xs text-emerald-400 mt-2 font-bold">失误率 ≤ 25%</p>
                  </button>

                  <button
                    onClick={() => {
                      setConfigStrategy('balanced');
                      setProgramConfig(generateProgramConfig(skater.attributes!, phases, 'balanced'));
                    }}
                    className={`p-6 rounded-2xl border-2 transition-all ${configStrategy === 'balanced' ? 'bg-blue-900/30 border-blue-500' : 'bg-slate-950 border-slate-800 hover:border-slate-600'}`}
                  >
                    <div className="text-2xl mb-2">⚖️</div>
                    <h3 className="text-lg font-black text-white mb-1">默认策略</h3>
                    <p className="text-xs text-slate-500">平衡难度与成功率</p>
                    <p className="text-xs text-blue-400 mt-2 font-bold">失误率 ≤ 40%</p>
                  </button>

                  <button
                    onClick={() => {
                      setConfigStrategy('aggressive');
                      setProgramConfig(generateProgramConfig(skater.attributes!, phases, 'aggressive'));
                    }}
                    className={`p-6 rounded-2xl border-2 transition-all ${configStrategy === 'aggressive' ? 'bg-red-900/30 border-red-500' : 'bg-slate-950 border-slate-800 hover:border-slate-600'}`}
                  >
                    <div className="text-2xl mb-2">⚡</div>
                    <h3 className="text-lg font-black text-white mb-1">激进策略</h3>
                    <p className="text-xs text-slate-500">冲击最高难度分数</p>
                    <p className="text-xs text-red-400 mt-2 font-bold">追求极限BV</p>
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-6 p-6 bg-slate-950 rounded-2xl border border-slate-800">
                  <div>
                    <p className="text-xs text-slate-500 mb-1">总基础分 (BV)</p>
                    <p className="text-3xl font-black text-blue-400">{calculateConfigTotalBV(programConfig).toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 mb-1">平均风险</p>
                    <p className={`text-3xl font-black ${calculateConfigAvgRisk(programConfig) > 0.4 ? 'text-red-400' : calculateConfigAvgRisk(programConfig) > 0.25 ? 'text-amber-400' : 'text-emerald-400'}`}>
                      {(calculateConfigAvgRisk(programConfig) * 100).toFixed(0)}%
                    </p>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                  <h3 className="text-xs font-black uppercase text-slate-500 mb-2 tracking-widest">技术要素配置</h3>
                  <p className="text-xs text-slate-600 mb-4">拖动调整执行顺序</p>
                  <div className="space-y-3">
                    {programConfig.elements.map((element, idx) => {
                      const action = getActionFromElement(element);
                      const elemPhaseMeta = PHASE_META[element.phase];
                      
                      return (
                        <div 
                          key={idx}
                          draggable
                          onDragStart={() => handleDragStart(idx)}
                          onDragOver={(e) => handleDragOver(e, idx)}
                          onDragEnd={handleDragEnd}
                          className={`bg-slate-950 border-2 rounded-2xl p-4 transition-all cursor-move hover:border-blue-500/50 ${
                            draggedIndex === idx ? 'opacity-50 scale-95' : 'opacity-100'
                          } ${draggedIndex !== null && draggedIndex !== idx ? 'border-slate-700' : 'border-slate-800'}`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-3">
                              <span className="text-slate-600 font-black text-sm min-w-[24px]">#{idx + 1}</span>
                              <span className="text-2xl">{elemPhaseMeta.icon}</span>
                              <div>
                                <h4 className="text-sm font-black text-white">{elemPhaseMeta.name}</h4>
                                <p className="text-xs text-slate-500">{action?.name || '未配置'}</p>
                              </div>
                            </div>
                            <button
                              onClick={() => setEditingElementIndex(idx)}
                              className="text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-300 px-4 py-2 rounded-lg transition-all"
                            >
                              调整
                            </button>
                          </div>
                          {action && (
                            <div className="flex gap-4 text-xs mt-3 pt-3 border-t border-slate-800/50">
                              <div><span className="text-slate-600">BV:</span><span className="text-blue-400 font-bold ml-1">{action.baseScore.toFixed(1)}</span></div>
                              <div><span className="text-slate-600">失误率:</span><span className={`font-bold ml-1 ${action.risk > 0.4 ? 'text-red-400' : action.risk > 0.25 ? 'text-amber-400' : 'text-emerald-400'}`}>{(action.risk * 100).toFixed(0)}%</span></div>
                              <div><span className="text-slate-600">体力:</span><span className="text-slate-300 font-bold ml-1">{action.cost}</span></div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="flex gap-4 mt-6 pt-6 border-t border-slate-800">
                  <button onClick={() => setStage('intro')} className="flex-1 bg-slate-800 hover:bg-slate-700 text-white px-8 py-4 rounded-2xl font-black transition-all">返回</button>
                  <button onClick={() => setStage('active')} className="flex-[2] bg-blue-600 hover:bg-blue-500 text-white px-8 py-4 rounded-2xl font-black text-xl transition-all active:scale-95">确认配置 · 开始比赛</button>
                </div>
              </div>
            )}

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
                    
                    const preview = calculateActionScore(currentAction, skater.attributes!, playerMatchSta, true);
                    
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
                              <p className="text-xs text-slate-500 mb-1">失误率</p>
                              <p className={`text-2xl font-black ${currentAction.risk > 0.4 ? 'text-amber-400' : 'text-emerald-400'}`}>{(currentAction.risk * 100).toFixed(0)}%</p>
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
                            <button onClick={executeConfiguredAction} className="w-full bg-blue-600 hover:bg-blue-500 text-white py-6 rounded-2xl font-black text-2xl shadow-2xl transition-all active:scale-95">执行动作</button>
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
      
      {editingElementIndex !== null && skater.attributes && (
        <div className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-sm flex items-center justify-center p-8 animate-in fade-in duration-300">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 max-w-4xl w-full max-h-[80vh] overflow-y-auto custom-scrollbar shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-2xl font-black text-white">
                  {PHASE_META[programConfig.elements[editingElementIndex].phase].name} - 选择动作
                </h3>
                <p className="text-xs text-slate-500 mt-1">点击选择要执行的技术动作</p>
              </div>
              <button onClick={() => setEditingElementIndex(null)} className="text-slate-500 hover:text-white text-2xl w-10 h-10 flex items-center justify-center rounded-full hover:bg-slate-800 transition-all">×</button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {ACTION_LIBRARY.filter(a => a.type === programConfig.elements[editingElementIndex].phase).map(action => {
                const isAvailable = Object.entries(action.reqStats).every(
                  ([key, val]) => (skater.attributes![key as keyof PlayerAttributes] || 0) >= (val as number)
                );
                const isSelected = programConfig.elements[editingElementIndex].actionId === action.id;
                
                return (
                  <button
                    key={action.id}
                    disabled={!isAvailable}
                    onClick={() => {
                      const newElements = [...programConfig.elements];
                      newElements[editingElementIndex] = { ...newElements[editingElementIndex], actionId: action.id };
                      setProgramConfig({ elements: newElements });
                      setConfigStrategy('custom');
                      setEditingElementIndex(null);
                    }}
                    className={`text-left p-5 rounded-2xl border-2 transition-all ${
                      !isAvailable 
                        ? 'opacity-40 cursor-not-allowed bg-slate-950 border-slate-800' 
                        : isSelected
                        ? 'bg-blue-900/30 border-blue-500 shadow-lg'
                        : 'bg-slate-950 border-slate-800 hover:border-slate-600 hover:bg-slate-900'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className={`font-black text-lg ${isAvailable ? 'text-white' : 'text-slate-600'}`}>
                        {action.name}
                        {isSelected && <span className="ml-2 text-xs text-blue-400">✓ 已选</span>}
                      </span>
                      <span className={`font-mono text-xs font-bold px-2 py-1 rounded ${isAvailable ? 'text-blue-400 bg-blue-900/20' : 'text-slate-600 bg-slate-800'}`}>
                        BV: {action.baseScore.toFixed(1)}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mb-3">{action.desc}</p>
                    
                    <div className="flex gap-4 text-xs border-t border-slate-800/50 pt-3">
                      <div><span className="text-slate-600">体力:</span><span className={`font-bold ml-1 ${isAvailable ? 'text-slate-300' : 'text-slate-600'}`}>{action.cost}</span></div>
                      <div><span className="text-slate-600">失误率:</span><span className={`font-bold ml-1 ${!isAvailable ? 'text-slate-600' : action.risk > 0.4 ? 'text-red-400' : action.risk > 0.25 ? 'text-amber-400' : 'text-emerald-400'}`}>{(action.risk * 100).toFixed(0)}%</span></div>
                    </div>
                    
                    {!isAvailable && (
                      <div className="mt-3 text-xs text-red-400 font-bold">
                        需求: {Object.entries(action.reqStats).map(([k, v]) => `${k} ≥ ${v}`).join(', ')}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MatchEngine;
