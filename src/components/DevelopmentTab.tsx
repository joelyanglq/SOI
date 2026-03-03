import React from 'react';
import { GameState, TrainingTaskType, JumpType, TrainingMode, PlayerAttributes } from '../types';
import { TRAINING_TASKS } from '../game/data/training';
import { TrainingResult } from '../game/training';

interface DevelopmentTabProps {
  game: GameState;
  displayAttributes: PlayerAttributes | null;
  statsPreview: TrainingResult;
  draggedTask: TrainingTaskType | null;
  setDraggedTask: (task: TrainingTaskType | null) => void;
  setGame: React.Dispatch<React.SetStateAction<GameState>>;
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

const DevelopmentTab: React.FC<DevelopmentTabProps> = ({ game, displayAttributes, statsPreview, draggedTask, setDraggedTask, setGame }) => {
  const focus = game.trainingFocus;

  const setFocusField = (patch: Partial<typeof focus>) => {
    setGame(prev => ({ ...prev, trainingFocus: { ...prev.trainingFocus, ...patch } }));
  };

  const handleJumpClick = (jt: JumpType) => {
    if (focus.primaryJump === jt) {
      setFocusField({ primaryJump: focus.secondaryJump, secondaryJump: jt });
    } else if (focus.secondaryJump === jt) {
      setFocusField({ primaryJump: jt, secondaryJump: focus.primaryJump });
    } else {
      setFocusField({ secondaryJump: jt });
    }
  };

  return (
    <div className="animate-in fade-in duration-500 space-y-6">

      {/* === Stats Bar === */}
      {displayAttributes && (
        <div className="flex items-center gap-3 px-6 py-4 bg-slate-900 border border-slate-800 rounded-2xl shadow-lg">
          {[
            { label: '爆发', val: displayAttributes.jump, color: 'text-red-400' },
            { label: '旋转', val: displayAttributes.spin, color: 'text-indigo-400' },
            { label: '步法', val: displayAttributes.step, color: 'text-cyan-400' },
            { label: '乐感', val: displayAttributes.perf, color: 'text-purple-400' },
            { label: '耐力', val: displayAttributes.endurance, color: 'text-amber-400' },
          ].map(s => (
            <div key={s.label} className="flex items-center gap-2 bg-slate-950 px-4 py-2 rounded-xl border border-slate-800/50">
              <span className={`text-xs font-black ${s.color}`}>{s.label}</span>
              <span className="text-base font-black text-white font-mono">{s.val.toFixed(0)}</span>
            </div>
          ))}
          <div className="ml-auto flex items-center gap-3 bg-slate-950 px-4 py-2 rounded-xl border border-slate-800/50">
            <span className="text-xs font-black text-slate-500">STA</span>
            <div className="w-32 h-2 bg-slate-800 rounded-full overflow-hidden">
              <div className={`h-full transition-all ${game.skater.sta < 20 ? 'bg-red-500' : 'bg-emerald-500'}`} style={{ width: `${game.skater.sta}%` }} />
            </div>
            <span className={`text-base font-black font-mono ${game.skater.sta < 20 ? 'text-red-500' : 'text-emerald-400'}`}>{game.skater.sta.toFixed(0)}%</span>
          </div>
        </div>
      )}

      {/* === Two-Column: Focus (left) + Schedule & Preview (right) === */}
      <div className="grid grid-cols-12 gap-6">
        {/* --- Left Column: Training Focus --- */}
        <div className="col-span-4 bg-slate-900 border border-slate-800 rounded-2xl shadow-lg p-6 space-y-6">
          <h4 className="text-xs font-black uppercase text-slate-400 tracking-widest">训练重心</h4>

          {/* Jump Focus Chips */}
          <div>
            <p className="text-[11px] text-slate-500 mb-3 font-bold">跳跃重心 <span className="text-slate-600 text-[10px]">（点击选择主攻/副攻）</span></p>
            <div className="grid grid-cols-3 gap-2">
              {ALL_JUMPS.map(jt => {
                const isPrimary = focus.primaryJump === jt;
                const isSecondary = focus.secondaryJump === jt;
                return (
                  <button
                    key={jt}
                    onClick={() => handleJumpClick(jt)}
                    className={`py-3 rounded-xl font-black transition-all active:scale-95 ${
                      isPrimary ? 'bg-rose-600 text-white ring-2 ring-rose-400/50 shadow-lg shadow-rose-600/20' :
                      isSecondary ? 'bg-rose-900/60 text-rose-300 ring-1 ring-rose-700/50' :
                      'bg-slate-800 text-slate-500 hover:bg-slate-700 hover:text-slate-300'
                    }`}
                  >
                    <span className="block text-sm font-mono">{JUMP_LABELS[jt].short}</span>
                    <span className="block text-[9px] mt-0.5 opacity-70">{JUMP_LABELS[jt].full}</span>
                  </button>
                );
              })}
            </div>
            <div className="flex gap-4 mt-3 text-[11px]">
              <span className="text-rose-400 font-bold">● 主攻 {JUMP_LABELS[focus.primaryJump].full} <span className="text-slate-600 font-normal">(60%)</span></span>
              <span className="text-rose-300/60 font-bold">● 副攻 {JUMP_LABELS[focus.secondaryJump].full} <span className="text-slate-600 font-normal">(30%)</span></span>
            </div>
          </div>

          {/* Training Mode Toggle */}
          <div>
            <p className="text-[11px] text-slate-500 mb-3 font-bold">训练模式</p>
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
            <p className="text-[11px] text-slate-600 mt-2">{MODE_INFO[focus.mode].desc}</p>
          </div>
        </div>

        {/* --- Right Column: Schedule + Preview --- */}
        <div className="col-span-8 space-y-6">
          {/* 7-Slot Schedule Grid */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-lg p-6">
            <h4 className="text-xs font-black uppercase text-slate-400 tracking-widest mb-4">月度排程 (7天)</h4>
            <div className="grid grid-cols-7 gap-3">
              {game.schedule.map((taskId, idx) => {
                const taskDef = TRAINING_TASKS[taskId];
                if (!taskDef) return <div key={idx} className="rounded-xl bg-slate-800 h-16 flex items-center justify-center"><span className="text-xs text-slate-500">?</span></div>;
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
                    className={`relative group rounded-xl h-16 flex items-center justify-center cursor-pointer transition-all hover:scale-105 active:scale-95 ${taskDef.color} shadow-lg`}
                  >
                    <span className="text-xs font-black text-white text-center leading-tight px-1">{taskDef.name}</span>
                    <div className="absolute inset-0 bg-white/0 group-hover:bg-white/10 rounded-xl transition-colors" />
                  </div>
                );
              })}
            </div>
          </div>

          {/* Stats Preview */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <div>
                <p className="text-[11px] font-black text-slate-500 uppercase mb-1">预计下月体力</p>
                <p className={`text-2xl font-mono font-black ${statsPreview.finalSta < 20 ? 'text-red-500' : 'text-emerald-400'}`}>{statsPreview.finalSta.toFixed(0)}%</p>
              </div>
              <div className="text-right">
                <p className="text-[11px] font-black text-slate-500 uppercase mb-1">身体素质提升</p>
                <div className="flex gap-2 justify-end">
                  {Object.entries(statsPreview.bodyGains).filter(([,v]) => (v as number) > 0).slice(0, 3).map(([k,v]) => (
                    <span key={k} className="text-[11px] font-black bg-slate-800 px-2 py-1 rounded-lg text-white uppercase">{k} +{(v as number).toFixed(1)}</span>
                  ))}
                  {Object.keys(statsPreview.bodyGains).every(k => statsPreview.bodyGains[k] <= 0) && <span className="text-xs text-slate-600 italic">休整期</span>}
                </div>
              </div>
            </div>
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
                    <span key={k} className={`text-[11px] font-black px-2 py-1 rounded-lg ${
                      isPrimary ? 'bg-rose-900/40 border border-rose-700/50 text-rose-300' :
                      isSecondary ? 'bg-rose-900/20 border border-rose-800/30 text-rose-400/70' :
                      'bg-red-900/20 border border-red-900/30 text-red-400/50'
                    }`}>{label} +{(v as number).toFixed(1)}</span>
                  );
                })}
              {Object.entries(statsPreview.techGains.spins).filter(([,v]) => (v as number) > 0).slice(0, 2).map(([k,v]) => (
                <span key={k} className="text-[11px] font-black bg-indigo-900/30 border border-indigo-800/40 px-2 py-1 rounded-lg text-indigo-300">旋转 +{(v as number).toFixed(1)}</span>
              ))}
              {statsPreview.techGains.steps > 0 && (
                <span className="text-[11px] font-black bg-cyan-900/30 border border-cyan-800/40 px-2 py-1 rounded-lg text-cyan-300">步法 +{statsPreview.techGains.steps.toFixed(1)}</span>
              )}
              {statsPreview.techGains.combo > 0 && (
                <span className="text-[11px] font-black bg-rose-900/30 border border-rose-800/40 px-2 py-1 rounded-lg text-rose-300">连跳 +{statsPreview.techGains.combo.toFixed(1)}</span>
              )}
              {Object.values(statsPreview.goeBonusGains.jumps).some(v => (v as number) > 0) && (
                <span className="text-[11px] font-black bg-emerald-900/30 border border-emerald-800/40 px-2 py-1 rounded-lg text-emerald-300">GOE提升</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* === Training Cards === */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-lg p-6">
        <h4 className="text-xs font-black uppercase text-slate-400 mb-4 tracking-widest">训练项目 <span className="text-slate-600 normal-case font-normal">— 拖拽至上方排程槽位</span></h4>
        <div className="grid grid-cols-4 gap-3">
          {allTasks.map(task => (
            <div
              key={task.id}
              draggable
              onDragStart={() => setDraggedTask(task.id)}
              onDragEnd={() => setDraggedTask(null)}
              className="bg-slate-950 p-4 rounded-xl border border-slate-800 cursor-grab active:cursor-grabbing hover:border-slate-600 transition-all group"
            >
              <div className="flex items-center gap-2 mb-2">
                <div className={`w-3 h-3 rounded-full ${task.color}`} />
                <span className="text-sm font-bold text-white">{task.name}</span>
              </div>
              <p className="text-xs text-slate-500 mb-2 leading-relaxed">{task.desc}</p>
              <div className="flex gap-2 text-[11px] font-mono font-black">
                {task.targetTech && <span className="text-blue-400">PROF +{task.baseGain}</span>}
                {task.targetAttr && <span className="text-slate-400 uppercase">{task.targetAttr} +{task.bodyGain}</span>}
                <span className={task.staCost > 0 ? 'text-red-500' : 'text-emerald-500'}>STA{task.staCost > 0 ? '-' : '+'}{Math.abs(task.staCost)}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DevelopmentTab;
