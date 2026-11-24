import type { Condition, Category } from '@/api/types'

export const naira = (n: number) => `₦${Math.round(n).toLocaleString('en-NG')}`

export const discountPct = (price: number, original?: number | null) =>
  original && original > price ? Math.round(((original - price) / original) * 100) : 0

export const CONDITION_LABEL: Record<Condition, string> = {
  brand_new: 'Brand New',
  certified_refurbished: 'Certified Refurbished',
  pre_owned_excellent: 'Pre-Owned Excellent',
  pre_owned_fair: 'Pre-Owned Fair',
}

export const CONDITION_HINT: Record<Condition, string> = {
  brand_new: 'Factory box & wraps',
  certified_refurbished: 'Grade A+ · Peak condition',
  pre_owned_excellent: 'Light use · 0 dents',
  pre_owned_fair: 'Functional · Signs of wear',
}

export const CATEGORY_LABEL: Record<Category, string> = {
  phones: 'Phones',
  laptops: 'Laptops',
  audio: 'Audio',
  tablets: 'Tablets',
  cameras: 'Cameras',
  books: 'Books',
  fashion: 'Fashion',
  home: 'Home & Hostel',
  other: 'Other',
}

export function timeAgo(iso: string) {
  const s = Math.max(1, Math.round((Date.now() - new Date(iso).getTime()) / 1000))
  if (s < 60) return 'now'
  const m = Math.round(s / 60)
  if (m < 60) return `${m}m`
  const h = Math.round(m / 60)
  if (h < 24) return `${h}h`
  return `${Math.round(h / 24)}d`
}

export const clockTime = (iso: string) => new Date(iso).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })

export const initials = (name: string) =>
  name
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('')
