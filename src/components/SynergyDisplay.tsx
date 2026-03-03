import React from 'react';
import { SynergyResult } from '../types';

interface SynergyDisplayProps {
  synergy: SynergyResult;
  size?: 'sm' | 'md';
}

const SynergyDisplay: React.FC<SynergyDisplayProps> = ({ synergy, size = 'md' }) => {
  const starSize = size === 'sm' ? 'text-sm' : 'text-lg';
  const textSize = size === 'sm' ? 'text-[9px]' : 'text-[10px]';

  return (
    <div className="flex items-center gap-1.5">
      <div className={`flex gap-0.5 ${starSize}`}>
        {[0, 1, 2].map(i => (
          <span key={i} className={i < synergy.stars ? 'text-amber-400' : 'text-slate-700'}>★</span>
        ))}
      </div>
      {synergy.multiplier > 1 && (
        <span className={`${textSize} font-bold text-amber-400`}>×{synergy.multiplier.toFixed(2)}</span>
      )}
    </div>
  );
};

export default SynergyDisplay;
