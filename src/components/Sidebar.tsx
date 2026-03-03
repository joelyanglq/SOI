import React, { useState } from 'react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';
import { GameState, PlayerAttributes } from '../types';
import { getTrait } from '../game/data/traits';
import { MOOD_LABELS, MOOD_COLORS } from '../game/data/music';
import SynergyDisplay from './SynergyDisplay';

interface SidebarProps {
  game: GameState;
  displayAttributes: PlayerAttributes | null;
  radarData: { subject: string; A: number; fullMark: number }[];
  onOpenTechProfile: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ game, displayAttributes, radarData, onOpenTechProfile }) => {
  return (
    <div className="col-span-3 space-y-6">
      {/* --- Player Info + Radar --- */}
      <div className="bg-slate-900 border border-slate-800 rounded-[2.5rem] p-7 shadow-2xl relative overflow-hidden">
        <h2 className="text-2xl font-black text-white italic tracking-tighter mb-1">{game.skater.name}</h2>
        <p className="text-[10px] text-slate-500 mb-1 font-bold uppercase tracking-[0.2em]">年龄 {game.skater.age.toFixed(1)}</p>

        {/* Program V2 Info */}
        {game.skater.programV2 ? (
          <div className="bg-slate-950 rounded-xl p-3 border border-slate-800/50 mb-2">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-black text-white">《{game.skater.programV2.name}》</span>
              <SynergyDisplay synergy={game.skater.programV2.synergy} size="sm" />
            </div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className={`text-[7px] px-1 py-0.5 rounded font-bold text-white ${MOOD_COLORS[game.skater.programV2.music.mood]}`}>{MOOD_LABELS[game.skater.programV2.music.mood]}</span>
              <span className="text-[8px] text-slate-500 truncate">{game.skater.programV2.costume.name}</span>
            </div>
            <div>
              <div className="flex justify-between text-[8px] mb-0.5">
                <span className="text-slate-600 font-bold">成熟度</span>
                <span className="text-pink-400 font-bold">{game.skater.programV2.maturity.toFixed(0)}</span>
              </div>
              <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-pink-500 rounded-full transition-all" style={{ width: `${game.skater.programV2.maturity}%` }}></div>
              </div>
            </div>
          </div>
        ) : (
          <p className="text-[10px] text-slate-600 mb-2 italic">{game.skater.activeProgram.name}</p>
        )}

        <div className="relative -mx-4 my-2">
          <ResponsiveContainer width="100%" height={220}>
            <RadarChart cx="50%" cy="50%" outerRadius="68%" data={radarData}>
              <PolarGrid stroke="#334155" />
              <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 9, fontWeight: 900 }} />
              <PolarRadiusAxis angle={90} domain={[0, 100]} tick={false} axisLine={false} />
              <Radar name="Skater" dataKey="A" stroke="#3b82f6" strokeWidth={2} fill="#3b82f6" fillOpacity={0.25} />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        {/* Body Stats */}
        {displayAttributes && (
          <div className="flex gap-1.5 mb-3">
            {[
              { label: '爆发', val: displayAttributes.jump, color: 'text-red-400' },
              { label: '旋转', val: displayAttributes.spin, color: 'text-indigo-400' },
              { label: '步法', val: displayAttributes.step, color: 'text-cyan-400' },
              { label: '乐感', val: displayAttributes.perf, color: 'text-purple-400' },
              { label: '耐力', val: displayAttributes.endurance, color: 'text-amber-400' },
            ].map(s => (
              <div key={s.label} className="flex-1 bg-slate-950 rounded-lg py-1.5 text-center border border-slate-800/50">
                <span className={`text-[8px] font-black ${s.color} block`}>{s.label}</span>
                <span className="text-sm font-black text-white">{s.val.toFixed(0)}</span>
              </div>
            ))}
          </div>
        )}

        {/* Trait Icons */}
        {game.skater.traits && game.skater.traits.length > 0 && (
          <div className="flex gap-1.5 mb-3 justify-center">
            {game.skater.traits.map(traitId => {
              const t = getTrait(traitId);
              if (!t) return null;
              return (
                <span
                  key={traitId}
                  title={`${t.name}: ${t.description}`}
                  className={`text-sm w-8 h-8 rounded-lg flex items-center justify-center cursor-help ${t.isNegative ? 'bg-red-950/40 border border-red-800/30' : 'bg-amber-950/40 border border-amber-800/30'}`}
                >
                  {t.icon}
                </span>
              );
            })}
          </div>
        )}

        {/* STA */}
        <div className="mb-3">
          <div className="flex justify-between text-[10px] font-bold text-slate-500 mb-0.5">
            <span>体力 STA</span>
            <span className={game.skater.sta < 20 ? "text-red-500 animate-pulse" : "text-emerald-400"}>{game.skater.sta.toFixed(0)}%</span>
          </div>
          <div className="h-1.5 bg-slate-950 rounded-full overflow-hidden"><div className={`h-full transition-all ${game.skater.sta < 20 ? 'bg-red-500' : 'bg-emerald-500'}`} style={{ width: `${game.skater.sta}%` }}></div></div>
        </div>

        {/* TEC / ART */}
        <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-500 font-bold mb-4">
          <div className="bg-slate-950 p-1.5 rounded-lg text-center"><span className="block text-blue-400 font-black text-base">{game.skater.tec.toFixed(0)}</span>TEC</div>
          <div className="bg-slate-950 p-1.5 rounded-lg text-center"><span className="block text-purple-400 font-black text-base">{game.skater.art.toFixed(0)}</span>ART</div>
        </div>

        {/* Tech Profile Link */}
        <button
          onClick={onOpenTechProfile}
          className="w-full py-3 rounded-2xl border border-slate-700 bg-slate-800/50 hover:bg-slate-800 hover:border-blue-500/50 transition-all group flex items-center justify-center gap-2"
        >
          <span className="text-[11px] font-black text-slate-300 group-hover:text-blue-400 uppercase tracking-widest">技术档案</span>
          <svg className="w-4 h-4 text-slate-500 group-hover:text-blue-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/></svg>
        </button>
      </div>

      {/* --- Equipment --- */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-5">
        <div className="space-y-3">
          {game.inventory.length > 0 ? game.inventory.map(item => {
            const percent = (item.lifespan / item.maxLifespan) * 100;
            const isLow = item.lifespan <= 3;
            return (
              <div key={item.id} className="space-y-1">
                <div className="flex justify-between items-center text-[9px] font-bold">
                  <span className="text-slate-300">{item.name}</span>
                  <span className={isLow ? "text-red-500 animate-pulse" : "text-slate-500"}>{item.lifespan}月</span>
                </div>
                <div className="h-1 bg-slate-950 rounded-full overflow-hidden">
                  <div className={`h-full transition-all ${isLow ? 'bg-red-500' : percent < 50 ? 'bg-amber-500' : 'bg-emerald-500'}`} style={{ width: `${percent}%` }}></div>
                </div>
              </div>
            );
          }) : <p className="text-[10px] text-slate-600 text-center py-3 italic">无活跃装备</p>}
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
