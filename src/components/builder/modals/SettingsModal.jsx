import { useBuilder } from '@/hooks/useBuilder';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BUILD_CATEGORIES } from '@/lib/catalogMeta';

function Toggle({ title, hint, checked, onChange }) {
  return (
    <div className="flex items-start justify-between gap-3 border-t border-[#1f1f26] pt-2.5 first:border-t-0 first:pt-0">
      <div>
        <div className="text-[12px] font-medium text-white">{title}</div>
        <p className="text-[11px] leading-snug text-[#71717a]">{hint}</p>
      </div>
      <Switch checked={checked} onCheckedChange={onChange} aria-label={title} />
    </div>
  );
}

export default function SettingsModal() {
  const { build, patch, setSettings, user } = useBuilder();
  const s = build.settings;
  return (
    <div className="space-y-3">
      <div><Label>Build name</Label><Input value={build.title} onChange={(e) => patch({ title: e.target.value })} onBlur={() => !build.title.trim() && patch({ title: 'New Build' })} /></div>
      <div><Label>Description</Label><Textarea rows={3} value={build.description} onChange={(e) => patch({ description: e.target.value })} /></div>
      <div className="grid grid-cols-2 gap-3">
        <div><Label>Visibility</Label>
          <Select value={build.visibility} onValueChange={(v) => patch({ visibility: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="private">Private</SelectItem><SelectItem value="public">Public</SelectItem></SelectContent></Select></div>
        <div><Label>Category</Label>
          <Select value={build.category} onValueChange={(v) => patch({ category: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{BUILD_CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select></div>
      </div>
      <div className="space-y-2.5 rounded-lg border border-[#27272f] bg-[#141418] p-3">
        <div className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#8b8b94]">What the builder shows</div>
        <Toggle
          title="Live retailer prices"
          hint="Amazon, Newegg and Micro Center listings and their links."
          checked={s.showLivePrices !== false}
          onChange={(v) => setSettings({ showLivePrices: v })}
        />
        <Toggle
          title="Predicted FPS"
          hint="The game frame-rate estimate over the 3D view and the benchmark readout."
          checked={s.showFps !== false}
          onChange={(v) => setSettings({ showFps: v })}
        />
      </div>
      <p className="text-[11px] text-[#71717a]">{user ? 'Press Save to apply visibility. Public builds appear in Completed Builds and get a share link.' : 'Sign in to save builds and publish them.'}</p>
    </div>
  );
}