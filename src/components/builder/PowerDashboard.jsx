import { useState } from 'react';
import { Zap, ChevronDown, ChevronUp, DollarSign, Activity } from 'lucide-react';
import { useBuilder } from '@/hooks/useBuilder';
import { money } from '@/lib/catalogMeta';

// Reference estimate only: US average residential rate and a 4 hour daily session.
const RATE_KWH = 0.17;
const HOURS_DAY = 4;

export default function PowerDashboard() {
  const { summary } = useBuilder();
  const [open, setOpen] = useState(true);
  const { power, price } = summary;
  const monthly = (power.total / 1000) * HOURS_DAY * 30 * RATE_KWH;
  const pct = Math.min(100, power.pct || 0);
  const col = power.level === 'error' ? '#ef4444' : power.level === 'warning' ? '#f1c40f' : '#00cc66';
  return (
    <div className="w-[156px] rounded-xl border border-[#262626] bg-[#141414]/95 p-2 shadow-[0_10px_30px_rgba(0,0,0,0.45)] backdrop-blur sm:w-[212px] sm:p-2.5">
      <button type="button" onClick={() => setOpen(!open)} aria-expanded={open} className="flex w-full items-center gap-1.5 text-[9px] font-semibold uppercase tracking-[0.14em] text-[#8b8b94] transition-colors hover:text-white">
        <Activity className="h-3 w-3 text-[#00cc66]" />Live draw
        {open ? <ChevronUp className="ml-auto h-3 w-3" /> : <ChevronDown className="ml-auto h-3 w-3" />}
      </button>
      {open && (
        <>
          <div className="mt-2 flex items-end justify-between">
            <span className="tabular text-[22px] font-semibold leading-none text-[#f1c40f]">
              {Math.round(power.total)}<span className="ml-0.5 text-[11px] text-[#8b8b94]">W</span>
            </span>
            <span className="text-[10px] text-[#71717a]">{power.capacity ? `${Math.round(pct)}% of ${power.capacity} W` : 'No PSU yet'}</span>
          </div>
          <div className="mt-1.5 h-1.5 overflow-hidden rounded bg-[#242424]">
            <div className="h-full rounded transition-[width] duration-300" style={{ width: `${pct}%`, background: col }} />
          </div>
          <div className="mt-2 space-y-1 border-t border-[#242424] pt-2 text-[11px]">
            <div className="flex items-center justify-between text-[#a1a1aa]">
              <span className="flex items-center gap-1"><DollarSign className="h-3 w-3 text-[#00cc66]" />Build cost</span>
              <span className="tabular font-semibold text-[#00cc66]">{money(price.total)}</span>
            </div>
            <div className="flex items-center justify-between text-[#a1a1aa]">
              <span className="flex items-center gap-1"><Zap className="h-3 w-3 text-[#f1c40f]" />Power / month</span>
              <span className="tabular font-semibold text-[#e5e7eb]">{money(monthly)}</span>
            </div>
          </div>
          <p className="mt-1.5 text-[9px] leading-tight text-[#5f5f68]">Estimate at ${RATE_KWH.toFixed(2)}/kWh, {HOURS_DAY} h a day. Not a real energy bill.</p>
        </>
      )}
    </div>
  );
}