export default function BenchCompare({ left, right }) {
  const games = left.bench.games || [];
  return (
    <div className="overflow-hidden rounded-xl border border-[#232323] bg-[#131313]">
      <div className="flex items-center justify-between border-b border-[#232323] px-3 py-2">
        <span className="text-[9px] font-semibold uppercase tracking-[0.14em] text-[#71717a]">Game performance · 1440p Ultra (estimated)</span>
        <span className="text-[9px] text-[#52525b]">3DMark A {left.bench.overall ? left.bench.overall.toLocaleString() : '—'} · B {right.bench.overall ? right.bench.overall.toLocaleString() : '—'}</span>
      </div>
      {games.map((g, i) => {
        const b = right.bench.games?.[i]?.fps ?? null;
        const a = g.fps;
        const delta = a != null && b != null ? b - a : null;
        return (
          <div key={g.name} className="grid grid-cols-[1fr_84px_84px_76px] items-center gap-2 border-b border-[#1c1c1c] px-3 py-1.5 text-[12px] last:border-0">
            <span className="truncate text-[#a1a1aa]">{g.name}</span>
            <span className="tabular text-right text-white">{a == null ? '—' : `${a} fps`}</span>
            <span className="tabular text-right text-white">{b == null ? '—' : `${b} fps`}</span>
            <span className="tabular text-right font-semibold" style={{ color: delta == null || delta === 0 ? '#71717a' : delta > 0 ? '#00cc66' : '#ef4444' }}>
              {delta == null || delta === 0 ? '—' : `${delta > 0 ? '+' : '−'}${Math.abs(delta)}`}
            </span>
          </div>
        );
      })}
      <p className="border-t border-[#1c1c1c] px-3 py-2 text-[9.5px] text-[#5f5f68]">FPS figures are modelled estimates from the CPU and GPU scores, not measured benchmarks.</p>
    </div>
  );
}