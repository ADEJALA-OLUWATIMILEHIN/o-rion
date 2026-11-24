import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router'
import { toast } from 'sonner'
import { BadgeCheck, CheckCheck, CircleCheck, HelpCircle, ImagePlus, Loader2, Sparkles, Star, Trash2, TrendingUp, Trophy, WandSparkles, X } from 'lucide-react'
import { listingsApi } from '@/api/listings'
import { hubsApi, uploadsApi } from '@/api/misc'
import type { Assessment, Category, Condition, Hub, ListingChecks } from '@/api/types'
import { CATEGORY_LABEL, CONDITION_HINT, CONDITION_LABEL, naira } from '@/lib/format'
import { cn } from '@/lib/utils'
import { PageHeader } from '@/components/PageHeader'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'

const ANGLES = ['Front Angle', 'Back / Underside', 'Side / Ports', 'Serial / Box']
const GRADE_FOR: Record<Condition, string | null> = { brand_new: null, certified_refurbished: 'A+', pre_owned_excellent: 'A', pre_owned_fair: 'B' }

const DISCLOSURES: { key: keyof ListingChecks; label: string }[] = [
  { key: 'functionalTested', label: 'Screen & functions tested' },
  { key: 'originalBox', label: 'Original box & cables' },
  { key: 'proofOfPurchase', label: 'Proof of purchase / receipt' },
  { key: 'serialVerified', label: 'IMEI / serial matches box' },
]

const digits = (s: string) => s.replace(/\D/g, '')

export function SellPage() {
  const navigate = useNavigate()
  const fileRef = useRef<HTMLInputElement>(null)
  const [images, setImages] = useState<string[]>([])
  const [uploading, setUploading] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState<Category>('audio')
  const [condition, setCondition] = useState<Condition>('certified_refurbished')
  const [checks, setChecks] = useState<ListingChecks>({ functionalTested: true })
  const [battery, setBattery] = useState('')
  const [originalPrice, setOriginalPrice] = useState('')
  const [price, setPrice] = useState('')
  const [negotiable, setNegotiable] = useState(true)
  const [warranty, setWarranty] = useState('0')
  const [location, setLocation] = useState('UNILAG, Akoka')
  const [hubs, setHubs] = useState<Hub[]>([])
  const [hubId, setHubId] = useState<string | null>(null)
  const [assessment, setAssessment] = useState<Assessment | null>(null)
  const [guideOpen, setGuideOpen] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    hubsApi
      .list()
      .then((h) => {
        setHubs(h)
        setHubId((cur) => cur ?? h[0]?.id ?? null)
      })
      .catch(() => {})
  }, [])

  const fullChecks: ListingChecks = { ...checks, batteryHealth: battery ? Math.min(100, Number(battery)) : undefined }

  // Re-grade whenever the disclosures change.
  useEffect(() => {
    const t = setTimeout(() => {
      listingsApi
        .assess({ condition, originalPrice: originalPrice ? Number(originalPrice) : undefined, imageCount: images.length, checks: fullChecks })
        .then(setAssessment)
        .catch(() => {})
    }, 250)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [condition, originalPrice, images.length, JSON.stringify(fullChecks)])

  async function addPhotos(files: FileList | null) {
    if (!files?.length) return
    const room = 8 - images.length
    if (room <= 0) return toast.error('Up to 8 photos')
    setUploading(true)
    try {
      const { urls } = await uploadsApi.images(Array.from(files).slice(0, room))
      setImages((cur) => [...cur, ...urls])
    } catch (e) {
      toast.error((e as Error).message)
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!images.length) return toast.error('Add at least one photo')
    if (!title.trim()) return toast.error('Add a listing title')
    if (!Number(price)) return toast.error('Set your listing price')
    setSaving(true)
    try {
      const listing = await listingsApi.create({
        title: title.trim(),
        description: description.trim(),
        category,
        condition,
        grade: GRADE_FOR[condition],
        price: Number(price),
        originalPrice: originalPrice ? Number(originalPrice) : null,
        negotiable,
        images,
        tags: [
          ...(assessment?.certifiable ? ['30-Pt Inspected'] : []),
          ...(Number(warranty) ? [`${warranty}-Mo Warranty`] : []),
          ...(fullChecks.batteryHealth ? [`Battery ${fullChecks.batteryHealth}%`] : []),
        ],
        checks: fullChecks,
        warrantyMonths: Number(warranty),
        location,
        hubId,
      })
      toast.success('Your item is live!')
      navigate(`/listings/${listing.id}`, { replace: true })
    } catch (err) {
      toast.error((err as Error).message)
    } finally {
      setSaving(false)
    }
  }

  const rec = assessment?.suggestedPrice

  return (
    <form onSubmit={submit} className="mx-auto max-w-3xl">
      <PageHeader title="Recommerce Grading & Sell" />
      <div className="flex flex-col gap-6 px-4 pt-2 pb-40 lg:pb-12">
        {/* Intro */}
        <div className="flex items-start gap-3">
          <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-surface text-primary">
            <BadgeCheck className="size-6" />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-2xl font-bold tracking-tight">Inspection & Grading</h2>
              <Badge variant="success">
                <CircleCheck /> Verified Flow
              </Badge>
            </div>
            <p className="mt-0.5 text-sm text-muted-foreground">List as Certified Pre-Owned to sell faster with buyer confidence.</p>
          </div>
          <Button type="button" variant="secondary" size="sm" onClick={() => setGuideOpen(true)}>
            <Trophy /> Grade Guide
          </Button>
        </div>

        {/* Photos */}
        <section className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-bold">Photos & Angles</h3>
            <span className="rounded-full bg-surface px-2.5 py-0.5 text-xs font-bold">{Math.min(images.length, 4)}/4 uploaded</span>
            <span className="ml-auto flex items-center gap-1 text-xs font-bold text-accent">
              <WandSparkles className="size-4" /> Cover auto-set
            </span>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {images.map((src, i) => (
              <div key={src} className="group relative aspect-[3/4] overflow-hidden rounded-3xl bg-surface shadow-card">
                <img src={src} alt={ANGLES[i] ?? `Photo ${i + 1}`} className="size-full object-cover" />
                {i === 0 ? (
                  <span className="absolute top-2 left-2 flex items-center gap-1 rounded-full bg-success px-2.5 py-1 text-xs font-bold text-white">
                    <Star className="size-3 fill-white" /> Cover
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => setImages((cur) => [src, ...cur.filter((s) => s !== src)])}
                    className="absolute top-2 left-2 rounded-full bg-white/90 px-2.5 py-1 text-xs font-bold opacity-0 transition group-hover:opacity-100 focus:opacity-100"
                  >
                    Make cover
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setImages((cur) => cur.filter((s) => s !== src))}
                  className="absolute top-2 right-2 grid size-8 place-items-center rounded-full bg-white/95 shadow-sm"
                  aria-label="Remove photo"
                >
                  <X className="size-4" />
                </button>
                <span className="absolute inset-x-2 bottom-2 truncate rounded-full bg-white/70 py-1 text-center text-xs font-bold backdrop-blur">
                  {ANGLES[i] ?? `Extra ${i - 3}`}
                </span>
              </div>
            ))}
            {images.length < 8 ? (
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                className="flex aspect-[3/4] flex-col items-center justify-center gap-2 rounded-3xl border-2 border-dashed border-primary/25 bg-surface/60 text-primary transition hover:bg-surface"
              >
                {uploading ? <Loader2 className="size-7 animate-spin" /> : <ImagePlus className="size-7" />}
                <span className="text-sm font-bold">{ANGLES[images.length] ?? 'Add photo'}</span>
                <span className="text-xs text-muted-foreground">Tap to snap or upload</span>
              </button>
            ) : null}
          </div>
          <input ref={fileRef} type="file" accept="image/*" multiple hidden capture="environment" onChange={(e) => addPhotos(e.target.files)} />
        </section>

        {/* Assessment */}
        <section className="flex gap-3 rounded-3xl bg-gradient-to-br from-surface to-surface-strong p-4 shadow-card">
          <span className="grid size-11 shrink-0 place-items-center rounded-full bg-primary text-white">
            <Sparkles className="size-5" />
          </span>
          <div className="flex min-w-0 flex-1 flex-col gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-primary px-2.5 py-0.5 text-[10px] font-bold tracking-wide text-white uppercase">Spec & Disclosure Check</span>
              {assessment ? (
                <span className="flex items-center gap-1 text-sm font-bold text-success">
                  <CircleCheck className="size-4" /> {assessment.legitimacyScore}% Trust Score
                </span>
              ) : null}
            </div>
            <p className="truncate font-bold">{title || 'Your item'}</p>
            {assessment?.notes.length ? (
              <ul className="text-sm text-muted-foreground">
                {assessment.notes.map((n) => (
                  <li key={n}>· {n}</li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">All key disclosures provided.</p>
            )}
            <div
              className={cn(
                'flex items-center justify-center gap-2 rounded-full px-4 py-2.5 text-sm font-bold',
                assessment?.certifiable ? 'bg-primary text-white' : 'bg-white text-muted-foreground',
              )}
            >
              <CheckCheck className="size-4" />
              {assessment?.certifiable ? 'Certified Diagnostic Profile Applied' : 'Reach 80% to list as Certified'}
            </div>
          </div>
        </section>

        {/* Title + category */}
        <section className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="title">Listing Title</Label>
            <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={160} placeholder="e.g. Sony WH-1000XM4 Headphones (Midnight Blue)" />
          </div>
          <div className="flex flex-col gap-2">
            <Label>Category</Label>
            <div className="flex flex-wrap gap-2">
              {(Object.keys(CATEGORY_LABEL) as Category[]).map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCategory(c)}
                  className={cn('rounded-full px-4 py-2 text-sm font-semibold transition', category === c ? 'bg-primary text-white' : 'bg-surface hover:bg-surface-strong')}
                >
                  {CATEGORY_LABEL[c]}
                </button>
              ))}
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="desc">Description</Label>
            <Textarea id="desc" value={description} onChange={(e) => setDescription(e.target.value)} maxLength={4000} placeholder="Battery life, what's included, any flaws…" />
          </div>
        </section>

        {/* Condition */}
        <section className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h3 className="flex items-center gap-2 font-bold">
              <BadgeCheck className="size-5 text-primary" /> Condition Grading Standard
            </h3>
            <button type="button" onClick={() => setGuideOpen(true)} className="flex items-center gap-1 text-sm font-bold text-primary">
              <HelpCircle className="size-4" /> Grading Rubric
            </button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {(Object.keys(CONDITION_LABEL) as Condition[]).map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setCondition(c)}
                aria-pressed={condition === c}
                className={cn(
                  'flex flex-col items-center gap-0.5 rounded-2xl px-3 py-3 text-center transition',
                  condition === c ? 'bg-primary text-white shadow-lift' : 'bg-surface hover:bg-surface-strong',
                )}
              >
                <span className="flex items-center gap-1 font-bold">
                  {condition === c ? <BadgeCheck className="size-4" /> : null}
                  {CONDITION_LABEL[c]}
                </span>
                <span className={cn('text-xs', condition === c ? 'text-white/85' : 'text-muted-foreground')}>{CONDITION_HINT[c]}</span>
              </button>
            ))}
          </div>
        </section>

        {/* Disclosures */}
        <section className="rounded-2xl border border-plum/10 p-4">
          <h3 className="mb-3 text-sm font-bold">Functional Check & Certification Disclosures</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            {DISCLOSURES.map(({ key, label }) => (
              <label key={key} className="flex cursor-pointer items-center gap-3 text-sm">
                <Checkbox checked={Boolean(checks[key])} onCheckedChange={(v) => setChecks((c) => ({ ...c, [key]: v === true }))} />
                {label}
              </label>
            ))}
            <label className="flex items-center gap-3 text-sm sm:col-span-2">
              <span className="shrink-0">Battery health</span>
              <Input value={battery} onChange={(e) => setBattery(digits(e.target.value).slice(0, 3))} inputMode="numeric" placeholder="e.g. 94" className="h-10 w-24" />
              <span className="text-muted-foreground">% (if applicable)</span>
            </label>
          </div>
        </section>

        {/* Pricing */}
        <section className="flex flex-col gap-3 rounded-2xl bg-surface p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="font-bold">Certified Listing Price</h3>
            {rec ? (
              <button type="button" onClick={() => setPrice(String(rec.recommended))} className="flex items-center gap-1 rounded-full bg-success/15 px-3 py-1 text-xs font-bold text-emerald-700">
                <TrendingUp className="size-3.5" /> Recommended Fair Value {naira(rec.recommended)}
              </button>
            ) : null}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-2">
              <Label htmlFor="orig">Original retail (₦)</Label>
              <Input id="orig" inputMode="numeric" value={originalPrice ? Number(originalPrice).toLocaleString('en-NG') : ''} onChange={(e) => setOriginalPrice(digits(e.target.value))} placeholder="180,000" className="bg-white" />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="price">Your price (₦)</Label>
              <Input id="price" inputMode="numeric" value={price ? Number(price).toLocaleString('en-NG') : ''} onChange={(e) => setPrice(digits(e.target.value))} placeholder="98,000" className="bg-white text-lg font-extrabold" />
            </div>
          </div>
          {rec ? <p className="text-xs text-muted-foreground">Similar items in this condition sell for {naira(rec.low)} – {naira(rec.high)}.</p> : <p className="text-xs text-muted-foreground">Add the original retail price for a fair-value suggestion.</p>}
          <label className="flex cursor-pointer items-center gap-3 text-sm font-semibold">
            <Checkbox checked={negotiable} onCheckedChange={(v) => setNegotiable(v === true)} /> Open to escrow offers (negotiable)
          </label>
        </section>

        {/* Handover */}
        <section className="flex flex-col gap-3">
          <h3 className="font-bold">Handover Hub</h3>
          <div className="flex flex-col gap-2">
            {hubs.map((h) => (
              <button
                key={h.id}
                type="button"
                onClick={() => setHubId(h.id)}
                className={cn('rounded-xl border px-3 py-2.5 text-left transition', hubId === h.id ? 'border-primary bg-surface ring-2 ring-primary/20' : 'border-input hover:bg-surface')}
              >
                <p className="text-sm font-bold">{h.name}</p>
                <p className="truncate text-xs text-muted-foreground">{h.description}</p>
              </button>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-2">
              <Label htmlFor="loc">Pickup area</Label>
              <Input id="loc" value={location} onChange={(e) => setLocation(e.target.value)} maxLength={120} />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="warranty">Warranty (months)</Label>
              <Input id="warranty" inputMode="numeric" value={warranty} onChange={(e) => setWarranty(digits(e.target.value).slice(0, 2) || '0')} />
            </div>
          </div>
        </section>

        <div className="fixed inset-x-0 bottom-24 z-30 px-4 lg:static lg:px-0">
          <Button type="submit" size="lg" className="mx-auto flex w-full max-w-md shadow-lift lg:max-w-none" disabled={saving || uploading}>
            {saving ? <Loader2 className="animate-spin" /> : <BadgeCheck />}
            {assessment?.certifiable ? 'List as Certified Pre-Owned' : 'Publish Listing'}
          </Button>
        </div>
      </div>

      <Dialog open={guideOpen} onOpenChange={setGuideOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Grading Rubric</DialogTitle>
            <DialogDescription>Pick the grade that honestly matches your item. Hubs re-check at handover.</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-2">
            {(Object.keys(CONDITION_LABEL) as Condition[]).map((c) => (
              <div key={c} className="rounded-xl bg-surface p-3">
                <p className="font-bold">
                  {CONDITION_LABEL[c]} {GRADE_FOR[c] ? <span className="text-primary">· Grade {GRADE_FOR[c]}</span> : null}
                </p>
                <p className="text-sm text-muted-foreground">{CONDITION_HINT[c]}</p>
              </div>
            ))}
            <p className="flex items-center gap-2 text-xs text-muted-foreground">
              <Trash2 className="size-3.5" /> Misgraded items can be returned within 48 hours at the seller's cost.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </form>
  )
}
