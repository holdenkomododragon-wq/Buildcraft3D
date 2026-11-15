import { useState } from 'react';
import { Gauge, EyeOff } from 'lucide-react';
import { useBuilder } from '@/hooks/useBuilder';
import { RESOLUTIONS, calcBenchmark } from '@/lib/buildCalc';

const SHORT = { '1080u': '1080p', '1440u': '1440p', '4ku': '4K' };
const RES = RESOLUTIONS.filter((r) => SHORT[r.id]);

export default function FpsChart() {
  const { summary, build, setSettings } = useBuilder();
  const [resId, setResId] = useState('1440u');
  // hidden from Settings, the eye button below, or both — the card never renders when off
  if (build.settings.showFps === false) return null;
  const bench = calcBenchmark(summary.r, resId);
  const max = Math.max(60, ...bench.games.map((g) => g.fps || 0));
  const empty = bench.games.every((g) => g.fps == null);
  return (
    <div className="w-[212px] rounded-xl border border-[#262626] bg-[#141414]/95 p-2.5 shadow-[0_10px_30px_rgba(0,0,0,0.45)] backdrop-blur">
      <div className="flex items-center gap-1.5 text-[9px] font-semibold uppercase tracking-[0.14em] text-[#8b8b94]">
        <Gauge className="h-3 w-3 text-[#f97316]" />Predicted FPS
        <button onClick={() => setSettings({ showFps: false })} title="Hide predicted FPS" aria-label="Hide predicted FPS" className="ml-auto rounded p-0.5 text-[#71717a] hover:text-white"><EyeOff className="h-3 w-3" /></button>
      </div>
      <div className="mt-1.5 flex gap-0.5 rounded border border-[#242424] bg-[#101010] p-0.5">
        {RES.map((r) => (
          <button key={r.id} type="button" onClick={() => setResId(r.id)} aria-pressed={resId === r.id} className={`flex-1 rounded px-1 py-0.5 text-[9px] font-medium transition-colors ${resId === r.id ? 'bg-[#2a2a2a] text-white' : 'text-[#8b8b94] hover:text-white'}`}>
            {SHORT[r.id]}
          </button>
        ))}
      </div>
      {empty ? (
        <p className="mt-2 text-[10px] leading-tight text-[#71717a]">Pick a CPU and GPU to see predicted frame rates.</p>
      ) : (
        <div className="mt-2 space-y-[5px]">
          {bench.games.map((g) => (
            <div key={g.name} className="flex items-center gap-1.5" title={g.limit ? `${g.name} — ${g.limit}-limited` : g.name}>
              <span className="w-[74px] shrink-0 truncate text-[9px] text-[#a1a1aa]">{g.name}</span>
              <div className="h-[7px] flex-1 overflow-hidden rounded-sm bg-[#242424]">
                <div className="h-full rounded-sm bg-gradient-to-r from-[#ff2e8c] to-[#f97316] transition-[width] duration-300" style={{ width: `${g.fps ? Math.max(3, (g.fps / max) * 100) : 0}%` }} />
              </div>
              <span className="tabular w-7 shrink-0 text-right text-[9px] font-semibold text-[#e5e7eb]">{g.fps ?? '—'}</span>
            </div>
          ))}
        </div>
      )}
      <p className="mt-1.5 text-[9px] leading-tight text-[#5f5f68]">Model estimate, not a measured benchmark.</p>
    </div>
  );
}