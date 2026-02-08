import React from 'react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';
import { GameState, PlayerAttributes } from '../types';

interface SidebarProps {
  game: GameState;
  displayAttributes: PlayerAttributes | null;
  radarData: { subject: string; A: number; fullMark: number }[];
}

const Sidebar: React.FC<SidebarProps> = ({ game, displayAttributes, radarData }) => {
  return (
    <div className="col-span-3 space-y-6">
      <div className="bg-slate-900 border border-slate-800 rounded-[3rem] p-8 shadow-2xl relative overflow-hidden group min-h-[500px] flex flex-col">
        <h2 className="text-3xl font-black text-white italic tracking-tighter mb-2">{game.skater.name}</h2>
        <p className="text-[10px] text-slate-500 mb-2 font-bold uppercase tracking-[0.2em]">年龄: {game.skater.age.toFixed(1)} 岁</p>
        <p className="text-[10px] text-slate-500 mb-6 font-bold uppercase tracking-[0.2em]">节目: {game.skater.activeProgram.name}</p>
        
        <div className="flex-1 relative -mx-8 -my-4">
          <ResponsiveContainer width="100%" height={250}>
            <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
              <PolarGrid stroke="#334155" />
              <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 9, fontWeight: 900 }} />
              <PolarRadiusAxis angle={90} domain={[0, 100]} tick={false} axisLine={false} />
              <Radar name="Skater" dataKey="A" stroke="#3b82f6" strokeWidth={2} fill="#3b82f6" fillOpacity={0.3} />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        <div className="space-y-4 relative z-10">
          {displayAttributes && (
            <div className="grid grid-cols-5 gap-2 mb-2">
              {[
                { label: 'JUMP', val: displayAttributes.jump, color: 'text-red-400', border: 'border-red-500/20', bg: 'bg-red-500/5' },
                { label: 'SPIN', val: displayAttributes.spin, color: 'text-indigo-400', border: 'border-indigo-500/20', bg: 'bg-indigo-500/5' },
                { label: 'STEP', val: displayAttributes.step, color: 'text-cyan-400', border: 'border-cyan-500/20', bg: 'bg-cyan-500/5' },
                { label: 'PERF', val: displayAttributes.perf, color: 'text-purple-400', border: 'border-purple-500/20', bg: 'bg-purple-500/5' },
                { label: 'END', val: displayAttributes.endurance, color: 'text-amber-400', border: 'border-amber-500/20', bg: 'bg-amber-500/5' },
              ].map((stat) => (
                <div key={stat.label} className={`flex flex-col items-center justify-center py-2 rounded-lg border ${stat.border} ${stat.bg} backdrop-blur-sm`}>
                  <span className={`text-[8px] font-black ${stat.color} tracking-wider mb-0.5`}>{stat.label}</span>
                  <span className="text-xs font-black text-white">{stat.val.toFixed(0)}</span>
                </div>
              ))}
            </div>
          )}

          <div>
            <div className="flex justify-between text-[11px] font-bold text-slate-500 mb-1 uppercase tracking-widest">
              <span>全局体力 STA</span>
              <span className={game.skater.sta < 20 ? "text-red-500 animate-pulse" : "text-emerald-400"}>{game.skater.sta.toFixed(0)} / 100</span>
            </div>
            <div className="h-1.5 bg-slate-950 rounded-full overflow-hidden shadow-inner"><div className={`h-full transition-all duration-1000 ${game.skater.sta < 20 ? 'bg-red-500' : 'bg-emerald-500'}`} style={{ width: `${game.skater.sta}%` }}></div></div>
          </div>
          <div className="grid grid-cols-2 gap-4 text-[10px] text-slate-500 font-bold uppercase">
            <div className="bg-slate-950 p-2 rounded-xl text-center"><span className="block text-blue-400 font-black text-lg">{game.skater.tec.toFixed(0)}</span>综合技术 TEC</div>
            <div className="bg-slate-950 p-2 rounded-xl text-center"><span className="block text-purple-400 font-black text-lg">{game.skater.art.toFixed(0)}</span>综合艺术 ART</div>
          </div>
        </div>
      </div>

      <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-6">
        <div className="space-y-4">
          {game.inventory.length > 0 ? game.inventory.map(item => {
            const percent = (item.lifespan / item.maxLifespan) * 100;
            const isLow = item.lifespan <= 3;
            return (
              <div key={item.id} className="space-y-1.5">
                <div className="flex justify-between items-center text-[9px] font-bold">
                  <span className="text-slate-300">{item.name}</span>
                  <span className={isLow ? "text-red-500 animate-pulse" : "text-slate-500"}>{item.lifespan}月</span>
                </div>
                <div className="h-1 bg-slate-950 rounded-full overflow-hidden">
                  <div className={`h-full transition-all duration-500 ${isLow ? 'bg-red-500' : percent < 50 ? 'bg-amber-500' : 'bg-emerald-500'}`} style={{ width: `${percent}%` }}></div>
                </div>
              </div>
            );
          }) : <p className="text-[10px] text-slate-600 text-center py-4 italic">无活跃装备</p>}
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
