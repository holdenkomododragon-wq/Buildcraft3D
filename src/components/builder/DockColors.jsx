import { RotateCcw } from 'lucide-react';
import { useBuilder } from '@/hooks/useBuilder';

const ROWS = [
  ['gpu', 'GPU'],
  ['cpu', 'CPU'],
  ['ram', 'RAM'],
  ['motherboard', 'Motherboard'],
];

export default function DockColors() {
  const { build, setSettings } = useBuilder();
  const colors = build.settings.componentColors || {};
  const set = (k, v) => setSettings({ componentColors: { ...colors, [k]: v } });
  const any = ROWS.some(([k]) => colors[k]);
  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <span className="font-semibold">Component colours</span>
        {any && <button type="button" onClick={() => setSettings({ componentColors: {} })} className="text-[10px] text-[#8b8b94] transition-colors hover:text-white">Reset all</button>}
      </div>
      <div className="space-y-1.5">
        {ROWS.map(([k, label]) => (
          <div key={k} className="flex items-center gap-2">
            <span className="w-[72px] shrink-0 text-[11px] text-[#a1a1aa]">{label}</span>
            <input type="color" aria-label={`${label} colour`} value={colors[k] || '#2b2f36'} onChange={(e) => set(k, e.target.value)} className="h-6 w-9 cursor-pointer rounded border border-[#242424] bg-transparent p-0" />
            <span className="tabular flex-1 text-[10px] uppercase text-[#71717a]">{colors[k] || 'part finish'}</span>
            <button type="button" onClick={() => set(k, '')} aria-label={`Reset ${label} colour`} disabled={!colors[k]} className="text-[#71717a] transition-colors enabled:hover:text-white disabled:opacity-30"><RotateCcw className="h-3 w-3" /></button>
          </div>
        ))}
      </div>
      <p className="mt-2 text-[10px] leading-tight text-[#71717a]">Repaints the 3D finish only. Photos, specs and prices stay as listed.</p>
    </div>
  );
}