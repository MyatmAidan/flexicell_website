import { apiDelete, apiGet, apiPost } from '@/api/client'
import type { ListParams } from '@/types/list'

export interface Role {
  id: number | string
  name: string
  code: string | null
  guard_name: string
  users_count?: number
  permissions?: { id: number; name: string; label: string }[]
  grouped_permissions?: unknown[]
  created_at: string
  updated_at: string
}

const BASE = '/roles'

export const rolesApi = {
  list: (params?: ListParams) => apiGet<Role[]>(BASE, params),
  get: (id: number | string) => apiGet<Role>(`${BASE}/${id}`),
  create: (data: Record<string, unknown>) => apiPost<Role>(BASE, data),
  update: (id: number | string, data: Record<string, unknown>) => apiPost<Role>(`${BASE}/${id}`, data),
  delete: (id: number | string) => apiDelete(`${BASE}/${id}`),
}
