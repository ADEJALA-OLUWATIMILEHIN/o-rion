import { useEffect, useState } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router'
import { Bell, CameraIcon, Compass, Heart, MessageSquare, User as UserIcon } from 'lucide-react'
import { chatApi } from '@/api/chat'
import { useAuth } from '@/lib/auth'
import { cn } from '@/lib/utils'
import { Logo } from './Logo'
import { UserAvatar } from './UserAvatar'
import { Button } from './ui/button'

const NAV = [
  { to: '/', label: 'Discover', icon: Compass, end: true },
  { to: '/saved', label: 'Saved', icon: Heart },
  { to: '/inbox', label: 'Inbox', icon: MessageSquare },
  { to: '/profile', label: 'Profile', icon: UserIcon },
] as const

function useUnread() {
  const { user } = useAuth()
  const { pathname } = useLocation()
  const [unread, setUnread] = useState(0)
  useEffect(() => {
    if (!user) return
    let alive = true
    const tick = () =>
      chatApi
        .unread()
        .then((r) => alive && setUnread(r.unread))
        .catch(() => {})
    tick()
    const t = setInterval(tick, 15000)
    return () => {
      alive = false
      clearInterval(t)
    }
  }, [user, pathname])
  return user ? unread : 0
}

function NavCount({ n }: { n: number }) {
  if (!n) return null
  return (
    <span className="absolute -top-1.5 -right-2 grid h-4 min-w-4 place-items-center rounded-full bg-primary px-1 text-[10px] font-bold text-white ring-2 ring-white">
      {n > 9 ? '9+' : n}
    </span>
  )
}

/** Mobile: floating frosted dock with a raised Sell button. Desktop: sticky top bar. */
export function AppShell() {
  const { user } = useAuth()
  const unread = useUnread()

  return (
    <div className="min-h-dvh bg-background">
      {/* Desktop top nav */}
      <header className="sticky top-0 z-40 hidden border-b border-plum/5 bg-white/90 backdrop-blur-md lg:block">
        <div className="mx-auto flex h-16 max-w-[1280px] items-center gap-8 px-8">
          <Logo />
          <nav className="flex items-center gap-1">
            {NAV.map(({ to, label, icon: Icon, ...rest }) => (
              <NavLink
                key={to}
                to={to}
                end={'end' in rest}
                className={({ isActive }) =>
                  cn('relative flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition', isActive ? 'bg-surface text-primary' : 'text-muted-foreground hover:text-plum')
                }
              >
                <span className="relative">
                  <Icon className="size-[18px]" />
                  {to === '/inbox' ? <NavCount n={unread} /> : null}
                </span>
                {label}
              </NavLink>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-3">
            <Button asChild>
              <Link to="/sell">
                <CameraIcon /> Sell an item
              </Link>
            </Button>
            {user ? (
              <Link to="/profile" aria-label="Profile">
                <UserAvatar name={user.name} src={user.avatarUrl} />
              </Link>
            ) : (
              <Button variant="secondary" asChild>
                <Link to="/login">Log in</Link>
              </Button>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1280px] pb-32 lg:pb-16">
        <Outlet />
      </main>

      {/* Mobile floating dock */}
      <nav className="fixed inset-x-4 bottom-4 z-40 pb-safe lg:hidden" aria-label="Primary">
        <div className="relative mx-auto flex h-16 max-w-md items-center justify-around rounded-full border border-plum/5 bg-white/90 px-2 shadow-dock backdrop-blur-lg">
          {NAV.slice(0, 2).map((item) => (
            <DockLink key={item.to} {...item} />
          ))}
          <div className="w-16" />
          <DockLink {...NAV[2]} badge={unread} />
          <DockLink {...NAV[3]} />
          <Link
            to="/sell"
            className="absolute -top-6 left-1/2 flex size-[68px] -translate-x-1/2 flex-col items-center justify-center rounded-full bg-primary text-white shadow-lift ring-4 ring-white transition active:scale-95"
          >
            <CameraIcon className="size-6" />
            <span className="text-[9px] font-bold tracking-wide">+ SELL</span>
          </Link>
        </div>
      </nav>
    </div>
  )
}

function DockLink({ to, label, icon: Icon, badge, ...rest }: { to: string; label: string; icon: typeof Bell; badge?: number; end?: boolean }) {
  return (
    <NavLink
      to={to}
      end={'end' in rest}
      className={({ isActive }) => cn('flex w-14 flex-col items-center gap-0.5 text-[11px] font-semibold', isActive ? 'text-primary' : 'text-plum/70')}
    >
      {({ isActive }) => (
        <>
          <span className="relative">
            <Icon className={cn('size-[22px]', isActive && 'stroke-[2.5]')} />
            {badge ? <NavCount n={badge} /> : null}
          </span>
          {label}
        </>
      )}
    </NavLink>
  )
}
