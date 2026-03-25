import React from 'react';
import { GameState } from '../types';
import { MOOD_LABELS, MOOD_COLORS, MOOD_COLORS_FADED, STRUCTURE_LABELS } from '../game/data/music';
import { CHOREO_TYPE_LABELS, CHOREO_TIER_LABELS, getChoreographerById } from '../game/data/choreographers';
import { THEME_LABELS, THEME_COLORS } from '../game/data/costumes';
import SynergyDisplay from './SynergyDisplay';
import ProgramCreator from './ProgramCreator';

interface ProgramTabProps {
  game: GameState;
  setGame: React.Dispatch<React.SetStateAction<GameState>>;
  addLog: (msg: string, type?: any) => void;
  subTab: 'detail' | 'create' | 'costume';
  setSubTab: (tab: 'detail' | 'create' | 'costume') => void;
}

const ProgramTab: React.FC<ProgramTabProps> = ({ game, setGame, addLog, subTab, setSubTab }) => {
  const program = game.skater.programV2;
  const choreoNPC = program ? getChoreographerById(program.choreographerId) : null;
  const costumes = game.market.costumes || [];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex gap-4 mb-4">
        {[
          { k: 'detail', l: '节目总览' },
          { k: 'create', l: '节目编排' },
          { k: 'costume', l: '服装' },
        ].map(s => (
          <button
            key={s.k}
            onClick={() => setSubTab(s.k as any)}
            className={`px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${
              subTab === s.k ? 'bg-white text-slate-950 shadow-lg' : 'bg-slate-900 text-slate-500 hover:text-slate-300'
            }`}
          >
            {s.l}
          </button>
        ))}
      </div>

      {/* ===== Detail Sub-tab ===== */}
      {subTab === 'detail' && (
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-[3rem] shadow-2xl">
          {program ? (
            <div className="space-y-4">
              {/* === Header Banner: Name + Synergy + Maturity === */}
              <div className="flex items-center gap-6 p-4 bg-slate-950/60 rounded-2xl border border-slate-800">
                <div className="flex-1 min-w-0">
                  <h3 className="text-2xl font-black text-white italic tracking-tight truncate">《{program.name}》</h3>
                  <p className="text-[10px] text-slate-500 mt-0.5 font-bold uppercase tracking-wider">
                    演出 {program.totalRuns} 次
                  </p>
                </div>
                <SynergyDisplay synergy={program.synergy} />
                <div className="flex items-center gap-3 pl-4 border-l border-slate-800">
                  <div>
                    <p className="text-[9px] text-slate-500 font-black uppercase tracking-wider">成熟度</p>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="w-24 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-pink-600 to-pink-400 rounded-full transition-all" style={{ width: `${program.maturity}%` }} />
                      </div>
                      <span className="text-sm font-black text-pink-400 font-mono">{program.maturity.toFixed(0)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* === Two-Column: Info Cards (left) + Blueprint (right) === */}
              <div className="grid grid-cols-12 gap-4">
                {/* --- Left Column: Music / Choreo / Costume / Synergy --- */}
                <div className="col-span-5 space-y-3">
                  {/* Music */}
                  <div className="bg-slate-950 rounded-2xl p-4 border border-slate-800">
                    <p className="text-[9px] text-slate-500 font-black uppercase tracking-wider mb-2">音乐</p>
                    <p className="text-sm font-black text-white mb-1.5">{program.music.name}</p>
                    <div className="flex gap-1.5 mb-2">
                      <span className={`text-[8px] px-1.5 py-0.5 rounded font-bold text-white ${MOOD_COLORS[program.music.mood]}`}>
                        {MOOD_LABELS[program.music.mood]}
                      </span>
                      <span className="text-[8px] px-1.5 py-0.5 rounded font-bold text-slate-300 bg-slate-700">
                        {STRUCTURE_LABELS[program.music.structure]}
                      </span>
                    </div>
                    <p className="text-[9px] text-slate-400 leading-relaxed">{program.music.description}</p>
                    <div className="flex gap-0.5 mt-2 items-end h-5">
                      {program.music.energyCurve.map((e, i) => (
                        <div key={i} className="flex-1 bg-blue-500/40 rounded-sm" style={{ height: `${e * 100}%` }} />
                      ))}
                    </div>
                  </div>

                  {/* Choreographer */}
                  <div className="bg-slate-950 rounded-2xl p-4 border border-slate-800">
                    <p className="text-[9px] text-slate-500 font-black uppercase tracking-wider mb-2">编舞师</p>
                    {choreoNPC ? (
                      <>
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className="text-xl">{choreoNPC.portrait}</span>
                          <span className="text-sm font-black text-white">{choreoNPC.name}</span>
                          <span className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded ${
                            choreoNPC.tier === 'master' ? 'bg-amber-500 text-black' :
                            choreoNPC.tier === 'established' ? 'bg-blue-500 text-white' :
                            'bg-slate-700 text-slate-300'
                          }`}>{CHOREO_TIER_LABELS[choreoNPC.tier]}</span>
                          <span className="text-[8px] font-bold text-slate-500 bg-slate-800 px-1.5 py-0.5 rounded">
                            {CHOREO_TYPE_LABELS[choreoNPC.type]}
                          </span>
                        </div>
                        <p className="text-[9px] text-slate-400 italic leading-relaxed mb-2">"{choreoNPC.quote}"</p>
                        <div className="flex gap-3 text-[9px]">
                          <span className="text-slate-500">过渡 <span className="text-white font-bold">{(choreoNPC.transitionQuality * 100).toFixed(0)}</span></span>
                          <span className="text-slate-500">编舞 <span className="text-white font-bold">{(choreoNPC.choreoQuality * 100).toFixed(0)}</span></span>
                        </div>
                      </>
                    ) : (
                      <p className="text-xs text-slate-500 italic">未知编舞师</p>
                    )}
                  </div>

                  {/* Costume */}
                  <div className="bg-slate-950 rounded-2xl p-4 border border-slate-800">
                    <p className="text-[9px] text-slate-500 font-black uppercase tracking-wider mb-2">服装</p>
                    <div className="flex items-center gap-2 mb-1.5">
                      <p className="text-sm font-black text-white">{program.costume.name}</p>
                      <span className={`text-[8px] px-1.5 py-0.5 rounded font-bold text-white ${THEME_COLORS[program.costume.theme]}`}>
                        {THEME_LABELS[program.costume.theme]}
                      </span>
                      <span className="text-[9px] text-amber-400">{'★'.repeat(program.costume.quality)}{'☆'.repeat(3 - program.costume.quality)}</span>
                    </div>
                    <p className="text-[9px] text-slate-400 leading-relaxed mb-2">{program.costume.description}</p>
                    <div className="flex gap-1 flex-wrap">
                      {program.costume.moodAffinity.map(m => (
                        <span key={m} className={`text-[8px] px-1.5 py-0.5 rounded font-bold text-white/80 ${MOOD_COLORS_FADED[m]}`}>
                          {MOOD_LABELS[m]}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Synergy details */}
                  <div className="bg-slate-950 rounded-2xl p-4 border border-slate-800">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-[9px] text-slate-500 font-black uppercase tracking-wider">共鸣</span>
                      <SynergyDisplay synergy={program.synergy} size="sm" />
                    </div>
                    {program.synergy.details.length > 0 ? (
                      <div className="flex gap-1.5 flex-wrap">
                        {program.synergy.details.map((d, i) => (
                          <span key={i} className="text-[8px] px-2 py-0.5 rounded bg-amber-900/30 text-amber-300 border border-amber-800/30 font-bold">{d}</span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-[9px] text-slate-600 italic">音乐、编舞和服装之间缺乏共鸣</p>
                    )}
                  </div>
                </div>

                {/* --- Right Column: Blueprint Timeline --- */}
                <div className="col-span-7 bg-slate-950 rounded-2xl p-5 border border-slate-800 flex flex-col">
                  <p className="text-[9px] text-slate-500 font-black uppercase tracking-wider mb-3">节目蓝图</p>
                  <div className="space-y-2 flex-1 overflow-y-auto custom-scrollbar pr-1" style={{ maxHeight: 'calc(100vh - 320px)' }}>
                    {program.blueprint.segments.map((seg, i) => {
                      if (seg.type === 'choreo') {
                        const data = seg.data as { description: string; emotionalBeat: string; impressionScore: number };
                        return (
                          <div key={i} className="flex gap-3 items-start">
                            <div className="w-2 h-2 rounded-full bg-purple-500 mt-1.5 shrink-0" />
                            <div className="min-w-0">
                              <span className="text-[8px] font-black text-purple-400 uppercase">{data.emotionalBeat}</span>
                              <span className="text-[8px] text-slate-600 ml-2">印象 {(data.impressionScore * 100).toFixed(0)}</span>
                              <p className="text-[10px] text-slate-400 leading-relaxed">{data.description}</p>
                            </div>
                          </div>
                        );
                      }
                      if (seg.type === 'transition') {
                        const data = seg.data as { description: string; quality: number };
                        return (
                          <div key={i} className="pl-5">
                            <span className="text-[9px] text-slate-600 italic">→ {data.description}</span>
                            <span className="text-[8px] text-slate-700 ml-2">质感 {(data.quality * 100).toFixed(0)}</span>
                          </div>
                        );
                      }
                      const elemSeg = seg as any;
                      return (
                        <div key={i} className="flex gap-3 items-center">
                          <div className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />
                          <span className="text-[10px] font-bold text-blue-300">#{elemSeg.slotIndex + 1} {elemSeg.recommendation}</span>
                          <span className="text-[8px] text-slate-600 uppercase">{elemSeg.phase}</span>
                        </div>
                      );
                    })}
                  </div>
                  {/* Blueprint summary */}
                  <div className="flex gap-4 mt-3 pt-3 border-t border-slate-800 text-[9px]">
                    <span className="text-slate-500">整体过渡质感 <span className="text-white font-bold">{(program.blueprint.totalTransitionQuality * 100).toFixed(0)}</span></span>
                    <span className="text-slate-500">编舞印象 <span className="text-white font-bold">{(program.blueprint.totalChoreoImpression * 100).toFixed(0)}</span></span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="text-5xl mb-6 opacity-30">🎵</div>
              <h3 className="text-xl font-black text-white mb-3">尚未编排节目</h3>
              <p className="text-sm text-slate-500 mb-8">选择音乐、编舞师和服装，创建你的第一个节目。</p>
              <button
                onClick={() => setSubTab('create')}
                className="bg-purple-600 hover:bg-purple-500 text-white px-10 py-4 rounded-2xl font-black text-sm uppercase tracking-widest transition-all active:scale-95 shadow-lg"
              >
                开始编排
              </button>
            </div>
          )}
        </div>
      )}

      {/* ===== Create Sub-tab ===== */}
      {subTab === 'create' && (
        <div className="bg-slate-900 border border-slate-800 p-10 rounded-[3rem] shadow-2xl">
          <h3 className="text-sm font-black uppercase text-slate-400 mb-8 tracking-widest">节目编排</h3>
          <ProgramCreator game={game} setGame={setGame} addLog={addLog} />
        </div>
      )}

      {/* ===== Costume Sub-tab ===== */}
      {subTab === 'costume' && (
        <div className="bg-slate-900 border border-slate-800 p-10 rounded-[3rem] shadow-2xl">
          <h3 className="text-sm font-black uppercase text-slate-400 mb-8 tracking-widest">服装</h3>

          {/* Current costume */}
          {program && (
            <div className="mb-8">
              <p className="text-[9px] text-slate-500 font-black uppercase tracking-wider mb-3">当前节目服装</p>
              <div className="bg-slate-950 rounded-2xl p-5 border-2 border-purple-800/30">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-black text-white">{program.costume.name}</span>
                    <span className={`text-[8px] px-1.5 py-0.5 rounded font-bold text-white ${THEME_COLORS[program.costume.theme]}`}>
                      {THEME_LABELS[program.costume.theme]}
                    </span>
                    <span className="text-[9px] text-amber-400">{'★'.repeat(program.costume.quality)}{'☆'.repeat(3 - program.costume.quality)}</span>
                  </div>
                  <span className="text-[8px] text-purple-400 font-bold uppercase">使用中</span>
                </div>
                <p className="text-[10px] text-slate-400 leading-relaxed mb-2">{program.costume.description}</p>
                <div className="flex gap-1">
                  {program.costume.moodAffinity.map(m => (
                    <span key={m} className={`text-[8px] px-1.5 py-0.5 rounded font-bold text-white/80 ${MOOD_COLORS_FADED[m]}`}>
                      {MOOD_LABELS[m]}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Market costumes */}
          <p className="text-[9px] text-slate-500 font-black uppercase tracking-wider mb-3">市场服装 <span className="text-slate-700 normal-case">（每 4 个月刷新）</span></p>
          {costumes.length === 0 ? (
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-8 text-center">
              <p className="text-slate-500 text-sm">暂无服装可选</p>
            </div>
          ) : (
            <div className="space-y-3">
              {costumes.map(costume => (
                <div key={costume.id} className="bg-slate-950 p-5 rounded-2xl border border-slate-800">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-black text-white">{costume.name}</span>
                      <span className={`text-[8px] px-1.5 py-0.5 rounded font-bold text-white ${THEME_COLORS[costume.theme]}`}>
                        {THEME_LABELS[costume.theme]}
                      </span>
                      <span className="text-[9px] text-amber-400">{'★'.repeat(costume.quality)}{'☆'.repeat(3 - costume.quality)}</span>
                    </div>
                    <span className="font-black text-sm text-white">¥{costume.price.toLocaleString()}</span>
                  </div>
                  <p className="text-[10px] text-slate-400 leading-relaxed mb-2">{costume.description}</p>
                  <div className="flex gap-1">
                    {costume.moodAffinity.map(m => (
                      <span key={m} className={`text-[8px] px-1.5 py-0.5 rounded font-bold text-white/80 ${MOOD_COLORS_FADED[m]}`}>
                        {MOOD_LABELS[m]}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          <p className="text-[9px] text-slate-600 text-center mt-6 italic">服装在创建节目时选择，暂不支持单独更换</p>
        </div>
      )}
    </div>
  );
};

export default ProgramTab;
