import { apiDelete, apiGet, apiPost, apiPostForm } from '@/api/client'
import type { ListParams } from '@/types/list'

export interface PhoneModel {
  id: number
  model_name: string
  brand_id: number
  brand_name?: string
  category_id: number | null
  category_name?: string
  processor: string | null
  battery_capacity: string | null
  release_year: number | null
  description: unknown
  available_color: unknown
  image: unknown
  image_urls: string[]
  created_at: string
  updated_at: string
}

const BASE = '/phone-models'

export const phoneModelsApi = {
  list: (params?: ListParams) => apiGet<PhoneModel[]>(BASE, params),
  get: (id: number) => apiGet<PhoneModel>(`${BASE}/${id}`),
  create: (data: FormData) => apiPostForm<PhoneModel>(BASE, data),
  update: (id: number, data: FormData) => apiPostForm<PhoneModel>(`${BASE}/${id}`, data),
  delete: (id: number) => apiDelete(`${BASE}/${id}`),
}
