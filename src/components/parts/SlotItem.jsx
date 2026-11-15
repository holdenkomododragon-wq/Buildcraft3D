import { ArrowLeftRight, X, ExternalLink, Minus, Plus, Settings2 } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import PartThumb from './PartThumb';
import PartPhotoButton from '@/components/parts/PartPhotoButton';
import { useBuilder } from '@/hooks/useBuilder';
import { money, productUrl } from '@/lib/catalogMeta';
import { bestOffer } from '@/lib/prices';

const DOT = { compatible: '#3b82f6', warning: '#f1c40f', incompatible: '#ef4444', unknown: '#94a3b8' };

export default function SlotItem({ slot, idx, item, onSwap }) {
  const { removePart, updateItem, summary, build } = useBuilder();
  const part = summary.r[slot][idx].part;
  const qty = item.qty;
  const st = summary.compat.perPart[part.id];
  const isAio = slot === 'cooler' && part.specs.type === 'aio';
  const mount = item.config?.mount || (part.specs.radiator_mm >= 360 ? 'front' : 'top');
  return (
    <div className="flex gap-2.5 border-t border-[#1c1c1c] px-3 py-2.5">
      <div className="relative shrink-0">
        {part.image_url ? <PartPhotoButton part={part} size="h-11 w-11" /> : <PartThumb part={part} size="h-11 w-11" />}
        <button
          onClick={onSwap}
          title="Swap part"
          className="absolute -left-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-[#00cc66] text-black shadow-[0_2px_6px_rgba(0,0,0,0.5)] transition-transform hover:scale-105"
        >
          <ArrowLeftRight className="h-2.5 w-2.5" />
        </button>
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-[12.5px] font-medium leading-snug text-white">{part.name}</div>
        <div className="mt-1 flex flex-wrap items-center gap-x-1.5 gap-y-1">
          <span className="tabular text-[12px] font-semibold text-[#00cc66]">{money(part.price == null ? null : part.price * qty)}</span>
          {qty > 1 && <span className="text-[10px] text-[#71717a]">{qty} x {money(part.price)}</span>}
          {build.settings.showLivePrices !== false && bestOffer(part) && (
            <span title={`Cheapest live listing: ${bestOffer(part).supplier}`} className="rounded bg-[#00cc66]/10 px-1 py-px text-[9px] font-semibold uppercase tracking-wide text-[#00cc66]">{bestOffer(part).supplier}</span>
          )}
          <span title={`Compatibility: ${st}`} className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: DOT[st] }} />
          {(slot === 'ram' || slot === 'fan' || slot === 'storage' || slot === 'monitor' || slot === 'lamp' || slot === 'speaker') && (
            <div className="flex items-center rounded border border-[#242424]">
              <button onClick={() => (qty > 1 ? updateItem(slot, idx, { qty: qty - 1 }) : removePart(slot, idx))} className="px-1 py-0.5 text-[#a1a1aa] hover:text-white" aria-label="Decrease"><Minus className="h-2.5 w-2.5" /></button>
              <span className="tabular w-4 text-center text-[10px]">{qty}</span>
              <button onClick={() => updateItem(slot, idx, { qty: Math.min(qty + 1, 8) })} className="px-1 py-0.5 text-[#a1a1aa] hover:text-white" aria-label="Increase"><Plus className="h-2.5 w-2.5" /></button>
            </div>
          )}
          {isAio && (
            <Popover>
              <PopoverTrigger asChild>
                <button title="Radiator mount" className="rounded border border-[#242424] p-1 text-[#8b8b94] hover:text-white"><Settings2 className="h-2.5 w-2.5" /></button>
              </PopoverTrigger>
              <PopoverContent className="w-44 border-[#242424] bg-[#141414] p-2">
                {['front', 'top'].map((m) => <button key={m} onClick={() => updateItem(slot, idx, { config: { ...item.config, mount: m } })} className={`block w-full rounded px-2 py-1.5 text-left text-[12px] capitalize ${mount === m ? 'bg-[#00cc66]/15 text-white' : 'text-[#a1a1aa] hover:bg-[#1c1c1c]'}`}>{m} radiator mount</button>)}
              </PopoverContent>
            </Popover>
          )}
          {productUrl(part) && (
            <a href={productUrl(part)} target="_blank" rel="noreferrer" title={`Open ${part.name} product page`} className="flex items-center gap-1 rounded bg-[#0b6fe0] px-1.5 py-0.5 text-[10px] font-semibold text-white hover:bg-[#0a63c7]">Buy <ExternalLink className="h-2.5 w-2.5" /></a>
          )}
          <div className="ml-auto flex items-center">
            <button onClick={() => removePart(slot, idx)} title="Remove" className="rounded p-1 text-[#8b8b94] hover:bg-[#1c1c1c] hover:text-[#ef4444]"><X className="h-3.5 w-3.5" /></button>
          </div>
        </div>
      </div>
    </div>
  );
}