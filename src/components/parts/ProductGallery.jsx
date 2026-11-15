import { useState } from 'react';
import { ExternalLink, Loader2, ImageOff, ZoomIn, ZoomOut } from 'lucide-react';
import { Image } from '@/components/ui/image';

export default function ProductGallery({ part }) {
  const photos = [...new Set([part.image_url, ...(part.image_urls || [])].filter(Boolean))];
  const [index, setIndex] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  const [zoom, setZoom] = useState(false);
  const select = (i) => { setIndex(i); setLoaded(false); setFailed(false); setZoom(false); };
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3">
      <div className="relative flex min-h-40 flex-1 items-center justify-center overflow-auto rounded-lg border bg-product">
        {!loaded && !failed && photos.length > 0 && <Loader2 aria-label="Loading product photo" className="absolute h-6 w-6 animate-spin text-primary" />}
        {(!photos.length || failed) ? <div className="flex flex-col items-center gap-2 p-6 text-sm text-muted-foreground"><ImageOff className="h-8 w-8" />Photo unavailable. Use the product source below.</div> : <Image key={photos[index]} src={photos[index]} alt={`${part.name} — product photo ${index + 1}`} fittingType="fit" referrerPolicy="no-referrer" onLoad={() => setLoaded(true)} onError={() => setFailed(true)} className={zoom ? 'h-auto min-h-full w-[160%] max-w-none shrink-0 object-contain' : 'absolute inset-0 h-full w-full object-contain p-3'} />}
        {loaded && !failed && <button type="button" onClick={() => setZoom(!zoom)} aria-label={zoom ? 'Reduce product photo' : 'Enlarge product photo'} className="absolute bottom-2 right-2 rounded-md border bg-card p-2 text-foreground">{zoom ? <ZoomOut className="h-4 w-4" /> : <ZoomIn className="h-4 w-4" />}</button>}
      </div>
      {photos.length > 1 && <div className="flex shrink-0 justify-center gap-2 overflow-x-auto">{photos.map((src, i) => <button type="button" key={src} onClick={() => select(i)} aria-label={`View product photo ${i + 1}`} aria-pressed={index === i} className={`h-12 w-12 shrink-0 overflow-hidden rounded border-2 bg-product ${index === i ? 'border-primary' : 'border-border'}`}><Image src={src} alt="" fittingType="fit" loading="lazy" referrerPolicy="no-referrer" className="h-full w-full object-contain p-1" /></button>)}</div>}
      <div className="shrink-0 space-y-1 text-xs text-muted-foreground">
        {part.image_note && <p>{part.image_note}</p>}
        <div className="flex flex-wrap items-center justify-between gap-2"><span>Product photos, not a 3D model.</span>{part.product_url && <a href={part.product_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-primary hover:underline">Product page <ExternalLink className="h-3 w-3" /></a>}</div>
        <p className="text-[9px]">Manufacturer / retailer imagery. Product matching: <a href="https://github.com/buildcores/buildcores-open-db/tree/7f759ec353714e9dca2adab9e62bd80311fc373e" target="_blank" rel="noreferrer" className="underline">BuildCores OpenDB, August 2026 (ODC-By)</a>.</p>
      </div>
    </div>
  );
}