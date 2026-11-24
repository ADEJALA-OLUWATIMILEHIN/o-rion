import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router'
import { ArrowRight, BadgeCheck, Bell, ChevronDown, ChevronRight, MapPin, PackageSearch, Search, ShieldCheck, SlidersHorizontal } from 'lucide-react'
import { listingsApi, type ListingQuery } from '@/api/listings'
import type { Category, Condition } from '@/api/types'
import { useAsync } from '@/hooks/useAsync'
import { useAuth } from '@/lib/auth'
import { CATEGORY_LABEL, CONDITION_LABEL } from '@/lib/format'
import { cn } from '@/lib/utils'
import { Logo } from '@/components/Logo'
import { UserAvatar } from '@/components/UserAvatar'
import { EmptyState } from '@/components/EmptyState'
import { FeaturedCard, ListingCard, ListingCardSkeleton } from '@/components/ListingCard'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const CHIPS: { key: string; label: string; icon?: typeof BadgeCheck }[] = [
  { key: 'all', label: 'All Items' },
  { key: 'certified', label: 'Certified Refurbished', icon: BadgeCheck },
  ...(['laptops', 'phones', 'audio', 'tablets', 'books', 'fashion', 'cameras', 'home'] as Category[]).map((c) => ({ key: c, label: CATEGORY_LABEL[c] })),
]

const SORTS: { value: NonNullable<ListingQuery['sort']>; label: string }[] = [
  { value: 'best_match', label: 'Best Match' },
  { value: 'newest', label: 'Newest' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
]

export function DiscoverPage() {
  const { user } = useAuth()
  const [params, setParams] = useSearchParams()
  const chip = params.get('c') ?? 'all'
  const q = params.get('q') ?? ''
  const sort = (params.get('sort') as ListingQuery['sort']) ?? 'best_match'
  const inspected = params.get('verified') === '1'
  const condition = (params.get('condition') as Condition | null) ?? undefined
  const minPrice = params.get('min') ?? ''
  const maxPrice = params.get('max') ?? ''

  const [search, setSearch] = useState(q)
  const [filtersOpen, setFiltersOpen] = useState(false)

  const update = (patch: Record<string, string | null>) => {
    const next = new URLSearchParams(params)
    for (const [k, v] of Object.entries(patch)) {
      if (v === null || v === '' || (k === 'c' && v === 'all') || (k === 'sort' && v === 'best_match')) next.delete(k)
      else next.set(k, v)
    }
    setParams(next, { replace: true })
  }

  // Debounce typing into ?q=
  useEffect(() => {
    if (search === q) return
    const t = setTimeout(() => update({ q: search.trim() || null }), 300)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search])

  const query: ListingQuery = useMemo(
    () => ({
      q: q || undefined,
      sort,
      inspected: inspected || undefined,
      category: chip !== 'all' && chip !== 'certified' ? (chip as Category) : undefined,
      condition: chip === 'certified' ? 'certified_refurbished' : condition,
      minPrice: minPrice ? Number(minPrice) : undefined,
      maxPrice: maxPrice ? Number(maxPrice) : undefined,
      limit: 24,
    }),
    [q, sort, inspected, chip, condition, minPrice, maxPrice],
  )

  const feed = useAsync(() => listingsApi.list(query), [JSON.stringify(query), user?.id])
  const drops = useAsync(() => listingsApi.list({ inspected: true, sort: 'best_match', limit: 8 }), [user?.id])
  const filtering = Boolean(q || chip !== 'all' || inspected || condition || minPrice || maxPrice)
  const activeFilterCount = [condition, minPrice, maxPrice].filter(Boolean).length

  return (
    <div className="flex flex-col gap-5 px-4 pt-3 sm:px-6 lg:px-8 lg:pt-6">
      {/* Mobile top bar */}
      <div className="flex items-center gap-2 lg:hidden">
        <Logo />
        <span className="ml-1 flex min-w-0 items-center gap-1.5 rounded-full bg-surface px-3 py-2 text-sm font-semibold">
          <MapPin className="size-4 shrink-0 text-primary" />
          <span className="truncate">Lagos, Nigeria</span>
        </span>
        <Link to="/inbox" className="relative ml-auto grid size-10 shrink-0 place-items-center rounded-full hover:bg-surface" aria-label="Notifications">
          <Bell className="size-[22px]" />
        </Link>
        <Link to={user ? '/profile' : '/login'} aria-label="Profile">
          <UserAvatar name={user?.name ?? 'Guest'} src={user?.avatarUrl} className="size-10" />
        </Link>
      </div>

      {/* Search */}
      <div className="flex gap-2">
        <label className="relative flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search verified phones, MacBooks, books…"
            className="h-12 w-full rounded-full border border-primary/10 bg-surface pr-4 pl-12 text-[15px] outline-none placeholder:text-muted-foreground focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/20"
          />
        </label>
        <button
          type="button"
          onClick={() => setFiltersOpen(true)}
          className="relative grid size-12 shrink-0 place-items-center rounded-2xl bg-surface text-primary hover:bg-surface-strong"
          aria-label="Filters"
        >
          <SlidersHorizontal className="size-5" />
          {activeFilterCount ? <span className="absolute top-2 right-2 size-2 rounded-full bg-primary" /> : null}
        </button>
      </div>

      {/* Trust banner */}
      <div className="flex items-center gap-3 rounded-2xl border border-primary/10 bg-surface p-3 pr-4">
        <span className="grid size-10 shrink-0 place-items-center rounded-full bg-primary text-white">
          <ShieldCheck className="size-5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold">Nigeria's #1 Verified Recommerce</p>
          <p className="truncate text-xs text-muted-foreground">30-Point Device Inspection · 6-Month Warranty · Bank Escrow</p>
        </div>
        <span className="hidden shrink-0 rounded-full bg-primary px-3 py-1.5 text-[10px] font-bold tracking-wide text-white uppercase sm:block">Escrow Secured</span>
      </div>

      {/* Category chips */}
      <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 sm:-mx-6 sm:px-6 lg:mx-0 lg:px-0">
        {CHIPS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            type="button"
            onClick={() => update({ c: key })}
            className={cn(
              'flex h-10 shrink-0 items-center gap-1.5 rounded-full border px-4 text-sm font-semibold transition',
              chip === key ? 'border-primary bg-primary text-white shadow-sm' : 'border-primary/15 bg-white text-plum hover:bg-surface',
            )}
          >
            {Icon ? <Icon className={cn('size-4', chip === key ? 'text-white' : 'text-primary')} /> : null}
            {label}
          </button>
        ))}
      </div>

      {/* Featured rail */}
      {!filtering ? (
        <section className="flex flex-col gap-3">
          <div className="flex items-start justify-between gap-4">
            <h2 className="flex items-start gap-2 text-xl leading-tight font-bold tracking-tight lg:text-2xl">
              <BadgeCheck className="mt-0.5 size-6 shrink-0 text-primary" /> Certified Pre-Owned & Refurbished Drops
            </h2>
            <button type="button" onClick={() => update({ verified: '1' })} className="flex shrink-0 items-center text-sm font-bold text-primary">
              See All {drops.data ? `(${drops.data.total})` : ''} <ChevronRight className="size-4" />
            </button>
          </div>
          <div className="no-scrollbar -mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-2 sm:-mx-6 sm:px-6 lg:mx-0 lg:px-0">
            {drops.loading && !drops.data
              ? Array.from({ length: 3 }, (_, i) => (
                  <div key={i} className="w-[260px] shrink-0">
                    <ListingCardSkeleton />
                  </div>
                ))
              : drops.data?.items.map((l) => <FeaturedCard key={l.id} listing={l} />)}
          </div>
        </section>
      ) : null}

      {/* Main grid */}
      <section className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <h2 className="min-w-0 flex-1 truncate text-xl font-bold tracking-tight lg:text-2xl">
            {q ? `Results for “${q}”` : chip === 'all' ? 'Certified Resale' : (CHIPS.find((c) => c.key === chip)?.label ?? 'Listings')}
          </h2>
          <button
            type="button"
            onClick={() => update({ verified: inspected ? null : '1' })}
            className={cn(
              'flex h-9 shrink-0 items-center gap-1.5 rounded-full border px-3 text-xs font-bold transition',
              inspected ? 'border-primary bg-primary text-white' : 'border-primary/20 bg-white text-primary',
            )}
          >
            <BadgeCheck className="size-4" /> Hub Verified Only
          </button>
          <label className="relative shrink-0">
            <select
              value={sort}
              onChange={(e) => update({ sort: e.target.value })}
              className="h-9 appearance-none rounded-full bg-surface pr-8 pl-3 text-xs font-bold outline-none focus:ring-2 focus:ring-primary/30"
              aria-label="Sort"
            >
              {SORTS.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute top-1/2 right-2.5 size-4 -translate-y-1/2" />
          </label>
        </div>

        {feed.error ? (
          <EmptyState icon={<PackageSearch />} title="Couldn't load listings" body={feed.error.message} action={<Button onClick={feed.reload}>Retry</Button>} />
        ) : feed.loading && !feed.data ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {Array.from({ length: 6 }, (_, i) => (
              <ListingCardSkeleton key={i} />
            ))}
          </div>
        ) : feed.data && feed.data.items.length === 0 ? (
          <EmptyState
            icon={<PackageSearch />}
            title="Nothing here yet"
            body="Try a different search or clear your filters."
            action={
              <Button variant="secondary" onClick={() => setParams(new URLSearchParams(), { replace: true })}>
                Clear filters
              </Button>
            }
          />
        ) : (
          <div className={cn('grid grid-cols-2 gap-3 transition-opacity sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5', feed.loading && 'opacity-60')}>
            {feed.data?.items.map((l) => <ListingCard key={l.id} listing={l} />)}
          </div>
        )}
      </section>

      {/* Safe trade promise */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-surface to-surface-strong p-5 lg:p-8">
        <div className="absolute -right-10 -bottom-10 size-40 rounded-full bg-primary/10" />
        <p className="flex items-center gap-2 text-xs font-bold tracking-[0.08em] text-primary uppercase">
          <span className="grid size-8 place-items-center rounded-full bg-primary text-white">
            <ShieldCheck className="size-4" />
          </span>
          Safe Trade Promise
        </p>
        <h3 className="mt-3 text-2xl font-bold tracking-tight">Why Buy Pre-Owned on O-Rion?</h3>
        <p className="mt-1 max-w-lg text-sm text-muted-foreground">
          Your money sits in escrow until you test the item at a certified hub and share your handover PIN. Free 48-hr returns across Lagos hubs.
        </p>
        <div className="relative mt-4 flex gap-2">
          <Button className="flex-1 sm:flex-none" asChild>
            <Link to="/how-escrow-works">
              Learn About Escrow <ArrowRight />
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link to="/sell">Sell Device</Link>
          </Button>
        </div>
      </section>

      {filtersOpen ? (
      <FilterDialog
        open={filtersOpen}
        onOpenChange={setFiltersOpen}
        initial={{ condition, minPrice, maxPrice }}
        onApply={(f) => update({ condition: f.condition ?? null, min: f.minPrice || null, max: f.maxPrice || null })}
      />
      ) : null}
    </div>
  )
}

type Filters = { condition?: Condition; minPrice: string; maxPrice: string }

function FilterDialog({
  open,
  onOpenChange,
  initial,
  onApply,
}: {
  open: boolean
  onOpenChange: (o: boolean) => void
  initial: Filters
  onApply: (f: Filters) => void
}) {
  const [f, setF] = useState<Filters>(initial)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Filters</DialogTitle>
          <DialogDescription>Narrow down by condition and budget.</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-2">
          <Label>Condition</Label>
          <div className="grid grid-cols-2 gap-2">
            {(Object.keys(CONDITION_LABEL) as Condition[]).map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setF({ ...f, condition: f.condition === c ? undefined : c })}
                className={cn(
                  'rounded-xl px-3 py-3 text-sm font-semibold transition',
                  f.condition === c ? 'bg-primary text-white' : 'bg-surface text-plum hover:bg-surface-strong',
                )}
              >
                {CONDITION_LABEL[c]}
              </button>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-2">
            <Label htmlFor="min">Min price (₦)</Label>
            <Input id="min" inputMode="numeric" value={f.minPrice} onChange={(e) => setF({ ...f, minPrice: e.target.value.replace(/\D/g, '') })} placeholder="0" />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="max">Max price (₦)</Label>
            <Input id="max" inputMode="numeric" value={f.maxPrice} onChange={(e) => setF({ ...f, maxPrice: e.target.value.replace(/\D/g, '') })} placeholder="Any" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setF({ minPrice: '', maxPrice: '' })}>
            Reset
          </Button>
          <Button
            onClick={() => {
              onApply(f)
              onOpenChange(false)
            }}
          >
            Show results
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
