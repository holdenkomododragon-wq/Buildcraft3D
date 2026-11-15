import { useMemo } from 'react';
import { Plus } from 'lucide-react';
import PartThumb from './PartThumb';
import { useBuilder } from '@/hooks/useBuilder';
import { SLOT_LABEL, money } from '@/lib/catalogMeta';

// One search across the whole catalog: every hit drops straight into its own slot,
// so nothing has to be hunted down slot by slot.
export default function PartSearchResults({ q, onDone }) {
  const { parts, addPart } = useBuilder();
  const hits = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return [];
    return parts
      .filter((p) => p.active !== false && SLOT_LABEL[p.category])
      .filter((p) => `${p.brand || ''} ${p.name} ${SLOT_LABEL[p.category]}`.toLowerCase().includes(t))
      .slice(0, 30);
  }, [parts, q]);

  if (!hits.length) {
    return <p className="p-4 text-[12px] text-[#71717a]">No parts match “{q.trim()}”.</p>;
  }

  return (
    <div>
      <p className="px-3 py-2 text-[11px] text-[#71717a]">{hits.length} {hits.length === 1 ? 'part' : 'parts'} — click to drop it straight into its slot</p>
      {hits.map((p) => (
        <button
          key={p.id}
          onClick={() => { addPart(p.category, p); onDone(); }}
          className="flex w-full items-center gap-3 border-t border-[#22222a] px-3 py-2 text-left transition-colors hover:bg-[#1c1c22]"
        >
          <PartThumb part={p} />
          <div className="min-w-0 flex-1">
            <div className="truncate text-[13px] font-medium">{p.name}</div>
            <div className="text-[11px] text-[#71717a]">{SLOT_LABEL[p.category]} · {p.brand}</div>
          </div>
          <div className="tabular text-[13px] font-semibold text-[#22c55e]">{money(p.price)}</div>
          <Plus className="h-3.5 w-3.5 text-[#71717a]" />
        </button>
      ))}
    </div>
  );
}