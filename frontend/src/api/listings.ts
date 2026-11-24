import { api } from './client'
import type { Assessment, Category, Condition, Listing, ListingChecks, ListingStatus, Paginated } from './types'

export type ListingQuery = {
  q?: string
  category?: Category
  condition?: Condition
  inspected?: boolean
  sellerId?: string
  status?: ListingStatus
  sort?: 'best_match' | 'newest' | 'price_asc' | 'price_desc'
  page?: number
  limit?: number
}

export type ListingInput = {
  title: string
  description?: string
  category: Category
  condition: Condition
  grade?: string | null
  price: number
  originalPrice?: number | null
  negotiable?: boolean
  images?: string[]
  tags?: string[]
  checks?: ListingChecks
  warrantyMonths?: number
  location?: string
  hubId?: string | null
}

export const listingsApi = {
  list: (query: ListingQuery = {}) => api<Paginated<Listing>>('/listings', { query }),
  get: (id: string) => api<Listing>(`/listings/${id}`),
  create: (input: ListingInput) => api<Listing>('/listings', { method: 'POST', body: input }),
  update: (id: string, patch: Partial<ListingInput> & { status?: ListingStatus }) => api<Listing>(`/listings/${id}`, { method: 'PATCH', body: patch }),
  remove: (id: string) => api<void>(`/listings/${id}`, { method: 'DELETE' }),
  toggleFavorite: (id: string) => api<{ isFavorite: boolean }>(`/listings/${id}/favorite`, { method: 'POST' }),
  favorites: () => api<Listing[]>('/favorites'),
  assess: (input: { condition: Condition; originalPrice?: number; imageCount?: number; checks?: ListingChecks }) =>
    api<Assessment>('/listings/assess', { method: 'POST', body: input }),
}
