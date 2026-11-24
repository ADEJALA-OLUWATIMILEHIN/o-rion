import { Link } from 'react-router'
import { Landmark, MessageSquare } from 'lucide-react'
import { chatApi } from '@/api/chat'
import { useAsync } from '@/hooks/useAsync'
import { useAuth } from '@/lib/auth'
import { naira, timeAgo } from '@/lib/format'
import { cn } from '@/lib/utils'
import { PageHeader } from '@/components/PageHeader'
import { SafeImage } from '@/components/SafeImage'
import { UserAvatar } from '@/components/UserAvatar'
import { EmptyState } from '@/components/EmptyState'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'

export function InboxPage() {
  const { user } = useAuth()
  const { data, loading, error, reload } = useAsync(() => chatApi.list(), [])

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title="Inbox" back={false} />
      <div className="flex flex-col gap-2 px-4">
        {error ? (
          <EmptyState icon={<MessageSquare />} title="Couldn't load chats" body={error.message} action={<Button onClick={reload}>Retry</Button>} />
        ) : loading && !data ? (
          Array.from({ length: 4 }, (_, i) => <Skeleton key={i} className="h-20" />)
        ) : !data?.length ? (
          <EmptyState
            icon={<MessageSquare />}
            title="No conversations yet"
            body="Message a seller from any listing to start a safe, escrow-backed chat."
            action={
              <Button asChild>
                <Link to="/">Discover deals</Link>
              </Button>
            }
          />
        ) : (
          data.map((c) => {
            const preview = c.lastMessage
              ? c.lastMessage.type === 'offer'
                ? c.lastMessage.body
                : `${c.lastMessage.senderId === user?.id ? 'You: ' : ''}${c.lastMessage.body || 'Photo'}`
              : 'No messages yet'
            return (
              <Link
                key={c.id}
                to={`/inbox/${c.id}`}
                className={cn('flex items-center gap-3 rounded-2xl p-3 transition hover:bg-surface', c.unreadCount && 'bg-surface/60')}
              >
                <div className="relative shrink-0">
                  <SafeImage src={c.listing.images[0]} alt={c.listing.title} className="size-14 rounded-xl" />
                  <UserAvatar name={c.otherUser.name} src={c.otherUser.avatarUrl} className="absolute -right-1.5 -bottom-1.5 size-7 ring-2 ring-white" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <p className={cn('truncate', c.unreadCount ? 'font-extrabold' : 'font-bold')}>{c.otherUser.name}</p>
                    <span className="shrink-0 text-xs text-muted-foreground">{c.lastMessage ? timeAgo(c.lastMessage.createdAt) : ''}</span>
                  </div>
                  <p className="truncate text-xs font-semibold text-primary">
                    {c.role === 'buyer' ? 'Buying' : 'Selling'} · {c.listing.title} · {naira(c.listing.price)}
                  </p>
                  <div className="flex items-center gap-2">
                    <p className={cn('flex min-w-0 flex-1 items-center gap-1 truncate text-sm', c.unreadCount ? 'font-semibold text-plum' : 'text-muted-foreground')}>
                      {c.lastMessage?.type === 'offer' ? <Landmark className="size-3.5 shrink-0 text-primary" /> : null}
                      <span className="truncate">{preview}</span>
                    </p>
                    {c.unreadCount ? <span className="grid h-5 min-w-5 place-items-center rounded-full bg-primary px-1.5 text-[11px] font-bold text-white">{c.unreadCount}</span> : null}
                  </div>
                </div>
              </Link>
            )
          })
        )}
      </div>
    </div>
  )
}
