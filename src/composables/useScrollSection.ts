import { ref } from 'vue'
import { extractScrollMeta, storefrontApi } from '@/api/storefront'
import type { ScrollMeta, StorefrontBlog, StorefrontProduct } from '@/types/storefront'

type ProductType = 'new' | 'popular' | 'bestseller'

export function useProductScrollSection(type: ProductType) {
  const items = ref<StorefrontProduct[]>([])
  const page = ref(1)
  const loading = ref(false)
  const meta = ref<ScrollMeta | null>(null)

  async function load(reset = false) {
    if (loading.value) return
    if (!reset && meta.value && !meta.value.has_more) return

    loading.value = true
    try {
      const nextPage = reset ? 1 : page.value
      const res = await storefrontApi.scrollProducts(type, nextPage)
      if (res.success) {
        const batch = res.data ?? []
        items.value = reset ? batch : [...items.value, ...batch]
        meta.value = extractScrollMeta(res)
        page.value = (meta.value?.current_page ?? nextPage) + 1
      }
    } finally {
      loading.value = false
    }
  }

  return { items, loading, meta, load }
}

export function useBlogScrollSection(perPage = 3) {
  const items = ref<StorefrontBlog[]>([])
  const page = ref(1)
  const loading = ref(false)
  const meta = ref<ScrollMeta | null>(null)

  async function load(reset = false) {
    if (loading.value) return
    if (!reset && meta.value && !meta.value.has_more) return

    loading.value = true
    try {
      const nextPage = reset ? 1 : page.value
      const res = await storefrontApi.scrollBlogs(nextPage, perPage)
      if (res.success) {
        const batch = res.data ?? []
        items.value = reset ? batch : [...items.value, ...batch]
        meta.value = extractScrollMeta(res)
        page.value = (meta.value?.current_page ?? nextPage) + 1
      }
    } finally {
      loading.value = false
    }
  }

  return { items, loading, meta, load }
}
