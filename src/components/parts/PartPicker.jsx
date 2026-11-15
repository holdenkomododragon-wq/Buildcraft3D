import { useMemo, useState } from 'react';
import { Search, AlertTriangle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import PartThumb from './PartThumb';
import PartPhotoButton from '@/components/parts/PartPhotoButton';
import { useBuilder } from '@/hooks/useBuilder';
import { ALL_SLOTS, SLOT_LABEL, money } from '@/lib/catalogMeta';
import { calcCompat, resolveItems } from '@/lib/buildCalc';

export default function PartPicker({ slot, idx, onClose }) {
  const { parts, build, byId, addPart } = useBuilder();
  const [q, setQ] = useState('');
  const [brand, setBrand] = useState('all');
  const [sort, setSort] = useState('rec');
  const [pending, setPending] = useState(null);
  const [fitOnly, setFitOnly] = useState(true);
  const meta = ALL_SLOTS.find((s) => s.key === slot);
  const hasCase = !!(build.items.case || []).length;
  const fitByCase = hasCase && (slot === 'gpu' || slot === 'cooler');

  const rows = useMemo(() => {
    if (!slot) return { shown: [], hidden: 0 };
    const conflict = (p) => {
      const cur = build.items[slot] || [];
      const list = idx != null ? cur.map((x, i) => (i === idx ? { partId: p.id, qty: x.qty } : x)) : meta?.multi ? [...cur, { partId: p.id, qty: 1 }] : [{ partId: p.id, qty: 1 }];
      const c = calcCompat(resolveItems({ ...build.items, [slot]: list }, byId));
      return c.checks.find((x) => x.status === 'incompatible' && x.ids.includes(p.id)) || null;
    };
    let list = parts.filter((p) => p.category === slot && p.active !== false).map((p) => ({ p, bad: conflict(p) }));
    if (brand !== 'all') list = list.filter((x) => x.p.brand === brand);
    if (q.trim()) list = list.filter((x) => x.p.name.toLowerCase().includes(q.toLowerCase()));
    const cmp = { rec: (a, b) => Number(!!a.bad) - Number(!!b.bad) || a.p.name.localeCompare(b.p.name), low: (a, b) => a.p.price - b.p.price, high: (a, b) => b.p.price - a.p.price };
    const sorted = list.sort(cmp[sort]);
    // the case governs only the card and the cooler, so only those lists are trimmed
    const trimmed = fitOnly && fitByCase;
    const shown = trimmed ? sorted.filter((x) => !x.bad) : sorted;
    return { shown, hidden: sorted.length - shown.length, trimmed };
  }, [slot, idx, parts, build.items, byId, q, brand, sort, fitOnly, fitByCase]);

  const brands = [...new Set(parts.filter((p) => p.category === slot).map((p) => p.brand))].sort();
  const choose = (x) => (x.bad ? setPending(x) : (addPart(slot, x.p, idx), onClose()));

  return (
    <Dialog open={!!slot} onOpenChange={(o) => { if (!o) { setPending(null); onClose(); } }}>
      <DialogContent className="flex max-h-[85vh] max-w-2xl flex-col gap-3 border-[#27272f] bg-[#141418]">
        <DialogHeader><DialogTitle>{idx != null ? 'Swap' : 'Add'} {SLOT_LABEL[slot]}</DialogTitle></DialogHeader>
        <div className="flex flex-wrap gap-2">
          <div className="relative min-w-[160px] flex-1"><Search className="absolute left-2.5 top-2.5 h-4 w-4 text-[#71717a]" /><Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search" className="pl-8" /></div>
          <Select value={brand} onValueChange={setBrand}><SelectTrigger className="w-36"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All brands</SelectItem>{brands.map((b) => <SelectItem key={b} value={b}>{b}</SelectItem>)}</SelectContent></Select>
          <Select value={sort} onValueChange={setSort}><SelectTrigger className="w-40"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="rec">Recommended</SelectItem><SelectItem value="low">Lowest price</SelectItem><SelectItem value="high">Highest price</SelectItem></SelectContent></Select>
        </div>
        {pending && (
          <div className="rounded-lg border border-[#ef4444]/50 bg-[#ef4444]/10 p-3 text-[12px]">
            <div className="flex items-start gap-2"><AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-[#ef4444]" /><div><b>{pending.p.name}</b> conflicts with your build: {pending.bad.message}</div></div>
            <div className="mt-2 flex gap-2"><Button size="sm" variant="outline" onClick={() => setPending(null)}>Choose another</Button><Button size="sm" variant="destructive" onClick={() => { addPart(slot, pending.p, idx); setPending(null); onClose(); }}>Add anyway</Button></div>
            <p className="mt-2 text-[10px] text-[#a1a1aa]">Nothing has changed yet — your current {SLOT_LABEL[slot].toLowerCase()} stays selected unless you add this one.</p>
          </div>
        )}
        <div className="thin-scroll -mr-2 min-h-0 flex-1 space-y-1.5 overflow-y-auto pr-2">
          {rows.shown.map((x) => (
            <div key={x.p.id} className="flex w-full items-center gap-3 rounded-lg border border-border bg-secondary p-2.5">
              {x.p.image_url ? <PartPhotoButton part={x.p} size="h-16 w-16" /> : <PartThumb part={x.p} />}
              <button type="button" onClick={() => choose(x)} className="flex min-w-0 flex-1 items-center gap-3 text-left">
              <div className="min-w-0 flex-1">
                <div className="truncate text-[13px] font-medium">{x.p.name}</div>
                <div className="text-[11px] text-[#71717a]">{x.p.brand}{x.bad ? <span className="ml-2 text-[#ef4444]">Conflict: {x.bad.message}</span> : null}</div>
              </div>
              <div className="tabular text-[13px] font-semibold text-[#00cc66]">{money(x.p.price)}</div>
              </button>
            </div>
          ))}
          {!rows.shown.length && (
            <div className="py-8 text-center text-[12px] text-[#71717a]">
              {rows.trimmed ? 'Nothing in the catalog fits this case.' : 'No parts match.'}
              {rows.trimmed && <button type="button" onClick={() => setFitOnly(false)} className="ml-1 text-[#00cc66] hover:underline">Show every part</button>}
            </div>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2 text-[10px] text-[#52525b]">
          <p>Prices are reference prices, not live retailer prices. Conflicting parts stay selectable, with a warning.</p>
          {fitByCase && (
            <button type="button" onClick={() => setFitOnly(!fitOnly)} className={`ml-auto rounded-full border px-2 py-0.5 text-[10px] font-medium transition-colors ${fitOnly ? 'border-[#00cc66] text-[#00cc66]' : 'border-[#2a2a2a] text-[#8b8b94] hover:text-white'}`}>
              {fitOnly ? `Only parts that fit${rows.hidden ? ` · ${rows.hidden} hidden` : ''}` : 'Showing every part'}
            </button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}