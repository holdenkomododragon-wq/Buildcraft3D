import { useEffect, useState } from 'react';
import { ExternalLink, Sheet, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useToast } from '@/components/ui/use-toast';
import { timeAgo } from '@/lib/prices';

// the shared price sheet: every part's live retailer prices, written to Google Sheets
export default function PriceSheetRow() {
  const { toast } = useToast();
  const [sheet, setSheet] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    base44.entities.PriceSheet.list('-created_date', 1).then((rows) => setSheet(rows[0] || null)).catch(() => setSheet(null));
  }, []);

  const sync = async () => {
    setBusy(true);
    try {
      const { data } = await base44.functions.invoke('priceSheetSync', {});
      setSheet({ url: data.url, rows: data.rows, synced_at: data.synced_at });
      toast({ title: 'Price sheet updated', description: `${data.rows} parts written to Google Sheets.` });
    } catch (e) {
      const message = (e && e.response && e.response.data && e.response.data.error) || 'The price sheet could not be updated.';
      toast({ title: 'Sheet not updated', description: message, variant: 'destructive' });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex items-center gap-2 rounded-lg border border-[#27272f] bg-[#121215] px-2.5 py-2 text-[11px]">
      <Sheet className="h-3.5 w-3.5 shrink-0 text-[#00cc66]" />
      <span className="min-w-0 flex-1 truncate text-[#a1a1aa]">
        {sheet
          ? `Price sheet · ${sheet.rows || 0} parts · updated ${timeAgo(Date.parse(sheet.synced_at) || 0)}`
          : 'Price sheet · not created yet'}
      </span>
      {sheet?.url && (
        <a href={sheet.url} target="_blank" rel="noreferrer" className="flex shrink-0 items-center gap-1 rounded border border-[#2b2b33] px-2 py-1 font-medium text-[#d4d4d8] hover:border-[#3a3a44] hover:text-white">
          <ExternalLink className="h-3 w-3" />Open
        </a>
      )}
      <button
        onClick={sync}
        disabled={busy}
        className="flex shrink-0 items-center gap-1 rounded border border-[#2b2b33] px-2 py-1 font-medium text-[#d4d4d8] transition-colors hover:border-[#00cc66]/60 hover:text-white disabled:opacity-50"
      >
        {busy ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sheet className="h-3 w-3" />}{busy ? 'Syncing…' : 'Sync'}
      </button>
    </div>
  );
}