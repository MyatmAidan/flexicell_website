import { apiDelete, apiGet, apiPost } from '@/api/client'
import type { User } from '@/types/auth'
import type { ListParams } from '@/types/list'

const BASE = '/users'

export const usersApi = {
  list: (params?: ListParams) => apiGet<User[]>(BASE, params),
  get: (id: number) => apiGet<User>(`${BASE}/${id}`),
  create: (data: Record<string, unknown>) => apiPost<User>(BASE, data),
  update: (id: number, data: Record<string, unknown>) => apiPost<User>(`${BASE}/${id}`, data),
  delete: (id: number) => apiDelete(`${BASE}/${id}`),
  getPermissions: (id: number) => apiGet(`${BASE}/${id}/permissions`),
  updatePermissions: (id: number, permissions: Record<number, string>) =>
    apiPost(`${BASE}/${id}/permissions`, { permissions }),
}
