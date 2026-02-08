import React from 'react';
import { GameState } from '../types';

interface EventNoticeModalProps {
  game: GameState;
  setGame: React.Dispatch<React.SetStateAction<GameState>>;
}

const EventNoticeModal: React.FC<EventNoticeModalProps> = ({ game, setGame }) => {
  if (!game.activeEvent) return null;
  
  return (
    <div className="fixed inset-0 z-[200] bg-slate-950/95 backdrop-blur-2xl flex items-center justify-center p-8 animate-in fade-in duration-500">
      <div className="max-w-lg w-full bg-slate-900 border border-slate-800 rounded-[3rem] p-12 shadow-2xl relative overflow-hidden">
        <div className={`absolute top-0 left-0 w-full h-1.5 ${game.activeEvent.event.type === 'positive' ? 'bg-emerald-500' : game.activeEvent.event.type === 'negative' ? 'bg-red-500' : 'bg-blue-500'}`}></div>
        <h2 className="text-3xl font-black text-white italic mb-6 uppercase tracking-tighter text-center">{game.activeEvent.event.name}</h2>
        <div className="bg-slate-950/50 p-8 rounded-[2rem] mb-8 text-left italic text-slate-300 font-serif text-sm leading-relaxed border border-slate-800">"{game.activeEvent.narrative}"</div>
        <div className="mb-10 space-y-3">
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest text-center mb-4">属性变动</p>
          <div className="grid grid-cols-2 gap-3">
            {Object.entries(game.activeEvent.event.effect).map(([key, val]) => {
              if (val === 0) return null;
              const labelMap: Record<string, string> = { tec: 'TEC', art: 'ART', sta: 'STA', money: '资金', fame: '名望', injuryMonths: '伤病', jump: 'JUMP', spin: 'SPIN', step: 'STEP', perf: 'PERF', endurance: 'END' };
              const isPositive = (val as number) > 0;
              return (
                <div key={key} className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 flex justify-between items-center">
                  <span className="text-[10px] font-bold text-slate-400">{labelMap[key] || key}</span>
                  <span className={`font-black text-xs ${isPositive ? 'text-emerald-400' : 'text-red-400'}`}>{(val as number) > 0 ? '+' : ''}{val}</span>
                </div>
              );
            })}
          </div>
        </div>
        <button onClick={() => setGame(prev => ({ ...prev, activeEvent: null }))} className="w-full bg-white text-slate-950 py-5 rounded-2xl font-black text-xl active:scale-95 transition-all shadow-xl uppercase tracking-tighter">确认</button>
      </div>
    </div>
  );
};

export default EventNoticeModal;
