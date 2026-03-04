import React, { useState } from 'react';
import { GameState, PlayerAttributes, JumpType, SpinType } from '../types';
import { getJumpKey, ALL_JUMP_TYPES, ALL_SPIN_TYPES, JUMP_ROTATION_THRESHOLDS } from '../game/data/technique';
import { getVariant } from '../game/data/variants';
import { getStyleTag } from '../game/data/styleTags';
import { estimateSuccessRate } from '../game/scoring';
import { ACTION_LIBRARY } from '../game/data/actions';

interface TechProfileProps {
  game: GameState;
  displayAttributes: PlayerAttributes | null;
  onClose: () => void;
}

const JUMP_FULL: Record<JumpType, string> = { axel: 'Axel', toeloop: 'Toeloop', salchow: 'Salchow', loop: 'Loop', flip: 'Flip', lutz: 'Lutz' };
const JUMP_SHORT: Record<JumpType, string> = { toeloop: 'T', salchow: 'S', loop: 'Lo', flip: 'F', lutz: 'Lz', axel: 'A' };
const SPIN_NAMES: Record<SpinType, string> = { upright: '直立旋转', sit: '蹲踞旋转', camel: '燕式旋转', combo: '联合旋转', flying: '跳接旋转' };

const RotDots: React.FC<{ n: number }> = ({ n }) => (
  <span className="font-mono text-sm tracking-wide">
    {[0,1,2,3].map(i => <span key={i} className={i < n ? 'text-blue-400' : 'text-slate-700'}>{i < n ? '●' : '○'}</span>)}
  </span>
);

/* ── Detail Modal (Instagram-style overlay) ── */
const DetailModal: React.FC<{ onClose: () => void; title: string; accent: string; children: React.ReactNode }> = ({ onClose, title, accent, children }) => (
  <div className="fixed inset-0 z-[200] flex items-center justify-center" onClick={onClose}>
    {/* backdrop */}
    <div className="absolute inset-0 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200" />
    {/* card */}
    <div
      onClick={e => e.stopPropagation()}
      className="relative z-10 w-[420px] max-h-[80vh] bg-slate-900 border border-slate-700/60 rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 fade-in duration-200"
    >
      {/* modal header */}
      <div className={`flex items-center justify-between px-6 py-4 border-b border-slate-800 shrink-0`}>
        <h3 className={`text-base font-black ${accent}`}>{title}</h3>
        <button onClick={onClose} className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center text-lg transition-all">×</button>
      </div>
      {/* modal body */}
      <div className="flex-1 overflow-y-auto px-6 py-5 custom-scrollbar">
        {children}
      </div>
    </div>
  </div>
);

/* ── Jump Detail Content ── */
const JumpDetail: React.FC<{ jt: JumpType; technique: NonNullable<GameState['skater']['technique']>; displayAttributes: PlayerAttributes | null }> = ({ jt, technique, displayAttributes }) => {
  const card = technique.jumps[jt];
  const maxRot = card?.maxRotation || 1;

  return (
    <>
      {/* Proficiency bars for all rotations */}
      {[1,2,3,4].map(r => {
        const rKey = getJumpKey(jt, r);
        const rProf = card?.proficiency[rKey] || 0;
        const isLearned = r <= maxRot;
        const threshold = JUMP_ROTATION_THRESHOLDS[jt]?.[r-1] || 0;
        const bodyJump = displayAttributes?.jump || 0;
        const isLocked = !isLearned && bodyJump < threshold;

        if (isLocked) {
          return (
            <div key={r} className="flex items-center gap-3 mb-3 opacity-40">
              <span className="text-xs font-bold text-slate-600 w-8">{r}{JUMP_SHORT[jt]}</span>
              <span className="text-xs text-slate-600">&#x1F512; 需要爆发 ≥ {threshold}（当前 {bodyJump.toFixed(0)}）</span>
            </div>
          );
        }

        const bv = ACTION_LIBRARY.find(a => a.techReq?.jumpType === jt && a.techReq?.rotation === r && !a.techReq?.comboSuffix)?.baseScore || 0;
        const status = rProf >= 80 ? '已掌握' : rProf >= 40 ? '训练中' : isLearned ? '初学' : '';

        return (
          <div key={r} className="flex items-center gap-3 mb-3">
            <span className="text-xs font-bold text-slate-300 w-8">{rKey}</span>
            <div className="flex-1 h-3 bg-slate-800 rounded-full overflow-hidden">
              <div className={`h-full rounded-full transition-all ${rProf >= 80 ? 'bg-emerald-500' : rProf >= 60 ? 'bg-blue-500' : rProf >= 40 ? 'bg-amber-500' : 'bg-red-500'}`} style={{ width: `${rProf}%` }}></div>
            </div>
            <span className={`text-xs font-mono font-bold w-10 text-right ${rProf >= 80 ? 'text-emerald-400' : rProf >= 60 ? 'text-white' : rProf >= 40 ? 'text-amber-400' : 'text-red-400'}`}>{rProf.toFixed(0)}%</span>
            <span className="text-[10px] text-slate-500 w-14">BV {bv.toFixed(1)}</span>
            <span className={`text-[10px] font-bold w-12 ${rProf >= 80 ? 'text-emerald-500' : rProf >= 40 ? 'text-blue-400' : 'text-slate-600'}`}>{status}</span>
          </div>
        );
      })}

      {/* Combo pairings */}
      {technique.comboProficiency && (
        <div className="mt-4 pt-4 border-t border-slate-800">
          <p className="text-[10px] font-black text-slate-500 uppercase mb-2">连跳搭配</p>
          {['+2T', '+3T'].map(suffix => {
            const comboAction = ACTION_LIBRARY.find(a =>
              a.techReq?.jumpType === jt && a.techReq?.rotation === maxRot && a.techReq?.comboSuffix === suffix
            );
            if (!comboAction) return null;
            const sr = estimateSuccessRate(comboAction, technique);
            return (
              <div key={suffix} className="flex items-center gap-3 mb-1.5">
                <span className="text-xs text-slate-300 font-bold w-24">{maxRot}{JUMP_SHORT[jt]}{suffix}</span>
                <span className={`text-xs font-mono font-bold ${sr >= 70 ? 'text-emerald-400' : sr >= 50 ? 'text-amber-400' : 'text-red-400'}`}>成功率 {sr}%</span>
                <span className="text-[10px] text-slate-500">BV {comboAction.baseScore.toFixed(1)}</span>
                {sr < 50 && <span className="text-amber-400 text-xs">&#x26A0;&#xFE0F; 高风险</span>}
              </div>
            );
          })}
        </div>
      )}

      {/* GOE */}
      <div className="mt-3 pt-3 border-t border-slate-800 flex items-center gap-3">
        <span className="text-[10px] text-slate-500">GOE修正</span>
        <span className={`text-xs font-black ${(card?.goeBonus || 0) > 0 ? 'text-emerald-400' : (card?.goeBonus || 0) < 0 ? 'text-red-400' : 'text-slate-600'}`}>
          {(card?.goeBonus || 0) > 0 ? '+' : ''}{(card?.goeBonus || 0).toFixed(2)}
        </span>
      </div>

      {/* Variants */}
      {(card?.variants?.length || 0) > 0 && (
        <div className="mt-3 pt-3 border-t border-slate-800">
          <p className="text-[10px] font-black text-amber-500 mb-1">已解锁变体</p>
          {card!.variants.map(vId => {
            const v = getVariant(vId);
            return v ? <div key={vId} className="flex gap-2 mb-0.5"><span className="text-xs text-amber-300 font-bold">{v.name}</span><span className="text-[10px] text-slate-500">BV x{v.bvMultiplier} | 风险+{(v.riskModifier*100).toFixed(0)}%</span></div> : null;
          })}
        </div>
      )}

      {/* Style tags */}
      {(card?.styleTags?.length || 0) > 0 && (
        <div className="mt-3 pt-3 border-t border-slate-800">
          <p className="text-[10px] font-black text-purple-500 mb-1">风格标签</p>
          {card!.styleTags.map(tId => {
            const t = getStyleTag(tId);
            return t ? <div key={tId} className="mb-1"><span className="text-xs text-purple-300 font-bold">{t.name}</span> <span className="text-[10px] text-emerald-500">GOE+{t.goeImpact.toFixed(1)}</span> <span className="text-[9px] text-slate-600 italic">"{t.description}"</span></div> : null;
          })}
        </div>
      )}
    </>
  );
};

/* ── Spin Detail Content ── */
const SpinDetail: React.FC<{ st: SpinType; technique: NonNullable<GameState['skater']['technique']> }> = ({ st, technique }) => {
  const card = technique.spins[st];
  return (
    <>
      <div className="flex items-center gap-3 mb-3">
        <span className="text-[10px] text-slate-500">等级</span>
        <span className="text-sm font-black text-indigo-400">Lv{card?.level || 1}</span>
      </div>
      <div className="flex items-center gap-3 mb-3">
        <span className="text-[10px] text-slate-500">熟练度</span>
        <div className="flex-1 h-3 bg-slate-800 rounded-full overflow-hidden">
          <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${card?.proficiency||0}%` }}></div>
        </div>
        <span className="text-xs font-mono font-bold text-slate-300">{(card?.proficiency||0).toFixed(0)}%</span>
      </div>
      <div className="flex items-center gap-3 mb-3">
        <span className="text-[10px] text-slate-500">GOE修正</span>
        <span className={`text-xs font-black ${(card?.goeBonus||0) > 0 ? 'text-emerald-400' : 'text-slate-600'}`}>{(card?.goeBonus||0) > 0 ? '+' : ''}{(card?.goeBonus||0).toFixed(2)}</span>
      </div>
      {(card?.variants?.length||0) > 0 && (
        <div className="pt-3 border-t border-slate-800 mb-3">
          <p className="text-[10px] font-black text-amber-500 mb-1.5">已解锁变体</p>
          {card!.variants.map(vId => { const v = getVariant(vId); return v ? <div key={vId} className="flex gap-2 mb-1"><span className="text-xs text-amber-300 font-bold">{v.name}</span><span className="text-[10px] text-slate-500">BV x{v.bvMultiplier}</span></div> : null; })}
        </div>
      )}
      {(card?.styleTags?.length||0) > 0 && (
        <div className="pt-3 border-t border-slate-800">
          <p className="text-[10px] font-black text-purple-500 mb-1.5">风格标签</p>
          {card!.styleTags.map(tId => { const t = getStyleTag(tId); return t ? <div key={tId} className="mb-1"><span className="text-xs text-purple-300 font-bold">{t.name}</span> <span className="text-[10px] text-emerald-500">GOE+{t.goeImpact.toFixed(1)}</span> <span className="text-[9px] text-slate-600 italic">"{t.description}"</span></div> : null; })}
        </div>
      )}
    </>
  );
};

/* ── Main TechProfile ── */
const TechProfile: React.FC<TechProfileProps> = ({ game, displayAttributes, onClose }) => {
  const technique = game.skater.technique;
  const [selectedJump, setSelectedJump] = useState<JumpType | null>(null);
  const [selectedSpin, setSelectedSpin] = useState<SpinType | null>(null);

  if (!technique) return null;

  return (
    <div className="fixed inset-0 z-[120] bg-slate-950/95 backdrop-blur-md flex items-center justify-center p-6 animate-in fade-in duration-300">
      <div className="max-w-3xl w-full max-h-[90vh] bg-slate-900 border border-slate-800 rounded-[2.5rem] shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-10 pt-8 pb-4 border-b border-slate-800 shrink-0">
          <div>
            <h2 className="text-2xl font-black text-white tracking-tighter">技术档案</h2>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{game.skater.name} | {game.skater.age.toFixed(1)} 岁</p>
          </div>
          <button onClick={onClose} className="w-10 h-10 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center text-xl transition-all">×</button>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto px-10 py-6 custom-scrollbar">

          {/* === JUMPS === */}
          <section className="mb-8">
            <h3 className="text-xs font-black text-slate-500 uppercase tracking-[0.3em] mb-3">跳跃</h3>
            <div className="space-y-1">
              {ALL_JUMP_TYPES.map(jt => {
                const card = technique.jumps[jt];
                const maxRot = card?.maxRotation || 1;
                const topKey = getJumpKey(jt, maxRot);
                const topProf = card?.proficiency[topKey] || 0;
                const isWarn = topProf > 0 && topProf < 50;

                return (
                  <div
                    key={jt}
                    onClick={() => setSelectedJump(jt)}
                    className="flex items-center gap-4 px-4 py-2.5 rounded-xl cursor-pointer transition-all hover:bg-slate-800/60 hover:ring-1 hover:ring-blue-500/30 active:scale-[0.98]"
                  >
                    <span className="text-sm font-black text-slate-200 w-20">{JUMP_FULL[jt]}</span>
                    <RotDots n={maxRot} />
                    <span className="text-xs text-slate-500 flex-1">{maxRot}{JUMP_SHORT[jt]} 最高</span>
                    <span className="text-xs text-slate-600 mr-1">熟练度</span>
                    <span className={`text-sm font-mono font-black w-10 text-right ${topProf >= 80 ? 'text-emerald-400' : topProf >= 60 ? 'text-white' : topProf >= 40 ? 'text-amber-400' : 'text-red-400'}`}>
                      {topProf.toFixed(0)}%
                    </span>
                    {isWarn && <span className="text-amber-400 text-sm">&#x26A0;&#xFE0F;</span>}
                  </div>
                );
              })}
            </div>
          </section>

          {/* === SPINS === */}
          <section className="mb-8">
            <h3 className="text-xs font-black text-slate-500 uppercase tracking-[0.3em] mb-3">旋转</h3>
            <div className="space-y-1">
              {ALL_SPIN_TYPES.map(st => {
                const card = technique.spins[st];
                const variantNames = (card?.variants || []).map(vId => getVariant(vId)?.name).filter(Boolean);

                return (
                  <div
                    key={st}
                    onClick={() => setSelectedSpin(st)}
                    className="flex items-center gap-4 px-4 py-2 rounded-xl cursor-pointer transition-all hover:bg-slate-800/60 hover:ring-1 hover:ring-indigo-500/30 active:scale-[0.98]"
                  >
                    <span className="text-xs font-bold text-slate-200 w-20">{SPIN_NAMES[st]}</span>
                    <span className="text-xs font-black text-indigo-400 w-10">Lv{card?.level || 1}</span>
                    <span className="text-xs text-slate-500 flex-1 truncate">{variantNames.length > 0 ? variantNames.join(', ') : '—'}</span>
                    <span className={`text-xs font-mono font-bold ${(card?.proficiency||0) >= 70 ? 'text-emerald-400' : (card?.proficiency||0) >= 50 ? 'text-white' : 'text-amber-400'}`}>{(card?.proficiency||0).toFixed(0)}%</span>
                  </div>
                );
              })}
            </div>
          </section>

          {/* === STEPS === */}
          <section className="mb-8">
            <h3 className="text-xs font-black text-slate-500 uppercase tracking-[0.3em] mb-3">接续步</h3>
            <div className="flex items-center gap-4 px-4 py-2.5 bg-slate-950/50 rounded-xl">
              <span className="text-xs font-bold text-cyan-400">接续步</span>
              <span className="text-xs font-black text-white">Lv{technique.steps?.level || 1}</span>
              <div className="flex-1 h-2.5 bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-cyan-500 rounded-full" style={{ width: `${technique.steps?.proficiency||0}%` }}></div>
              </div>
              <span className="text-xs font-mono text-slate-300">{(technique.steps?.proficiency||0).toFixed(0)}%</span>
              <span className="text-[10px] text-slate-500">GOE {(technique.steps?.goeBonus||0) > 0 ? '+' : ''}{(technique.steps?.goeBonus||0).toFixed(2)}</span>
            </div>
          </section>

          {/* === COMBO PROFICIENCY === */}
          {technique.comboProficiency && (
            <section className="mb-8">
              <h3 className="text-xs font-black text-slate-500 uppercase tracking-[0.3em] mb-3">连跳能力</h3>
              <div className="flex gap-4 px-4">
                {Object.entries(technique.comboProficiency).map(([suffix, rawProf]) => {
                  const prof = rawProf as number;
                  return (
                    <div key={suffix} className="flex-1 bg-slate-950 rounded-xl p-3 border border-slate-800 text-center">
                      <span className="text-sm font-black text-rose-400 block mb-1">{suffix}</span>
                      <div className="h-2 bg-slate-800 rounded-full overflow-hidden mb-1">
                        <div className={`h-full rounded-full ${prof >= 70 ? 'bg-emerald-500' : prof >= 40 ? 'bg-amber-500' : 'bg-red-500'}`} style={{ width: `${prof}%` }}></div>
                      </div>
                      <span className={`text-sm font-mono font-black ${prof >= 70 ? 'text-emerald-400' : prof >= 40 ? 'text-amber-400' : 'text-red-400'}`}>{prof.toFixed(0)}%</span>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* === STYLE TAGS === */}
          {(() => {
            const allTags: { id: string; source: string }[] = [];
            ALL_JUMP_TYPES.forEach(jt => (technique.jumps[jt]?.styleTags||[]).forEach(t => allTags.push({ id: t, source: JUMP_SHORT[jt] })));
            ALL_SPIN_TYPES.forEach(st => (technique.spins[st]?.styleTags||[]).forEach(t => allTags.push({ id: t, source: SPIN_NAMES[st] })));
            (technique.steps?.styleTags||[]).forEach(t => allTags.push({ id: t, source: '步法' }));
            if (allTags.length === 0) return null;
            return (
              <section>
                <h3 className="text-xs font-black text-slate-500 uppercase tracking-[0.3em] mb-3">风格标签</h3>
                <div className="flex gap-2 flex-wrap px-2">
                  {allTags.map(({ id, source }) => {
                    const t = getStyleTag(id);
                    if (!t) return null;
                    const cls = t.rarity === 'legendary' ? 'bg-amber-900/40 text-amber-300 border-amber-700/50' : t.rarity === 'rare' ? 'bg-purple-900/40 text-purple-300 border-purple-700/50' : 'bg-slate-800 text-slate-300 border-slate-700';
                    return <span key={`${id}-${source}`} className={`text-[10px] font-bold px-3 py-1 rounded-full border ${cls}`} title={`${t.description} | GOE+${t.goeImpact} | ${source}`}>{t.name}</span>;
                  })}
                </div>
              </section>
            );
          })()}
        </div>
      </div>

      {/* ── Jump Detail Modal ── */}
      {selectedJump && (
        <DetailModal
          onClose={() => setSelectedJump(null)}
          title={`${JUMP_FULL[selectedJump]} — ${technique.jumps[selectedJump]?.maxRotation || 1}${JUMP_SHORT[selectedJump]}`}
          accent="text-blue-400"
        >
          <JumpDetail jt={selectedJump} technique={technique} displayAttributes={displayAttributes} />
        </DetailModal>
      )}

      {/* ── Spin Detail Modal ── */}
      {selectedSpin && (
        <DetailModal
          onClose={() => setSelectedSpin(null)}
          title={SPIN_NAMES[selectedSpin]}
          accent="text-indigo-400"
        >
          <SpinDetail st={selectedSpin} technique={technique} />
        </DetailModal>
      )}
    </div>
  );
};

export default TechProfile;
