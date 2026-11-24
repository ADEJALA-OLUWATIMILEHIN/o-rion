import { useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router'
import { toast } from 'sonner'
import { Loader2, ShieldCheck } from 'lucide-react'
import { useAuth } from '@/lib/auth'
import { Logo } from '@/components/Logo'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

function AuthLayout({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <div className="grid min-h-dvh lg:grid-cols-2">
      <div className="hidden flex-col justify-between bg-gradient-to-br from-primary to-accent p-12 text-white lg:flex">
        <Logo className="text-white [&>span:first-child]:bg-white [&>span:first-child>span]:border-primary" />
        <div>
          <p className="text-4xl leading-tight font-extrabold tracking-tight">Buy and sell on campus — with your money safe in escrow.</p>
          <p className="mt-4 flex items-center gap-2 text-white/85">
            <ShieldCheck className="size-5" /> Funds release only after you test the item at a certified hub.
          </p>
        </div>
        <p className="text-sm text-white/70">Lagos · UNILAG · Ikeja · Computer Village</p>
      </div>
      <div className="flex flex-col justify-center px-5 py-10">
        <div className="mx-auto w-full max-w-sm">
          <Logo className="mb-8 lg:hidden" />
          <h1 className="text-3xl font-extrabold tracking-tight">{title}</h1>
          <p className="mt-1 mb-6 text-muted-foreground">{subtitle}</p>
          {children}
        </div>
      </div>
    </div>
  )
}

export function LoginPage() {
  const { user, login } = useAuth()
  const navigate = useNavigate()
  const from = (useLocation().state as { from?: string } | null)?.from ?? '/'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  if (user) return <Navigate to={from} replace />

  return (
    <AuthLayout title="Welcome back" subtitle="Log in to chat, make escrow offers and sell.">
      <form
        className="flex flex-col gap-4"
        onSubmit={async (e) => {
          e.preventDefault()
          setBusy(true)
          try {
            await login(email, password)
            navigate(from, { replace: true })
          } catch (err) {
            toast.error((err as Error).message)
          } finally {
            setBusy(false)
          }
        }}
      >
        <div className="flex flex-col gap-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@live.unilag.edu.ng" />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="password">Password</Label>
          <Input id="password" type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>
        <Button type="submit" size="lg" disabled={busy}>
          {busy ? <Loader2 className="animate-spin" /> : null} Log in
        </Button>
        <p className="text-center text-sm text-muted-foreground">
          New to O-Rion?{' '}
          <Link to="/register" state={{ from }} className="font-bold text-primary">
            Create an account
          </Link>
        </p>
      </form>
    </AuthLayout>
  )
}

export function RegisterPage() {
  const { user, register } = useAuth()
  const navigate = useNavigate()
  const from = (useLocation().state as { from?: string } | null)?.from ?? '/'
  const [form, setForm] = useState({ name: '', email: '', password: '', department: '' })
  const [busy, setBusy] = useState(false)
  if (user) return <Navigate to={from} replace />
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, [k]: e.target.value })

  return (
    <AuthLayout title="Join O-Rion" subtitle="Use your school email to get the Verified Student badge.">
      <form
        className="flex flex-col gap-4"
        onSubmit={async (e) => {
          e.preventDefault()
          setBusy(true)
          try {
            await register({ ...form, department: form.department || undefined })
            navigate(from, { replace: true })
          } catch (err) {
            toast.error((err as Error).message)
          } finally {
            setBusy(false)
          }
        }}
      >
        <div className="flex flex-col gap-2">
          <Label htmlFor="name">Full name</Label>
          <Input id="name" required minLength={2} autoComplete="name" value={form.name} onChange={set('name')} />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="remail">Email</Label>
          <Input id="remail" type="email" required autoComplete="email" value={form.email} onChange={set('email')} placeholder="you@live.unilag.edu.ng" />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="dept">Department / Year (optional)</Label>
          <Input id="dept" value={form.department} onChange={set('department')} placeholder="Unilag Eng '26" />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="rpassword">Password</Label>
          <Input id="rpassword" type="password" required minLength={8} autoComplete="new-password" value={form.password} onChange={set('password')} placeholder="At least 8 characters" />
        </div>
        <Button type="submit" size="lg" disabled={busy}>
          {busy ? <Loader2 className="animate-spin" /> : null} Create account
        </Button>
        <p className="text-center text-sm text-muted-foreground">
          Already have an account?{' '}
          <Link to="/login" state={{ from }} className="font-bold text-primary">
            Log in
          </Link>
        </p>
      </form>
    </AuthLayout>
  )
}
