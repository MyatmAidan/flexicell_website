import { apiDelete, apiGet, apiPost, apiPostForm } from '@/api/client'
import type { ListParams } from '@/types/list'

export interface Brand {
  id: number
  brand_name: string
  logo: string | null
  logo_url: string | null
  color: string | null
  products_count?: number
  created_at: string
  updated_at: string
}

const BASE = '/brands'

export const brandsApi = {
  list: (params?: ListParams) => apiGet<Brand[]>(BASE, params),
  get: (id: number) => apiGet<Brand>(`${BASE}/${id}`),
  create: (data: FormData) => apiPostForm<Brand>(BASE, data),
  update: (id: number, data: FormData) => apiPostForm<Brand>(`${BASE}/${id}`, data),
  delete: (id: number) => apiDelete(`${BASE}/${id}`),
  bulkDelete: (ids: number[]) => apiPost(`${BASE}/bulk-delete`, { ids }),
}
