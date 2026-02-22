import React from 'react';
import { GameState, TrainingTaskType, Equipment, JumpType, TrainingMode } from '../types';
import { TRAINING_TASKS } from '../game/data/training';
import { TrainingResult } from '../game/training';

interface DevelopmentTabProps {
  game: GameState;
  devSubTab: 'train' | 'coach' | 'equip' | 'choreo';
  setDevSubTab: (tab: 'train' | 'coach' | 'equip' | 'choreo') => void;
  statsPreview: TrainingResult;
  draggedTask: TrainingTaskType | null;
  setDraggedTask: (task: TrainingTaskType | null) => void;
  setGame: React.Dispatch<React.SetStateAction<GameState>>;
  addLog: (msg: string, type?: any) => void;
  buyItem: (item: Equipment) => void;
}

const JUMP_LABELS: Record<JumpType, { full: string; short: string }> = {
  toeloop: { full: 'Toeloop', short: 'T' },
  salchow: { full: 'Salchow', short: 'S' },
  loop:    { full: 'Loop',    short: 'Lo' },
  flip:    { full: 'Flip',    short: 'F' },
  lutz:    { full: 'Lutz',    short: 'Lz' },
  axel:    { full: 'Axel',    short: 'A' },
};

const ALL_JUMPS: JumpType[] = ['toeloop', 'salchow', 'loop', 'flip', 'lutz', 'axel'];

const MODE_INFO: Record<TrainingMode, { label: string; desc: string; color: string }> = {
  stability:  { label: '稳定优先', desc: '熟练度 ×1.2 · GOE ×0.5', color: 'bg-emerald-600' },
  balanced:   { label: '均衡',     desc: '熟练度 ×1.0 · GOE ×1.0', color: 'bg-blue-600' },
  refinement: { label: '精雕细琢', desc: '熟练度 ×0.6 · GOE ×2.0', color: 'bg-purple-600' },
};

const allTasks = Object.values(TRAINING_TASKS);

const DevelopmentTab: React.FC<DevelopmentTabProps> = ({ game, devSubTab, setDevSubTab, statsPreview, draggedTask, setDraggedTask, setGame, addLog, buyItem }) => {
  const focus = game.trainingFocus;

  const setFocusField = (patch: Partial<typeof focus>) => {
    setGame(prev => ({ ...prev, trainingFocus: { ...prev.trainingFocus, ...patch } }));
  };

  const handleJumpClick = (jt: JumpType) => {
    if (focus.primaryJump === jt) {
      // Clicking primary again → demote to secondary, promote secondary to primary
      setFocusField({ primaryJump: focus.secondaryJump, secondaryJump: jt });
    } else if (focus.secondaryJump === jt) {
      // Clicking secondary → promote to primary, old primary becomes secondary
      setFocusField({ primaryJump: jt, secondaryJump: focus.primaryJump });
    } else {
      // Clicking unselected → becomes new secondary
      setFocusField({ secondaryJump: jt });
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex gap-4 mb-4">
        {[{ k: 'train', l: '训练' }, { k: 'coach', l: '团队' }, { k: 'equip', l: '装备' }, { k: 'choreo', l: '编排' }].map(s => (
          <button key={s.k} onClick={() => setDevSubTab(s.k as any)} className={`px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${devSubTab === s.k ? 'bg-white text-slate-950 shadow-lg' : 'bg-slate-900 text-slate-500 hover:text-slate-300'}`}>{s.l}</button>
        ))}
      </div>

      {devSubTab === 'train' && (
        <div className="bg-slate-900 border border-slate-800 p-10 rounded-[3rem] shadow-2xl">

          {/* === Training Focus Panel === */}
          <div className="mb-8 p-5 bg-slate-950/60 rounded-2xl border border-slate-800">
            <h4 className="text-[10px] font-black uppercase text-slate-500 tracking-widest mb-4">训练重心</h4>

            {/* Jump Focus Chips */}
            <div className="mb-4">
              <p className="text-[9px] text-slate-600 mb-2 font-bold uppercase tracking-wider">跳跃重心 <span className="text-slate-700 normal-case">（点击选择主攻/副攻）</span></p>
              <div className="flex gap-2">
                {ALL_JUMPS.map(jt => {
                  const isPrimary = focus.primaryJump === jt;
                  const isSecondary = focus.secondaryJump === jt;
                  return (
                    <button
                      key={jt}
                      onClick={() => handleJumpClick(jt)}
                      className={`flex-1 py-2.5 rounded-xl text-xs font-black transition-all active:scale-95 ${
                        isPrimary ? 'bg-rose-600 text-white ring-2 ring-rose-400/50 shadow-lg shadow-rose-600/20' :
                        isSecondary ? 'bg-rose-900/60 text-rose-300 ring-1 ring-rose-700/50' :
                        'bg-slate-800 text-slate-500 hover:bg-slate-700 hover:text-slate-300'
                      }`}
                    >
                      <span className="block text-[10px] font-mono">{JUMP_LABELS[jt].short}</span>
                      <span className="block text-[8px] mt-0.5 opacity-70">{JUMP_LABELS[jt].full}</span>
                    </button>
                  );
                })}
              </div>
              <div className="flex gap-4 mt-2 text-[9px]">
                <span className="text-rose-400 font-bold">● 主攻 {JUMP_LABELS[focus.primaryJump].full} <span className="text-slate-600 font-normal">（60%收益）</span></span>
                <span className="text-rose-300/60 font-bold">● 副攻 {JUMP_LABELS[focus.secondaryJump].full} <span className="text-slate-600 font-normal">（30%收益）</span></span>
              </div>
            </div>

            {/* Training Mode Toggle */}
            <div>
              <p className="text-[9px] text-slate-600 mb-2 font-bold uppercase tracking-wider">训练模式</p>
              <div className="flex gap-2">
                {(['stability', 'balanced', 'refinement'] as TrainingMode[]).map(m => {
                  const info = MODE_INFO[m];
                  const isActive = focus.mode === m;
                  return (
                    <button
                      key={m}
                      onClick={() => setFocusField({ mode: m })}
                      className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-black transition-all active:scale-95 ${
                        isActive ? `${info.color} text-white ring-2 ring-white/20 shadow-lg` :
                        'bg-slate-800 text-slate-500 hover:bg-slate-700 hover:text-slate-300'
                      }`}
                    >
                      {info.label}
                    </button>
                  );
                })}
              </div>
              <p className="text-[9px] text-slate-600 mt-1.5">{MODE_INFO[focus.mode].desc}</p>
            </div>
          </div>

          {/* === Stats Preview === */}
          <h3 className="text-sm font-black uppercase text-slate-400 mb-6 tracking-widest flex items-center gap-3">月度排程 (7天) <div className="flex-1 h-px bg-slate-800"></div></h3>

          <div className="mb-8 p-4 bg-slate-950/50 rounded-2xl border border-slate-800">
            <div className="flex justify-between items-center mb-3">
              <div>
                <p className="text-[10px] font-black text-slate-500 uppercase">预计下月体力</p>
                <p className={`text-xl font-mono font-black ${statsPreview.finalSta < 20 ? 'text-red-500' : 'text-emerald-400'}`}>{statsPreview.finalSta.toFixed(0)}%</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-black text-slate-500 uppercase">身体素质提升</p>
                <div className="flex gap-2 justify-end">
                  {Object.entries(statsPreview.bodyGains).filter(([,v]) => (v as number) > 0).slice(0, 3).map(([k,v]) => (
                    <span key={k} className="text-[10px] font-black bg-slate-800 px-2 py-0.5 rounded text-white uppercase">{k} +{(v as number).toFixed(1)}</span>
                  ))}
                  {Object.keys(statsPreview.bodyGains).every(k => statsPreview.bodyGains[k] <= 0) && <span className="text-[10px] text-slate-600 italic">休整期</span>}
                </div>
              </div>
            </div>
            {/* Technique gains preview — focus-aware */}
            <div className="flex gap-2 flex-wrap">
              {Object.entries(statsPreview.techGains.jumps)
                .filter(([,v]) => (v as number) > 0.05)
                .sort(([,a], [,b]) => (b as number) - (a as number))
                .map(([k,v]) => {
                  const isPrimary = k === focus.primaryJump;
                  const isSecondary = k === focus.secondaryJump;
                  const label = isPrimary ? `主攻 ${JUMP_LABELS[k as JumpType]?.short || k}` :
                                isSecondary ? `副攻 ${JUMP_LABELS[k as JumpType]?.short || k}` :
                                JUMP_LABELS[k as JumpType]?.short || k;
                  return (
                    <span key={k} className={`text-[9px] font-black px-2 py-0.5 rounded ${
                      isPrimary ? 'bg-rose-900/40 border border-rose-700/50 text-rose-300' :
                      isSecondary ? 'bg-rose-900/20 border border-rose-800/30 text-rose-400/70' :
                      'bg-red-900/20 border border-red-900/30 text-red-400/50'
                    }`}>{label} +{(v as number).toFixed(1)}</span>
                  );
                })}
              {Object.entries(statsPreview.techGains.spins).filter(([,v]) => (v as number) > 0).slice(0, 2).map(([k,v]) => (
                <span key={k} className="text-[9px] font-black bg-indigo-900/30 border border-indigo-800/40 px-2 py-0.5 rounded text-indigo-300">旋转 +{(v as number).toFixed(1)}</span>
              ))}
              {statsPreview.techGains.steps > 0 && (
                <span className="text-[9px] font-black bg-cyan-900/30 border border-cyan-800/40 px-2 py-0.5 rounded text-cyan-300">步法 +{statsPreview.techGains.steps.toFixed(1)}</span>
              )}
              {statsPreview.techGains.combo > 0 && (
                <span className="text-[9px] font-black bg-rose-900/30 border border-rose-800/40 px-2 py-0.5 rounded text-rose-300">连跳 +{statsPreview.techGains.combo.toFixed(1)}</span>
              )}
              {Object.values(statsPreview.goeBonusGains.jumps).some(v => (v as number) > 0) && (
                <span className="text-[9px] font-black bg-emerald-900/30 border border-emerald-800/40 px-2 py-0.5 rounded text-emerald-300">GOE提升</span>
              )}
            </div>
          </div>

          {/* === 7-Slot Schedule Grid === */}
          <div className="grid grid-cols-7 gap-2 mb-8 p-2 bg-slate-950 rounded-2xl border border-slate-800 min-h-[80px]">
            {game.schedule.map((taskId, idx) => {
              const taskDef = TRAINING_TASKS[taskId];
              if (!taskDef) return <div key={idx} className="rounded-xl bg-slate-800 flex items-center justify-center"><span className="text-[10px] text-slate-500">?</span></div>;
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

          {/* === Training Cards (6 cards, 3×2 grid) === */}
          <h4 className="text-[10px] font-black uppercase text-slate-500 mb-3 tracking-widest">训练项目 (拖拽至上方槽位)</h4>
          <div className="grid grid-cols-3 gap-3">
            {allTasks.map(task => (
              <div
                key={task.id}
                draggable
                onDragStart={() => setDraggedTask(task.id)}
                onDragEnd={() => setDraggedTask(null)}
                className="bg-slate-950 p-3 rounded-2xl border border-slate-800 cursor-grab active:cursor-grabbing hover:border-slate-600 transition-all group"
              >
                <div className="flex items-center gap-2 mb-1">
                  <div className={`w-2.5 h-2.5 rounded-full ${task.color}`}></div>
                  <span className="text-xs font-bold text-white">{task.name}</span>
                </div>
                <p className="text-[8px] text-slate-500 mb-1 leading-tight">{task.desc}</p>
                <div className="flex gap-2 text-[8px] font-mono font-black">
                  {task.targetTech && <span className="text-blue-400">PROF +{task.baseGain}</span>}
                  {task.targetAttr && <span className="text-slate-400 uppercase">{task.targetAttr} +{task.bodyGain}</span>}
                  <span className={task.staCost > 0 ? 'text-red-500' : 'text-emerald-500'}>STA{task.staCost > 0 ? '-' : '+'}{Math.abs(task.staCost)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {devSubTab === 'coach' && (
        <div className="bg-slate-900 border border-slate-800 p-10 rounded-[3rem] shadow-2xl">
          <h3 className="text-sm font-black uppercase text-slate-400 mb-8 tracking-widest">教练市场 (每 4 个月刷新)</h3>
          <div className="space-y-4">
            {game.market.coaches.map(c => (
              <div key={c.id} className={`p-6 rounded-2xl border-2 flex justify-between items-center transition-all ${game.activeCoachId === c.id ? 'bg-blue-600/10 border-blue-500 shadow-xl' : 'bg-slate-950 border-slate-800'}`}>
                <div>
                  <div className="flex items-center gap-3">
                    <span className="font-black text-white text-lg">{c.name}</span>
                    <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded ${c.tier === 'legend' ? 'bg-amber-500 text-black' : c.tier === 'pro' ? 'bg-blue-500 text-white' : 'bg-slate-700 text-slate-300'}`}>{c.tier}</span>
                  </div>
                  <p className="text-[10px] text-slate-500 font-bold uppercase mt-1">系数: TEC x{c.tecMod} | ART x{c.artMod} | 月薪: ¥{c.salary.toLocaleString()}</p>
                </div>
                <button onClick={() => setGame(prev => ({ ...prev, activeCoachId: c.id }))} className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${game.activeCoachId === c.id ? 'bg-blue-600 text-white cursor-default' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}>{game.activeCoachId === c.id ? "签约中" : "聘请"}</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {devSubTab === 'choreo' && (
        <div className="bg-slate-900 border border-slate-800 p-10 rounded-[3rem] shadow-2xl">
          <h3 className="text-sm font-black uppercase text-slate-400 mb-8 tracking-widest">节目编排</h3>
          <div className="space-y-4">
            {game.market.choreographers.map((ch, idx) => (
              <div key={idx} className="p-6 bg-slate-950 border border-slate-800 rounded-2xl flex justify-between items-center transition-all">
                <div>
                  <p className="font-black text-white text-lg mb-1 italic">《{ch.name}》</p>
                  <p className="text-[10px] text-slate-500 font-bold uppercase">{ch.desc}</p>
                  <p className="text-[8px] text-purple-400 font-black uppercase mt-1">艺术底蕴: {ch.base}</p>
                </div>
                <button onClick={() => {
                  if (game.money >= ch.cost) {
                    setGame(p => ({ ...p, money: p.money - ch.cost, skater: { ...p.skater, activeProgram: { name: ch.name, baseArt: ch.base, freshness: 100 } } }));
                    addLog(`完成编舞: 《${ch.name}》`, 'art');
                  } else alert("资金不足");
                }} className="bg-purple-600 hover:bg-purple-500 text-white px-8 py-4 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg active:scale-95">¥{ch.cost.toLocaleString()}</button>
              </div>
            ))}
          </div>
        </div>
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
  );
};

export default DevelopmentTab;
