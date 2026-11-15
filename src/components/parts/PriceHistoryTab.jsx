import { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { useBuilder } from '@/hooks/useBuilder';
import { money } from '@/lib/catalogMeta';

const RANGES = [['7d', 7], ['30d', 30], ['90d', 90], ['1y', 365], ['All', 0]];

export default function PriceHistoryTab() {
  const { build } = useBuilder();
  const [range, setRange] = useState('All');
  const days = RANGES.find((r) => r[0] === range)[1];
  const pts = build.priceHistory.filter((p) => !days || Date.now() - new Date(p.date) < days * 864e5).map((p) => ({ ...p, label: new Date(p.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) }));
  const vals = pts.map((p) => p.total);
  return (
    <div className="p-4">
      <h3 className="text-[14px] font-semibold">Build Price History</h3>
      <div className="mt-2 flex gap-1">{RANGES.map(([n]) => <button key={n} onClick={() => setRange(n)} className={`rounded-full px-2.5 py-1 text-[11px] ${range === n ? 'bg-[#ff2a85] text-white' : 'bg-[#18181e] text-[#a1a1aa]'}`}>{n}</button>)}</div>
      {pts.length < 2 ? (
        <div className="mt-6 rounded-lg border border-dashed border-[#34343d] p-6 text-center text-[12px] text-[#71717a]">Insufficient price history.<br />The total is recorded each time you save a build while signed in.</div>
      ) : (
        <>
          <div className="mt-4 h-48">
            <ResponsiveContainer>
              <LineChart data={pts}><CartesianGrid stroke="#27272f" vertical={false} /><XAxis dataKey="label" stroke="#71717a" fontSize={10} /><YAxis stroke="#71717a" fontSize={10} domain={['auto', 'auto']} width={48} /><Tooltip contentStyle={{ background: '#141418', border: '1px solid #27272f', fontSize: 12 }} formatter={(v) => money(v)} /><Line type="monotone" dataKey="total" stroke="#22c55e" strokeWidth={2} dot={{ r: 3 }} /></LineChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-3 grid grid-cols-3 gap-2 text-center text-[11px]">
            {[['Current', vals[vals.length - 1]], ['Lowest', Math.min(...vals)], ['Highest', Math.max(...vals)]].map(([n, v]) => <div key={n} className="rounded-lg border border-[#27272f] bg-[#18181e] p-2"><div className="text-[#71717a]">{n}</div><div className="tabular font-semibold text-[#22c55e]">{money(v)}</div></div>)}
          </div>
        </>
      )}
    </div>
  );
}