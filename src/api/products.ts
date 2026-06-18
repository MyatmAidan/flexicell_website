import { apiDelete, apiGet, apiPost, apiPostForm } from '@/api/client'
import type { ListParams } from '@/types/list'

export interface Product {
  id: number
  phone_model_id: number
  model_name?: string
  brand_name?: string
  product_type: 'new' | 'second hand'
  description: string | null
  image: unknown
  image_urls: string[]
  available_devices_count?: number
  stock_quantity: number
  created_at: string
  updated_at: string
}

const BASE = '/products'

export const productsApi = {
  list: (params?: ListParams) => apiGet<Product[]>(BASE, params),
  get: (id: number) => apiGet<Product>(`${BASE}/${id}`),
  create: (data: FormData) => apiPostForm<Product>(BASE, data),
  update: (id: number, data: FormData) => apiPostForm<Product>(`${BASE}/${id}`, data),
  delete: (id: number) => apiDelete(`${BASE}/${id}`),
}
