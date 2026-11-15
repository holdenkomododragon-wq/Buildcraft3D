import { Check, AlertTriangle, XCircle, HelpCircle } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { money } from '@/lib/catalogMeta';

const COMPAT = {
  compatible: { label: 'Compatible', color: '#3b82f6', Icon: Check },
  warning: { label: 'Warnings', color: '#f1c40f', Icon: AlertTriangle },
  incompatible: { label: 'Incompatible', color: '#ef4444', Icon: XCircle },
  unknown: { label: 'Unverified', color: '#94a3b8', Icon: HelpCircle },
};

export default function CompareSlot({ title, value, onChange, data, groups }) {
  const c = COMPAT[data?.compat?.overall] || COMPAT.unknown;
  return (
    <div className="rounded-xl border border-[#232323] bg-[#131313] p-3">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#71717a]">{title}</span>
        {data && <span className="tabular text-[12px] font-semibold text-[#00cc66]">{money(data.price.total)}</span>}
      </div>
      <Select value={value || ''} onValueChange={onChange}>
        <SelectTrigger className="h-8 border-[#2a2a2a] bg-[#0f0f0f] text-[12px]"><SelectValue placeholder="Choose a build" /></SelectTrigger>
        <SelectContent>
          {groups.map((g) => g.items.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>))}
        </SelectContent>
      </Select>
      {data ? (
        <div className="mt-2">
          <div className="truncate text-[14px] font-semibold text-white">{data.title}</div>
          <div className="flex items-center gap-1.5 text-[11px] text-[#71717a]">
            <span className="truncate">{data.subtitle}</span>
            <span className="h-2.5 w-px bg-[#2a2a2a]" />
            <span className="shrink-0" style={{ color: c.color }}>{c.label}</span>
          </div>
        </div>
      ) : (
        <p className="mt-2 text-[11px] text-[#5f5f68]">Nothing selected for this side yet.</p>
      )}
    </div>
  );
}