import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Landmark, Loader2, Lock } from 'lucide-react'
import { offersApi } from '@/api/chat'
import { hubsApi } from '@/api/misc'
import type { Hub, Listing } from '@/api/types'
import { naira } from '@/lib/format'
import { cn } from '@/lib/utils'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Textarea } from './ui/textarea'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog'

export function OfferDialog({
  open,
  onOpenChange,
  conversationId,
  listing,
  mode,
  onCreated,
}: {
  open: boolean
  onOpenChange: (o: boolean) => void
  conversationId: string
  listing: Listing
  mode: 'offer' | 'buy'
  onCreated: () => void
}) {
  const [hubs, setHubs] = useState<Hub[]>([])
  // Mounted fresh each time it opens, so initial state comes straight from props.
  const [amount, setAmount] = useState(() =>
    String(mode === 'buy' || !listing.negotiable ? listing.price : Math.round((listing.price * 0.92) / 500) * 500),
  )
  const [note, setNote] = useState('')
  const [hubId, setHubId] = useState<string | null>(listing.hubId)
  const [meetupAt, setMeetupAt] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    hubsApi.list().then(setHubs).catch(() => {})
  }, [])

  const value = Number(amount || 0)
  const saving_ = listing.price - value
  const fixed = mode === 'buy' || !listing.negotiable

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      await offersApi.create(conversationId, {
        amount: value,
        note: note.trim() || undefined,
        hubId,
        meetupAt: meetupAt ? new Date(meetupAt).toISOString() : null,
      })
      toast.success(fixed ? 'Buy request sent to seller' : 'Escrow offer sent')
      setNote('')
      onOpenChange(false)
      onCreated()
    } catch (err) {
      toast.error((err as Error).message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form onSubmit={submit} className="flex flex-col gap-4">
          <DialogHeader>
            <DialogTitle>{fixed ? 'Buy with Escrow' : 'Make an Escrow Offer'}</DialogTitle>
            <DialogDescription>Funds stay locked until you test the item at the hub and share your handover PIN.</DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-2">
            <Label htmlFor="amount">{fixed ? 'Price' : 'Your offer'}</Label>
            <div className="relative">
              <span className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-xl font-extrabold">₦</span>
              <Input
                id="amount"
                inputMode="numeric"
                readOnly={fixed}
                value={value ? value.toLocaleString('en-NG') : ''}
                onChange={(e) => setAmount(e.target.value.replace(/\D/g, ''))}
                className="h-16 pl-10 text-2xl font-extrabold md:text-2xl"
              />
            </div>
            <p className="flex justify-between text-xs text-muted-foreground">
              <span>Asking {naira(listing.price)}</span>
              {saving_ > 0 ? <span className="font-bold text-success">You save {naira(saving_)}</span> : null}
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <Label>Safe exchange hub</Label>
            <div className="flex flex-col gap-2">
              {hubs.map((h) => (
                <button
                  type="button"
                  key={h.id}
                  onClick={() => setHubId(h.id)}
                  className={cn('rounded-xl border px-3 py-2.5 text-left transition', hubId === h.id ? 'border-primary bg-surface ring-2 ring-primary/20' : 'border-input hover:bg-surface')}
                >
                  <p className="text-sm font-bold">{h.name}</p>
                  <p className="truncate text-xs text-muted-foreground">{h.area} · {h.features.join(' · ')}</p>
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="meetup">Meet-up time (optional)</Label>
              <Input id="meetup" type="datetime-local" value={meetupAt} onChange={(e) => setMeetupAt(e.target.value)} />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="note">Testing & handover note</Label>
            <Textarea id="note" value={note} onChange={(e) => setNote(e.target.value)} maxLength={500} placeholder="e.g. Can test ANC and pick up today at 4:30pm at the hub." />
          </div>

          <div className="flex items-center gap-2 rounded-xl bg-surface p-3 text-xs font-semibold text-plum/80">
            <Landmark className="size-4 shrink-0 text-primary" /> Escrow is simulated in this build. Wire a payment provider in the backend offer service to hold real funds.
          </div>

          <DialogFooter>
            <Button type="submit" disabled={saving || value <= 0} className="w-full sm:w-auto">
              {saving ? <Loader2 className="animate-spin" /> : <Lock />} Lock {value ? naira(value) : ''} in Escrow
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
