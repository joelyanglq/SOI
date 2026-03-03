import React, { Suspense, useState } from 'react';
import { useGameState } from './hooks/useGameState';
import Sidebar from './components/Sidebar';
import LogPanel from './components/LogPanel';
import EventTab from './components/EventTab';
import DevelopmentTab from './components/DevelopmentTab';
import CareerTab from './components/CareerTab';
import ProgramTab from './components/ProgramTab';
import ClubTab from './components/ClubTab';
import SponsorshipModal from './components/SponsorshipModal';
import EventNoticeModal from './components/EventNoticeModal';
import TechProfile from './components/TechProfile';
import { MATCH_STAMINA_COST } from './game/config';
import { getStyleTag } from './game/data/styleTags';
import { getTrait, TRAIT_LIBRARY } from './game/data/traits';

const MatchEngine = React.lazy(() => import('./components/MatchEngine'));

const App: React.FC = () => {
  const gs = useGameState();
  const [showTechProfile, setShowTechProfile] = useState(false);

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
      <nav className="sticky top-0 z-50 bg-slate-900/90 backdrop-blur-lg border-b border-slate-800 px-8 py-3 flex items-center gap-6 shadow-2xl">
        <div className="flex items-center gap-3 shrink-0">
          <div className="bg-gradient-to-tr from-blue-600 to-indigo-600 w-10 h-10 rounded-xl flex items-center justify-center font-black text-xl italic text-white">F</div>
          <div>
            <h1 className="text-lg font-black uppercase tracking-tighter leading-tight">FS Manager <span className="text-blue-500">Elite</span></h1>
            <p className="text-[9px] text-slate-500 font-mono uppercase tracking-widest">{gs.game.year} 年 {gs.game.month} 月</p>
          </div>
        </div>

        {/* --- Tabs in Nav --- */}
        <div className="flex-1 flex justify-center">
          <div className="flex gap-1 bg-slate-950/50 p-1 rounded-xl">
            {[{ k: 'event', l: '竞技赛事' }, { k: 'development', l: '训练成长' }, { k: 'program', l: '节目工坊' }, { k: 'club', l: '俱乐部管理' }, { k: 'career', l: '选手信息' }].map(t => (
              <button key={t.k} onClick={() => gs.setActiveTab(t.k as any)} className={`px-5 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${gs.activeTab === t.k ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/50'}`}>{t.l}</button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-8 shrink-0">
          <div className="text-right">
            <p className="text-[9px] text-slate-500 font-bold uppercase">排名积分</p>
            <p className="text-lg font-black text-blue-400 font-mono">{(gs.game.skater.rolling || 0).toLocaleString()}</p>
          </div>
          <div className="text-right">
            <p className="text-[9px] text-slate-500 font-bold uppercase">资金</p>
            <p className="text-lg font-black text-emerald-400 font-mono">¥{gs.game.money.toLocaleString()}</p>
          </div>
          <button
            onClick={gs.nextMonth}
            disabled={gs.isProcessing}
            className={`bg-blue-600 hover:bg-blue-500 text-white font-black py-3 px-8 rounded-xl transition-all shadow-xl flex items-center gap-2 active:scale-95 text-sm ${gs.game.skater.sta < 10 && gs.statsPreview.finalSta < 10 ? 'bg-red-600 hover:bg-red-500 ring-2 ring-red-500/50' : ''}`}
          >
            {gs.game.skater.sta < 10 && gs.statsPreview.finalSta < 10 ? '体力告急!' : '下个月'}
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M13 5l7 7-7 7M5 5l7 7-7 7"/></svg>
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
      {gs.activeTab === 'event' ? (
        <main className="container mx-auto grid grid-cols-12 gap-8 p-8">
          <Sidebar game={gs.game} displayAttributes={gs.displayAttributes} radarData={gs.radarData} onOpenTechProfile={() => setShowTechProfile(true)} />
          <div className="col-span-6 space-y-6">
            <div className="min-h-[600px]">
              <EventTab game={gs.game} seasonCalendar={gs.seasonCalendar} setShowMatch={gs.setShowMatch} />
            </div>
          </div>
          <LogPanel logs={gs.logs} />
        </main>
      ) : (
        <main className="container mx-auto p-8">
          <div className="min-h-[600px]">
            {gs.activeTab === 'development' && <DevelopmentTab game={gs.game} displayAttributes={gs.displayAttributes} statsPreview={gs.statsPreview} draggedTask={gs.draggedTask} setDraggedTask={gs.setDraggedTask} setGame={gs.setGame} />}
            {gs.activeTab === 'program' && <ProgramTab game={gs.game} setGame={gs.setGame} addLog={gs.addLog} subTab={gs.programSubTab} setSubTab={gs.setProgramSubTab} />}
            {gs.activeTab === 'club' && <ClubTab game={gs.game} setGame={gs.setGame} clubSubTab={gs.clubSubTab} setClubSubTab={gs.setClubSubTab} sponsorOptions={gs.sponsorOptions} selectSponsor={gs.selectSponsor} buyItem={gs.buyItem} />}
            {gs.activeTab === 'career' && <CareerTab game={gs.game} careerSubTab={gs.careerSubTab} setCareerSubTab={gs.setCareerSubTab} setShowResetConfirm={gs.setShowResetConfirm} />}
          </div>
        </main>
      )}

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

              // Check trait milestone: first podium (rank <= 3) and traits < 4
              let pendingTraitSelection = prev.pendingTraitSelection;
              const currentTraits = prev.skater.traits || [];
              if (rank <= 3 && currentTraits.length < 4 && !pendingTraitSelection) {
                const available = TRAIT_LIBRARY
                  .filter(t => !currentTraits.includes(t.id))
                  .map(t => t.id);
                if (available.length >= 3) {
                  const shuffled = [...available].sort(() => Math.random() - 0.5);
                  pendingTraitSelection = {
                    reason: rank === 1 ? `${gs.showMatch!.event.name} 冠军` : `${gs.showMatch!.event.name} 第${rank}名`,
                    candidates: shuffled.slice(0, 3),
                  };
                }
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
                fame: prev.fame + fameGained,
                pendingTraitSelection,
              };
            });
            gs.addLog(`${gs.showMatch!.event.name}: 第${rank}名 | +${pts}分`, 'comp');
            gs.setShowMatch(null);
          }}
        />
        </Suspense>
      )}

      {/* --- Tech Profile Modal --- */}
      {showTechProfile && (
        <TechProfile game={gs.game} displayAttributes={gs.displayAttributes} onClose={() => setShowTechProfile(false)} />
      )}

      {/* --- Style Tag Selection Modal --- */}
      {gs.game.pendingStyleTags && gs.game.pendingStyleTags.length > 0 && (
        <div className="fixed inset-0 z-[150] bg-slate-950/95 backdrop-blur-sm flex items-center justify-center p-8 animate-in fade-in duration-300">
          <div className="max-w-lg w-full bg-slate-900 border border-purple-900/30 rounded-[2.5rem] p-10 shadow-2xl">
            <div className="w-14 h-14 bg-purple-600/20 text-purple-400 rounded-full flex items-center justify-center text-2xl mb-4 mx-auto">
              <span>&#x2728;</span>
            </div>
            <h2 className="text-2xl font-black text-white text-center mb-2 tracking-tighter">风格标签解锁</h2>
            <p className="text-sm text-slate-500 text-center mb-2">
              {gs.game.pendingStyleTags[0].targetType === 'jump' ? '跳跃' : gs.game.pendingStyleTags[0].targetType === 'spin' ? '旋转' : '步法'} - {gs.game.pendingStyleTags[0].targetKey}
            </p>
            <p className="text-xs text-slate-600 text-center mb-8">你的技术熟练度达到了新的里程碑！选择一个风格标签来定义你的技术特色。</p>
            <div className="space-y-3">
              {gs.game.pendingStyleTags[0].candidates.map(tagId => {
                const tag = getStyleTag(tagId);
                if (!tag) return null;
                return (
                  <button
                    key={tagId}
                    onClick={() => gs.handleSelectStyleTag(0, tagId)}
                    className="w-full p-5 rounded-2xl border-2 border-slate-800 bg-slate-950 hover:border-purple-500 hover:bg-purple-950/20 transition-all text-left group"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-black text-white text-lg group-hover:text-purple-300 transition-colors">{tag.name}</span>
                        <span className="text-[9px] text-slate-500 italic">{tag.nameEn}</span>
                      </div>
                      <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded ${tag.rarity === 'legendary' ? 'bg-amber-500 text-black' : tag.rarity === 'rare' ? 'bg-purple-600 text-white' : 'bg-slate-700 text-slate-300'}`}>
                        {tag.rarity === 'legendary' ? '传奇' : tag.rarity === 'rare' ? '稀有' : '普通'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mb-2">{tag.description}</p>
                    <p className="text-[10px] text-emerald-400 font-bold">GOE +{tag.goeImpact.toFixed(1)}</p>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* --- Trait Selection Modal --- */}
      {gs.game.pendingTraitSelection && (
        <div className="fixed inset-0 z-[160] bg-slate-950/95 backdrop-blur-sm flex items-center justify-center p-8 animate-in fade-in duration-300">
          <div className="max-w-lg w-full bg-slate-900 border border-amber-900/30 rounded-[2.5rem] p-10 shadow-2xl">
            <div className="w-14 h-14 bg-amber-600/20 text-amber-400 rounded-full flex items-center justify-center text-2xl mb-4 mx-auto">
              <span>&#x1F3C6;</span>
            </div>
            <h2 className="text-2xl font-black text-white text-center mb-2 tracking-tighter">新特质解锁</h2>
            <p className="text-sm text-amber-400 text-center mb-1 font-bold">{gs.game.pendingTraitSelection.reason}</p>
            <p className="text-xs text-slate-600 text-center mb-8">选择一个特质来定义你的选手个性。特质将永久影响训练和比赛。</p>
            <div className="space-y-3">
              {gs.game.pendingTraitSelection.candidates.map(traitId => {
                const trait = getTrait(traitId);
                if (!trait) return null;
                return (
                  <button
                    key={traitId}
                    onClick={() => gs.handleSelectTrait(traitId)}
                    className={`w-full p-5 rounded-2xl border-2 bg-slate-950 transition-all text-left group ${trait.isNegative ? 'border-red-900/40 hover:border-red-500' : 'border-slate-800 hover:border-amber-500 hover:bg-amber-950/20'}`}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-2xl">{trait.icon}</span>
                      <div>
                        <span className="font-black text-white text-lg group-hover:text-amber-300 transition-colors">{trait.name}</span>
                        <span className="text-[9px] text-slate-500 italic ml-2">{trait.nameEn}</span>
                      </div>
                      <span className={`ml-auto text-[8px] font-black uppercase px-2 py-0.5 rounded ${trait.trigger === 'passive' ? 'bg-blue-800 text-blue-200' : 'bg-purple-800 text-purple-200'}`}>
                        {trait.trigger === 'passive' ? '被动' : '条件'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 pl-10">{trait.description}</p>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
