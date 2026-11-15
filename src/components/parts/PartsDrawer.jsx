import { useState } from 'react';
import { Loader2, Search, Sparkles } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import SlotGroup from './SlotGroup';
import PartPicker from './PartPicker';
import PartSearchResults from './PartSearchResults';
import PriceHistoryTab from './PriceHistoryTab';
import { Input } from '@/components/ui/input';
import { PC_SLOTS, SETUP_SLOTS } from '@/lib/catalogMeta';
import { useBuilder } from '@/hooks/useBuilder';
import { useToast } from '@/components/ui/use-toast';

const Head = ({ children }) => <div className="border-y border-[#1c1c1c] bg-[#0d0d0d] px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#71717a]">{children}</div>;

export default function PartsDrawer() {
  const { catalogLoading, mode, localPreview, parts, user } = useBuilder();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [tab, setTab] = useState('parts');
  const [q, setQ] = useState('');
  const [pick, setPick] = useState({ slot: null, idx: null });
  const [generating, setGenerating] = useState(false);
  const searching = tab === 'parts' && q.trim().length > 0;
  const order = mode === 'setup' ? [['SETUP', SETUP_SLOTS], ['PC BUILD', PC_SLOTS]] : [['PC BUILD', PC_SLOTS], ['SETUP', SETUP_SLOTS]];

  const generateWithGemini = async () => {
    setGenerating(true);
    try {
      const { data } = await base44.functions.invoke('generateCaseDesigns', { count: 8 });
      await queryClient.invalidateQueries({ queryKey: ['parts', 'product-photos'] });
      toast({ title: `${data?.count || 0} real cases added`, description: 'Gemini Search-grounded manufacturer pages; 3D models are procedural approximations.' });
    } catch (error) {
      toast({ title: 'Gemini case generation failed', description: error?.message || 'Check Base44 admin access and the GEMINI_API_KEY secret.', variant: 'destructive' });
    } finally {
      setGenerating(false);
    }
  };
  return (
    <div className="flex h-full flex-col bg-[#0f0f0f]">
      <div className="flex border-b border-[#1c1c1c]">
        {[['parts', 'Parts'], ['history', 'Price History']].map(([k, n]) => (
          <button key={k} onClick={() => setTab(k)} className={`relative flex-1 px-3 py-2.5 text-[12px] font-medium transition-colors ${tab === k ? 'text-white' : 'text-[#71717a] hover:text-white'}`}>
            {n}
            {tab === k && <span className="absolute inset-x-0 -bottom-px h-[2px] bg-white" />}
          </button>
        ))}
      </div>
      {tab === 'parts' && (
        <div className="border-b border-[#1c1c1c] p-2">
          {localPreview && <p className="mb-2 rounded border border-[#f1c40f]/30 bg-[#f1c40f]/[0.06] px-2 py-1.5 text-[10px] leading-relaxed text-[#f1c40f]">{parts.length} real manufacturer cases · offline samples, no live retailer prices</p>}
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-[#5f5f68]" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search every part — GPU, case, monitor…" className="h-8 border-[#242424] bg-[#131313] pl-8 text-[12px]" />
          </div>
          {!localPreview && user?.role === 'admin' && <button type="button" onClick={generateWithGemini} disabled={generating} className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-md border border-[#00cc66]/40 bg-[#00cc66]/10 px-2 py-1.5 text-[11px] font-semibold text-[#00cc66] transition-colors hover:bg-[#00cc66]/20 disabled:opacity-60">{generating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}{generating ? 'Searching official case pages…' : 'Find 8 real cases with Gemini'}</button>}
        </div>
      )}
      <div className="thin-scroll min-h-0 flex-1 overflow-y-auto">
        {tab === 'history' ? <PriceHistoryTab /> : catalogLoading ? <p className="p-4 text-[12px] text-[#71717a]">Loading the parts catalog…</p> : searching ? (
          <PartSearchResults q={q} onDone={() => setQ('')} />
        ) : (
          <>
            {order.map(([title, slots]) => (
              <div key={title}>
                <Head>{title}</Head>
                {slots.map((s) => <SlotGroup key={s.key} slotDef={s} onPick={setPick} />)}
              </div>
            ))}
          </>
        )}
      </div>
      <PartPicker slot={pick.slot} idx={pick.idx} onClose={() => setPick({ slot: null, idx: null })} />
    </div>
  );
}