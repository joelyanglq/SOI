import React from 'react';
import { GameState, Equipment, Sponsorship } from '../types';

interface ClubTabProps {
  game: GameState;
  setGame: React.Dispatch<React.SetStateAction<GameState>>;
  clubSubTab: 'coach' | 'equip' | 'sponsor';
  setClubSubTab: (tab: 'coach' | 'equip' | 'sponsor') => void;
  sponsorOptions: Sponsorship[];
  selectSponsor: (sp: Sponsorship) => void;
  buyItem: (item: Equipment) => void;
}

const ClubTab: React.FC<ClubTabProps> = ({ game, setGame, clubSubTab, setClubSubTab, sponsorOptions, selectSponsor, buyItem }) => {
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex gap-4 mb-4">
        {[{ k: 'coach', l: '教练' }, { k: 'equip', l: '器材' }, { k: 'sponsor', l: '代言' }].map(s => (
          <button key={s.k} onClick={() => setClubSubTab(s.k as any)} className={`px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${clubSubTab === s.k ? 'bg-white text-slate-950 shadow-lg' : 'bg-slate-900 text-slate-500 hover:text-slate-300'}`}>{s.l}</button>
        ))}
      </div>

      {clubSubTab === 'coach' && (
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

      {clubSubTab === 'equip' && (
        <div className="bg-slate-900 border border-slate-800 p-10 rounded-[3rem] shadow-2xl">
          <h3 className="text-sm font-black uppercase text-slate-400 mb-8 tracking-widest">器材更新</h3>
          <div className="grid grid-cols-3 gap-4">
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

          {/* Current inventory */}
          {game.inventory.length > 0 && (
            <div className="mt-8">
              <h4 className="text-[10px] font-black uppercase text-slate-500 mb-3 tracking-widest">当前装备库</h4>
              <div className="grid grid-cols-3 gap-3">
                {game.inventory.map(item => {
                  const percent = (item.lifespan / item.maxLifespan) * 100;
                  const isLow = item.lifespan <= 3;
                  return (
                    <div key={item.id} className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-xs font-bold text-white">{item.name}</span>
                        <span className={`text-[9px] font-bold ${isLow ? 'text-red-500 animate-pulse' : 'text-slate-500'}`}>{item.lifespan}月</span>
                      </div>
                      <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
                        <div className={`h-full transition-all ${isLow ? 'bg-red-500' : percent < 50 ? 'bg-amber-500' : 'bg-emerald-500'}`} style={{ width: `${percent}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {clubSubTab === 'sponsor' && (
        <div className="bg-slate-900 border border-slate-800 p-10 rounded-[3rem] shadow-2xl">
          <h3 className="text-sm font-black uppercase text-slate-400 mb-8 tracking-widest">商业代言</h3>
          {game.activeSponsor ? (
            <div className="max-w-lg mx-auto bg-slate-950 p-8 rounded-2xl border border-blue-500/30">
              <p className="text-xl font-black text-white italic mb-4 tracking-tight">{game.activeSponsor.name}</p>
              <div className="space-y-3">
                {game.activeSponsor.paymentType === 'monthly' ? (
                  <div className="flex justify-between items-center text-sm font-bold text-slate-500"><span>月度收益</span><span className="text-emerald-400 font-black">¥{(game.activeSponsor.monthlyPay || 0).toLocaleString()}</span></div>
                ) : (
                  <div className="flex justify-between items-center text-sm font-bold text-slate-500"><span>总包收入</span><span className="text-emerald-400 font-black">¥{(game.activeSponsor.totalPay || 0).toLocaleString()}</span></div>
                )}
                <div className="flex justify-between items-center text-sm font-bold text-slate-500"><span>剩余合约</span><span className="text-blue-400 font-black">{game.activeSponsor.remainingMonths} 个月</span></div>
              </div>
            </div>
          ) : (
            <div>
              <p className="text-[10px] text-amber-500 font-black uppercase mb-6 text-center">当前可签协议 ({sponsorOptions.length})</p>
              <div className="grid grid-cols-2 gap-4">
                {sponsorOptions.map(sp => {
                  const disabled = game.fame < sp.minFame;
                  return (
                    <button key={sp.id} disabled={disabled} onClick={() => selectSponsor(sp)} className={`p-6 rounded-2xl border text-left transition-all ${disabled ? 'bg-slate-950 border-slate-800 opacity-30 cursor-not-allowed' : 'bg-slate-950 border-slate-800 hover:border-blue-500 hover:bg-blue-950/10'}`}>
                      <div className="flex justify-between mb-2"><span className="text-sm font-black text-white">{sp.name}</span><span className="text-[9px] uppercase text-blue-400 font-bold">{sp.tier}</span></div>
                      <div className="flex justify-between text-[9px] text-slate-500 font-bold"><span>{sp.paymentType === 'monthly' ? `月薪: ¥${(sp.monthlyPay||0)}` : `总包: ¥${(sp.totalPay||0)}`}</span><span>签约金: ¥{sp.signingBonus}</span></div>
                      {disabled && <p className="text-[9px] text-red-500 mt-2 uppercase font-bold">需名望: {sp.minFame}</p>}
                    </button>
                  );
                })}
                {sponsorOptions.length === 0 && <p className="col-span-2 text-sm text-slate-600 text-center py-12 italic">暂无赞助商意向</p>}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ClubTab;
