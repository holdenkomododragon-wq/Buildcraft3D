import { Plus } from 'lucide-react';
import SlotItem from './SlotItem';
import { SLOT_ICON } from '@/lib/slotIcons';
import { useBuilder } from '@/hooks/useBuilder';

export default function SlotGroup({ slotDef, onPick }) {
  const { build, summary } = useBuilder();
  // keep each entry paired with its true index in the stored list, so a row always shows
  // (and edits) the part that is actually selected in that position
  const rows = (build.items[slotDef.key] || []).map((item, idx) => ({ item, idx })).filter(({ idx }) => summary.r[slotDef.key]?.[idx]);
  const Icon = SLOT_ICON[slotDef.key];
  const canAdd = slotDef.multi || !rows.length;
  return (
    <div>
      <div className="flex items-center justify-between px-3 pb-1 pt-3">
        <span className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#71717a]">
          <Icon className="h-3 w-3" strokeWidth={1.8} />{slotDef.label}
        </span>
        {canAdd && (
          <button onClick={() => onPick({ slot: slotDef.key, idx: null })} className="flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-medium text-[#8b8b94] transition-colors hover:bg-[#171717] hover:text-white">
            <Plus className="h-3 w-3" />{rows.length ? 'Add more' : 'Add'}
          </button>
        )}
      </div>
      {rows.map(({ item, idx }) => <SlotItem key={`${item.partId}-${idx}`} slot={slotDef.key} idx={idx} item={item} onSwap={() => onPick({ slot: slotDef.key, idx })} />)}
    </div>
  );
}