import { useState } from 'react';
import { SLOT_ICON } from '@/lib/slotIcons';
import { Image } from '@/components/ui/image';

export default function PartThumb({ part, size = 'h-12 w-12' }) {
  const Icon = SLOT_ICON[part.category] || SLOT_ICON.case;
  const [failedUrl, setFailedUrl] = useState(null);
  const hasPhoto = part.image_url && failedUrl !== part.image_url;
  return (
    <div className={`relative flex ${size} shrink-0 items-center justify-center overflow-hidden rounded-md border border-border text-muted-foreground ${hasPhoto ? 'bg-product' : 'bg-background'}`}>
      {hasPhoto ? <Image src={part.image_url} alt={part.name} className="h-full w-full object-contain p-1" fittingType="fit" loading="lazy" referrerPolicy="no-referrer" onError={() => setFailedUrl(part.image_url)} /> : <Icon className="h-5 w-5" />}
    </div>
  );
}