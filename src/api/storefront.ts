import { publicGet, publicPost } from '@/api/publicClient'
import type {
  BlogDetail,
  ProductDetail,
  ProductSearchResult,
  ScrollMeta,
  StorefrontBlog,
  StorefrontBrand,
  StorefrontCategory,
  StorefrontProduct,
} from '@/types/storefront'
import type { ApiResponse } from '@/types/api'

const BASE = '/public'

export const storefrontApi = {
  categories: () => publicGet<StorefrontCategory[]>(`${BASE}/categories`),

  brands: (categoryId?: number) =>
    publicGet<StorefrontBrand[]>(`${BASE}/brands`, categoryId ? { category_id: categoryId } : undefined),

  scrollProducts: (type: 'new' | 'popular' | 'bestseller', page = 1) =>
    publicGet<StorefrontProduct[]>(`${BASE}/products/scroll`, { type, page }),

  scrollBlogs: (page = 1, perPage = 3) =>
    publicGet<StorefrontBlog[]>(`${BASE}/blogs/scroll`, { page, per_page: perPage }),

  searchProducts: (params: Record<string, unknown>) =>
    publicGet<ProductSearchResult>(`${BASE}/products/search`, params),

  productDetail: (id: number) => publicGet<ProductDetail>(`${BASE}/products/${id}`),

  blogs: (page = 1, perPage = 9) =>
    publicGet<StorefrontBlog[]>(`${BASE}/blogs`, { page, per_page: perPage }),

  blogDetail: (id: number) => publicGet<BlogDetail>(`${BASE}/blogs/${id}`),

  warrantyCheck: (imei: string) => publicPost(`${BASE}/warranty-check`, { imei }),

  contact: (payload: Record<string, string>) => publicPost(`${BASE}/contact`, payload),
}

export function extractScrollMeta(response: ApiResponse<unknown>): ScrollMeta | null {
  if (!response.meta) return null
  const m = response.meta as unknown as Record<string, unknown>
  return {
    current_page: Number(m.current_page ?? 1),
    last_page: Number(m.last_page ?? 1),
    has_more: Boolean(
      m.has_more ?? Number(m.current_page ?? 1) < Number(m.last_page ?? 1),
    ),
    total: Number(m.total ?? 0),
  }
}
