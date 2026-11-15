import { useRef, useState } from 'react';
import { Eye } from 'lucide-react';
import RealProductView from '@/components/builder/RealProductView';
import ViewportControls from '@/components/builder/ViewportControls';
import PowerDashboard from '@/components/builder/PowerDashboard';
import FpsChart from '@/components/builder/FpsChart';
import ThreeViewport from '@/three/ThreeViewport';
import Dock from './Dock';
import Logo from '@/components/layout/Logo';
import { useBuilder } from '@/hooks/useBuilder';

export default function ViewportPanel({ hide3D, onRender, viewRef }) {
  const { resolved, build, mode, setMode, setSettings } = useBuilder();
  const inner = useRef(null);
  const ref = viewRef || inner;
  const [photoMode, setPhotoMode] = useState(true);
  const [hq, setHq] = useState(false);
  const showPhotos = photoMode && mode === 'pc';
  return (
    <div className="relative min-h-0 flex-1 overflow-hidden bg-[#0b0b0b]">
      <div className={`absolute inset-0 ${hide3D || showPhotos ? 'invisible' : ''}`}>
        <ThreeViewport ref={ref} resolved={resolved} settings={build.settings} mode={mode} active={!hide3D && !showPhotos} hq={hq} />
      </div>
      {!hide3D && showPhotos && <RealProductView />}
      <div className="pointer-events-none absolute left-3 top-3 z-10">
        <div className="flex items-center gap-1.5">
          <Logo size={15} />
          <span className="text-[11px] font-extrabold uppercase tracking-[0.12em] text-white/70">RigForge</span>
        </div>
        <p className="mt-0.5 max-w-[150px] text-[9px] leading-tight text-[#5f5f68]">3D layout is approximate. Accuracy not guaranteed.</p>
      </div>
      {!hide3D && mode === 'pc' && (
        <div className="absolute left-3 top-14 z-10 flex rounded-md border border-[#262626] bg-[#161616]/90 p-0.5 backdrop-blur">
          {[[true, 'Product photos'], [false, '3D layout']].map(([value, label]) => (
            <button type="button" key={label} onClick={() => setPhotoMode(value)} aria-pressed={photoMode === value} className={`rounded px-2 py-1 text-[10px] font-medium transition-colors ${photoMode === value ? 'bg-[#2a2a2a] text-white' : 'text-[#8b8b94] hover:text-white'}`}>{label}</button>
          ))}
        </div>
      )}
      {hide3D && <div className="absolute inset-0 flex items-center justify-center text-[13px] text-[#71717a]">3D view hidden. Your parts and calculations are unchanged.</div>}
      <div className="absolute left-1/2 top-3 z-10 flex -translate-x-1/2 rounded-full border border-[#262626] bg-[#161616]/90 p-0.5 backdrop-blur">
        {[['pc', 'PC Build'], ['setup', 'Setup']].map(([k, n]) => (
          <button key={k} onClick={() => setMode(k)} className={`rounded-full px-4 py-1 text-[11px] font-medium transition-colors ${mode === k ? 'bg-[#2a2a2a] text-white' : 'text-[#8b8b94] hover:text-white'}`}>{n}</button>
        ))}
      </div>
      {!hide3D && !showPhotos && <ViewportControls viewRef={ref} hq={hq} onToggleHq={() => setHq((v) => !v)} />}
      {!hide3D && !showPhotos && (
        <div className="thin-scroll absolute right-3 top-12 z-10 w-[212px] max-h-[calc(100%-7.5rem)] space-y-2 overflow-y-auto">
          <PowerDashboard />
          {build.settings.showFps !== false ? (
            <FpsChart />
          ) : (
            <button onClick={() => setSettings({ showFps: true })} className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-[#262626] bg-[#141414]/95 px-2 py-1.5 text-[10px] font-medium text-[#8b8b94] transition-colors hover:text-white">
              <Eye className="h-3 w-3" />Show predicted FPS
            </button>
          )}
        </div>
      )}
      {!hide3D && !showPhotos && !['case', 'cpu', 'motherboard', 'gpu', 'ram', 'cooler', 'storage', 'psu', 'fan'].some((k) => resolved[k]?.length) && (
        <div className="pointer-events-none absolute inset-x-0 bottom-24 text-center text-[12px] text-[#71717a]">Preview rig — add parts from the Parts panel to build your own.</div>
      )}
      {!hide3D && !showPhotos && <><p className="pointer-events-none absolute inset-x-0 bottom-24 text-center text-[10px] text-[#5f5f68]">Approximate 3D layout — use Product photos for the actual product appearance.</p><Dock onRender={onRender} /></>}
    </div>
  );
}