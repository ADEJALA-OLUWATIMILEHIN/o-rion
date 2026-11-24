import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { BadgeCheck, CheckCircle2, Clock, KeyRound, Landmark, Loader2, ShieldCheck, Truck, XCircle } from 'lucide-react'
import { offersApi } from '@/api/chat'
import type { Offer } from '@/api/types'
import { naira } from '@/lib/format'
import { cn } from '@/lib/utils'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog'

const STATUS_STYLE: Record<Offer['status'], { label: string; cls: string }> = {
  pending: { label: 'Awaiting seller', cls: 'bg-deal/15 text-amber-700' },
  accepted: { label: 'Locked in escrow', cls: 'bg-primary/10 text-primary' },
  declined: { label: 'Declined', cls: 'bg-destructive/10 text-destructive' },
  cancelled: { label: 'Cancelled', cls: 'bg-plum/5 text-muted-foreground' },
  expired: { label: 'Expired', cls: 'bg-plum/5 text-muted-foreground' },
  completed: { label: 'Completed', cls: 'bg-success/15 text-emerald-700' },
}

function useCountdown(iso: string) {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 60_000)
    return () => clearInterval(t)
  }, [])
  const ms = new Date(iso).getTime() - now
  if (ms <= 0) return 'Expired'
  const h = Math.floor(ms / 3600_000)
  return h >= 1 ? `Expires in ${h} hr${h === 1 ? '' : 's'}` : `Expires in ${Math.ceil(ms / 60_000)} min`
}

/** Structured escrow offer card shown inline in the chat thread. */
export function OfferCard({
  offer,
  listingPrice,
  role,
  mine,
  onChanged,
}: {
  offer: Offer
  listingPrice: number
  role: 'buyer' | 'seller'
  mine: boolean
  onChanged: () => void
}) {
  const [busy, setBusy] = useState<string | null>(null)
  const [pinOpen, setPinOpen] = useState(false)
  const [pin, setPin] = useState('')
  const countdown = useCountdown(offer.expiresAt)
  const status = STATUS_STYLE[offer.status]
  const savings = listingPrice - offer.amount

  async function act(name: string, fn: () => Promise<unknown>, success: string) {
    setBusy(name)
    try {
      await fn()
      toast.success(success)
      onChanged()
      return true
    } catch (e) {
      toast.error((e as Error).message)
      return false
    } finally {
      setBusy(null)
    }
  }

  return (
    <div className={cn('w-full max-w-[400px] overflow-hidden rounded-2xl border border-surface bg-white shadow-card', mine ? 'ml-auto' : '')}>
      <div className={cn('h-1.5', offer.status === 'completed' ? 'bg-success' : offer.status === 'pending' || offer.status === 'accepted' ? 'bg-primary' : 'bg-plum/10')} />
      <div className="flex flex-col gap-3 p-4">
        <div className="flex items-start justify-between gap-2">
          <p className="flex items-center gap-2 text-sm font-extrabold tracking-wide uppercase">
            <span className="grid size-8 place-items-center rounded-full bg-surface text-primary">
              <Landmark className="size-4" />
            </span>
            {mine ? 'Escrow offer sent' : 'Escrow offer received'}
          </p>
          {offer.status === 'pending' ? (
            <span className="flex shrink-0 items-center gap-1 rounded-full bg-deal/15 px-2.5 py-1 text-[11px] font-bold text-amber-700">
              <Clock className="size-3.5" /> {countdown}
            </span>
          ) : (
            <span className={cn('shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold', status.cls)}>{status.label}</span>
          )}
        </div>

        <div className="flex items-center justify-between rounded-xl bg-surface p-3">
          <div>
            <p className="text-xs text-muted-foreground">Escrow Reserved Amount</p>
            <p className="text-3xl font-extrabold tracking-tight">{naira(offer.amount)}</p>
            {savings > 0 ? <p className="text-xs font-bold text-success">Save {naira(savings)}</p> : null}
          </div>
          <span className="grid size-11 place-items-center rounded-full bg-white text-primary">
            <ShieldCheck className="size-6" />
          </span>
        </div>

        <ul className="flex flex-col gap-1.5 text-xs font-semibold">
          <li className="flex items-center gap-2 rounded-full bg-surface px-3 py-1.5">
            <Landmark className="size-3.5 text-primary" /> Funds held in escrow until handover
          </li>
          <li className="flex items-center gap-2 rounded-full bg-surface px-3 py-1.5">
            <BadgeCheck className="size-3.5 text-success" /> 48-hour test & return window
          </li>
          <li className="flex items-center gap-2 rounded-full bg-surface px-3 py-1.5">
            <Truck className="size-3.5 text-primary" /> {offer.hub ? offer.hub.name : 'Hub pickup or inspected courier'}
          </li>
        </ul>

        {offer.meetupAt ? (
          <p className="text-xs text-muted-foreground">
            Meet-up: <span className="font-semibold text-plum">{new Date(offer.meetupAt).toLocaleString([], { weekday: 'short', hour: 'numeric', minute: '2-digit' })}</span>
          </p>
        ) : null}

        {offer.note ? (
          <div>
            <p className="mb-1 text-xs font-bold">Buyer testing & handover note</p>
            <p className="rounded-xl bg-surface px-3 py-2 text-sm">“{offer.note}”</p>
          </div>
        ) : null}

        {/* Buyer's PIN, visible only to the buyer once accepted */}
        {offer.status === 'accepted' && role === 'buyer' && offer.verificationPin ? (
          <div className="rounded-xl border-2 border-dashed border-primary/30 bg-primary/5 p-3 text-center">
            <p className="flex items-center justify-center gap-1 text-xs font-bold text-primary">
              <KeyRound className="size-4" /> Your handover PIN
            </p>
            <p className="mt-1 font-mono text-3xl font-extrabold tracking-[0.4em]">{offer.verificationPin}</p>
            <p className="mt-1 text-xs text-muted-foreground">Only share it with the seller after you've tested the item.</p>
          </div>
        ) : null}

        {/* Actions */}
        {offer.status === 'pending' && role === 'seller' ? (
          <div className="flex gap-2">
            <Button className="flex-1" disabled={busy !== null} onClick={() => act('accept', () => offersApi.accept(offer.id), 'Offer accepted — funds locked in escrow')}>
              {busy === 'accept' ? <Loader2 className="animate-spin" /> : <CheckCircle2 />} Accept
            </Button>
            <Button variant="ghost" className="flex-1" disabled={busy !== null} onClick={() => act('decline', () => offersApi.decline(offer.id), 'Offer declined')}>
              {busy === 'decline' ? <Loader2 className="animate-spin" /> : <XCircle />} Decline
            </Button>
          </div>
        ) : null}

        {offer.status === 'accepted' && role === 'seller' ? (
          <Button onClick={() => setPinOpen(true)}>
            <KeyRound /> Confirm handover with PIN
          </Button>
        ) : null}

        {(offer.status === 'pending' || offer.status === 'accepted') && role === 'buyer' ? (
          <div className="flex items-center justify-between gap-2 text-xs">
            <span className="flex items-center gap-1 font-semibold text-success">
              <ShieldCheck className="size-4" /> Payout held until you enter your PIN
            </span>
            <button
              type="button"
              disabled={busy !== null}
              className="shrink-0 font-bold text-destructive hover:underline"
              onClick={() => act('cancel', () => offersApi.cancel(offer.id), 'Offer cancelled — escrow refunded')}
            >
              {busy === 'cancel' ? 'Cancelling…' : 'Cancel Offer'}
            </button>
          </div>
        ) : null}
      </div>

      <Dialog open={pinOpen} onOpenChange={setPinOpen}>
        <DialogContent>
          <form
            className="flex flex-col gap-4"
            onSubmit={async (e) => {
              e.preventDefault()
              const ok = await act('complete', () => offersApi.complete(offer.id, pin), 'Handover verified — escrow released!')
              if (ok) {
                setPinOpen(false)
                setPin('')
              }
            }}
          >
            <DialogHeader>
              <DialogTitle>Confirm handover</DialogTitle>
              <DialogDescription>Ask the buyer for their 4-digit PIN after they've tested the item. Entering it releases {naira(offer.amount)} to you.</DialogDescription>
            </DialogHeader>
            <Input
              autoFocus
              inputMode="numeric"
              maxLength={4}
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
              placeholder="••••"
              className="h-16 text-center font-mono text-3xl tracking-[0.5em] md:text-3xl"
            />
            <DialogFooter>
              <Button type="submit" disabled={pin.length !== 4 || busy !== null}>
                {busy === 'complete' ? <Loader2 className="animate-spin" /> : <CheckCircle2 />} Release escrow
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
