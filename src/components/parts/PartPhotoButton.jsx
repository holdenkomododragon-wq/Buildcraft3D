import { useState } from 'react';
import { Expand } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Image } from '@/components/ui/image';
import ProductGallery from '@/components/parts/ProductGallery';

export default function PartPhotoButton({ part, size = 'h-14 w-14' }) {
  const [open, setOpen] = useState(false);
  const [failed, setFailed] = useState(false);
  if (!part.image_url) return null;
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <button type="button" onClick={() => setOpen(true)} aria-label={`Inspect photos of ${part.name}`} title="Inspect real product photos" className={`group relative ${size} shrink-0 overflow-hidden rounded-md border bg-product focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary`}>
        {!failed && <Image src={part.image_url} alt={part.name} fittingType="fit" loading="lazy" referrerPolicy="no-referrer" onError={() => setFailed(true)} className="h-full w-full object-contain p-1" />}
        <span className="absolute bottom-0 right-0 rounded-tl bg-card/90 p-0.5 text-foreground"><Expand className="h-3 w-3" /></span>
      </button>
      <DialogContent className="flex h-[min(82vh,700px)] max-w-3xl flex-col bg-card">
        <DialogHeader className="shrink-0 pr-6"><DialogTitle>{part.name}</DialogTitle></DialogHeader>
        <ProductGallery key={part.id} part={part} />
      </DialogContent>
    </Dialog>
  );
}