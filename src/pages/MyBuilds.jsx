import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeftRight } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import BuildCard from '@/components/community/BuildCard';
import { useBuilder } from '@/hooks/useBuilder';

export default function MyBuilds() {
  const { user, cloneFromRecord } = useBuilder();
  const qc = useQueryClient();
  const nav = useNavigate();
  const { data: builds = [], isLoading } = useQuery({
    queryKey: ['my-builds', user?.id], enabled: !!user,
    queryFn: () => base44.entities.Build.filter({ created_by_id: user.id }, '-updated_date', 100),
  });
  const del = async (b) => { await base44.entities.Build.delete(b.id); qc.invalidateQueries({ queryKey: ['my-builds'] }); };
  return (
    <div className="thin-scroll h-full overflow-y-auto p-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-[24px] font-semibold">My Builds</h1>
          <p className="mt-1 text-[13px] text-[#71717a]">Builds saved to your account, available on any device.</p>
        </div>
        <Link to="/compare" className="flex items-center gap-1.5 rounded-md border border-[#2e2e2e] bg-[#161616] px-3 py-1.5 text-[12px] text-[#d4d4d8] transition-colors hover:border-[#ff2e8c] hover:text-white">
          <ArrowLeftRight className="h-3.5 w-3.5" />Compare builds
        </Link>
      </div>
      <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {builds.map((b) => <BuildCard key={b.id} b={b} to={`/build/${b.id}`} onClone={(r) => { cloneFromRecord(r); nav('/'); }} onDelete={del} />)}
      </div>
      {!isLoading && !builds.length && <p className="mt-16 text-center text-[13px] text-[#71717a]">You have no saved builds yet. Build something and press Save.</p>}
    </div>
  );
}