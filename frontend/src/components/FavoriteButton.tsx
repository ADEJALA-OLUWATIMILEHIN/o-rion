import { useState } from 'react'
import { useNavigate } from 'react-router'
import { Heart } from 'lucide-react'
import { toast } from 'sonner'
import { listingsApi } from '@/api/listings'
import { useAuth } from '@/lib/auth'
import { cn } from '@/lib/utils'

export function FavoriteButton({
  listingId,
  initial,
  onChange,
  className,
}: {
  listingId: string
  initial?: boolean
  onChange?: (fav: boolean) => void
  className?: string
}) {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [fav, setFav] = useState(Boolean(initial))
  const [busy, setBusy] = useState(false)

  async function toggle(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    if (!user) {
      navigate('/login', { state: { from: location.pathname } })
      return
    }
    setBusy(true)
    setFav(!fav)
    try {
      const res = await listingsApi.toggleFavorite(listingId)
      setFav(res.isFavorite)
      onChange?.(res.isFavorite)
    } catch (err) {
      setFav(fav)
      toast.error((err as Error).message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={busy}
      aria-pressed={fav}
      aria-label={fav ? 'Remove from saved' : 'Save item'}
      className={cn('grid size-9 place-items-center rounded-full bg-white/95 shadow-sm transition active:scale-90', className)}
    >
      <Heart className={cn('size-[18px]', fav ? 'fill-primary text-primary' : 'text-plum')} />
    </button>
  )
}
