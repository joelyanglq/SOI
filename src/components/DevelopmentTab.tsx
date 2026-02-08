import React from 'react';
import { GameState, TrainingTaskType, Equipment } from '../types';
import { TRAINING_TASKS } from '../game/data/training';

interface DevelopmentTabProps {
  game: GameState;
  devSubTab: 'train' | 'coach' | 'equip' | 'choreo';
  setDevSubTab: (tab: 'train' | 'coach' | 'equip' | 'choreo') => void;
  statsPreview: { finalSta: number; gains: Record<string, number> };
  draggedTask: TrainingTaskType | null;
  setDraggedTask: (task: TrainingTaskType | null) => void;
  setGame: React.Dispatch<React.SetStateAction<GameState>>;
  addLog: (msg: string, type?: any) => void;
  buyItem: (item: Equipment) => void;
}

const DevelopmentTab: React.FC<DevelopmentTabProps> = ({ game, devSubTab, setDevSubTab, statsPreview, draggedTask, setDraggedTask, setGame, addLog, buyItem }) => {
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex gap-4 mb-4">
        {[{ k: 'train', l: '训练' }, { k: 'coach', l: '团队' }, { k: 'equip', l: '装备' }, { k: 'choreo', l: '编排' }].map(s => (
          <button key={s.k} onClick={() => setDevSubTab(s.k as any)} className={`px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${devSubTab === s.k ? 'bg-white text-slate-950 shadow-lg' : 'bg-slate-900 text-slate-500 hover:text-slate-300'}`}>{s.l}</button>
        ))}
      </div>

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
                {Object.entries(statsPreview.gains).filter(([k,v]) => (v as number) > 0).slice(0, 3).map(([k,v]) => (
                  <span key={k} className="text-[10px] font-black bg-slate-800 px-2 py-0.5 rounded text-white uppercase">{k} +{(v as number).toFixed(1)}</span>
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
