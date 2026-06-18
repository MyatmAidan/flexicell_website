<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { extractScrollMeta, storefrontApi } from '@/api/storefront'
import ProductCard from '@/components/storefront/ProductCard.vue'
import ScrollPaginationSentinel from '@/components/storefront/ScrollPaginationSentinel.vue'
import type { ScrollMeta, StorefrontBrand, StorefrontCategory, StorefrontProduct } from '@/types/storefront'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()

const loading = ref(false)
const products = ref<StorefrontProduct[]>([])
const categories = ref<StorefrontCategory[]>([])
const brands = ref<StorefrontBrand[]>([])
const page = ref(1)
const meta = ref<ScrollMeta | null>(null)

const query = ref(String(route.query.query ?? ''))
const categoryId = ref(route.query.category_id ? String(route.query.category_id) : '')
const brandId = ref(route.query.brand_id ? String(route.query.brand_id) : '')

const hasMore = computed(() => Boolean(meta.value?.has_more))

function buildParams(nextPage: number) {
  const params: Record<string, unknown> = { page: nextPage, per_page: 12 }
  if (query.value.trim()) params.query = query.value.trim()
  if (categoryId.value) params.category_id = categoryId.value
  if (brandId.value) params.brand_id = brandId.value
  return params
}

async function search(reset = false) {
  if (loading.value) return
  if (!reset && meta.value && !meta.value.has_more) return

  loading.value = true
  try {
    const nextPage = reset ? 1 : page.value
    const res = await storefrontApi.searchProducts(buildParams(nextPage))
    if (res.success && res.data) {
      const batch = res.data.products ?? []
      products.value = reset ? batch : [...products.value, ...batch]
      if (reset) {
        categories.value = res.data.categories ?? []
        brands.value = res.data.brands ?? []
      }
      meta.value = extractScrollMeta(res)
      page.value = (meta.value?.current_page ?? nextPage) + 1
    }
  } finally {
    loading.value = false
  }
}

function applyFilters() {
  router.replace({
    path: '/products/search',
    query: {
      ...(query.value.trim() ? { query: query.value.trim() } : {}),
      ...(categoryId.value ? { category_id: categoryId.value } : {}),
      ...(brandId.value ? { brand_id: brandId.value } : {}),
    },
  })
}

onMounted(() => search(true))

watch(
  () => route.query,
  () => {
    query.value = String(route.query.query ?? '')
    categoryId.value = route.query.category_id ? String(route.query.category_id) : ''
    brandId.value = route.query.brand_id ? String(route.query.brand_id) : ''
    search(true)
  },
)
</script>

<template>
  <section class="sf-section">
    <div class="sf-container">
      <div class="sf-section-header sf-reveal-up">
        <div>
          <h1 class="sf-section-title">{{ t('storefront.search.title') }}</h1>
          <p class="sf-section-sub">{{ t('storefront.search.subtitle') }}</p>
        </div>
      </div>

      <form class="sf-filters sf-reveal-up" style="transition-delay: 80ms" @submit.prevent="applyFilters">
        <input v-model="query" type="search" :placeholder="t('storefront.search.placeholder')" />
        <select v-model="categoryId">
          <option value="">{{ t('storefront.search.allCategories') }}</option>
          <option v-for="c in categories" :key="c.id" :value="c.id">{{ c.category_name }}</option>
        </select>
        <select v-model="brandId">
          <option value="">{{ t('storefront.search.allBrands') }}</option>
          <option v-for="b in brands" :key="b.id" :value="b.id">{{ b.brand_name }}</option>
        </select>
        <button type="submit" class="sf-btn sf-btn-primary">{{ t('common.search') }}</button>
      </form>

      <div v-if="loading && !products.length" class="sf-product-grid">
        <div v-for="n in 8" :key="n" class="sf-skeleton sf-skeleton-card" />
      </div>

      <div v-else-if="!products.length" class="sf-reveal-up sf-visible" style="text-align: center; padding: 3rem 0; color: var(--sf-muted)">
        {{ t('storefront.search.noResults') }}
      </div>

      <div v-else class="sf-product-grid">
        <ProductCard
          v-for="(product, i) in products"
          :key="product.id"
          :product="product"
          :index="i"
        />
      </div>

      <ScrollPaginationSentinel
        :has-more="hasMore"
        :loading="loading"
        @load="search()"
      />
    </div>
  </section>
</template>
