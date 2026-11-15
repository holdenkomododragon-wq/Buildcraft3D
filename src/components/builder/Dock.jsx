import { Fan, PanelRight, Sparkles, Grid3x3, Palette, Image as ImageIcon } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import DockColors from './DockColors';
import { useBuilder } from '@/hooks/useBuilder';

const trigger = 'flex w-14 flex-col items-center gap-1 rounded-lg px-1 py-1.5 text-[9px] font-semibold uppercase tracking-[0.08em] text-[#8b8b94] transition-colors hover:bg-[#1c1c1c] hover:text-white';
const panel = 'w-64 border-[#242424] bg-[#141414] p-3 text-[12px] text-[#f5f5f7]';
const PRESETS = [['Silent', 600], ['Standard', 1200], ['Performance', 1800], ['Max', 2400]];
const MODES = [['solid', 'Solid'], ['red', 'Solid red'], ['rainbow', 'Rainbow wave'], ['breathing', 'Breathing'], ['off', 'Off']];

function Btn({ icon: Icon, label, children, active }) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button className={`${trigger} ${active ? 'text-white' : ''}`}>
          <Icon className={`h-4 w-4 ${active ? 'text-[#00cc66]' : ''}`} strokeWidth={1.7} />{label}
        </button>
      </PopoverTrigger>
      <PopoverContent side="top" className={panel}>{children}</PopoverContent>
    </Popover>
  );
}

export default function Dock({ onRender }) {
  const { build, setSettings } = useBuilder();
  const s = build.settings;
  const hexOk = (v) => /^#[0-9a-fA-F]{6}$/.test(v);
  return (
    <div className="absolute bottom-4 left-1/2 z-10 flex -translate-x-1/2 items-center gap-0.5 rounded-2xl border border-[#262626] bg-[#161616]/95 p-1.5 shadow-[0_12px_40px_rgba(0,0,0,0.55)] backdrop-blur">
      <Btn icon={Fan} label="Fans" active={s.fansOn}>
        <div className="mb-2 flex items-center justify-between"><span className="font-semibold">Fan animation</span><Switch checked={s.fansOn} onCheckedChange={(v) => setSettings({ fansOn: v })} /></div>
        <div className="mb-1 flex justify-between text-[#a1a1aa]"><span>Master speed</span><span className="tabular">{s.rpm} RPM</span></div>
        <Slider value={[s.rpm]} min={300} max={2400} step={50} onValueChange={([v]) => setSettings({ rpm: v })} />
        <div className="mt-3 grid grid-cols-4 gap-1">{PRESETS.map(([n, v]) => <button key={n} onClick={() => setSettings({ rpm: v })} className="rounded border border-[#242424] py-1 text-[10px] hover:border-[#00cc66]">{n}</button>)}</div>
        <p className="mt-2 text-[10px] text-[#71717a]">Visual preview only. This does not control real fans.</p>
      </Btn>
      <Btn icon={PanelRight} label="Config" active={s.showGlass}>
        <div className="flex items-center justify-between"><span className="font-semibold">Side glass panel</span><Switch checked={s.showGlass} onCheckedChange={(v) => setSettings({ showGlass: v })} /></div>
      </Btn>
      <Btn icon={Sparkles} label="RGB" active={s.rgbMode !== 'off'}>
        <div className="mb-2 font-semibold">RGB lighting</div>
        <div className="mb-2 grid grid-cols-2 gap-1">{MODES.map(([k, n]) => <button key={k} onClick={() => setSettings({ rgbMode: k })} className={`rounded border py-1 text-[11px] ${s.rgbMode === k ? 'border-[#00cc66] bg-[#00cc66]/10' : 'border-[#242424] hover:border-[#3a3a3a]'}`}>{n}</button>)}</div>
        <div className="flex items-center gap-2">
          <input type="color" value={hexOk(s.rgbColor) ? s.rgbColor : '#00cc66'} onChange={(e) => setSettings({ rgbColor: e.target.value, rgbMode: 'solid' })} className="h-8 w-10 cursor-pointer rounded border border-[#242424] bg-transparent" />
          <input value={s.rgbColor} onChange={(e) => setSettings({ rgbColor: e.target.value })} className="w-24 rounded-md border border-[#242424] bg-[#0d0d0d] px-2 py-1 uppercase" />
          <span className="tabular text-[10px] text-[#71717a]">{hexOk(s.rgbColor) ? [1, 3, 5].map((i) => parseInt(s.rgbColor.slice(i, i + 2), 16)).join(', ') : ''}</span>
        </div>
      </Btn>
      <Btn icon={Palette} label="Colors" active={Object.values(s.componentColors || {}).some(Boolean)}>
        <DockColors />
      </Btn>
      <Btn icon={Grid3x3} label="Displays" active={s.showGrid}>
        <div className="flex items-center justify-between"><span className="font-semibold">Floor grid</span><Switch checked={s.showGrid} onCheckedChange={(v) => setSettings({ showGrid: v })} /></div>
        <div className="mt-2.5 flex items-center justify-between border-t border-[#242424] pt-2.5"><span className="font-semibold">Predicted FPS</span><Switch checked={s.showFps !== false} onCheckedChange={(v) => setSettings({ showFps: v })} aria-label="Predicted FPS" /></div>
        <div className="mt-2.5 flex items-center justify-between border-t border-[#242424] pt-2.5"><span className="font-semibold">Live retailer prices</span><Switch checked={s.showLivePrices !== false} onCheckedChange={(v) => setSettings({ showLivePrices: v })} aria-label="Live retailer prices" /></div>
      </Btn>
      <div className="mx-1 h-8 w-px bg-[#262626]" />
      <button className={trigger} onClick={onRender}><ImageIcon className="h-4 w-4" strokeWidth={1.7} />Render</button>
    </div>
  );
}