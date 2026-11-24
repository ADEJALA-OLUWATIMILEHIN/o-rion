import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { toast } from 'sonner'
import { BadgeCheck, Battery, Box, Check, Eye, Loader2, MapPin, MessageCircle, PackageSearch, Receipt, ScanLine, Share2, ShieldCheck, Star, Trash2, Wrench, X } from 'lucide-react'
import { listingsApi } from '@/api/listings'
import { chatApi } from '@/api/chat'
import type { Listing } from '@/api/types'
import { useAsync } from '@/hooks/useAsync'
import { useAuth } from '@/lib/auth'
import { CATEGORY_LABEL, CONDITION_LABEL, discountPct, naira } from '@/lib/format'
import { cn } from '@/lib/utils'
import { PageHeader } from '@/components/PageHeader'
import { SafeImage } from '@/components/SafeImage'
import { FavoriteButton } from '@/components/FavoriteButton'
import { ConditionBadge } from '@/components/ConditionBadge'
import { UserAvatar } from '@/components/UserAvatar'
import { EmptyState } from '@/components/EmptyState'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'

export function ListingPage() {
  const { id = '' } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const { data: listing, error, loading, setData } = useAsync(() => listingsApi.get(id), [id, user?.id])
  const [busy, setBusy] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState(false)

  if (error) {
    return (
      <div className="p-4">
        <PageHeader title="Listing" />
        <EmptyState icon={<PackageSearch />} title="Listing not found" body={error.message} action={<Button asChild><Link to="/">Back to Discover</Link></Button>} />
      </div>
    )
  }
  if (loading || !listing) return <ListingSkeleton />

  const isOwner = user?.id === listing.sellerId
  const off = discountPct(listing.price, listing.originalPrice)

  async function openChat(intent?: 'offer' | 'buy') {
    if (!user) return navigate('/login', { state: { from: `/listings/${id}` } })
    setBusy(intent ?? 'chat')
    try {
      const convo = await chatApi.start(id)
      navigate(`/inbox/${convo.id}${intent ? `?intent=${intent}` : ''}`)
    } catch (e) {
      toast.error((e as Error).message)
      setBusy(null)
    }
  }

  async function setStatus(status: Listing['status']) {
    setBusy('status')
    try {
      const updated = await listingsApi.update(id, { status })
      setData(updated)
      toast.success(status === 'sold' ? 'Marked as sold' : 'Listing is live again')
    } catch (e) {
      toast.error((e as Error).message)
    } finally {
      setBusy(null)
    }
  }

  async function remove() {
    setBusy('delete')
    try {
      await listingsApi.remove(id)
      toast.success('Listing deleted')
      navigate('/profile', { replace: true })
    } catch (e) {
      toast.error((e as Error).message)
      setBusy(null)
    }
  }

  async function share() {
    const url = window.location.href
    try {
      if (navigator.share) await navigator.share({ title: listing!.title, url })
      else {
        await navigator.clipboard.writeText(url)
        toast.success('Link copied')
      }
    } catch {
      /* user cancelled */
    }
  }

  const checks = [
    { key: 'batteryHealth', icon: Battery, label: listing.checks.batteryHealth ? `Battery Health ${listing.checks.batteryHealth}%` : 'Battery health', ok: Boolean(listing.checks.batteryHealth) },
    { key: 'functionalTested', icon: Wrench, label: 'Functionally tested', ok: Boolean(listing.checks.functionalTested) },
    { key: 'serialVerified', icon: ScanLine, label: 'IMEI / Serial verified', ok: Boolean(listing.checks.serialVerified) },
    { key: 'originalBox', icon: Box, label: 'Original box & cables', ok: Boolean(listing.checks.originalBox) },
    { key: 'proofOfPurchase', icon: Receipt, label: 'Proof of purchase', ok: Boolean(listing.checks.proofOfPurchase) },
  ]

  return (
    <div className="lg:px-8">
      <PageHeader
        title={<span className="lg:hidden">{CATEGORY_LABEL[listing.category]}</span>}
        right={
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" onClick={share} aria-label="Share">
              <Share2 className="size-5" />
            </Button>
            {!isOwner ? <FavoriteButton listingId={listing.id} initial={listing.isFavorite} className="bg-surface shadow-none" /> : null}
          </div>
        }
      />
      <div className="grid gap-6 lg:grid-cols-[1.1fr_1fr] lg:gap-10">
        {/* Gallery */}
        <div className="lg:sticky lg:top-36 lg:self-start">
          <div className="no-scrollbar flex snap-x snap-mandatory overflow-x-auto lg:rounded-3xl">
            {(listing.images.length ? listing.images : [null]).map((src, i) => (
              <div key={i} className="relative aspect-square w-full shrink-0 snap-center bg-surface">
                <SafeImage src={src} alt={`${listing.title} photo ${i + 1}`} className="size-full" />
                {listing.images.length > 1 ? (
                  <span className="absolute right-3 bottom-3 rounded-full bg-plum/70 px-2.5 py-1 text-xs font-semibold text-white">
                    {i + 1}/{listing.images.length}
                  </span>
                ) : null}
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-5 px-4 pb-36 lg:px-0 lg:pb-8">
          <div className="flex flex-col gap-2">
            <div className="flex flex-wrap items-center gap-1.5">
              <ConditionBadge condition={listing.condition} grade={listing.grade} />
              {listing.warrantyMonths ? <Badge variant="success">{listing.warrantyMonths}-Mo Warranty</Badge> : null}
              {listing.inspected ? (
                <Badge variant="secondary">
                  <ShieldCheck /> Hub Inspected
                </Badge>
              ) : null}
              {listing.status !== 'active' ? <Badge variant="deal">{listing.status}</Badge> : null}
            </div>
            <h1 className="text-2xl leading-tight font-bold tracking-tight lg:text-3xl">{listing.title}</h1>
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <span className="text-3xl font-extrabold tracking-tight lg:text-4xl">{naira(listing.price)}</span>
              {listing.originalPrice ? <span className="text-muted-foreground line-through">{naira(listing.originalPrice)}</span> : null}
              {off ? <span className="text-sm font-bold text-destructive">{off}% off retail</span> : null}
              <span className="text-sm text-muted-foreground">{listing.negotiable ? 'Negotiable' : 'Fixed price'}</span>
            </div>
            <p className="flex items-center gap-3 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <MapPin className="size-4" /> {listing.location}
              </span>
              <span className="flex items-center gap-1">
                <Eye className="size-4" /> {listing.views} views
              </span>
            </p>
          </div>

          {listing.tags.length ? (
            <div className="flex flex-wrap gap-1.5">
              {listing.tags.map((t) => (
                <span key={t} className="rounded-full bg-surface px-3 py-1 text-xs font-semibold text-accent">
                  {t}
                </span>
              ))}
            </div>
          ) : null}

          {/* Seller */}
          {listing.seller ? (
            <Card className="flex-row items-center gap-3 p-3">
              <UserAvatar name={listing.seller.name} src={listing.seller.avatarUrl} className="size-12" />
              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-1 font-bold">
                  {listing.seller.name}
                  {listing.seller.verified ? <BadgeCheck className="size-4 text-primary" /> : null}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {listing.seller.department ?? listing.seller.campus} · {listing.seller.tradesCount} trades · {listing.seller.responseTime}
                </p>
              </div>
              <span className="flex items-center gap-1 rounded-full bg-surface px-2.5 py-1 text-sm font-bold">
                <Star className="size-4 fill-deal text-deal" /> {listing.seller.rating.toFixed(1)}
              </span>
            </Card>
          ) : null}

          {/* Escrow explainer */}
          <div className="flex gap-3 rounded-2xl bg-surface p-4">
            <span className="grid size-10 shrink-0 place-items-center rounded-full bg-white text-primary">
              <ShieldCheck className="size-5" />
            </span>
            <div className="text-sm">
              <p className="font-bold">Escrow & 48hr Test Guarantee</p>
              <p className="text-muted-foreground">
                Your payment is held until you test the item at {listing.hub ? listing.hub.name : 'a certified safe hub'} and share your handover PIN.
              </p>
            </div>
          </div>

          {/* Checks */}
          <section className="flex flex-col gap-2">
            <h2 className="text-lg font-bold">Functional Check & Disclosures</h2>
            <div className="grid gap-2 sm:grid-cols-2">
              {checks.map(({ key, icon: Icon, label, ok }) => (
                <div key={key} className={cn('flex items-center gap-2 rounded-xl border px-3 py-2.5 text-sm', ok ? 'border-primary/15 bg-white' : 'border-dashed text-muted-foreground')}>
                  <Icon className={cn('size-4', ok ? 'text-primary' : '')} />
                  <span className="flex-1">{label}</span>
                  {ok ? <Check className="size-4 text-success" /> : <X className="size-4" />}
                </div>
              ))}
            </div>
          </section>

          {listing.description ? (
            <section className="flex flex-col gap-2">
              <h2 className="text-lg font-bold">About this item</h2>
              <p className="text-[15px] leading-relaxed whitespace-pre-line text-plum/85">{listing.description}</p>
              <p className="text-sm text-muted-foreground">Condition: {CONDITION_LABEL[listing.condition]}</p>
            </section>
          ) : null}

          {listing.hub ? (
            <section className="flex flex-col gap-2">
              <h2 className="text-lg font-bold">Certified Safe Exchange Hub</h2>
              <Card className="gap-1 p-4">
                <p className="font-bold">{listing.hub.name}</p>
                <p className="text-sm text-muted-foreground">{listing.hub.description}</p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {listing.hub.features.map((f) => (
                    <Badge key={f} variant="success" className="normal-case tracking-normal">
                      {f}
                    </Badge>
                  ))}
                </div>
              </Card>
            </section>
          ) : null}

          {/* Actions — sticky on mobile, inline on desktop */}
          <div className="fixed inset-x-0 bottom-24 z-30 px-4 lg:static lg:px-0">
            <div className="mx-auto flex max-w-md gap-2 rounded-full bg-white/95 p-1.5 shadow-dock backdrop-blur lg:max-w-none lg:bg-transparent lg:p-0 lg:shadow-none">
              {isOwner ? (
                <>
                  {listing.status === 'sold' ? (
                    <Button className="flex-1" variant="secondary" disabled={busy !== null} onClick={() => setStatus('active')}>
                      Relist item
                    </Button>
                  ) : (
                    <Button className="flex-1" variant="secondary" disabled={busy !== null} onClick={() => setStatus('sold')}>
                      Mark as sold
                    </Button>
                  )}
                  <Button variant="ghost" size="icon" className="size-12 text-destructive" onClick={() => setConfirmDelete(true)} aria-label="Delete listing">
                    <Trash2 className="size-5" />
                  </Button>
                </>
              ) : listing.status !== 'active' ? (
                <Button className="flex-1" variant="secondary" disabled>
                  {listing.status === 'sold' ? 'Sold' : 'Reserved in escrow'}
                </Button>
              ) : (
                <>
                  <Button variant="ghost" size="icon" className="size-12 bg-surface" onClick={() => openChat()} disabled={busy !== null} aria-label="Chat with seller">
                    {busy === 'chat' ? <Loader2 className="animate-spin" /> : <MessageCircle className="size-5" />}
                  </Button>
                  {listing.negotiable ? (
                    <Button className="flex-1" variant="secondary" onClick={() => openChat('offer')} disabled={busy !== null}>
                      {busy === 'offer' ? <Loader2 className="animate-spin" /> : null} Make Offer
                    </Button>
                  ) : null}
                  <Button className="flex-1" onClick={() => openChat('buy')} disabled={busy !== null}>
                    {busy === 'buy' ? <Loader2 className="animate-spin" /> : null} Buy Now
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <Dialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete this listing?</DialogTitle>
            <DialogDescription>Buyers will no longer see it and open chats about it will close. This can't be undone.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setConfirmDelete(false)}>
              Keep it
            </Button>
            <Button variant="destructive" onClick={remove} disabled={busy === 'delete'}>
              {busy === 'delete' ? <Loader2 className="animate-spin" /> : <Trash2 />} Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function ListingSkeleton() {
  return (
    <div className="grid gap-6 lg:grid-cols-2 lg:px-8 lg:pt-20">
      <Skeleton className="aspect-square rounded-none lg:rounded-3xl" />
      <div className="flex flex-col gap-3 px-4">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-8 w-3/4" />
        <Skeleton className="h-10 w-1/2" />
        <Skeleton className="h-20 w-full" />
      </div>
    </div>
  )
}
