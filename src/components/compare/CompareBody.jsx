import { Radio } from 'lucide-react';
import CompareSlot from './CompareSlot';
import MetricCompare from './MetricCompare';
import SpecRows from './SpecRows';
import BenchCompare from './BenchCompare';

export default function CompareBody({ left, right, groups, slotA, slotB, onA, onB }) {
  const both = left && right;
  return (
    <div className="space-y-4">
      <div className="grid gap-3 md:grid-cols-2">
        <CompareSlot title="Build A" value={slotA} onChange={onA} data={left} groups={groups} />
        <CompareSlot title="Build B" value={slotB} onChange={onB} data={right} groups={groups} />
      </div>
      {both ? (
        <>
          <MetricCompare left={left} right={right} />
          <SpecRows left={left} right={right} />
          <BenchCompare left={left} right={right} />
        </>
      ) : (
        <div className="flex items-center gap-2 rounded-xl border border-dashed border-[#2a2a2a] p-6 text-[13px] text-[#71717a]">
          <Radio className="h-4 w-4" />Pick a build in both slots to see the differences.
        </div>
      )}
    </div>
  );
}