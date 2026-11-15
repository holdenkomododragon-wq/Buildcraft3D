import { useState } from 'react';
import { Gauge } from 'lucide-react';
import { RESOLUTIONS, calcBenchmark } from '@/lib/buildCalc';

const RES = RESOLUTIONS.filter((r) => ['1080u', '1440u', '4ku'].includes(r.id));

// a build's own performance chart: same model as the builder and the advisor
export default function BuildFpsSection({ r }) {
  const [resId, setResId] = useState('1440u');
  const bench = calcBenchmark(r, resId);
  const res = RESOLUTIONS.find((x) => x.id === resId);
  const max = Math.max(60, ...bench.games.map((g) => g.fps || 0));
  const empty = bench.games.every((g) => g.fps == null);

  return (
    <section className="mt-6 rounded-xl border border-[#222] bg-[#121212]">
      <div className="flex flex-wrap items-center gap-2 border-b border-[#222] px-4 py-2.5">
        <h2 className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#71717a]">
          <Gauge className="h-3.5 w-3.5 text-[#f97316]" />Estimated FPS
        </h2>
        <span className="text-[10px] text-[#5f5f68]">{bench.gpuName || 'No GPU'} · {bench.cpuName || 'No CPU'}</span>
        <div className="ml-auto flex gap-0.5 rounded border border-[#242424] bg-[#0d0d0d] p-0.5">
          {RES.map((x) => (
            <button key={x.id} type="button" onClick={() => setResId(x.id)} aria-pressed={resId === x.id} className={`rounded px-2 py-0.5 text-[10px] font-medium transition-colors ${resId === x.id ? 'bg-[#2a2a2a] text-white' : 'text-[#8b8b94] hover:text-white'}`}>
              {x.label}
            </button>
          ))}
        </div>
      </div>

      {empty ? (
        <p className="px-4 py-8 text-center text-[12px] text-[#71717a]">This build has no CPU and GPU pair yet, so there is nothing to predict.</p>
      ) : (
        <div className="grid gap-x-8 px-4 py-3 sm:grid-cols-2">
          {bench.games.map((g) => (
            <div key={g.name} className="flex items-center gap-2 border-b border-[#1c1c1c] py-2 last:border-0 sm:last:border-0">
              <span className="w-[110px] shrink-0 truncate text-[11.5px] text-[#b3b3bb]" title={g.name}>{g.name}</span>
              <div className="h-2 flex-1 overflow-hidden rounded-sm bg-[#242424]">
                <div className="h-full rounded-sm bg-gradient-to-r from-[#ff2e8c] to-[#f97316]" style={{ width: `${g.fps ? Math.max(2, (g.fps / max) * 100) : 0}%` }} />
              </div>
              <span className="tabular w-10 shrink-0 text-right text-[11.5px] font-semibold text-white">{g.fps ?? '—'}<span className="ml-0.5 text-[9px] font-normal text-[#71717a]">fps</span></span>
              <span className="w-8 shrink-0 text-[9px] uppercase tracking-wide text-[#5f5f68]">{g.limit || ''}</span>
            </div>
          ))}
        </div>
      )}

      <p className="border-t border-[#1c1c1c] px-4 py-2 text-[10px] text-[#5f5f68]">
        {res ? res.label : ''} at the model's reference settings. Predicted from the CPU and GPU Time Spy scores, not a measured benchmark.
      </p>
    </section>
  );
}