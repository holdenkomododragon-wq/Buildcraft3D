import PartThumb from '@/components/parts/PartThumb';
import { useBuilder } from '@/hooks/useBuilder';
import { SLOT_LABEL } from '@/lib/catalogMeta';

const C = { compatible: ['#38bdf8', 'Compatible'], warning: ['#f1c40f', 'Warning'], incompatible: ['#ef4444', 'Incompatible'], unknown: ['#94a3b8', 'Unknown'] };

export default function CompatModal() {
  const { summary, resolved } = useBuilder();
  const { compat } = summary;
  const [col, label] = C[compat.overall];
  const rows = Object.entries(resolved).flatMap(([slot, list]) => list.map((x) => ({ ...x, slot })));
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3"><span className="text-[18px] font-semibold" style={{ color: col }}>{label}</span><span className="text-[12px] text-[#71717a]">{compat.checks.length} checks · {compat.errors} conflicts · {compat.warnings} warnings · {compat.unknown} unknown</span></div>
      <div className="rounded-lg border border-[#27272f] bg-[#18181e] p-3 text-[11px] text-[#a1a1aa]">Rule-based checks cover socket, form factor, GPU/cooler/PSU size, memory, storage slots and power. Other checks (for example cooler vs RAM clearance, BIOS versions) are not yet verified.{compat.missing.length ? ` Missing for a complete PC: ${compat.missing.map((k) => SLOT_LABEL[k]).join(', ')}.` : ''}</div>
      {!!compat.checks.length && (
        <div className="space-y-1">
          {compat.checks.map((c) => <div key={c.id} className="flex items-start justify-between gap-3 border-b border-[#27272f] py-1.5 text-[12px]"><div><div className="text-[10px] uppercase tracking-wider text-[#71717a]">{c.rule}</div><div className="text-[#d4d4d8]">{c.message}</div></div><span className="shrink-0 font-medium" style={{ color: C[c.status][0] }}>{C[c.status][1]}</span></div>)}
        </div>
      )}
      <div className="max-h-48 space-y-1 overflow-y-auto thin-scroll">
        {rows.map((x, i) => <div key={i} className="flex items-center gap-2 text-[12px]"><PartThumb part={x.part} size="h-8 w-8" /><div className="min-w-0 flex-1 truncate">{x.part.name}</div><span style={{ color: C[compat.perPart[x.part.id]][0] }}>{C[compat.perPart[x.part.id]][1]}</span></div>)}
      </div>
    </div>
  );
}