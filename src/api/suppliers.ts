import { apiDelete, apiGet, apiPost } from '@/api/client'
import type { ListParams } from '@/types/list'

export interface Supplier {
  id: number
  company_name: string
  phone: string | null
  address: string | null
  debt_total: number
  purchases_count?: number
  created_at: string
  updated_at: string
}

const BASE = '/suppliers'

export const suppliersApi = {
  list: (params?: ListParams) => apiGet<Supplier[]>(BASE, params),
  get: (id: number) => apiGet<Supplier>(`${BASE}/${id}`),
  create: (data: Record<string, unknown>) => apiPost<Supplier>(BASE, data),
  update: (id: number, data: Record<string, unknown>) => apiPost<Supplier>(`${BASE}/${id}`, data),
  delete: (id: number) => apiDelete(`${BASE}/${id}`),
  bulkDelete: (ids: number[]) => apiPost(`${BASE}/bulk-delete`, { ids }),
}
