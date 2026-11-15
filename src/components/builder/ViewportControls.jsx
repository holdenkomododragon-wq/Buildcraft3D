import { Maximize, RotateCcw, Box, ZoomIn, ZoomOut } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export default function ViewportControls({ viewRef, hq, onToggleHq }) {
  const controls = [
    [Maximize, 'Fit to screen', () => viewRef.current?.fit()],
    [RotateCcw, 'Reset orbit', () => viewRef.current?.reset()],
    [Box, 'Isometric', () => viewRef.current?.iso()],
    [ZoomIn, 'Zoom in', () => viewRef.current?.zoom(0.75)],
    [ZoomOut, 'Zoom out', () => viewRef.current?.zoom(1.33)],
  ];
  return (
    <TooltipProvider delayDuration={200}>
      <div className="absolute right-3 top-3 z-10 flex gap-1">
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              onClick={onToggleHq}
              aria-pressed={hq}
              aria-label="4K rendering"
              className={`flex h-7 items-center rounded-md border px-1.5 text-[9px] font-bold tracking-[0.06em] backdrop-blur transition-colors ${hq ? 'border-[#00cc66] bg-[#00cc66]/15 text-white' : 'border-[#262626] bg-[#161616]/90 text-[#a1a1aa] hover:bg-[#222] hover:text-white'}`}
            >
              4K
            </button>
          </TooltipTrigger>
          <TooltipContent>{hq ? 'Back to standard resolution' : 'Render the 3D view at 4K'}</TooltipContent>
        </Tooltip>
        {controls.map(([Icon, tip, onClick]) => (
          <Tooltip key={tip}>
            <TooltipTrigger asChild>
              <button type="button" onClick={onClick} aria-label={tip} className="flex h-7 w-7 items-center justify-center rounded-md border border-[#262626] bg-[#161616]/90 text-[#a1a1aa] backdrop-blur transition-colors hover:bg-[#222] hover:text-white">
                <Icon className="h-3.5 w-3.5" strokeWidth={1.8} />
              </button>
            </TooltipTrigger>
            <TooltipContent>{tip}</TooltipContent>
          </Tooltip>
        ))}
      </div>
    </TooltipProvider>
  );
}