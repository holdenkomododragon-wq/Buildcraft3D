import { useState } from 'react';
import { Pencil, DollarSign, BadgeCheck, Zap, Gauge, AlertTriangle, XCircle, HelpCircle } from 'lucide-react';
import { useBuilder } from '@/hooks/useBuilder';
import { money } from '@/lib/catalogMeta';

const COMPAT = {
  compatible: { label: 'Compatible', color: '#3b82f6', Icon: BadgeCheck },
  warning: { label: 'Warnings', color: '#f59e0b', Icon: AlertTriangle },
  incompatible: { label: 'Incompatible', color: '#ef4444', Icon: XCircle },
  unknown: { label: 'Unverified', color: '#94a3b8', Icon: HelpCircle },
};

function Pill({ color, Icon, children, onClick, label }) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      className="flex items-center gap-1.5 rounded-md border border-[#242424] bg-[#161616] px-2.5 py-1.5 transition-colors hover:border-[#343434] hover:bg-[#1b1b1b]"
    >
      <Icon className="h-3.5 w-3.5" style={{ color }} />
      <span className="tabular text-[13px] font-semibold" style={{ color }}>{children}</span>
    </button>
  );
}

function TitleEditor() {
  const { build, patch } = useBuilder();
  const [edit, setEdit] = useState(false);
  const [val, setVal] = useState('');
  const commit = () => { const v = val.trim(); if (v) patch({ title: v }); setEdit(false); };
  if (edit) return <input autoFocus value={val} onChange={(e) => setVal(e.target.value)} onBlur={commit} onKeyDown={(e) => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') setEdit(false); }} className="w-52 rounded-md border border-[#ff2e8c] bg-[#0d0d0d] px-2 py-0.5 text-[14px] font-semibold text-white outline-none" />;
  return (
    <button onClick={() => { setVal(build.title); setEdit(true); }} className="group flex items-center gap-1.5 text-[15px] font-semibold text-white">
      {build.title}<Pencil className="h-3.5 w-3.5 text-[#5f5f68] group-hover:text-[#ff2e8c]" />
    </button>
  );
}

export default function TelemetryBar({ onOpen }) {
  const { build, user, summary } = useBuilder();
  const { price, power, compat, bench } = summary;
  const c = COMPAT[compat.overall];
  return (
    <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2 border-b border-[#1f1f1f] bg-[#0f0f0f] px-3 py-2">
      <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1">
        <TitleEditor />
        <span className="h-3 w-px bg-[#2a2a2a]" />
        <span className="text-[11px] text-[#71717a]">{user ? user.full_name || user.email : 'Anonymous'}</span>
        <span className="text-[11px] text-[#71717a]">{new Date(build.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
      </div>
      <div className="flex flex-wrap items-center gap-1.5">
        <Pill label="Price breakdown" color="#22c55e" Icon={DollarSign} onClick={() => onOpen('price')}>{money(price.total)}</Pill>
        <Pill label="Compatibility" color={c.color} Icon={c.Icon} onClick={() => onOpen('compat')}>{c.label}</Pill>
        <Pill label="Power usage" color="#eab308" Icon={Zap} onClick={() => onOpen('power')}>{Math.round(power.total * 10) / 10}W</Pill>
        {build.settings.showFps !== false && (
          <Pill label="Benchmark" color="#f97316" Icon={Gauge} onClick={() => onOpen('bench')}>{bench.overall ? `3DMark ${bench.overall.toLocaleString()}` : 'No data'}</Pill>
        )}
      </div>
    </div>
  );
}