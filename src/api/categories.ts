import { apiDelete, apiGet, apiPost, apiPostForm } from '@/api/client'
import type { ListParams } from '@/types/list'

export interface Category {
  id: number
  category_name: string
  color: string | null
  products_count?: number
  created_at: string
  updated_at: string
}

const BASE = '/categories'

export const categoriesApi = {
  list: (params?: ListParams) => apiGet<Category[]>(BASE, params),
  get: (id: number) => apiGet<Category>(`${BASE}/${id}`),
  create: (data: FormData | Record<string, unknown>) =>
    data instanceof FormData ? apiPostForm<Category>(BASE, data) : apiPost<Category>(BASE, data),
  update: (id: number, data: FormData | Record<string, unknown>) =>
    data instanceof FormData ? apiPostForm<Category>(`${BASE}/${id}`, data) : apiPost<Category>(`${BASE}/${id}`, data),
  delete: (id: number) => apiDelete(`${BASE}/${id}`),
  bulkDelete: (ids: number[]) => apiPost(`${BASE}/bulk-delete`, { ids }),
}
