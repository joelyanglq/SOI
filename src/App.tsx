import React, { Suspense } from 'react';
import { useGameState } from './hooks/useGameState';
import Sidebar from './components/Sidebar';
import LogPanel from './components/LogPanel';
import EventTab from './components/EventTab';
import DevelopmentTab from './components/DevelopmentTab';
import RankingTab from './components/RankingTab';
import CareerTab from './components/CareerTab';
import SponsorshipModal from './components/SponsorshipModal';
import EventNoticeModal from './components/EventNoticeModal';
import { MATCH_STAMINA_COST } from './game/config';

const MatchEngine = React.lazy(() => import('./components/MatchEngine'));

const App: React.FC = () => {
  const gs = useGameState();

  // --- Naming Screen ---
  if (gs.isNaming) {
    return (
      <div className="fixed inset-0 z-[1000] bg-slate-950 flex items-center justify-center p-8 overflow-hidden">
        <div className="max-w-xl w-full bg-slate-900 border border-slate-800 rounded-[3rem] p-16 shadow-2xl relative z-10 text-center animate-in zoom-in duration-500">
          <h1 className="text-4xl font-black text-white italic tracking-tighter mb-4">FS MANAGER <span className="text-blue-500 italic">ELITE</span></h1>
          <p className="text-slate-500 text-xs font-bold uppercase tracking-[0.3em] mb-12">开启你的世界冠军之路</p>
          <div className="space-y-8 text-left">
            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">选手姓名</label>
              <input type="text" value={gs.newName} onChange={(e) => gs.setNewName(e.target.value)} placeholder="例如: 苏小冰" className="w-full bg-slate-950 border border-slate-800 px-8 py-5 rounded-2xl text-white font-bold focus:border-blue-500 outline-none" />
            </div>
            <button onClick={gs.handleStartGame} className="w-full bg-white text-slate-950 py-5 rounded-2xl font-black text-xl hover:scale-105 active:scale-95 transition-all shadow-xl uppercase tracking-tighter">进入冰场</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 selection:bg-blue-500/30 font-sans">
      {/* --- Nav Bar --- */}
      <nav className="sticky top-0 z-50 bg-slate-900/90 backdrop-blur-lg border-b border-slate-800 px-8 py-4 flex justify-between items-center shadow-2xl">
        <div className="flex items-center gap-4">
          <div className="bg-gradient-to-tr from-blue-600 to-indigo-600 w-12 h-12 rounded-2xl flex items-center justify-center font-black text-2xl italic text-white">F</div>
          <div>
            <h1 className="text-xl font-black uppercase tracking-tighter">FS Manager <span className="text-blue-500">Elite</span></h1>
            <p className="text-[10px] text-slate-500 font-mono uppercase tracking-widest">{gs.game.year} 年 {gs.game.month} 月</p>
          </div>
        </div>
        <div className="flex items-center gap-10">
          <div className="text-right">
            <p className="text-[10px] text-slate-500 font-bold uppercase">世界排名积分</p>
            <p className="text-xl font-black text-blue-400 font-mono">{(gs.game.skater.rolling || 0).toLocaleString()}</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-slate-500 font-bold uppercase">持有资金</p>
            <p className="text-xl font-black text-emerald-400 font-mono">¥{gs.game.money.toLocaleString()}</p>
          </div>
          <button 
            onClick={gs.nextMonth} 
            disabled={gs.isProcessing}
            className={`bg-blue-600 hover:bg-blue-500 text-white font-black py-4 px-10 rounded-2xl transition-all shadow-xl flex items-center gap-3 active:scale-95 ${gs.game.skater.sta < 10 && gs.statsPreview.finalSta < 10 ? 'bg-red-600 hover:bg-red-500 ring-2 ring-red-500/50' : ''}`}
          >
            {gs.game.skater.sta < 10 && gs.statsPreview.finalSta < 10 ? '体力告急!' : '下个月'}
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M13 5l7 7-7 7M5 5l7 7-7 7"/></svg>
          </button>
        </div>
      </nav>

      {/* --- Loading Overlay --- */}
      {gs.isProcessing && (
        <div className="fixed inset-0 z-[2000] bg-slate-950/90 backdrop-blur-sm flex flex-col items-center justify-center p-12 text-center animate-in fade-in duration-300">
          <div className="w-24 h-24 border-b-4 border-blue-500 rounded-full animate-spin mb-12"></div>
          <p className="text-3xl font-black text-white italic tracking-tighter mb-6 uppercase">时间流逝中...</p>
          <div className="max-w-md bg-slate-900/50 p-6 rounded-3xl border border-slate-800 italic text-slate-400 text-sm">"{gs.loadingQuote}"</div>
        </div>
      )}

      {/* --- Reset Confirm --- */}
      {gs.showResetConfirm && (
        <div className="fixed inset-0 z-[2500] bg-slate-950/95 flex items-center justify-center p-8 animate-in fade-in duration-300">
          <div className="max-w-md w-full bg-slate-900 border border-red-900/30 rounded-[2.5rem] p-10 text-center shadow-2xl">
            <div className="w-16 h-16 bg-red-600/20 text-red-500 rounded-full flex items-center justify-center text-3xl mb-6 mx-auto">⚠️</div>
            <h2 className="text-2xl font-black text-white mb-4 uppercase tracking-tighter">彻底重置生涯？</h2>
            <p className="text-slate-500 text-sm mb-10 leading-relaxed">此操作将清空所有存档数据并重新开始。一旦点击"确认重置"，当前进度将永远丢失。</p>
            <div className="flex gap-4">
              <button onClick={() => gs.setShowResetConfirm(false)} className="flex-1 bg-slate-800 text-slate-300 py-4 rounded-xl font-black uppercase text-xs">返回</button>
              <button onClick={gs.confirmResetGame} className="flex-1 bg-red-600 text-white py-4 rounded-xl font-black uppercase text-xs shadow-xl shadow-red-600/20">确认重置</button>
            </div>
          </div>
        </div>
      )}

      {/* --- Main Layout --- */}
      <main className="container mx-auto grid grid-cols-12 gap-8 p-8">
        <Sidebar game={gs.game} displayAttributes={gs.displayAttributes} radarData={gs.radarData} />

        <div className="col-span-6 space-y-6">
          <div className="bg-slate-900/50 p-2 rounded-2xl border border-slate-800 flex gap-2 shadow-inner">
            {[{ k: 'event', l: '竞技赛事' }, { k: 'development', l: '能力成长' }, { k: 'ranking', l: '世界排名' }, { k: 'career', l: '选手信息' }].map(t => (
              <button key={t.k} onClick={() => gs.setActiveTab(t.k as any)} className={`flex-1 py-4 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${gs.activeTab === t.k ? 'bg-blue-600 text-white shadow-xl scale-105' : 'text-slate-500 hover:bg-slate-800'}`}>{t.l}</button>
            ))}
          </div>
          
          <div className="min-h-[600px]">
            {gs.activeTab === 'event' && <EventTab game={gs.game} seasonCalendar={gs.seasonCalendar} setShowMatch={gs.setShowMatch} />}
            {gs.activeTab === 'development' && <DevelopmentTab game={gs.game} devSubTab={gs.devSubTab} setDevSubTab={gs.setDevSubTab} statsPreview={gs.statsPreview} draggedTask={gs.draggedTask} setDraggedTask={gs.setDraggedTask} setGame={gs.setGame} addLog={gs.addLog} buyItem={gs.buyItem} />}
            {gs.activeTab === 'ranking' && <RankingTab game={gs.game} />}
            {gs.activeTab === 'career' && <CareerTab game={gs.game} careerSubTab={gs.careerSubTab} setCareerSubTab={gs.setCareerSubTab} sponsorOptions={gs.sponsorOptions} selectSponsor={gs.selectSponsor} setShowResetConfirm={gs.setShowResetConfirm} />}
          </div>
        </div>
        
        <LogPanel logs={gs.logs} />
      </main>

      {/* --- Modals --- */}
      {gs.game.activeEvent && <EventNoticeModal game={gs.game} setGame={gs.setGame} />}
      
      {gs.showSponsorshipModal && <SponsorshipModal sponsorshipModalMode={gs.sponsorshipModalMode} sponsorshipRenewalOptions={gs.sponsorshipRenewalOptions} sponsorOptions={gs.sponsorOptions} fame={gs.game.fame} handleSponsorshipModalClose={gs.handleSponsorshipModalClose} />}

      {gs.showMatch && (
        <Suspense fallback={
          <div className="fixed inset-0 z-[3000] bg-slate-950/95 flex items-center justify-center">
            <div className="w-16 h-16 border-b-4 border-blue-500 rounded-full animate-spin"></div>
          </div>
        }>
        <MatchEngine 
          key={`match-${gs.showMatch.event.name}-${Date.now()}`}
          event={gs.showMatch.event} skater={gs.game.skater} aiSkaters={gs.game.aiSkaters}
          onClose={(results) => {
            const rank = results.findIndex((r: any) => r.isPlayer) + 1;
            const pts = Math.floor(gs.showMatch!.event.pts / (rank * 0.4 + 0.6));
            const fameGained = Math.max(0, 10 - rank) * 10 + (rank === 1 ? 150 : 0);
            
            const isMajor = gs.showMatch!.event.pts >= 2500 || 
                           gs.showMatch!.event.name.includes("世锦赛") || 
                           gs.showMatch!.event.name.includes("奥运会") || 
                           gs.showMatch!.event.name.includes("总决赛");
            
            const enduranceFactor = gs.game.skater.attributes ? (gs.game.skater.attributes.endurance / 200) : 0; 
            const finalStaCost = Math.max(5, MATCH_STAMINA_COST * (1 - enduranceFactor));

            gs.setGame(prev => {
              const shouldRecordHonor = rank === 1 || (isMajor && rank <= 3);
              const honors = [...(prev.skater.honors || [])];
              if (shouldRecordHonor) {
                honors.push({ year: prev.year, month: prev.month, eventName: gs.showMatch!.event.name, rank, points: pts });
              }

              return { 
                ...prev, hasCompeted: true,
                skater: { 
                  ...prev.skater, 
                  pointsCurrent: prev.skater.pointsCurrent + pts,
                  sta: Math.max(0, prev.skater.sta - finalStaCost),
                  honors
                }, 
                money: prev.money + (gs.showMatch!.event.prize || 0) * (rank <= 3 ? (4-rank)*0.3 + 0.1 : 0),
                fame: prev.fame + fameGained
              };
            });
            gs.addLog(`${gs.showMatch!.event.name}: 第${rank}名 | +${pts}分`, 'comp');
            gs.setShowMatch(null);
          }}
        />
        </Suspense>
      )}
    </div>
  );
};

export default App;
