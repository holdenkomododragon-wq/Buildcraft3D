import { useEffect } from 'react';
import { ExternalLink, RefreshCw } from 'lucide-react';
import { useBuilder } from '@/hooks/useBuilder';
import { SLOT_LABEL, money, productUrl } from '@/lib/catalogMeta';
import { newestOfferAt, offerLines, timeAgo } from '@/lib/prices';
import PriceSheetRow from './PriceSheetRow';

export default function PriceModal() {
  const { resolved, summary, refreshPrices, priceSyncing, build } = useBuilder();
  const showLive = build.settings.showLivePrices !== false;
  const rows = Object.entries(resolved).flatMap(([slot, list]) => list.map((x) => ({ ...x, slot })));

  // prices are real retailer prices and go stale by the hour, so opening this panel re-prices the build
  useEffect(() => { refreshPrices().catch(() => null); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const newest = rows.reduce((t, x) => Math.max(t, newestOfferAt(x.part)), 0);
  const liveCount = rows.filter((x) => newestOfferAt(x.part)).length;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 rounded-lg border border-[#27272f] bg-[#121215] px-2.5 py-2">
        <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${!showLive ? 'bg-[#71717a]' : liveCount ? 'bg-[#22c55e]' : 'bg-[#f59e0b]'}`} />
        <span className="text-[11px] leading-snug text-[#a1a1aa]">
          {!showLive
            ? 'Live retailer prices are hidden.'
            : liveCount
              ? `Live prices from Amazon, Newegg and Micro Center · updated ${timeAgo(newest)}`
              : 'No live retailer price for these parts yet — showing catalog reference prices'}
        </span>
        <button
          onClick={() => refreshPrices(null, true).catch(() => null)}
          disabled={priceSyncing}
          className="ml-auto flex shrink-0 items-center gap-1 rounded border border-[#2b2b33] px-2 py-1 text-[11px] font-medium text-[#d4d4d8] transition-colors hover:border-[#ff2e8c]/60 hover:text-white disabled:opacity-50"
        >
          <RefreshCw className={`h-3 w-3 ${priceSyncing ? 'animate-spin' : ''}`} />{priceSyncing ? 'Updating…' : 'Refresh'}
        </button>
      </div>

      <PriceSheetRow />

      <div className="max-h-[50vh] space-y-1 overflow-y-auto pr-1 thin-scroll">
        {rows.map((x, i) => (
          <div key={i} className="flex items-start gap-3 rounded-lg border border-[#27272f] bg-[#18181e] p-2.5 text-[12px]">
            <div className="min-w-0 flex-1">
              <div className="truncate font-medium text-white">{x.part.name}</div>
              <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[10.5px] text-[#71717a]">
                <span>{SLOT_LABEL[x.slot]} · {x.qty} × {money(x.part.price)}</span>
                {showLive && offerLines(x.part).map((o) => (
                  <a
                    key={o.supplier}
                    href={o.url || undefined}
                    target="_blank"
                    rel="noreferrer"
                    className={`flex items-center gap-0.5 rounded border border-[#2b2b33] px-1 py-px transition-colors hover:border-[#3a3a44] hover:text-white ${o.best ? 'text-[#4ade80]' : 'text-[#a1a1aa]'}`}
                  >
                    {o.supplier} {money(o.price)}
                  </a>
                ))}
              </div>
            </div>
            <div className="tabular shrink-0 font-semibold text-[#22c55e]">{money(x.part.price * x.qty)}</div>
            {productUrl(x.part) && (
              <a href={productUrl(x.part)} target="_blank" rel="noreferrer" className="shrink-0 rounded bg-[#0ea5e9] p-1.5 text-white" aria-label={`Open ${x.part.name} product page`}><ExternalLink className="h-3.5 w-3.5" /></a>
            )}
          </div>
        ))}
        {!rows.length && <p className="py-6 text-center text-[12px] text-[#71717a]">No parts selected yet.</p>}
      </div>

      <div className="flex items-center justify-between border-t border-[#27272f] pt-3"><span className="text-[13px] text-[#a1a1aa]">Component subtotal</span><span className="tabular text-[18px] font-semibold text-[#22c55e]">{money(summary.price.total)}</span></div>
      <p className="text-[11px] text-[#71717a]">
        {showLive
          ? 'Prices are the cheapest live listing at Amazon, Newegg or Micro Center for that exact part, refreshed by the hour. A highlighted supplier is the one the total is priced from. Tax and shipping are not included.'
          : 'Supplier listings are hidden in Settings. Totals still use the current price of each part. Tax and shipping are not included.'}
      </p>
    </div>
  );
}