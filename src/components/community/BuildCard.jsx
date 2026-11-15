import { Link } from 'react-router-dom';
import { Files, Trash2, Share2 } from 'lucide-react';
import { money } from '@/lib/catalogMeta';
import { useToast } from '@/components/ui/use-toast';

const C = { compatible: ['#3b82f6', 'Compatible'], warning: ['#f59e0b', 'Warnings'], incompatible: ['#ef4444', 'Incompatible'], unknown: ['#94a3b8', 'Unverified'] };

export default function BuildCard({ b, onClone, onDelete, to }) {
  const [col, label] = C[b.compat_status] || C.unknown;
  const { toast } = useToast();
  const share = async () => {
    if (b.visibility !== 'public') {
      toast({ title: 'This build is private', description: 'Open the build and tap "Make public" to get a share link.' });
      return;
    }
    const url = `${window.location.origin}/b/${b.id}`;
    try { await navigator.clipboard.writeText(url); } catch (e) { /* clipboard blocked */ }
    toast({ title: 'Public link copied', description: url });
  };
  return (
    <div className="flex flex-col rounded-lg border border-[#232323] bg-[#131313] p-4 transition-colors hover:border-[#343434]">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0"><div className="truncate text-[15px] font-semibold text-white">{b.title}</div><div className="text-[11px] text-[#71717a]">by {b.author_name || 'Anonymous'} · {new Date(b.created_date).toLocaleDateString()}</div></div>
        <span className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium" style={{ color: col, background: `${col}1f` }}>{label}</span>
      </div>
      <div className="mt-3 space-y-1 text-[12px] text-[#a1a1aa]">
        {[b.case_name, b.cpu_name, b.gpu_name].filter(Boolean).map((n) => <div key={n} className="truncate">{n}</div>)}
        {!b.case_name && !b.cpu_name && !b.gpu_name && <div className="text-[#52525b]">No PC parts</div>}
      </div>
      <div className="mt-3 flex items-center gap-4 text-[12px]">
        <span className="tabular font-semibold text-[#22c55e]">{money(b.total_price)}</span>
        <span className="tabular text-[#eab308]">{b.power_w || 0}W</span>
        {!!b.timespy_estimate && <span className="tabular text-[#f97316]">~{b.timespy_estimate.toLocaleString()} est.</span>}
        <span className="ml-auto rounded bg-[#1c1c1c] px-1.5 py-0.5 text-[10px] text-[#a1a1aa]">{b.build_category}</span>
      </div>
      <div className="mt-4 flex gap-2">
        <Link to={to || `/b/${b.id}`} className="flex-1 rounded-md bg-[#ff2e8c] py-1.5 text-center text-[12px] font-semibold text-white hover:opacity-90">View Build</Link>
        <button onClick={share} title="Copy public link" aria-label="Copy public link" className="rounded-md border border-[#2e2e2e] px-2.5 text-[#a1a1aa] hover:border-[#ff2e8c] hover:text-white"><Share2 className="h-3.5 w-3.5" /></button>
        {onClone && <button onClick={() => onClone(b)} className="flex items-center gap-1.5 rounded-md border border-[#2e2e2e] px-3 py-1.5 text-[12px] hover:border-[#ff2e8c]"><Files className="h-3.5 w-3.5" />Clone</button>}
        {onDelete && <button onClick={() => onDelete(b)} className="rounded-md border border-[#2e2e2e] px-2.5 text-[#a1a1aa] hover:border-[#ef4444] hover:text-[#ef4444]" aria-label="Delete build"><Trash2 className="h-3.5 w-3.5" /></button>}
      </div>
    </div>
  );
}