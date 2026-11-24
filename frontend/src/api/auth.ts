import { api } from './client'
import type { User } from './types'

type AuthResponse = { token: string; user: User }

export const authApi = {
  login: (email: string, password: string) => api<AuthResponse>('/auth/login', { method: 'POST', body: { email, password } }),
  register: (input: { name: string; email: string; password: string; department?: string }) =>
    api<AuthResponse>('/auth/register', { method: 'POST', body: input }),
  me: () => api<User>('/auth/me'),
  updateMe: (patch: Partial<Pick<User, 'name' | 'department' | 'campus' | 'avatarUrl'>>) => api<User>('/auth/me', { method: 'PATCH', body: patch }),
}
