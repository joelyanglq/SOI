import React from 'react';
import { LogEntry } from '../types';

interface LogPanelProps {
  logs: LogEntry[];
}

const LogPanel: React.FC<LogPanelProps> = ({ logs }) => {
  return (
    <div className="col-span-3 flex flex-col h-[calc(100vh-160px)]">
      <h3 className="text-[10px] font-black uppercase text-slate-500 mb-4 tracking-[0.3em] flex items-center gap-2">
        <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span> 全球快讯
      </h3>
      <div className="flex-1 bg-slate-900 border border-slate-800 rounded-[3rem] p-8 overflow-y-auto space-y-5 shadow-inner custom-scrollbar">
        {logs.map(log => (
          <div key={log.id} className="pb-5 border-b border-slate-800/60 last:border-0 animate-in slide-in-from-right-4 duration-300">
            <div className="flex justify-between mb-2">
              <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded shadow-sm ${log.type === 'train' ? 'bg-blue-600/20 text-blue-400' : log.type === 'comp' ? 'bg-amber-600/20 text-amber-400' : log.type === 'art' ? 'bg-purple-600/20 text-purple-400' : 'bg-slate-800 text-slate-400'}`}>{log.type}</span>
              <span className="text-[8px] text-slate-600 font-mono font-bold">{log.month}月</span>
            </div>
            <p className="text-[11px] text-slate-300 leading-relaxed font-medium">{log.msg}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default LogPanel;
