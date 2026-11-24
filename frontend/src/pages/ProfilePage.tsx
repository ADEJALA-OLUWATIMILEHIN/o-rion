import { useState } from 'react'
import { Link } from 'react-router'
import { toast } from 'sonner'
import { BadgeCheck, Camera, Loader2, LogOut, Package, Pencil, Star } from 'lucide-react'
import { authApi } from '@/api/auth'
import { listingsApi } from '@/api/listings'
import { uploadsApi } from '@/api/misc'
import type { ListingStatus } from '@/api/types'
import { useAsync } from '@/hooks/useAsync'
import { useAuth } from '@/lib/auth'
import { cn } from '@/lib/utils'
import { PageHeader } from '@/components/PageHeader'
import { UserAvatar } from '@/components/UserAvatar'
import { ListingCard, ListingCardSkeleton } from '@/components/ListingCard'
import { EmptyState } from '@/components/EmptyState'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'

const TABS: { status: ListingStatus; label: string }[] = [
  { status: 'active', label: 'Active' },
  { status: 'reserved', label: 'In Escrow' },
  { status: 'sold', label: 'Sold' },
]

export function ProfilePage() {
  const { user, logout, setUser } = useAuth()
  const [tab, setTab] = useState<ListingStatus>('active')
  const [editOpen, setEditOpen] = useState(false)
  const listings = useAsync(() => listingsApi.list({ sellerId: user!.id, status: tab, sort: 'newest', limit: 50 }), [tab, user?.id])
  if (!user) return null

  return (
    <div className="lg:px-4">
      <PageHeader title="Profile" back={false} right={<Button variant="ghost" size="icon" onClick={logout} aria-label="Log out"><LogOut className="size-5" /></Button>} />
      <div className="flex flex-col gap-5 px-4">
        <div className="flex items-center gap-4 rounded-3xl bg-gradient-to-br from-surface to-surface-strong p-5">
          <UserAvatar name={user.name} src={user.avatarUrl} className="size-20 ring-4 ring-white" />
          <div className="min-w-0 flex-1">
            <p className="flex items-center gap-1 text-xl font-bold">
              <span className="truncate">{user.name}</span>
              {user.verified ? <BadgeCheck className="size-5 shrink-0 text-primary" /> : null}
            </p>
            <p className="truncate text-sm text-muted-foreground">
              {user.department ? `${user.department} · ` : ''}
              {user.campus}
            </p>
            <div className="mt-2 flex flex-wrap gap-3 text-sm font-semibold">
              <span className="flex items-center gap-1">
                <Star className="size-4 fill-deal text-deal" /> {user.rating.toFixed(1)}
              </span>
              <span>{user.tradesCount} trades</span>
              <span className={user.verified ? 'text-primary' : 'text-muted-foreground'}>{user.verified ? 'Verified student' : 'Unverified'}</span>
            </div>
          </div>
          <Button variant="outline" size="icon" onClick={() => setEditOpen(true)} aria-label="Edit profile">
            <Pencil className="size-4" />
          </Button>
        </div>
        {!user.verified ? (
          <p className="rounded-2xl bg-deal/10 px-4 py-3 text-sm text-amber-800">Sign up with your school email (e.g. @live.unilag.edu.ng) to get the Verified Student badge.</p>
        ) : null}

        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold">My Listings</h2>
          <Button size="sm" asChild>
            <Link to="/sell">+ New listing</Link>
          </Button>
        </div>
        <div className="flex gap-2">
          {TABS.map((t) => (
            <button
              key={t.status}
              type="button"
              onClick={() => setTab(t.status)}
              className={cn('rounded-full px-4 py-2 text-sm font-semibold', tab === t.status ? 'bg-primary text-white' : 'bg-surface')}
            >
              {t.label}
            </button>
          ))}
        </div>
        {listings.loading && !listings.data ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {Array.from({ length: 2 }, (_, i) => (
              <ListingCardSkeleton key={i} />
            ))}
          </div>
        ) : !listings.data?.items.length ? (
          <EmptyState icon={<Package />} title={`No ${TABS.find((t) => t.status === tab)!.label.toLowerCase()} listings`} body="Snap a photo, grade it and you're live in under a minute." />
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {listings.data.items.map((l) => (
              <ListingCard key={l.id} listing={l} />
            ))}
          </div>
        )}
      </div>
      <EditProfileDialog open={editOpen} onOpenChange={setEditOpen} onSaved={setUser} />
    </div>
  )
}

function EditProfileDialog({ open, onOpenChange, onSaved }: { open: boolean; onOpenChange: (o: boolean) => void; onSaved: (u: NonNullable<ReturnType<typeof useAuth>['user']>) => void }) {
  const { user } = useAuth()
  const [name, setName] = useState(user?.name ?? '')
  const [department, setDepartment] = useState(user?.department ?? '')
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl ?? '')
  const [busy, setBusy] = useState(false)

  async function uploadAvatar(files: FileList | null) {
    if (!files?.[0]) return
    setBusy(true)
    try {
      const { urls } = await uploadsApi.images([files[0]])
      setAvatarUrl(urls[0])
    } catch (e) {
      toast.error((e as Error).message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form
          className="flex flex-col gap-4"
          onSubmit={async (e) => {
            e.preventDefault()
            setBusy(true)
            try {
              onSaved(await authApi.updateMe({ name, department, avatarUrl: avatarUrl || undefined }))
              toast.success('Profile updated')
              onOpenChange(false)
            } catch (err) {
              toast.error((err as Error).message)
            } finally {
              setBusy(false)
            }
          }}
        >
          <DialogHeader>
            <DialogTitle>Edit profile</DialogTitle>
            <DialogDescription>This is what buyers and sellers see in chat.</DialogDescription>
          </DialogHeader>
          <label className="flex cursor-pointer items-center gap-3">
            <UserAvatar name={name || 'You'} src={avatarUrl} className="size-16" />
            <span className="flex items-center gap-1 text-sm font-bold text-primary">
              <Camera className="size-4" /> Change photo
            </span>
            <input type="file" accept="image/*" hidden onChange={(e) => uploadAvatar(e.target.files)} />
          </label>
          <div className="flex flex-col gap-2">
            <Label htmlFor="pname">Name</Label>
            <Input id="pname" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="pdept">Department / Year</Label>
            <Input id="pdept" value={department} onChange={(e) => setDepartment(e.target.value)} placeholder="Unilag Eng '25" />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={busy || name.trim().length < 2}>
              {busy ? <Loader2 className="animate-spin" /> : null} Save
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
