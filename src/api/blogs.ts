import { apiDelete, apiGet, apiPost, apiPostForm } from '@/api/client'
import type { ListParams } from '@/types/list'

export interface BlogSection {
  id: number
  heading: string
  content: string
  order: number
  images?: { id: number; image_url: string }[]
}

export interface Blog {
  id: number
  title: string
  thumbnail: string | null
  thumbnail_url: string | null
  sections_count?: number
  sections?: BlogSection[]
  created_at: string
  updated_at: string
}

const BASE = '/admin/blogs'

export const blogsApi = {
  list: (params?: ListParams) => apiGet<Blog[]>(BASE, params),
  get: (id: number) => apiGet<Blog>(`${BASE}/${id}`),
  create: (data: FormData) => apiPostForm<Blog>(BASE, data),
  update: (id: number, data: FormData) => apiPostForm<Blog>(`${BASE}/${id}`, data),
  delete: (id: number) => apiDelete(`${BASE}/${id}`),
}
