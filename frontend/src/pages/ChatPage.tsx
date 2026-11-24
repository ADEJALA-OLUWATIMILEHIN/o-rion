import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router'
import { toast } from 'sonner'
import {
  BadgeCheck, Camera, CheckCheck, ClipboardCheck, Clock, Landmark, Loader2, Lock, MessageSquareOff, PlusCircle, ScanLine, SendHorizontal, ShieldCheck, Star, Video,
} from 'lucide-react'
import { chatApi } from '@/api/chat'
import { uploadsApi } from '@/api/misc'
import type { Conversation, Message } from '@/api/types'
import { useAuth } from '@/lib/auth'
import { clockTime, naira } from '@/lib/format'
import { cn } from '@/lib/utils'
import { PageHeader } from '@/components/PageHeader'
import { SafeImage } from '@/components/SafeImage'
import { UserAvatar } from '@/components/UserAvatar'
import { OfferCard } from '@/components/OfferCard'
import { OfferDialog } from '@/components/OfferDialog'
import { EmptyState } from '@/components/EmptyState'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'

const POLL_MS = 4000

const TEST_CHECKLIST = [
  'Power on and check for boot loops',
  'Match IMEI / serial on device and box',
  'Check battery health in settings',
  'Test speakers, mic and noise cancelling',
  'Test all buttons, ports and charging',
  'Inspect screen for dead pixels and burn-in',
  'Confirm accessories listed are present',
  'Sign out of previous owner accounts',
]

export function ChatPage() {
  const { id = '' } = useParams()
  const { user } = useAuth()
  const [params, setParams] = useSearchParams()
  const [convo, setConvo] = useState<Conversation | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [error, setError] = useState<string | null>(null)
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const [offerMode, setOfferMode] = useState<'offer' | 'buy' | null>(null)
  const [checklistOpen, setChecklistOpen] = useState(false)
  const [showGuarantee, setShowGuarantee] = useState(true)
  const bottomRef = useRef<HTMLDivElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const lastCount = useRef(0)

  const refresh = useCallback(async () => {
    const [c, m] = await Promise.all([chatApi.get(id), chatApi.messages(id)])
    setConvo(c)
    setMessages(m)
  }, [id])

  useEffect(() => {
    let alive = true
    refresh().catch((e) => alive && setError((e as Error).message))
    const t = setInterval(() => {
      if (document.visibilityState === 'visible') refresh().catch(() => {})
    }, POLL_MS)
    return () => {
      alive = false
      clearInterval(t)
    }
  }, [refresh])

  // Opening from "Make Offer" / "Buy Now" on a listing.
  useEffect(() => {
    const intent = params.get('intent')
    if (convo && convo.role === 'buyer' && (intent === 'offer' || intent === 'buy')) {
      setOfferMode(intent)
      setParams({}, { replace: true })
    }
  }, [convo, params, setParams])

  useLayoutEffect(() => {
    if (messages.length !== lastCount.current) {
      bottomRef.current?.scrollIntoView({ behavior: lastCount.current ? 'smooth' : 'auto' })
      lastCount.current = messages.length
    }
  }, [messages.length])

  async function send(e?: React.FormEvent, imageUrl?: string) {
    e?.preventDefault()
    const body = text.trim()
    if (!body && !imageUrl) return
    setSending(true)
    try {
      const msg = await chatApi.send(id, body, imageUrl)
      setMessages((m) => [...m, msg])
      setText('')
    } catch (err) {
      toast.error((err as Error).message)
    } finally {
      setSending(false)
    }
  }

  async function uploadPhoto(files: FileList | null) {
    if (!files?.length) return
    setSending(true)
    try {
      const { urls } = await uploadsApi.images([files[0]])
      await send(undefined, urls[0])
    } catch (err) {
      toast.error((err as Error).message)
      setSending(false)
    } finally {
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  if (error) {
    return (
      <div className="px-4">
        <PageHeader title="Chat" />
        <EmptyState icon={<MessageSquareOff />} title="Can't open this chat" body={error} action={<Button asChild><Link to="/inbox">Back to Inbox</Link></Button>} />
      </div>
    )
  }
  if (!convo || !user) return <ChatSkeleton />

  const { listing, otherUser, role } = convo
  const isBuyer = role === 'buyer'
  const canOffer = isBuyer && listing.status === 'active'
  const activeOffer = [...messages].reverse().find((m) => m.offer && (m.offer.status === 'pending' || m.offer.status === 'accepted'))?.offer

  return (
    <div className="mx-auto flex min-h-dvh max-w-3xl flex-col lg:min-h-[calc(100dvh-4rem)]">
      <PageHeader
        title={
          <span className="flex items-center gap-2">
            <UserAvatar name={otherUser.name} src={otherUser.avatarUrl} className="size-9" />
            <span className="min-w-0">
              <span className="flex items-center gap-1 truncate text-base leading-tight">
                {otherUser.name} {otherUser.verified ? <BadgeCheck className="size-4 shrink-0 text-primary" /> : null}
              </span>
              <span className="block truncate text-xs font-medium text-muted-foreground">
                {otherUser.department ?? otherUser.campus} · {otherUser.responseTime}
              </span>
            </span>
          </span>
        }
        className="border-b border-plum/5"
      />

      {/* Listing summary */}
      <div className="px-4 pt-3">
        <div className="flex gap-3 rounded-2xl bg-surface p-3">
          <Link to={`/listings/${listing.id}`} className="relative size-20 shrink-0 overflow-hidden rounded-xl">
            <SafeImage src={listing.images[0]} alt={listing.title} className="size-full" />
            {listing.seller ? null : null}
          </Link>
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <div className="flex flex-wrap gap-1">
              {listing.grade ? <Badge variant="secondary">Grade {listing.grade}</Badge> : null}
              {listing.warrantyMonths ? <Badge variant="success">{listing.warrantyMonths}-Mo Warranty</Badge> : null}
              <Badge variant="outline">
                <Lock /> Escrow
              </Badge>
            </div>
            <Link to={`/listings/${listing.id}`} className="truncate font-bold hover:underline">
              {listing.title}
            </Link>
            <p className="flex items-baseline gap-2">
              <span className="text-xl font-extrabold">{naira(listing.price)}</span>
              <span className="text-xs text-muted-foreground">{listing.status === 'active' ? (listing.negotiable ? 'Negotiable' : 'Fixed') : listing.status}</span>
            </p>
          </div>
          {canOffer && !activeOffer ? (
            <div className="hidden flex-col gap-1.5 sm:flex">
              {listing.negotiable ? (
                <Button size="sm" variant="outline" onClick={() => setOfferMode('offer')}>
                  Offer
                </Button>
              ) : null}
              <Button size="sm" onClick={() => setOfferMode('buy')}>
                Buy Now
              </Button>
            </div>
          ) : null}
        </div>
        <p className="mt-2 flex items-center justify-between px-1 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Star className="size-3.5 fill-deal text-deal" /> {otherUser.rating.toFixed(1)} · {otherUser.tradesCount} trades
          </span>
          <span className="flex items-center gap-1 font-semibold text-primary">
            <Clock className="size-3.5" /> {otherUser.responseTime}
          </span>
        </p>
      </div>

      {/* Thread */}
      <div className="flex flex-1 flex-col gap-3 px-4 py-4">
        {showGuarantee ? (
          <div className="rounded-2xl border border-primary/10 bg-gradient-to-br from-surface to-white p-4">
            <div className="flex items-start gap-3">
              <span className="grid size-10 shrink-0 place-items-center rounded-full bg-primary/10 text-primary">
                <ShieldCheck className="size-5" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-bold leading-tight">Recommerce Escrow & 48hr Test Guarantee</p>
                  <button type="button" onClick={() => setShowGuarantee(false)} className="shrink-0 text-xs font-semibold text-muted-foreground hover:text-plum">
                    Hide
                  </button>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  Funds are <b className="text-plum">only released</b> after you physically test the item at the verified hub and share your PIN.
                </p>
              </div>
            </div>
            <div className="mt-3 flex flex-wrap gap-1.5 text-xs font-semibold">
              <span className="flex items-center gap-1 rounded-full bg-white px-2.5 py-1 text-primary shadow-card">
                <ScanLine className="size-3.5" /> IMEI/Serial Verified
              </span>
              <span className="flex items-center gap-1 rounded-full bg-white px-2.5 py-1 text-primary shadow-card">
                <Clock className="size-3.5" /> 48-Hour Return Window
              </span>
              <span className="flex items-center gap-1 rounded-full bg-white px-2.5 py-1 text-primary shadow-card">
                <Video className="size-3.5" /> CCTV Safe Hub
              </span>
            </div>
          </div>
        ) : null}

        {messages.map((m, i) => {
          const prev = messages[i - 1]
          const mine = m.senderId === user.id
          if (m.type === 'system') {
            return (
              <div key={m.id} className="my-1 flex justify-center">
                <span className="max-w-[90%] rounded-full bg-surface px-3 py-1.5 text-center text-xs font-semibold text-plum/80">
                  {m.body} · {clockTime(m.createdAt)}
                </span>
              </div>
            )
          }
          if (m.type === 'offer' && m.offer) {
            return (
              <OfferCard key={m.id} offer={m.offer} listingPrice={listing.price} role={role} mine={mine} onChanged={() => refresh().catch(() => {})} />
            )
          }
          const grouped = prev && prev.senderId === m.senderId && prev.type === 'text'
          return (
            <div key={m.id} className={cn('flex items-end gap-2', mine ? 'justify-end' : 'justify-start', grouped && '-mt-2')}>
              {!mine ? (
                <span className={cn('size-8 shrink-0', grouped && 'invisible')}>
                  <UserAvatar name={otherUser.name} src={otherUser.avatarUrl} className="size-8" />
                </span>
              ) : null}
              <div className={cn('flex max-w-[78%] flex-col gap-1', mine ? 'items-end' : 'items-start')}>
                <div
                  className={cn(
                    'overflow-hidden rounded-2xl text-[15px] leading-relaxed',
                    mine ? 'rounded-br-[4px] bg-primary text-white' : 'rounded-bl-[4px] bg-surface text-plum',
                    m.body ? 'px-4 py-2.5' : '',
                  )}
                >
                  {m.imageUrl ? (
                    <a href={m.imageUrl} target="_blank" rel="noreferrer" className={cn('block', m.body && '-mx-4 -mt-2.5 mb-2')}>
                      <SafeImage src={m.imageUrl} alt="Photo" className="max-h-64 w-full" />
                    </a>
                  ) : null}
                  {m.body}
                </div>
                <span className="flex items-center gap-1 px-1 text-[11px] text-muted-foreground">
                  {clockTime(m.createdAt)}
                  {mine ? <CheckCheck className={cn('size-3.5', m.readAt ? 'text-primary' : '')} /> : null}
                </span>
              </div>
            </div>
          )
        })}

        {/* Safe hub card */}
        {listing.hub ? (
          <div className="mt-2 rounded-2xl bg-surface p-4">
            <div className="flex items-start justify-between gap-2">
              <p className="flex items-center gap-2 text-lg font-bold leading-tight">
                <BadgeCheck className="size-6 shrink-0 text-primary" /> O-Rion Certified Safe Exchange Hub
              </p>
              <Badge variant="success" className="shrink-0">
                CCTV & Power
              </Badge>
            </div>
            <div className="mt-3 flex items-center gap-3 rounded-xl bg-white p-3">
              <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-surface text-primary">
                <ShieldCheck className="size-5" />
              </span>
              <div className="min-w-0">
                <p className="truncate font-bold">{listing.hub.name}</p>
                <p className="truncate text-xs text-muted-foreground">{listing.hub.description}</p>
              </div>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <button type="button" onClick={() => setChecklistOpen(true)} className="flex items-center gap-1.5 rounded-full bg-white px-3 py-2 text-xs font-bold text-primary">
                <ClipboardCheck className="size-4" /> Test Checklist ({TEST_CHECKLIST.length} items)
              </button>
            </div>
            {canOffer && !activeOffer ? (
              <Button className="mt-3 w-full" onClick={() => setOfferMode(listing.negotiable ? 'offer' : 'buy')}>
                <Lock /> Lock Escrow & Time
              </Button>
            ) : null}
          </div>
        ) : null}
        <div ref={bottomRef} />
      </div>

      {/* Composer */}
      <div className="sticky bottom-0 z-30 border-t border-plum/5 bg-white/95 px-3 pt-2 pb-28 backdrop-blur lg:pb-4">
        <div className="no-scrollbar mb-2 flex gap-2 overflow-x-auto">
          {canOffer ? (
            <button type="button" onClick={() => setOfferMode(listing.negotiable ? 'offer' : 'buy')} className="flex shrink-0 items-center gap-1.5 rounded-full bg-surface px-3 py-2 text-xs font-bold">
              <Landmark className="size-4 text-primary" /> Make Escrow Offer
            </button>
          ) : null}
          <button type="button" onClick={() => setChecklistOpen(true)} className="flex shrink-0 items-center gap-1.5 rounded-full bg-surface px-3 py-2 text-xs font-bold">
            <ClipboardCheck className="size-4 text-primary" /> Test Checklist
          </button>
          {['Is this still available?', 'Can we meet at the hub today?', 'Any scratches or dents?'].map((q) => (
            <button key={q} type="button" onClick={() => setText(q)} className="shrink-0 rounded-full border border-primary/15 px-3 py-2 text-xs font-semibold">
              {q}
            </button>
          ))}
        </div>
        <form onSubmit={send} className="flex items-center gap-2">
          <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => uploadPhoto(e.target.files)} />
          <button type="button" onClick={() => fileRef.current?.click()} className="grid size-10 shrink-0 place-items-center rounded-full text-primary hover:bg-surface" aria-label="Attach photo">
            <PlusCircle className="size-6" />
          </button>
          <button type="button" onClick={() => fileRef.current?.click()} className="hidden size-10 shrink-0 place-items-center rounded-full hover:bg-surface sm:grid" aria-label="Send photo">
            <Camera className="size-6" />
          </button>
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            maxLength={2000}
            placeholder="Type a safe, private message…"
            className="h-12 min-w-0 flex-1 rounded-full bg-surface px-4 text-[15px] outline-none focus:ring-2 focus:ring-primary/25"
          />
          <Button type="submit" size="icon" className="size-12 shrink-0" disabled={sending || !text.trim()} aria-label="Send">
            {sending ? <Loader2 className="animate-spin" /> : <SendHorizontal className="size-5" />}
          </Button>
        </form>
      </div>

      {offerMode ? (
        <OfferDialog
          open
          onOpenChange={(o) => !o && setOfferMode(null)}
          conversationId={id}
          listing={listing}
          mode={offerMode}
          onCreated={() => refresh().catch(() => {})}
        />
      ) : null}

      <Dialog open={checklistOpen} onOpenChange={setChecklistOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Hub Test Checklist</DialogTitle>
            <DialogDescription>Run through these before sharing your handover PIN.</DialogDescription>
          </DialogHeader>
          <ol className="flex flex-col gap-2">
            {TEST_CHECKLIST.map((item, i) => (
              <li key={item} className="flex items-center gap-3 rounded-xl bg-surface px-3 py-2.5 text-sm">
                <span className="grid size-6 shrink-0 place-items-center rounded-full bg-white text-xs font-bold text-primary">{i + 1}</span>
                {item}
              </li>
            ))}
          </ol>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function ChatSkeleton() {
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-4 p-4 pt-20">
      <Skeleton className="h-24 w-full" />
      <Skeleton className="ml-auto h-16 w-2/3" />
      <Skeleton className="h-20 w-3/4" />
      <Skeleton className="ml-auto h-56 w-4/5" />
    </div>
  )
}
