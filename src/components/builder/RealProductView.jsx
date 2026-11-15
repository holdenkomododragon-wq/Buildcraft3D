import { Loader2 } from 'lucide-react';
import ProductGallery from '@/components/parts/ProductGallery';
import PartThumb from '@/components/parts/PartThumb';
import { useBuilder } from '@/hooks/useBuilder';
import { PC_SLOTS, SLOT_LABEL } from '@/lib/catalogMeta';

export default function RealProductView() {
  const { resolved, parts, catalogLoading, focusPartId, setFocusPartId } = useBuilder();
  const selected = PC_SLOTS.flatMap(({ key }) => (resolved[key] || []).map((it) => it.part));
  const unique = [...new Map(selected.map((p) => [p.id, p])).values()];
  const choices = unique.length ? unique : parts.filter((p) => p.category === 'case' && p.active !== false);
  const part = choices.find((p) => p.id === focusPartId) || choices[0];
  if (catalogLoading) return <div className="absolute inset-0 flex items-center justify-center"><Loader2 aria-label="Loading product photographs" className="h-6 w-6 animate-spin text-primary" /></div>;
  if (!part) return <div className="absolute inset-0 flex items-center justify-center text-sm text-muted-foreground">Add a PC part to see its product photos.</div>;
  return (
    <div className="absolute inset-x-0 bottom-0 top-24 flex flex-col gap-3 p-4 pt-0 sm:p-6 sm:pt-0">
      <div className="shrink-0"><div className="text-[10px] font-semibold uppercase tracking-widest text-primary">{unique.length ? 'Your selected hardware' : 'Case catalog preview'} · {SLOT_LABEL[part.category]}</div><h2 className="mt-1 text-base font-semibold sm:text-xl">{part.name}</h2></div>
      <ProductGallery key={part.id} part={part} />
      <div className="shrink-0 border-t pt-3">
        <p className="mb-2 text-[11px] text-muted-foreground">{unique.length ? 'Select a component to inspect its actual appearance.' : 'Preview a case below. Add parts from the Parts panel to start your build.'}</p>
        <div className="thin-scroll flex gap-2 overflow-x-auto pb-1">{choices.map((p) => <button type="button" key={p.id} onClick={() => setFocusPartId(p.id)} aria-pressed={part.id === p.id} title={p.name} className={`flex max-w-44 shrink-0 items-center gap-2 rounded-lg border p-1.5 text-left ${part.id === p.id ? 'border-primary bg-primary/10' : 'border-border bg-card'}`}><PartThumb part={p} size="h-10 w-10" /><span className="line-clamp-2 text-[10px] leading-tight">{p.name}</span></button>)}</div>
      </div>
    </div>
  );
}