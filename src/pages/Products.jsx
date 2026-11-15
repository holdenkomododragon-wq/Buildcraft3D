import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import PartThumb from '@/components/parts/PartThumb';
import PartPhotoButton from '@/components/parts/PartPhotoButton';
import ProductGallery from '@/components/parts/ProductGallery';
import { useBuilder } from '@/hooks/useBuilder';
import { ALL_SLOTS, money } from '@/lib/catalogMeta';
import { useToast } from '@/components/ui/use-toast';

const keySpecs = (p) => Object.entries(p.specs || {}).filter(([, v]) => typeof v !== 'object').slice(0, 4);

export default function Products() {
  const { parts, addPart, catalogLoading } = useBuilder();
  const [cat, setCat] = useState('all');
  const [q, setQ] = useState('');
  const [detail, setDetail] = useState(null);
  const nav = useNavigate();
  const { toast } = useToast();
  const list = parts.filter((p) => (cat === 'all' || p.category === cat) && (!q || `${p.name} ${p.brand}`.toLowerCase().includes(q.toLowerCase())));
  const add = (p) => { addPart(p.category, p); toast({ title: 'Added to build', description: p.name }); };
  return (
    <div className="thin-scroll h-full overflow-y-auto p-6">
      <h1 className="text-[24px] font-semibold">Products</h1>
      <div className="relative mt-4 max-w-md"><Search className="absolute left-3 top-2.5 h-4 w-4 text-[#71717a]" /><Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search parts and brands" className="pl-9" /></div>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {[{ key: 'all', label: 'All' }, ...ALL_SLOTS].map((s) => <button key={s.key} onClick={() => setCat(s.key)} className={`rounded-full px-3 py-1 text-[12px] ${cat === s.key ? 'bg-[#ff2e8c] text-white' : 'bg-[#1c1c1c] text-[#a1a1aa] hover:text-white'}`}>{s.label}</button>)}
      </div>
      <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {list.map((p) => (
          <div key={p.id} className="flex flex-col rounded-lg border border-[#232323] bg-[#131313] p-3 transition-colors hover:border-[#41414c]">
            <div className="flex gap-3">{p.image_url ? <PartPhotoButton part={p} size="h-20 w-20" /> : <PartThumb part={p} size="h-14 w-14" />}<div className="min-w-0"><div className="text-[13px] font-medium leading-snug">{p.name}</div><div className="mt-0.5 text-[11px] text-[#71717a]">{p.brand} · {p.category}</div></div></div>
            <div className="mt-2 flex flex-wrap gap-1">{keySpecs(p).map(([k, v]) => <span key={k} className="rounded bg-[#1c1c1c] px-1.5 py-0.5 text-[10px] text-[#a1a1aa]">{k.replace(/_/g, ' ')}: {String(v)}</span>)}</div>
            <div className="mt-3 flex items-center gap-2"><span className="tabular text-[14px] font-semibold text-[#22c55e]">{money(p.price)}</span><span className="rounded border border-[#34343d] px-1 text-[9px] text-[#71717a]">{p.image_url ? 'Product photo' : '3D approximate'}</span>
              <Button size="sm" variant="outline" className="ml-auto h-7 text-[11px]" onClick={() => setDetail(p)}>Details</Button>
              <Button size="sm" className="h-7 text-[11px]" onClick={() => add(p)}>Add to Build</Button></div>
          </div>
        ))}
      </div>
      {!catalogLoading && !list.length && <p className="mt-16 text-center text-[13px] text-[#71717a]">No products match.</p>}
      <Dialog open={!!detail} onOpenChange={(o) => !o && setDetail(null)}>
        <DialogContent className="max-h-[85vh] overflow-y-auto border-[#232323] bg-[#131313]">
          {detail && (<>
            <DialogHeader><DialogTitle>{detail.name}</DialogTitle></DialogHeader>
            {detail.image_url && <div className="flex h-80 flex-col"><ProductGallery key={detail.id} part={detail} /></div>}
            {detail.description && <p className="text-[12px] text-[#a1a1aa]">{detail.description}</p>}
            <div className="text-[12px]">{Object.entries(detail.specs || {}).map(([k, v]) => <div key={k} className="flex justify-between gap-4 border-b border-[#232323] py-1.5"><span className="text-[#71717a]">{k.replace(/_/g, ' ')}</span><span className="text-right">{typeof v === 'object' ? JSON.stringify(v).replace(/["{}\[\]]/g, '') : String(v)}</span></div>)}</div>
            <p className="text-[11px] text-[#71717a]">{money(detail.price)} · {detail.price_source || 'Reference price (not live)'}. Photos show the real product; the interactive 3D layout is an approximation, not an exact product model.</p>
            <Button onClick={() => { add(detail); setDetail(null); nav('/'); }}>Add to build and open builder</Button>
          </>)}
        </DialogContent>
      </Dialog>
    </div>
  );
}