import { useState } from 'react'
import { ImageIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

/** <img> that falls back to a soft placeholder when the URL fails. */
export function SafeImage({ src, alt, className }: { src?: string | null; alt: string; className?: string }) {
  const [failed, setFailed] = useState(false)
  if (!src || failed) {
    return (
      <div className={cn('grid place-items-center bg-gradient-to-br from-surface to-surface-strong text-primary/40', className)} role="img" aria-label={alt}>
        <ImageIcon className="size-8" />
      </div>
    )
  }
  return <img src={src} alt={alt} loading="lazy" onError={() => setFailed(true)} className={cn('object-cover', className)} />
}
