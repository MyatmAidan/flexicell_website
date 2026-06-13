import { apiDelete, apiGet, apiPost } from '@/api/client'
import type { ListParams } from '@/types/list'

export interface Customer {
  id: number
  user_id: number | null
  name: string
  phone: string | null
  email: string | null
  address: string | null
  points: number
  account_type: 'registered' | 'walk-in'
  orders_count?: number
  created_at: string
  updated_at: string
}

const BASE = '/customers'

export const customersApi = {
  list: (params?: ListParams) => apiGet<Customer[]>(BASE, params),
  get: (id: number) => apiGet<Customer>(`${BASE}/${id}`),
  create: (data: Record<string, unknown>) => apiPost<Customer>(BASE, data),
  update: (id: number, data: Record<string, unknown>) => apiPost<Customer>(`${BASE}/${id}`, data),
  delete: (id: number) => apiDelete(`${BASE}/${id}`),
  bulkDelete: (ids: number[]) => apiPost(`${BASE}/bulk-delete`, { ids }),
}
