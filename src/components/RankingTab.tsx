import React from 'react';
import { GameState } from '../types';

interface RankingTabProps {
  game: GameState;
}

const RankingTab: React.FC<RankingTabProps> = ({ game }) => {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-[3rem] overflow-hidden shadow-2xl animate-in fade-in duration-500">
      <div className="p-8 bg-slate-800/40 border-b border-slate-800 flex justify-between items-center">
        <h3 className="text-sm font-black uppercase text-white tracking-widest">ISU 世界排名公告板</h3>
        <span className="text-[10px] text-slate-500 font-mono">150 名注册选手中</span>
      </div>
      <div className="h-[550px] overflow-y-auto divide-y divide-slate-800/50 px-4 custom-scrollbar">
        {[...game.aiSkaters, game.skater].sort((a,b) => (b.rolling || 0) - (a.rolling || 0)).map((s, idx) => (
          <div key={s.id || idx} className={`flex justify-between items-center p-5 rounded-2xl ${s.isPlayer ? 'bg-blue-600/10 border border-blue-500/20 my-2 shadow-lg' : 'hover:bg-slate-800/30 transition-all'}`}>
            <div className="flex items-center gap-5">
              <span className={`font-black text-sm w-8 ${idx === 0 ? 'text-amber-500' : idx === 1 ? 'text-slate-300' : idx === 2 ? 'text-amber-700' : 'text-slate-600'}`}>{idx + 1}.</span>
              <div>
                <span className={`font-bold ${s.isPlayer ? 'text-blue-400 font-black' : 'text-slate-300'}`}>{s.name} {s.injuryMonths > 0 && <span className="text-[10px] text-red-500 font-black ml-2">INJURED</span>}</span>
                <p className="text-[8px] text-slate-500 font-bold uppercase tracking-widest">年龄: {s.age.toFixed(1)} | 总分: {s.pointsCurrent + s.pointsLast}</p>
              </div>
            </div>
            <div className="text-right">
              <span className="font-mono text-white text-base font-black italic">{(s.rolling || 0).toLocaleString()}</span>
              <p className="text-[9px] text-slate-600 font-bold uppercase">Points</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RankingTab;
