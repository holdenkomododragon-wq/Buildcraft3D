import { useBuilder } from '@/hooks/useBuilder';

export default function PowerModal() {
  const { summary } = useBuilder();
  const p = summary.power;
  const msg = {
    safe: ['Power consumption is within safe limits.', '#f59e0b'],
    warning: [`The PSU covers the estimate but is below the suggested ${p.recommended} W (25% headroom).`, '#f59e0b'],
    error: ['Estimated power exceeds the PSU rating. Choose a larger power supply.', '#ef4444'],
    none: ['Add a power supply to compare against its rated capacity.', '#94a3b8'],
  }[p.level];
  return (
    <div className="space-y-3">
      <div className="flex items-baseline gap-2"><span className="tabular text-[24px] font-semibold text-[#f59e0b]">{Math.round(p.total * 10) / 10}W</span><span className="text-[13px] text-[#a1a1aa]">{p.capacity ? `of ${p.capacity}W` : 'estimated peak'}</span>{p.capacity && <span className="tabular ml-auto text-[12px] text-[#71717a]">{p.pct.toFixed(1)}% utilization</span>}</div>
      <div className="h-2 overflow-hidden rounded-full bg-[#27272f]"><div className="h-full rounded-full bg-[#f59e0b] transition-all" style={{ width: `${Math.min(100, p.pct)}%`, background: p.level === 'error' ? '#ef4444' : '#f59e0b' }} /></div>
      <div className="text-[12px]" style={{ color: msg[1] }}>{msg[0]}</div>
      <div className="text-[11px] font-semibold uppercase tracking-wider text-[#71717a]">Power details</div>
      <div className="max-h-[40vh] overflow-y-auto thin-scroll">
        {p.rows.map((r, i) => <div key={i} className="flex items-center justify-between gap-3 border-b border-[#27272f] py-2 text-[12px]"><span className="min-w-0 flex-1 truncate text-[#d4d4d8]">{r.part.name}</span><span className="tabular text-[#71717a]">{r.qty > 1 ? `${r.qty} x ${r.each}W` : ''}</span><span className="tabular w-16 text-right text-[#a1a1aa]">{Math.round(r.sub * 10) / 10}W</span></div>)}
        {!p.rows.length && <p className="py-4 text-center text-[12px] text-[#71717a]">No power-drawing parts selected.</p>}
      </div>
      <p className="text-[11px] text-[#71717a]">Peak estimates use catalog power figures (CPU max power, GPU board power). The 25% margin is a planning guideline, not a certification.</p>
    </div>
  );
}