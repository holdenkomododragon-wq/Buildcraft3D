import { useState } from 'react';
import { useBuilder } from '@/hooks/useBuilder';
import { RESOLUTIONS, calcBenchmark } from '@/lib/buildCalc';
import { Image } from '@/components/ui/image';
import { gameArt } from '@/lib/gameArt';

function Gauge({ value, max = 45000 }) {
  const frac = Math.min(1, (value || 0) / max);
  const r = 70;
  const c = Math.PI * r;
  return (
    <svg viewBox="0 0 180 110" className="mx-auto w-48">
      <path d="M20 95 A70 70 0 0 1 160 95" fill="none" stroke="#27272f" strokeWidth="12" strokeLinecap="round" />
      <path d="M20 95 A70 70 0 0 1 160 95" fill="none" stroke="#f97316" strokeWidth="12" strokeLinecap="round" strokeDasharray={`${c * frac} ${c}`} />
      <text x="90" y="80" textAnchor="middle" fill="#fff" fontSize="22" fontWeight="600">{value ? value.toLocaleString() : '--'}</text>
      <text x="90" y="98" textAnchor="middle" fill="#a1a1aa" fontSize="9">Estimated Time Spy score</text>
    </svg>
  );
}

const Bar = ({ label, v, max }) => (
  <div><div className="mb-1 flex justify-between text-[11px]"><span className="text-[#a1a1aa]">{label}</span><span className="tabular">{v ? v.toLocaleString() : '--'}</span></div><div className="h-1.5 rounded-full bg-[#27272f]"><div className="h-full rounded-full bg-[#38bdf8]" style={{ width: `${Math.min(100, ((v || 0) / max) * 100)}%` }} /></div></div>
);

export default function BenchModal() {
  const { resolved } = useBuilder();
  const [res, setRes] = useState('1440u');
  const b = calcBenchmark(resolved, res);
  const label = RESOLUTIONS.find((x) => x.id === res).label;
  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-[220px_1fr]">
        <div className="space-y-3 rounded-lg border border-[#27272f] bg-[#18181e] p-3">
          <Gauge value={b.overall} />
          <Bar label="CPU score (est.)" v={b.C} max={20000} />
          <Bar label="GPU score (est.)" v={b.G} max={40000} />
          <p className="text-[10px] text-[#71717a]">Estimate from a reference model (weighted CPU/GPU). Not an official 3DMark result. Confidence: low.</p>
        </div>
        <div>
          <div className="mb-3 flex flex-wrap gap-1">{RESOLUTIONS.map((x) => <button key={x.id} onClick={() => setRes(x.id)} className={`rounded-full px-3 py-1 text-[11px] ${res === x.id ? 'bg-[#ff2a85] text-white' : 'bg-[#18181e] text-[#a1a1aa] hover:text-white'}`}>{x.label}</button>)}</div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {b.games.map((g) => (
              <div key={g.name} className="overflow-hidden rounded-lg border border-[#27272f] bg-[#18181e]">
                {gameArt(g.name) ? (
                  <Image src={gameArt(g.name)} alt={g.name} className="h-16 w-full object-cover" fittingType="fill" />
                ) : null}
                <div className="p-2.5">
                  <div className="text-[11px] font-medium leading-tight">{g.name}</div>
                  <div className="tabular mt-2 text-[20px] font-semibold">{g.fps ?? '--'}<span className="ml-1 text-[10px] font-normal text-[#71717a]">{g.fps ? 'FPS est.' : ''}</span></div>
                  <div className="text-[10px] text-[#71717a]">{g.fps ? `${label} · ${g.limit}-limited` : 'Insufficient benchmark data'}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <p className="text-[11px] text-[#71717a]">{b.overall ? `Based on ${b.cpuName} and ${b.gpuName}. ` : 'Add a CPU and a GPU to see estimates. '}FPS is an interpolated estimate, not measured data, and will differ with drivers, game updates and system configuration.</p>
    </div>
  );
}