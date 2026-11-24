import { api } from './client'
import type { Hub } from './types'

export const hubsApi = {
  list: () => api<Hub[]>('/hubs'),
}

export const uploadsApi = {
  images: (files: File[]) => {
    const form = new FormData()
    files.forEach((f) => form.append('images', f))
    return api<{ urls: string[] }>('/uploads', { method: 'POST', body: form })
  },
}
