import { Link } from 'react-router'
import { HandCoins, KeyRound, Landmark, MapPin, MessageSquare, ShieldCheck } from 'lucide-react'
import { PageHeader } from '@/components/PageHeader'
import { Button } from '@/components/ui/button'

const STEPS = [
  { icon: MessageSquare, title: 'Chat & agree', body: 'Ask questions in a private chat, then send a formal escrow offer from the thread.' },
  { icon: Landmark, title: 'Funds locked', body: 'When the seller accepts, your payment is locked in escrow and the item is reserved for you.' },
  { icon: MapPin, title: 'Meet at a safe hub', body: 'Test the item at a certified CCTV hub using the built-in checklist.' },
  { icon: KeyRound, title: 'Share your PIN', body: 'Happy? Give the seller your 4-digit handover PIN. Not happy? Cancel and get refunded.' },
  { icon: HandCoins, title: 'Seller gets paid', body: 'The seller enters your PIN, escrow releases, and the trade is complete.' },
]

export function EscrowPage() {
  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title="How escrow works" />
      <div className="flex flex-col gap-4 px-4">
        <div className="rounded-3xl bg-gradient-to-br from-primary to-accent p-6 text-white">
          <ShieldCheck className="size-10" />
          <h2 className="mt-3 text-2xl font-extrabold tracking-tight">Your money never moves until you say so.</h2>
        </div>
        <ol className="flex flex-col gap-3">
          {STEPS.map(({ icon: Icon, title, body }, i) => (
            <li key={title} className="flex gap-4 rounded-2xl bg-surface p-4">
              <span className="grid size-11 shrink-0 place-items-center rounded-full bg-white text-primary shadow-card">
                <Icon className="size-5" />
              </span>
              <div>
                <p className="font-bold">
                  {i + 1}. {title}
                </p>
                <p className="text-sm text-muted-foreground">{body}</p>
              </div>
            </li>
          ))}
        </ol>
        <Button size="lg" asChild>
          <Link to="/">Start browsing</Link>
        </Button>
      </div>
    </div>
  )
}

export function NotFoundPage() {
  return (
    <div className="flex flex-col items-center gap-4 px-4 py-24 text-center">
      <p className="text-6xl font-extrabold text-primary">404</p>
      <p className="text-lg font-bold">This page wandered off campus.</p>
      <Button asChild>
        <Link to="/">Back to Discover</Link>
      </Button>
    </div>
  )
}
