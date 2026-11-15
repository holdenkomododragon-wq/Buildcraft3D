import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useSearchParams } from 'react-router-dom';
import { FolderOpen } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useBuilder } from '@/hooks/useBuilder';
import { summarize } from '@/lib/buildCalc';
import CompareBody from '@/components/compare/CompareBody';

export default function Compare() {
  const { user, build, byId, summary } = useBuilder();
  const [params] = useSearchParams();
  const [slotA, setSlotA] = useState(params.get('a') || 'current');
  const [slotB, setSlotB] = useState(params.get('b') || '');

  const { data: mine = [] } = useQuery({
    queryKey: ['my-builds', user?.id], enabled: !!user,
    queryFn: () => base44.entities.Build.filter({ created_by_id: user.id }, '-updated_date', 100),
  });
  const { data: shared = [] } = useQuery({
    queryKey: ['public-builds'],
    queryFn: () => base44.entities.Build.filter({ visibility: 'public' }, '-created_date', 100),
  });

  const groups = useMemo(() => {
    // a build that is both mine and public appears once
    const community = shared.filter((b) => !mine.some((m) => m.id === b.id));
    return [
      { label: 'In the builder', items: [{ value: 'current', label: `Current draft — ${build.title || 'New Build'}` }] },
      { label: 'My builds', items: mine.map((b) => ({ value: `id:${b.id}`, label: b.title })) },
      { label: 'Community', items: community.map((b) => ({ value: `id:${b.id}`, label: b.title })) },
    ];
  }, [build.title, mine, shared]);

  const resolve = (key) => {
    if (!key) return null;
    if (key === 'current') return { title: build.title || 'Current build', subtitle: 'Draft in the builder', ...summary };
    const rec = [...mine, ...shared].find((b) => b.id === key.slice(3));
    if (!rec) return null;
    return {
      title: rec.title,
      subtitle: `${rec.author_name || 'Anonymous'}${rec.visibility === 'public' ? ' · public' : ''}`,
      ...summarize(rec.items || {}, byId),
    };
  };

  const left = resolve(slotA);
  const right = resolve(slotB);

  return (
    <div className="thin-scroll h-full overflow-y-auto p-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-[24px] font-semibold">Compare builds</h1>
          <p className="mt-1 text-[13px] text-[#71717a]">Put two builds side by side to see exactly which parts and numbers differ.</p>
        </div>
        <Link to="/my-builds" className="flex items-center gap-1.5 rounded-md border border-[#2e2e2e] bg-[#161616] px-3 py-1.5 text-[12px] text-[#d4d4d8] transition-colors hover:border-[#ff2e8c] hover:text-white">
          <FolderOpen className="h-3.5 w-3.5" />My saved builds
        </Link>
      </div>
      <div className="mt-5">
        <CompareBody left={left} right={right} groups={groups} slotA={slotA} slotB={slotB} onA={setSlotA} onB={setSlotB} />
      </div>
    </div>
  );
}