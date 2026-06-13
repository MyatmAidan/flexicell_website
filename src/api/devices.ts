import { apiDelete, apiGet, apiPost, apiPostForm } from '@/api/client'
import type { ListParams } from '@/types/list'

export interface Device {
  id: number
  product_id: number
  product_variant_id: number | null
  product_name: string
  brand_name: string | null
  imei: string
  ram_option_id: number | null
  ram_value?: string
  storage_option_id: number | null
  storage_value?: string
  color_option_id: number | null
  color_value?: string
  warranty_id: number | null
  warranty_months: number | null
  battery_percentage: number | null
  condition_grade: string | null
  status: string
  purchase_price: number | null
  selling_price: number | null
  stock_source: string | null
  image_urls: string[]
  created_at: string
  updated_at: string
}

const BASE = '/devices'

export const devicesApi = {
  list: (params?: ListParams) => apiGet<Device[]>(BASE, params),
  get: (id: number) => apiGet<Device>(`${BASE}/${id}`),
  create: (data: FormData) => apiPostForm<Device>(BASE, data),
  update: (id: number, data: FormData) => apiPostForm<Device>(`${BASE}/${id}`, data),
  delete: (id: number) => apiDelete(`${BASE}/${id}`),
}
