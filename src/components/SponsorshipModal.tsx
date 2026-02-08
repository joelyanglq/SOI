import React from 'react';
import { Sponsorship } from '../types';

interface SponsorshipModalProps {
  sponsorshipModalMode: 'selection' | 'expired';
  sponsorshipRenewalOptions: Sponsorship[];
  sponsorOptions: Sponsorship[];
  fame: number;
  handleSponsorshipModalClose: (sp?: Sponsorship) => void;
}

const SponsorshipModal: React.FC<SponsorshipModalProps> = ({ sponsorshipModalMode, sponsorshipRenewalOptions, sponsorOptions, fame, handleSponsorshipModalClose }) => {
  return (
    <div className="fixed inset-0 z-[210] bg-slate-950/95 backdrop-blur-2xl flex items-center justify-center p-8 animate-in fade-in duration-500">
      <div className="max-w-2xl w-full bg-slate-900 border border-slate-800 rounded-[3rem] p-12 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500"></div>
        
        <h2 className="text-3xl font-black text-white italic mb-2 uppercase tracking-tighter text-center">
          {sponsorshipModalMode === 'selection' ? '选择赞助商' : '赞助合约已到期'}
        </h2>
        <p className="text-[10px] text-slate-400 text-center mb-8 uppercase tracking-widest">
          {sponsorshipModalMode === 'selection' 
            ? '为你的职业生涯寻找合适的赞助商' 
            : '续期现有合作或寻找新的赞助机会'}
        </p>

        {sponsorshipModalMode === 'expired' && sponsorshipRenewalOptions.length > 0 && (
          <div className="mb-8 bg-slate-950/50 border border-blue-500/20 rounded-2xl p-6">
            <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-4">💎 续期选项 (原赞助商享折扣)</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {sponsorshipRenewalOptions.map(renewal => (
                <button
                  key={renewal.id}
                  onClick={() => handleSponsorshipModalClose(renewal)}
                  className="p-4 bg-slate-900 border-2 border-blue-500/30 hover:border-blue-500 rounded-2xl transition-all hover:scale-105 text-left group"
                >
                  <p className="text-sm font-black text-white mb-2 group-hover:text-blue-400">{renewal.name}</p>
                  <div className="space-y-1 text-[9px] text-slate-400">
                    <p>周期: <span className="text-blue-400 font-bold">{renewal.duration}月</span></p>
                    <p>签约金: <span className="text-emerald-400 font-bold">¥{renewal.signingBonus.toLocaleString()}</span></p>
                    <p>月薪: <span className="text-emerald-400 font-bold">¥{(renewal.monthlyPay || 0).toLocaleString()}</span></p>
                  </div>
                  <div className="mt-3 pt-3 border-t border-slate-800">
                    <span className="text-[8px] font-black text-amber-400">优惠15% + 续约奖励</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        <div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">
            {sponsorshipModalMode === 'expired' ? '其他赞助选项' : '可选赞助商'}
          </p>
          <div className="space-y-3 max-h-80 overflow-y-auto pr-2 custom-scrollbar">
            {sponsorOptions.map(sp => {
              const disabled = fame < sp.minFame;
              return (
                <button
                  key={sp.id}
                  disabled={disabled}
                  onClick={() => handleSponsorshipModalClose(sp)}
                  className={`w-full p-4 rounded-2xl border-2 text-left transition-all ${
                    disabled
                      ? 'bg-slate-950 border-slate-800 opacity-40 cursor-not-allowed'
                      : 'bg-slate-950 border-slate-800 hover:border-purple-500 hover:scale-102'
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-sm font-black text-white">{sp.name}</span>
                    <span className={`text-[8px] font-black uppercase px-2 py-1 rounded ${
                      sp.tier === 'local' ? 'bg-slate-700 text-slate-300' :
                      sp.tier === 'brand' ? 'bg-blue-600/30 text-blue-400' :
                      'bg-purple-600/30 text-purple-400'
                    }`}>
                      {sp.tier === 'local' ? '本地' : sp.tier === 'brand' ? '品牌' : '国际'}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-3 text-[9px] text-slate-400 mb-3">
                    <div>
                      <p className="text-slate-500 font-bold uppercase text-[8px]">周期</p>
                      <p className="text-white font-bold">{sp.duration}月</p>
                    </div>
                    <div>
                      <p className="text-slate-500 font-bold uppercase text-[8px]">签约</p>
                      <p className="text-emerald-400 font-bold">¥{sp.signingBonus.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-slate-500 font-bold uppercase text-[8px]">支付形式</p>
                      {sp.paymentType === 'monthly' ? (
                        <p className="text-emerald-400 font-bold">月付 ¥{(sp.monthlyPay||0).toLocaleString()}</p>
                      ) : (
                        <p className="text-emerald-400 font-bold">总包 ¥{(sp.totalPay||0).toLocaleString()}</p>
                      )}
                    </div>
                  </div>
                  {disabled && (
                    <p className="text-[8px] text-red-500 font-bold uppercase">需名望: {sp.minFame}</p>
                  )}
                </button>
              );
            })}
            {sponsorOptions.length === 0 && (
              <p className="text-xs text-slate-600 text-center py-10 italic">暂无可用赞助商</p>
            )}
          </div>
        </div>

        <button
          onClick={() => handleSponsorshipModalClose()}
          className="mt-8 w-full py-3 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-300 rounded-2xl font-black text-sm uppercase tracking-widest transition-all"
        >
          暂时跳过
        </button>
      </div>
    </div>
  );
};

export default SponsorshipModal;
