import React, { useState, useMemo } from 'react';
import { GameState, Music, ChoreographerNPC, ProgramCostume } from '../types';
import { MOOD_LABELS, MOOD_COLORS, MOOD_COLORS_FADED, STRUCTURE_LABELS } from '../game/data/music';
import { CHOREO_TYPE_LABELS, CHOREO_TIER_LABELS, getChoreographerReaction, getReactionText, getChoreographerById } from '../game/data/choreographers';
import { THEME_LABELS, THEME_COLORS } from '../game/data/costumes';
import { calculateSynergy, assembleProgramV2 } from '../game/program';
import SynergyDisplay from './SynergyDisplay';

interface ProgramCreatorProps {
  game: GameState;
  setGame: React.Dispatch<React.SetStateAction<GameState>>;
  addLog: (msg: string, type?: any) => void;
}

type Step = 'overview' | 'music' | 'choreo' | 'costume' | 'confirm';

const WIZARD_STEPS: { key: Step; label: string; num: number }[] = [
  { key: 'music', label: '选曲', num: 1 },
  { key: 'choreo', label: '编舞', num: 2 },
  { key: 'costume', label: '服装', num: 3 },
  { key: 'confirm', label: '确认', num: 4 },
];

const StepIndicator: React.FC<{ current: Step }> = ({ current }) => {
  if (current === 'overview') return null;
  const currentIdx = WIZARD_STEPS.findIndex(s => s.key === current);
  return (
    <div className="flex items-center gap-1 mb-5">
      {WIZARD_STEPS.map((s, i) => {
        const isActive = s.key === current;
        const isPast = currentIdx > i;
        return (
          <React.Fragment key={s.key}>
            {i > 0 && <div className={`flex-1 h-0.5 ${isPast ? 'bg-purple-500' : 'bg-slate-800'}`} />}
            <div className="flex items-center gap-1.5 shrink-0">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black ${
                isActive ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30' :
                isPast ? 'bg-purple-900 text-purple-300' :
                'bg-slate-800 text-slate-600'
              }`}>{isPast ? '✓' : s.num}</div>
              <span className={`text-[10px] font-bold ${isActive ? 'text-purple-400' : isPast ? 'text-purple-600' : 'text-slate-600'}`}>{s.label}</span>
            </div>
          </React.Fragment>
        );
      })}
    </div>
  );
};

const ProgramCreator: React.FC<ProgramCreatorProps> = ({ game, setGame, addLog }) => {
  const [step, setStep] = useState<Step>('overview');
  const [selectedMusic, setSelectedMusic] = useState<Music | null>(null);
  const [selectedChoreo, setSelectedChoreo] = useState<ChoreographerNPC | null>(null);
  const [selectedCostume, setSelectedCostume] = useState<ProgramCostume | null>(null);

  const playerMusic = game.playerMusic || [];
  const choreographers = game.market.choreographers;
  const costumes = game.market.costumes || [];
  const currentProgram = game.skater.programV2;

  // Full preview program (synergy + blueprint) — only computed when all 3 are selected
  const previewProgram = useMemo(() => {
    if (selectedMusic && selectedChoreo && selectedCostume) {
      return assembleProgramV2(selectedMusic, selectedChoreo, selectedCostume);
    }
    return null;
  }, [selectedMusic, selectedChoreo, selectedCostume]);

  const previewSynergy = previewProgram?.synergy || null;

  const totalCost = useMemo(() => {
    let cost = 0;
    if (selectedChoreo) cost += selectedChoreo.cost;
    if (selectedCostume) cost += selectedCostume.price;
    return cost;
  }, [selectedChoreo, selectedCostume]);

  const handleConfirm = () => {
    if (!previewProgram) return;
    if (game.money < totalCost) return;

    setGame(prev => ({
      ...prev,
      money: prev.money - totalCost,
      skater: {
        ...prev.skater,
        programV2: previewProgram,
        activeProgram: { name: previewProgram.name, baseArt: 35, freshness: 100 },
      },
    }));
    addLog(`新节目《${previewProgram.name}》编排完成！共鸣 ${'★'.repeat(previewProgram.synergy.stars)}${'☆'.repeat(3 - previewProgram.synergy.stars)}`, 'art');
    setStep('overview');
    setSelectedMusic(null);
    setSelectedChoreo(null);
    setSelectedCostume(null);
  };

  // ========================================
  // Overview: current program + create button
  // ========================================
  if (step === 'overview') {
    const choreoNPC = currentProgram ? getChoreographerById(currentProgram.choreographerId) : null;
    return (
      <div className="space-y-6">
        {currentProgram ? (
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-black text-white italic">《{currentProgram.name}》</h4>
              <SynergyDisplay synergy={currentProgram.synergy} />
            </div>
            <div className="grid grid-cols-3 gap-3 mb-3">
              <div className="bg-slate-900 rounded-xl p-3 border border-slate-800">
                <p className="text-[9px] text-slate-500 font-bold uppercase mb-1">音乐</p>
                <p className="text-xs font-bold text-white truncate">{currentProgram.music.name}</p>
                <span className={`text-[8px] px-1.5 py-0.5 rounded font-bold text-white mt-1 inline-block ${MOOD_COLORS[currentProgram.music.mood]}`}>{MOOD_LABELS[currentProgram.music.mood]}</span>
              </div>
              <div className="bg-slate-900 rounded-xl p-3 border border-slate-800">
                <p className="text-[9px] text-slate-500 font-bold uppercase mb-1">编舞师</p>
                {choreoNPC ? (
                  <>
                    <p className="text-xs font-bold text-white truncate">{choreoNPC.portrait} {choreoNPC.name}</p>
                    <span className={`text-[8px] px-1.5 py-0.5 rounded font-bold mt-1 inline-block ${
                      choreoNPC.tier === 'master' ? 'bg-amber-500 text-black' :
                      choreoNPC.tier === 'established' ? 'bg-blue-500 text-white' :
                      'bg-slate-700 text-slate-300'
                    }`}>{CHOREO_TIER_LABELS[choreoNPC.tier]} · {CHOREO_TYPE_LABELS[choreoNPC.type]}</span>
                  </>
                ) : (
                  <p className="text-xs text-slate-500 italic">未知</p>
                )}
              </div>
              <div className="bg-slate-900 rounded-xl p-3 border border-slate-800">
                <p className="text-[9px] text-slate-500 font-bold uppercase mb-1">服装</p>
                <p className="text-xs font-bold text-white truncate">{currentProgram.costume.name}</p>
                <span className={`text-[8px] px-1.5 py-0.5 rounded font-bold text-white mt-1 inline-block ${THEME_COLORS[currentProgram.costume.theme]}`}>{THEME_LABELS[currentProgram.costume.theme]}</span>
              </div>
            </div>

            {/* Maturity bar (full width) */}
            <div className="bg-slate-900 rounded-xl p-3 border border-slate-800 mb-3">
              <div className="flex justify-between items-center mb-1.5">
                <span className="text-[9px] text-slate-500 font-bold uppercase">成熟度</span>
                <span className="text-sm font-black text-pink-400">{currentProgram.maturity.toFixed(0)}</span>
              </div>
              <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-pink-500 rounded-full transition-all" style={{ width: `${currentProgram.maturity}%` }}></div>
              </div>
            </div>

            {/* Blueprint compact */}
            <div className="mb-3">
              <p className="text-[9px] text-slate-500 font-bold uppercase mb-2">节目蓝图</p>
              <div className="flex gap-1 flex-wrap">
                {currentProgram.blueprint.segments.map((seg, i) => (
                  <div key={i} className={`px-2 py-1 rounded text-[8px] font-bold ${
                    seg.type === 'choreo' ? 'bg-purple-900/40 text-purple-300 border border-purple-800/30' :
                    seg.type === 'transition' ? 'bg-slate-800 text-slate-500' :
                    'bg-blue-900/40 text-blue-300 border border-blue-800/30'
                  }`}>
                    {seg.type === 'choreo' ? (seg.data as any).emotionalBeat :
                     seg.type === 'transition' ? '→' :
                     `#${(seg as any).slotIndex + 1}`}
                  </div>
                ))}
              </div>
            </div>

            {/* Synergy details */}
            {currentProgram.synergy.details.length > 0 && (
              <div className="flex gap-2 flex-wrap">
                {currentProgram.synergy.details.map((d, i) => (
                  <span key={i} className="text-[8px] px-2 py-0.5 rounded bg-amber-900/30 text-amber-300 border border-amber-800/30 font-bold">{d}</span>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-8 text-center">
            <p className="text-slate-500 text-sm mb-2">尚未编排节目</p>
            <p className="text-[10px] text-slate-600">创建你的第一个节目，选择音乐、编舞师和服装。</p>
          </div>
        )}
        <button
          onClick={() => setStep('music')}
          className="w-full bg-purple-600 hover:bg-purple-500 text-white py-4 rounded-2xl font-black text-sm uppercase tracking-widest transition-all active:scale-95 shadow-lg"
        >
          {currentProgram ? '创建新节目' : '开始编排'}
        </button>
        {currentProgram && (
          <p className="text-[9px] text-slate-600 text-center">创建新节目会覆盖当前节目，成熟度将重置为 0</p>
        )}
      </div>
    );
  }

  // ========================================
  // Step 1: Music Selection
  // ========================================
  if (step === 'music') {
    return (
      <div className="space-y-4">
        <StepIndicator current="music" />
        <div className="flex items-center justify-between mb-2">
          <div>
            <h4 className="text-sm font-black text-white uppercase tracking-widest">选曲</h4>
            <p className="text-[10px] text-slate-500">从你的音乐收藏中选择一首曲目</p>
          </div>
          <button onClick={() => setStep('overview')} className="text-[10px] text-slate-500 hover:text-white px-3 py-1.5 rounded-lg bg-slate-800 transition-all">返回</button>
        </div>
        {playerMusic.length === 0 ? (
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-8 text-center">
            <p className="text-slate-500 text-sm">暂无音乐收藏</p>
            <p className="text-[10px] text-slate-600 mt-1">每月有一定概率遇到新的曲目</p>
          </div>
        ) : (
          <div className="space-y-3">
            {playerMusic.map(music => {
              const isSelected = selectedMusic?.id === music.id;
              return (
                <button
                  key={music.id}
                  onClick={() => { setSelectedMusic(music); setStep('choreo'); }}
                  className={`w-full text-left p-5 rounded-2xl border-2 transition-all ${
                    isSelected ? 'bg-purple-950/30 border-purple-500/60' : 'bg-slate-950 border-slate-800 hover:border-slate-600'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-base font-black text-white">《{music.name}》</span>
                    <div className="flex gap-1.5">
                      <span className={`text-[8px] px-2 py-0.5 rounded font-bold text-white ${MOOD_COLORS[music.mood]}`}>{MOOD_LABELS[music.mood]}</span>
                      <span className="text-[8px] px-2 py-0.5 rounded font-bold text-slate-300 bg-slate-700">{STRUCTURE_LABELS[music.structure]}</span>
                    </div>
                  </div>
                  <p className="text-[10px] text-slate-400 leading-relaxed mb-2">{music.description}</p>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1">
                      <span className="text-[8px] text-slate-600 font-bold">复杂度</span>
                      <span className="text-[9px] text-amber-400">{'★'.repeat(music.complexity)}{'☆'.repeat(3 - music.complexity)}</span>
                    </div>
                    <div className="flex items-center gap-0.5">
                      <span className="text-[8px] text-slate-600 font-bold">能量</span>
                      {music.energyCurve.map((e, i) => (
                        <div key={i} className="w-3 bg-slate-800 rounded-sm overflow-hidden" style={{ height: '16px' }}>
                          <div className={`w-full rounded-sm ${e > 1.05 ? 'bg-amber-500' : e < 0.9 ? 'bg-blue-500' : 'bg-slate-600'}`} style={{ height: `${(e / 1.2) * 100}%`, marginTop: `${(1 - e / 1.2) * 100}%` }}></div>
                        </div>
                      ))}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  // ========================================
  // Step 2: Choreographer Selection
  // ========================================
  if (step === 'choreo') {
    const allTooExpensive = choreographers.every(c => game.money < c.cost);
    return (
      <div className="space-y-4">
        <StepIndicator current="choreo" />
        <div className="flex items-center justify-between mb-2">
          <div>
            <h4 className="text-sm font-black text-white uppercase tracking-widest">选编舞师</h4>
            <p className="text-[10px] text-slate-500">选曲: 《{selectedMusic?.name}》<span className={`ml-1 text-[8px] px-1.5 py-0.5 rounded font-bold text-white ${selectedMusic ? MOOD_COLORS[selectedMusic.mood] : ''}`}>{selectedMusic ? MOOD_LABELS[selectedMusic.mood] : ''}</span></p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-slate-500 font-bold">¥{game.money.toLocaleString()}</span>
            <button onClick={() => setStep('music')} className="text-[10px] text-slate-500 hover:text-white px-3 py-1.5 rounded-lg bg-slate-800 transition-all">上一步</button>
          </div>
        </div>
        {allTooExpensive && (
          <div className="bg-red-950/30 border border-red-900/50 rounded-xl p-4 text-center">
            <p className="text-red-400 text-sm font-bold">资金不足</p>
            <p className="text-[10px] text-red-500/70 mt-1">当前资金 ¥{game.money.toLocaleString()}，无法聘请任何编舞师。请先通过比赛赚取更多资金。</p>
          </div>
        )}
        <div className="space-y-3">
          {choreographers.map(choreo => {
            const reaction = selectedMusic ? getChoreographerReaction(choreo, selectedMusic) : 'neutral';
            const reactionText = getReactionText(choreo.id, reaction);
            const reactionColor = reaction === 'match' ? 'text-emerald-400 border-emerald-800/50 bg-emerald-950/30' :
                                  reaction === 'mismatch' ? 'text-red-400 border-red-800/50 bg-red-950/30' :
                                  'text-slate-400 border-slate-800 bg-slate-950/30';
            const tierColor = choreo.tier === 'master' ? 'bg-amber-500 text-black' :
                              choreo.tier === 'established' ? 'bg-blue-500 text-white' :
                              'bg-slate-700 text-slate-300';
            const canAfford = game.money >= choreo.cost;

            return (
              <button
                key={choreo.id}
                onClick={() => { if (canAfford) { setSelectedChoreo(choreo); setStep('costume'); } }}
                disabled={!canAfford}
                className={`w-full text-left p-5 rounded-2xl border-2 transition-all ${
                  !canAfford ? 'opacity-50 cursor-not-allowed bg-slate-950 border-slate-800' :
                  'bg-slate-950 border-slate-800 hover:border-purple-500/50'
                }`}
              >
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-2xl">{choreo.portrait}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-black text-white">{choreo.name}</span>
                      <span className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded ${tierColor}`}>{CHOREO_TIER_LABELS[choreo.tier]}</span>
                      <span className="text-[8px] font-bold text-slate-500 bg-slate-800 px-1.5 py-0.5 rounded">{CHOREO_TYPE_LABELS[choreo.type]}</span>
                    </div>
                    <p className="text-[10px] text-slate-500 italic mt-0.5">"{choreo.quote}"</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className={`font-black text-sm ${canAfford ? 'text-white' : 'text-red-400'}`}>¥{choreo.cost.toLocaleString()}</p>
                    {!canAfford && <p className="text-[8px] text-red-500/70 font-bold">资金不足</p>}
                  </div>
                </div>
                <div className={`mt-2 p-2.5 rounded-xl border text-[10px] font-bold ${reactionColor}`}>
                  <span className="mr-1">{reaction === 'match' ? '✦' : reaction === 'mismatch' ? '✕' : '—'}</span>
                  {reactionText}
                </div>
                <div className="flex gap-4 mt-2 text-[9px]">
                  <span className="text-slate-500">过渡质感 <span className="text-white font-bold">{(choreo.transitionQuality * 100).toFixed(0)}</span></span>
                  <span className="text-slate-500">编舞质量 <span className="text-white font-bold">{(choreo.choreoQuality * 100).toFixed(0)}</span></span>
                  <span className="text-slate-500">偏好 {choreo.preferredMoods.map(m => MOOD_LABELS[m]).join('·')}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // ========================================
  // Step 3: Costume Selection
  // ========================================
  if (step === 'costume') {
    const remainingBudget = game.money - (selectedChoreo?.cost || 0);
    const allTooExpensive = costumes.length > 0 && costumes.every(c => remainingBudget < c.price);
    return (
      <div className="space-y-4">
        <StepIndicator current="costume" />
        <div className="flex items-center justify-between mb-2">
          <div>
            <h4 className="text-sm font-black text-white uppercase tracking-widest">选服装</h4>
            <p className="text-[10px] text-slate-500">
              选曲: 《{selectedMusic?.name}》 · 编舞: {selectedChoreo?.name}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-slate-500 font-bold">剩余 ¥{remainingBudget.toLocaleString()}</span>
            <button onClick={() => setStep('choreo')} className="text-[10px] text-slate-500 hover:text-white px-3 py-1.5 rounded-lg bg-slate-800 transition-all">上一步</button>
          </div>
        </div>
        {allTooExpensive && (
          <div className="bg-red-950/30 border border-red-900/50 rounded-xl p-4 text-center">
            <p className="text-red-400 text-sm font-bold">资金不足</p>
            <p className="text-[10px] text-red-500/70 mt-1">扣除编舞师费用后剩余 ¥{remainingBudget.toLocaleString()}，无法购买任何服装。请返回选择更便宜的编舞师。</p>
          </div>
        )}
        {costumes.length === 0 ? (
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-8 text-center">
            <p className="text-slate-500 text-sm">暂无服装可选</p>
          </div>
        ) : (
          <div className="space-y-3">
            {costumes.map(costume => {
              const preview = selectedMusic && selectedChoreo
                ? calculateSynergy(selectedMusic, selectedChoreo, costume)
                : null;
              const canAfford = remainingBudget >= costume.price;

              return (
                <button
                  key={costume.id}
                  onClick={() => { if (canAfford) { setSelectedCostume(costume); setStep('confirm'); } }}
                  disabled={!canAfford}
                  className={`w-full text-left p-5 rounded-2xl border-2 transition-all ${
                    !canAfford ? 'opacity-50 cursor-not-allowed bg-slate-950 border-slate-800' :
                    'bg-slate-950 border-slate-800 hover:border-purple-500/50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-black text-white">{costume.name}</span>
                      <span className={`text-[8px] px-1.5 py-0.5 rounded font-bold text-white ${THEME_COLORS[costume.theme]}`}>{THEME_LABELS[costume.theme]}</span>
                      <span className="text-[9px] text-amber-400">{'★'.repeat(costume.quality)}{'☆'.repeat(3 - costume.quality)}</span>
                    </div>
                    <div className="text-right">
                      <span className={`font-black text-sm ${canAfford ? 'text-white' : 'text-red-400'}`}>¥{costume.price.toLocaleString()}</span>
                      {!canAfford && <p className="text-[8px] text-red-500/70 font-bold">资金不足</p>}
                    </div>
                  </div>
                  <p className="text-[10px] text-slate-400 leading-relaxed mb-2">{costume.description}</p>
                  <div className="flex items-center justify-between">
                    <div className="flex gap-1">
                      {costume.moodAffinity.map(m => (
                        <span key={m} className={`text-[8px] px-1.5 py-0.5 rounded font-bold text-white/80 ${MOOD_COLORS_FADED[m]}`}>{MOOD_LABELS[m]}</span>
                      ))}
                    </div>
                    {preview && (
                      <div className="flex items-center gap-1">
                        <span className="text-[9px] text-slate-500 font-bold">共鸣预估</span>
                        <SynergyDisplay synergy={preview} size="sm" />
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  // ========================================
  // Step 4: Confirmation
  // ========================================
  if (step === 'confirm' && selectedMusic && selectedChoreo && selectedCostume) {
    const canAfford = game.money >= totalCost;
    const confirmSynergy = previewSynergy || calculateSynergy(selectedMusic, selectedChoreo, selectedCostume);

    return (
      <div className="space-y-4">
        <StepIndicator current="confirm" />
        <div className="flex items-center justify-between mb-2">
          <div>
            <h4 className="text-sm font-black text-white uppercase tracking-widest">确认编排</h4>
            <p className="text-[10px] text-slate-500">确认你的节目配置</p>
          </div>
          <button onClick={() => setStep('costume')} className="text-[10px] text-slate-500 hover:text-white px-3 py-1.5 rounded-lg bg-slate-800 transition-all">上一步</button>
        </div>

        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-black text-white italic">《{selectedMusic.name}》</h3>
            <SynergyDisplay synergy={confirmSynergy} />
          </div>

          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="bg-slate-900 rounded-xl p-3 border border-slate-800">
              <p className="text-[9px] text-slate-500 font-bold uppercase mb-1">音乐</p>
              <p className="text-xs font-bold text-white">{selectedMusic.name}</p>
              <div className="flex gap-1 mt-1">
                <span className={`text-[8px] px-1.5 py-0.5 rounded font-bold text-white ${MOOD_COLORS[selectedMusic.mood]}`}>{MOOD_LABELS[selectedMusic.mood]}</span>
                <span className="text-[8px] px-1.5 py-0.5 rounded font-bold text-slate-300 bg-slate-700">{STRUCTURE_LABELS[selectedMusic.structure]}</span>
              </div>
            </div>
            <div className="bg-slate-900 rounded-xl p-3 border border-slate-800">
              <p className="text-[9px] text-slate-500 font-bold uppercase mb-1">编舞师</p>
              <p className="text-xs font-bold text-white">{selectedChoreo.portrait} {selectedChoreo.name}</p>
              <span className={`text-[8px] px-1.5 py-0.5 rounded font-bold mt-1 inline-block ${
                selectedChoreo.tier === 'master' ? 'bg-amber-500 text-black' :
                selectedChoreo.tier === 'established' ? 'bg-blue-500 text-white' :
                'bg-slate-700 text-slate-300'
              }`}>{CHOREO_TIER_LABELS[selectedChoreo.tier]} · {CHOREO_TYPE_LABELS[selectedChoreo.type]}</span>
            </div>
            <div className="bg-slate-900 rounded-xl p-3 border border-slate-800">
              <p className="text-[9px] text-slate-500 font-bold uppercase mb-1">服装</p>
              <p className="text-xs font-bold text-white">{selectedCostume.name}</p>
              <span className={`text-[8px] px-1.5 py-0.5 rounded font-bold text-white mt-1 inline-block ${THEME_COLORS[selectedCostume.theme]}`}>{THEME_LABELS[selectedCostume.theme]}</span>
            </div>
          </div>

          {/* Synergy */}
          <div className="bg-slate-900 rounded-xl p-4 border border-slate-800 mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-black text-slate-400 uppercase">共鸣</span>
              <SynergyDisplay synergy={confirmSynergy} />
            </div>
            {confirmSynergy.details.length > 0 ? (
              <div className="flex gap-2 flex-wrap">
                {confirmSynergy.details.map((d, i) => (
                  <span key={i} className="text-[8px] px-2 py-0.5 rounded bg-amber-900/30 text-amber-300 border border-amber-800/30 font-bold">{d}</span>
                ))}
              </div>
            ) : (
              <p className="text-[9px] text-slate-600 italic">音乐、编舞和服装之间缺乏共鸣</p>
            )}
          </div>

          {/* Blueprint Preview */}
          {previewProgram && (
            <div className="bg-slate-900 rounded-xl p-4 border border-slate-800 mb-4">
              <p className="text-[10px] font-black text-slate-400 uppercase mb-3">节目蓝图预览</p>
              <div className="space-y-1.5 max-h-52 overflow-y-auto custom-scrollbar pr-1">
                {previewProgram.blueprint.segments.map((seg, i) => {
                  if (seg.type === 'choreo') {
                    const data = seg.data as { description: string; emotionalBeat: string; impressionScore: number };
                    return (
                      <div key={i} className="flex gap-2.5 items-start">
                        <div className="w-1.5 h-1.5 rounded-full bg-purple-500 mt-1.5 shrink-0" />
                        <div className="min-w-0">
                          <span className="text-[8px] font-black text-purple-400 uppercase">{data.emotionalBeat}</span>
                          <p className="text-[9px] text-slate-400 leading-relaxed">{data.description}</p>
                        </div>
                      </div>
                    );
                  }
                  if (seg.type === 'transition') {
                    const data = seg.data as { description: string; quality: number };
                    return (
                      <div key={i} className="pl-4">
                        <span className="text-[9px] text-slate-600 italic">→ {data.description}</span>
                      </div>
                    );
                  }
                  const elemSeg = seg as any;
                  return (
                    <div key={i} className="flex gap-2.5 items-center">
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
                      <span className="text-[9px] font-bold text-blue-300">#{elemSeg.slotIndex + 1} {elemSeg.recommendation}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Cost Summary */}
          <div className="bg-slate-900 rounded-xl p-4 border border-slate-800">
            <div className="flex justify-between text-[10px] font-bold mb-1">
              <span className="text-slate-500">编舞师费用</span>
              <span className="text-white">¥{selectedChoreo.cost.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-[10px] font-bold mb-2">
              <span className="text-slate-500">服装费用</span>
              <span className="text-white">¥{selectedCostume.price.toLocaleString()}</span>
            </div>
            <div className="border-t border-slate-800 pt-2 flex justify-between text-xs font-black">
              <span className="text-slate-400">合计</span>
              <span className={canAfford ? 'text-white' : 'text-red-400'}>¥{totalCost.toLocaleString()}</span>
            </div>
            {!canAfford && <p className="text-[9px] text-red-400 mt-1">资金不足（当前 ¥{game.money.toLocaleString()}）</p>}
          </div>
        </div>

        <button
          onClick={handleConfirm}
          disabled={!canAfford}
          className={`w-full py-5 rounded-2xl font-black text-lg uppercase tracking-widest transition-all active:scale-95 shadow-xl ${
            canAfford ? 'bg-purple-600 hover:bg-purple-500 text-white' : 'bg-slate-800 text-slate-500 cursor-not-allowed'
          }`}
        >
          确认编排
        </button>
      </div>
    );
  }

  return <div className="text-slate-500 text-center py-8">请返回重新开始</div>;
};

export default ProgramCreator;
