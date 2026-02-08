import React from 'react';
import { GameEvent, GameState } from '../types';
import { MATCH_STAMINA_COST } from '../game/config';

interface EventTabProps {
  game: GameState;
  seasonCalendar: Record<number, GameEvent[]>;
  setShowMatch: (match: { event: GameEvent; idx: number } | null) => void;
}

const EventTab: React.FC<EventTabProps> = ({ game, seasonCalendar, setShowMatch }) => {
  return (
    <div className="space-y-4 animate-in fade-in duration-500">
      {(seasonCalendar[game.month] || []).map((ev, i) => {
        const locked = (game.skater.rolling || 0) < ev.req || game.skater.sta < MATCH_STAMINA_COST;
        return (
          <div key={i} className={`bg-slate-900 border border-slate-800 p-8 rounded-[2.5rem] flex justify-between items-center group transition-all hover:border-blue-500/40 shadow-xl ${locked ? 'opacity-60 grayscale-[0.5]' : ''}`}>
            <div className="flex gap-6 items-center">
              <div className={`w-16 h-16 rounded-2xl flex items-center justify-center font-black text-2xl text-white shadow-lg ${locked ? 'bg-slate-800' : 'bg-gradient-to-br from-blue-500 to-indigo-600'}`}>{ev.name[0]}</div>
              <div>
                <h4 className="text-xl font-bold text-white mb-1">{ev.name} {locked && '🔒'}</h4>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">入围积分: {ev.req} | 奖励总分: {ev.pts} pts | 难度: {ev.base}</p>
              </div>
            </div>
            <button disabled={locked || game.hasCompeted} onClick={() => setShowMatch({ event: ev, idx: i })} className={`px-10 py-4 rounded-2xl font-black transition-all ${locked || game.hasCompeted ? 'bg-slate-800 text-slate-600 cursor-not-allowed' : 'bg-white text-slate-950 hover:scale-105 active:scale-95 shadow-xl'}`}>{game.hasCompeted ? '已完赛' : locked ? '积分不足' : '报名'}</button>
          </div>
        );
      })}
    </div>
  );
};

export default EventTab;
