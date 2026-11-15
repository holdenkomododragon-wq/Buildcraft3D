import { ALL_SLOTS } from '@/lib/catalogMeta';
import { money } from '@/lib/catalogMeta';

const label = (rows) => (rows || []).map((x) => `${x.part.name}${x.qty > 1 ? ` ×${x.qty}` : ''}`).join(' + ');
const total = (rows) => (rows || []).reduce((a, x) => a + (x.part.price || 0) * x.qty, 0);

export default function SpecRows({ left, right }) {
  const slots = ALL_SLOTS.filter((s) => left.r[s.key]?.length || right.r[s.key]?.length);
  if (!slots.length) return null;
  return (
    <div className="overflow-hidden rounded-xl border border-[#232323] bg-[#131313]">
      <div className="grid grid-cols-[104px_1fr_1fr] items-center gap-2 border-b border-[#232323] px-3 py-2 text-[9px] font-semibold uppercase tracking-[0.14em] text-[#71717a]">
        <span>Part</span><span>Build A</span><span>Build B</span>
      </div>
      {slots.map((s) => {
        const a = left.r[s.key];
        const b = right.r[s.key];
        const same = label(a) === label(b);
        const cell = (rows, price) => (
          <div className="min-w-0 text-[12px]">
            <div className={rows?.length ? 'text-white' : 'text-[#52525b]'}>{rows?.length ? label(rows) : '—'}</div>
            {rows?.length ? <div className="tabular text-[10.5px] text-[#71717a]">{money(price)}</div> : null}
          </div>
        );
        return (
          <div key={s.key} className={`grid grid-cols-[104px_1fr_1fr] items-start gap-2 border-b border-[#1c1c1c] px-3 py-2 last:border-0 ${same ? '' : 'bg-[#00cc66]/[0.04]'}`}>
            <span className={`text-[9.5px] font-semibold uppercase tracking-[0.12em] ${same ? 'text-[#5f5f68]' : 'text-[#00cc66]'}`}>{s.label}</span>
            {cell(a, total(a))}
            {cell(b, total(b))}
          </div>
        );
      })}
    </div>
  );
}