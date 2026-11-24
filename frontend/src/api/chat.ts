import { api } from './client'
import type { Conversation, ConversationSummary, Message, Offer } from './types'

export const chatApi = {
  list: () => api<ConversationSummary[]>('/conversations'),
  unread: () => api<{ unread: number }>('/conversations/unread'),
  start: (listingId: string, message?: string) => api<Conversation>('/conversations', { method: 'POST', body: { listingId, message } }),
  get: (id: string) => api<Conversation>(`/conversations/${id}`),
  messages: (id: string, after?: string) => api<Message[]>(`/conversations/${id}/messages`, { query: { after } }),
  send: (id: string, body: string, imageUrl?: string) => api<Message>(`/conversations/${id}/messages`, { method: 'POST', body: { body, imageUrl } }),
}

export const offersApi = {
  create: (conversationId: string, input: { amount: number; note?: string; hubId?: string | null; meetupAt?: string | null }) =>
    api<Offer>(`/conversations/${conversationId}/offers`, { method: 'POST', body: input }),
  get: (id: string) => api<Offer>(`/offers/${id}`),
  accept: (id: string) => api<Offer>(`/offers/${id}/accept`, { method: 'POST' }),
  decline: (id: string) => api<Offer>(`/offers/${id}/decline`, { method: 'POST' }),
  cancel: (id: string) => api<Offer>(`/offers/${id}/cancel`, { method: 'POST' }),
  complete: (id: string, pin: string) => api<Offer>(`/offers/${id}/complete`, { method: 'POST', body: { pin } }),
}
