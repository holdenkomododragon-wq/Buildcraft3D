import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import BuildCard from '@/components/community/BuildCard';
import { Input } from '@/components/ui/input';
import { useBuilder } from '@/hooks/useBuilder';
import { BUILD_CATEGORIES } from '@/lib/catalogMeta';

export default function CompletedBuilds() {
  const { cloneFromRecord } = useBuilder();
  const nav = useNavigate();
  const [cat, setCat] = useState('All');
  const [q, setQ] = useState('');
  const [sort, setSort] = useState('new');
  const { data: builds = [], isLoading } = useQuery({ queryKey: ['public-builds'], queryFn: () => base44.entities.Build.filter({ visibility: 'public' }, '-created_date', 100) });
  let list = builds.filter((b) => (cat === 'All' || b.build_category === cat) && (!q || `${b.title} ${b.cpu_name} ${b.gpu_name}`.toLowerCase().includes(q.toLowerCase())));
  if (sort === 'low') list = [...list].sort((a, b) => a.total_price - b.total_price);
  if (sort === 'high') list = [...list].sort((a, b) => b.total_price - a.total_price);
  return (
    <div className="thin-scroll h-full overflow-y-auto p-6">
      <h1 className="text-[24px] font-semibold">Completed Builds</h1>
      <p className="mt-1 text-[13px] text-[#71717a]">Public builds shared by the community. Clone one to make it your own.</p>
      <div className="mt-5 flex flex-wrap items-center gap-2">
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search builds, CPUs, GPUs" className="w-64" />
        {['All', ...BUILD_CATEGORIES].map((c) => <button key={c} onClick={() => setCat(c)} className={`rounded-full px-3 py-1 text-[12px] ${cat === c ? 'bg-[#00cc66] text-white' : 'bg-[#1c1c1c] text-[#a1a1aa] hover:text-white'}`}>{c}</button>)}
        <select value={sort} onChange={(e) => setSort(e.target.value)} className="ml-auto rounded-[7px] border border-[#232323] bg-[#131313] px-2 py-1.5 text-[12px]"><option value="new">Newest</option><option value="low">Lowest price</option><option value="high">Highest price</option></select>
      </div>
      <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {list.map((b) => <BuildCard key={b.id} b={b} onClone={(r) => { cloneFromRecord(r); nav('/'); }} />)}
      </div>
      {!isLoading && !list.length && <p className="mt-16 text-center text-[13px] text-[#71717a]">No public builds yet. Save a build, set it to Public in Settings, and it will show up here.</p>}
    </div>
  );
}