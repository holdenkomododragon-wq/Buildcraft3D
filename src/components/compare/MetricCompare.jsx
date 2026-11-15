import { money } from '@/lib/catalogMeta';

const ROWS = [
  { label: 'Build price', get: (d) => d.price.total, fmt: money, better: 'lower' },
  { label: 'Power draw', get: (d) => d.power.total, fmt: (v) => `${Math.round(v)} W`, better: 'lower' },
  { label: '3DMark (est.)', get: (d) => d.bench.overall, fmt: (v) => (v ? v.toLocaleString() : '—'), better: 'higher' },
  { label: 'Cyberpunk 1440p', get: (d) => d.bench.games.find((g) => g.name === 'Cyberpunk 2077')?.fps, fmt: (v) => (v ? `${v} fps` : '—'), better: 'higher' },
];

export default function MetricCompare({ left, right }) {
  return (
    <div className="overflow-hidden rounded-xl border border-[#232323] bg-[#131313]">
      <div className="grid grid-cols-[1fr_104px_104px_84px] items-center gap-2 border-b border-[#232323] px-3 py-2 text-[9px] font-semibold uppercase tracking-[0.14em] text-[#71717a]">
        <span>Metric</span><span className="text-right">Build A</span><span className="text-right">Build B</span><span className="text-right">Diff</span>
      </div>
      {ROWS.map((r) => {
        const a = r.get(left);
        const b = r.get(right);
        const delta = a != null && b != null ? b - a : null;
        const color = delta == null || delta === 0 ? '#71717a' : (r.better === 'lower' ? delta < 0 : delta > 0) ? '#22c55e' : '#ef4444';
        const sign = delta == null || delta === 0 ? '' : delta > 0 ? '+' : '−';
        return (
          <div key={r.label} className="grid grid-cols-[1fr_104px_104px_84px] items-center gap-2 border-b border-[#1c1c1c] px-3 py-1.5 text-[12px] last:border-0">
            <span className="text-[#a1a1aa]">{r.label}</span>
            <span className="tabular text-right font-medium text-white">{r.fmt(a)}</span>
            <span className="tabular text-right font-medium text-white">{r.fmt(b)}</span>
            <span className="tabular text-right font-semibold" style={{ color }}>{delta == null ? '—' : `${sign}${r.fmt(Math.abs(delta))}`}</span>
          </div>
        );
      })}
    </div>
  );
}