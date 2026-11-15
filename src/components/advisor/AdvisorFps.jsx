import { Image } from '@/components/ui/image';
import { gameArt } from '@/lib/gameArt';

export default function AdvisorFps({ games, resolution = '1440p Ultra' }) {
  const rows = (games || []).filter((g) => g && g.fps).slice(0, 6);
  if (!rows.length) return null;
  return (
    <div className="border-t border-[#262626] px-3 py-2">
      <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#5f5f68]">Estimated FPS · {resolution}</p>
      <div className="grid grid-cols-3 gap-1.5">
        {rows.map((g) => (
          <div key={g.name} className="overflow-hidden rounded border border-[#262626] bg-[#111111]">
            {gameArt(g.name) ? (
              <Image src={gameArt(g.name)} alt={g.name} className="h-14 w-full object-cover" fittingType="fill" />
            ) : (
              <div className="h-14 w-full bg-gradient-to-br from-[#232330] to-[#101014]" />
            )}
            <div className="px-1.5 py-1">
              <p className="truncate text-[9.5px] leading-tight text-[#8b8b94]">{g.name}</p>
              <p className="tabular text-[12.5px] font-semibold leading-tight text-white">
                {g.fps}<span className="ml-0.5 text-[8px] font-normal text-[#5f5f68]">fps</span>
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}