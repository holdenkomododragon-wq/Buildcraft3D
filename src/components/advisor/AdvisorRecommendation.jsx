import { Button } from '@/components/ui/button';
import PartThumb from '@/components/parts/PartThumb';
import { SLOT_LABEL, money } from '@/lib/catalogMeta';
import AdvisorFps from './AdvisorFps';
import { Check, ShieldCheck, AlertTriangle } from 'lucide-react';

export default function AdvisorRecommendation({ build, total, notes, fit, fps, onApply, canApply }) {
  return (
    <div className="max-w-[92%] overflow-hidden rounded-lg border border-[#2b2b2b] bg-[#151515]">
      <div className="flex items-center justify-between border-b border-[#262626] px-3 py-2">
        <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#71717a]">Recommended build</span>
        <span className="tabular text-[12.5px] font-semibold text-white">{money(total)}</span>
      </div>
      <ul>
        {build.map((row) => (
          <li key={row.part.id} className="flex items-start gap-2 border-b border-[#1e1e1e] px-3 py-2 last:border-0">
            <PartThumb part={row.part} size="h-9 w-9" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-[11.5px] font-medium text-white">{row.part.name}</p>
              <p className="text-[10px] uppercase tracking-[0.12em] text-[#5f5f68]">{SLOT_LABEL[row.slot] || row.slot}</p>
              {row.why ? <p className="mt-0.5 text-[11px] leading-snug text-[#8b8b94]">{row.why}</p> : null}
            </div>
            <span className="tabular shrink-0 text-[11px] text-[#b3b3bb]">{row.part.price != null ? money(row.part.price) : '—'}</span>
          </li>
        ))}
      </ul>
      {fit ? (
        fit.overall === 'compatible' ? (
          <p className="flex items-start gap-1.5 border-t border-[#262626] px-3 py-2 text-[11px] leading-snug text-[#4ade80]">
            <ShieldCheck className="mt-px h-3.5 w-3.5 shrink-0" />
            Every fit check passes — socket, memory, clearance and power all line up.
          </p>
        ) : (
          <div className="border-t border-[#262626] px-3 py-2">
            <p className="flex items-center gap-1.5 text-[11px] font-medium text-[#fbbf24]">
              <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
              {fit.overall === 'incompatible' ? 'This list breaks a fit rule' : 'Fit checks worth a look'}
            </p>
            {(fit.issues || []).map((m, i) => (
              <p key={i} className="mt-1 text-[10.5px] leading-snug text-[#8b8b94]">{m}</p>
            ))}
          </div>
        )
      ) : null}
      {fps && fps.length ? <AdvisorFps games={fps} /> : null}
      {notes && notes.length ? (
        <ul className="space-y-1 border-t border-[#262626] px-3 py-2">
          {notes.map((n, i) => (
            <li key={i} className="flex gap-1.5 text-[11px] leading-snug text-[#8b8b94]"><span className="text-[#ff2e8c]">•</span><span>{n}</span></li>
          ))}
        </ul>
      ) : null}
      {canApply ? (
        <div className="flex items-center justify-between gap-3 border-t border-[#262626] bg-[#121212] px-3 py-2">
          <p className="text-[10px] leading-snug text-[#71717a]">Nothing changes until you apply it.</p>
          <Button size="sm" onClick={() => onApply(build)} className="shrink-0 gap-1.5 bg-[#ff2e8c] text-white hover:opacity-90">
            <Check className="h-3.5 w-3.5" />Apply to my build
          </Button>
        </div>
      ) : null}
    </div>
  );
}