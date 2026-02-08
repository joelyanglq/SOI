import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { GameState, Sponsorship } from '../types';

interface CareerTabProps {
  game: GameState;
  careerSubTab: 'profile' | 'honors' | 'stats';
  setCareerSubTab: (tab: 'profile' | 'honors' | 'stats') => void;
  sponsorOptions: Sponsorship[];
  selectSponsor: (sp: Sponsorship) => void;
  setShowResetConfirm: (show: boolean) => void;
}

const CareerTab: React.FC<CareerTabProps> = ({ game, careerSubTab, setCareerSubTab, sponsorOptions, selectSponsor, setShowResetConfirm }) => {
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex gap-4 mb-4">
        {[{ k: 'profile', l: '档案' }, { k: 'honors', l: '荣誉' }, { k: 'stats', l: '趋势' }].map(s => (
          <button key={s.k} onClick={() => setCareerSubTab(s.k as any)} className={`px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${careerSubTab === s.k ? 'bg-white text-slate-950 shadow-lg' : 'bg-slate-900 text-slate-500 hover:text-slate-300'}`}>{s.l}</button>
        ))}
      </div>

      {careerSubTab === 'honors' && (
        <div className="bg-slate-900 border border-slate-800 rounded-[2.5rem] overflow-hidden shadow-2xl">
          <div className="p-6 bg-slate-800/30 border-b border-slate-800 flex justify-between items-center">
            <h3 className="text-xs font-black uppercase text-white tracking-widest">生涯荣誉记录簿</h3>
            <span className="text-[10px] text-slate-500 italic">仅记录重大赛事前三及常规赛冠军</span>
          </div>
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-800/50 text-[10px] font-black uppercase text-slate-500 tracking-widest">
                <th className="px-8 py-6">年份/月</th>
                <th className="px-8 py-6">赛事全称</th>
                <th className="px-8 py-6">名次成绩</th>
                <th className="px-8 py-6 text-right">获得积分</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {game.skater.honors.slice().reverse().map((h, i) => (
                <tr key={i} className="hover:bg-slate-800/30 transition-all group">
                  <td className="px-8 py-5 text-sm font-mono text-slate-400 group-hover:text-white transition-colors">{h.year}.{h.month}</td>
                  <td className="px-8 py-5 text-sm font-bold text-white italic tracking-tight">{h.eventName}</td>
                  <td className="px-8 py-5">
                    <span className={`text-[9px] font-black uppercase px-3 py-1 rounded-lg ${h.rank === 1 ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/30' : h.rank === 2 ? 'bg-slate-300 text-slate-900' : h.rank === 3 ? 'bg-orange-800 text-white' : 'bg-slate-800 text-slate-400'}`}>
                      {h.rank === 1 ? '🥇 Winner' : h.rank === 2 ? '🥈 Silver' : h.rank === 3 ? '🥉 Bronze' : `Rank ${h.rank}`}
                    </span>
                  </td>
                  <td className="px-8 py-5 text-right font-mono font-black text-blue-400 text-sm">+{h.points.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {game.skater.honors.length === 0 && (
            <div className="py-32 text-center opacity-30 italic text-sm">记录簿上一片空白，等待你的首枚奖牌...</div>
          )}
        </div>
      )}

      {careerSubTab === 'stats' && (
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 p-10 rounded-[3rem] shadow-2xl">
            <h3 className="text-xs font-black uppercase text-slate-500 mb-8 tracking-widest">能力演化轨迹 (保留两位小数)</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={game.history}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis dataKey="month" stroke="#475569" fontSize={9} axisLine={false} tickLine={false} />
                  <YAxis stroke="#475569" fontSize={9} axisLine={false} tickLine={false} domain={[0, 100]} />
                  <Tooltip
                    formatter={(v: number) => Number(v).toFixed(2)}
                    contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '16px' }}
                  />
                  <Legend />
                  <Area type="monotone" dataKey="tec" name="技术能力(TEC)" stroke="#3b82f6" strokeWidth={3} fill="#3b82f622" dot={false} />
                  <Area type="monotone" dataKey="art" name="艺术感悟(ART)" stroke="#a855f7" strokeWidth={3} fill="#a855f722" dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-10 rounded-[3rem] shadow-2xl">
            <h3 className="text-xs font-black uppercase text-slate-500 mb-8 tracking-widest">商业价值趋势(ISU积分 / 核心名望)</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={game.history}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis dataKey="month" stroke="#475569" fontSize={9} axisLine={false} tickLine={false} />
                  <YAxis yAxisId="left" stroke="#3b82f6" fontSize={9} axisLine={false} tickLine={false} />
                  <YAxis yAxisId="right" orientation="right" stroke="#f59e0b" fontSize={9} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '16px' }} />
                  <Legend />
                  <Area yAxisId="left" type="stepAfter" dataKey="rank" name="世界排名总分" stroke="#3b82f6" strokeWidth={2} fill="#3b82f611" dot={false} />
                  <Area yAxisId="right" type="monotone" dataKey="fame" name="公众影响力" stroke="#f59e0b" strokeWidth={2} fill="#f59e0b11" dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {careerSubTab === 'profile' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-slate-900 border border-slate-800 p-8 rounded-[2.5rem] shadow-2xl">
            <h3 className="text-xs font-black uppercase text-slate-500 mb-6 tracking-widest">商业代言</h3>
            {game.activeSponsor ? (
              <div className="bg-slate-950 p-6 rounded-2xl border border-blue-500/30">
                <p className="text-lg font-black text-white italic mb-2 tracking-tight">{game.activeSponsor.name}</p>
                <div className="space-y-2">
                  {game.activeSponsor.paymentType === 'monthly' ? (
                    <div className="flex justify-between items-center text-[10px] uppercase font-bold text-slate-500"><span>月度收益</span><span className="text-emerald-400">¥{(game.activeSponsor.monthlyPay || 0).toLocaleString()}</span></div>
                  ) : (
                    <div className="flex justify-between items-center text-[10px] uppercase font-bold text-slate-500"><span>总包收入</span><span className="text-emerald-400">¥{(game.activeSponsor.totalPay || 0).toLocaleString()}</span></div>
                  )}
                  <div className="flex justify-between items-center text-[10px] uppercase font-bold text-slate-500"><span>剩余合约</span><span className="text-blue-400">{game.activeSponsor.remainingMonths} 个月</span></div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-[10px] text-amber-500 font-black uppercase mb-4 text-center">当前可签协议 ({sponsorOptions.length})</p>
                <div className="space-y-3 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
                  {sponsorOptions.map(sp => {
                    const disabled = game.fame < sp.minFame;
                    return (
                      <button key={sp.id} disabled={disabled} onClick={() => selectSponsor(sp)} className={`w-full p-4 rounded-xl border text-left transition-all ${disabled ? 'bg-slate-950 border-slate-800 opacity-30 cursor-not-allowed' : 'bg-slate-950 border-slate-800 hover:border-blue-500'}`}>
                        <div className="flex justify-between mb-1"><span className="text-xs font-black text-white">{sp.name}</span><span className="text-[8px] uppercase text-blue-400">{sp.tier}</span></div>
                        <div className="flex justify-between text-[8px] text-slate-500 font-bold"><span>{sp.paymentType === 'monthly' ? `月薪: ¥${(sp.monthlyPay||0)}` : `总包: ¥${(sp.totalPay||0)}`}</span><span>签约金: ¥{sp.signingBonus}</span></div>
                        {disabled && <p className="text-[8px] text-red-500 mt-1 uppercase">需名望: {sp.minFame}</p>}
                      </button>
                    );
                  })}
                  {sponsorOptions.length === 0 && <p className="text-xs text-slate-600 text-center py-10 italic">暂无赞助商意向</p>}
                </div>
              </div>
            )}
          </div>

          <div className="bg-slate-900 border border-slate-800 p-8 rounded-[2.5rem] shadow-2xl">
            <h3 className="text-xs font-black uppercase text-slate-500 mb-6 tracking-widest">当前装备库</h3>
            <div className="space-y-3 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
              {game.inventory.length > 0 ? game.inventory.map(item => (
                <div key={item.id} className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex justify-between items-center mb-2">
                  <div><p className="text-xs font-bold text-white">{item.name}</p><p className="text-[8px] text-slate-500 uppercase">{item.type}</p></div>
                  <div className="text-right"><p className="text-[10px] font-black text-emerald-500">{item.lifespan}月</p></div>
                </div>
              )) : <p className="text-xs text-slate-600 text-center py-6 italic opacity-50">仓库中目前没有活跃装备</p>}
            </div>
          </div>

          <div className="md:col-span-2 bg-slate-900/50 border border-slate-800 p-10 rounded-[2.5rem] flex flex-col items-center justify-center space-y-6">
            <div className="text-center">
              <h3 className="text-xs font-black text-red-500 uppercase tracking-[0.3em] mb-2">危险操作区域</h3>
              <p className="text-[10px] text-slate-500 max-w-sm">重置后将清除所有选手的成长轨迹、奖牌历史、资产和器材。本操作在沙盒预览环境中即时生效。</p>
            </div>
            <button onClick={() => setShowResetConfirm(true)} className="px-12 py-4 bg-red-600/10 border border-red-600/40 hover:bg-red-600 text-white text-[10px] font-black uppercase tracking-widest rounded-2xl transition-all shadow-xl active:scale-95 group overflow-hidden relative">
              <span className="relative z-10 group-hover:text-white transition-colors">确认重置我的职业生涯</span>
              <div className="absolute inset-0 bg-red-600 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CareerTab;
