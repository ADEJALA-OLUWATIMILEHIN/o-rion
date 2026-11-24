import { Link } from 'react-router'
import { BadgeCheck, MessageSquareText, ShieldCheck, Star } from 'lucide-react'
import type { Listing } from '@/api/types'
import { discountPct, naira } from '@/lib/format'
import { cn } from '@/lib/utils'
import { SafeImage } from './SafeImage'
import { FavoriteButton } from './FavoriteButton'
import { Badge } from './ui/badge'
import { ConditionBadge } from './ConditionBadge'

/** Compact 2-column feed card (Discover grid, Saved, Profile). */
export function ListingCard({ listing, onFavoriteChange }: { listing: Listing; onFavoriteChange?: (fav: boolean) => void }) {
  const tag = listing.tags[0]
  return (
    <Link
      to={`/listings/${listing.id}`}
      className="group flex flex-col gap-2 rounded-2xl border border-plum/5 bg-card p-2 shadow-card transition hover:-translate-y-0.5 hover:shadow-lift"
    >
      <div className="relative aspect-square overflow-hidden rounded-xl">
        <SafeImage src={listing.images[0]} alt={listing.title} className="size-full transition duration-300 group-hover:scale-[1.03]" />
        <FavoriteButton listingId={listing.id} initial={listing.isFavorite} onChange={onFavoriteChange} className="absolute top-2 right-2" />
        {listing.status !== 'active' ? (
          <Badge variant="deal" className="absolute top-2 left-2 bg-white/95">
            {listing.status}
          </Badge>
        ) : null}
        {tag ? (
          <Badge variant="glass" className="absolute bottom-2 left-2 h-auto max-w-[calc(100%-1rem)] truncate py-1 text-primary">
            {listing.inspected ? <BadgeCheck className="text-primary" /> : null}
            <span className="truncate">{tag}</span>
          </Badge>
        ) : null}
      </div>
      <div className="flex flex-col gap-1 px-1 pb-1">
        <div className="flex items-baseline justify-between gap-2">
          <span className="text-lg font-extrabold tracking-tight">{naira(listing.price)}</span>
          {listing.seller ? (
            <span className="flex items-center gap-0.5 text-xs font-semibold">
              <Star className="size-3.5 fill-deal text-deal" /> {listing.seller.rating.toFixed(1)}
            </span>
          ) : null}
        </div>
        <h3 className="truncate text-[15px] font-semibold">{listing.title}</h3>
        {listing.seller ? (
          <p className="flex items-center gap-1 truncate text-xs text-muted-foreground">
            <BadgeCheck className={cn('size-3.5 shrink-0', listing.seller.verified ? 'text-primary' : 'text-muted-foreground')} />
            <span className="truncate">
              {listing.seller.verified ? 'Verified Seller' : listing.seller.name} · {listing.seller.tradesCount} Trades
            </span>
          </p>
        ) : null}
        <div className="mt-1 flex items-center justify-between gap-2 border-t border-plum/5 pt-2">
          {listing.inspected ? (
            <span className="flex min-w-0 items-center gap-1 text-xs font-medium text-primary">
              <ShieldCheck className="size-3.5 shrink-0" /> <span className="truncate">Escrow Protected</span>
            </span>
          ) : (
            <ConditionBadge condition={listing.condition} grade={listing.grade} />
          )}
          <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-surface text-primary">
            <MessageSquareText className="size-4" />
          </span>
        </div>
      </div>
    </Link>
  )
}

/** Wide card for the horizontally scrolling "Certified drops" rail. */
export function FeaturedCard({ listing }: { listing: Listing }) {
  const off = discountPct(listing.price, listing.originalPrice)
  return (
    <Link
      to={`/listings/${listing.id}`}
      className="group flex w-[260px] shrink-0 snap-start flex-col gap-2 rounded-2xl border border-plum/5 bg-card p-2 shadow-card transition hover:shadow-lift sm:w-[280px]"
    >
      <div className="relative aspect-square overflow-hidden rounded-xl bg-surface">
        <SafeImage src={listing.images[0]} alt={listing.title} className="size-full transition duration-300 group-hover:scale-[1.03]" />
        <FavoriteButton listingId={listing.id} initial={listing.isFavorite} className="absolute top-2 right-2" />
        <div className="absolute bottom-2 left-2">
          <ConditionBadge condition={listing.condition} grade={listing.grade} />
        </div>
      </div>
      <div className="flex flex-col gap-1.5 px-1 pb-1">
        <div className="flex flex-wrap gap-1">
          {listing.tags.slice(0, 2).map((t) => (
            <Badge key={t} variant="secondary" className="normal-case tracking-normal">
              {t}
            </Badge>
          ))}
        </div>
        <h3 className="truncate text-base font-semibold">{listing.title}</h3>
        <div className="flex items-baseline gap-2">
          <span className="text-xl font-extrabold tracking-tight">{naira(listing.price)}</span>
          {listing.originalPrice ? <span className="text-xs text-muted-foreground line-through">{naira(listing.originalPrice)}</span> : null}
          {off ? <span className="ml-auto text-xs font-bold text-destructive">{off}% off</span> : null}
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="flex items-center gap-1 font-medium text-primary">
            <ShieldCheck className="size-3.5" /> Escrow Hold
          </span>
          <span className="truncate text-muted-foreground">{listing.location}</span>
        </div>
      </div>
    </Link>
  )
}

export function ListingCardSkeleton() {
  return (
    <div className="flex flex-col gap-2 rounded-2xl border border-plum/5 p-2">
      <div className="aspect-square animate-pulse rounded-xl bg-surface-strong/70" />
      <div className="h-5 w-1/2 animate-pulse rounded bg-surface-strong/70" />
      <div className="h-4 w-3/4 animate-pulse rounded bg-surface-strong/70" />
    </div>
  )
}
