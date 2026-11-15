import { useState } from 'react';
import { Check, Copy, Share2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

export default function ShareRow({ url, note }) {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    if (!url) return toast({ title: 'No public link yet', description: 'Make this build public to share it.' });
    try { await navigator.clipboard.writeText(url); } catch (e) { /* clipboard blocked */ }
    setCopied(true);
    toast({ title: 'Public link copied', description: 'Anyone with the link can view this build.' });
    setTimeout(() => setCopied(false), 1600);
  };

  const share = async () => {
    if (!url) return copy();
    if (navigator.share) {
      try { await navigator.share({ title: 'My PC build', url }); return; } catch (e) { return; }
    }
    copy();
  };

  const btn = 'flex items-center gap-1.5 rounded-md bg-[#ff2e8c] px-3 py-2 text-[12px] font-semibold text-white transition-opacity hover:opacity-90';
  const ghost = 'flex items-center gap-1.5 rounded-md border border-[#2e2e2e] bg-[#161616] px-3 py-2 text-[12px] font-medium text-[#d4d4d8] transition-colors hover:border-[#3d3d3d] hover:text-white';

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button onClick={copy} className={btn}>{copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}{copied ? 'Link copied' : 'Copy link'}</button>
      <button onClick={share} className={ghost}><Share2 className="h-3.5 w-3.5" />Share…</button>
      {note && <span className="w-full text-[10px] text-[#71717a]">{note}</span>}
    </div>
  );
}