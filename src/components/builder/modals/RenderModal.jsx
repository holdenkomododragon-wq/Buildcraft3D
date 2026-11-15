import { useState } from 'react';
import { Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { useBuilder } from '@/hooks/useBuilder';

export default function RenderModal({ viewRef }) {
  const { build } = useBuilder();
  const [grid, setGrid] = useState(false);
  const [transparent, setTransparent] = useState(false);
  const [fourK, setFourK] = useState(true);
  const [url, setUrl] = useState(null);
  const make = () => setUrl(viewRef.current?.capture({ grid, transparent, resolution: fourK ? '4k' : 'screen' }));
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-[12px]"><span>Show floor grid</span><Switch checked={grid} onCheckedChange={setGrid} /></div>
      <div className="flex items-center justify-between text-[12px]"><span>Transparent background</span><Switch checked={transparent} onCheckedChange={setTransparent} /></div>
      <div className="flex items-center justify-between text-[12px]"><span>4K render (3840 px wide)</span><Switch checked={fourK} onCheckedChange={setFourK} /></div>
      <Button onClick={make} className="w-full">Capture current view</Button>
      {url && (
        <div className="space-y-2">
          <img src={url} alt="Render preview" className="w-full rounded-lg border border-[#27272f]" style={{ background: transparent ? 'repeating-conic-gradient(#222 0% 25%, #111 0% 50%) 50% / 16px 16px' : undefined }} />
          <a href={url} download={`${build.title.replace(/\s+/g, '-')}${fourK ? '-4k' : ''}.png`} className="flex items-center justify-center gap-2 rounded-md border border-[#34343d] py-2 text-[12px] hover:border-[#00cc66]"><Download className="h-4 w-4" />Download PNG</a>
        </div>
      )}
    </div>
  );
}