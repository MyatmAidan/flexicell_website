<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, RouterLink } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { storefrontApi } from '@/api/storefront'
import { useReveal } from '@/composables/useReveal'
import { formatCurrency } from '@/utils/format'
import type { ProductDetail } from '@/types/storefront'

const { t } = useI18n()
const route = useRoute()
const id = computed(() => Number(route.params.id))
const { el, visible } = useReveal({ threshold: 0.08 })

const loading = ref(true)
const product = ref<ProductDetail | null>(null)
const activeImage = ref(0)

onMounted(async () => {
  try {
    const res = await storefrontApi.productDetail(id.value)
    if (res.success) product.value = res.data ?? null
  } finally {
    loading.value = false
  }
})

const specs = computed(() => {
  const s = product.value?.specifications
  if (!s) return []
  if (Array.isArray(s)) return s.map((line, i) => ({ key: String(i), value: line }))
  return Object.entries(s).map(([key, value]) => ({ key, value }))
})
</script>

<template>
  <section class="sf-section">
    <div ref="el" class="sf-container">
      <div v-if="loading" class="sf-detail-grid">
        <div class="sf-skeleton" style="aspect-ratio: 1" />
        <div class="sf-skeleton" style="height: 320px" />
      </div>

      <template v-else-if="product">
        <RouterLink to="/products/search" class="sf-btn sf-btn-outline" style="margin-bottom: 1.5rem">
          ← {{ t('common.back') }}
        </RouterLink>

        <div class="sf-detail-grid sf-reveal" :class="{ 'sf-visible': visible }">
          <div>
            <div class="sf-gallery-main">
              <img
                v-if="product.images[activeImage]"
                :src="product.images[activeImage]"
                :alt="product.model_name"
              />
            </div>
            <div v-if="product.images.length > 1" class="sf-gallery-thumbs">
              <button
                v-for="(img, i) in product.images"
                :key="i"
                type="button"
                :class="{ active: activeImage === i }"
                @click="activeImage = i"
              >
                <img :src="img" :alt="`${product.model_name} ${i + 1}`" />
              </button>
            </div>
          </div>

          <div>
            <p style="color: var(--sf-muted); margin: 0 0 0.25rem; font-size: 0.85rem; text-transform: uppercase">
              {{ product.brand_name }} · {{ product.category_name }}
            </p>
            <h1 style="margin: 0; font-size: 1.75rem">{{ product.model_name }}</h1>
            <div class="sf-detail-price">{{ formatCurrency(product.selling_price) }}</div>

            <p v-if="product.description" style="line-height: 1.65; color: var(--sf-muted)">{{ product.description }}</p>

            <p style="margin-top: 1rem">
              <strong>{{ t('storefront.product.stock') }}:</strong>
              {{ product.stock_quantity > 0 ? product.stock_quantity : t('storefront.soldOut') }}
            </p>

            <div v-if="product.available_colors?.length" style="margin-top: 1rem">
              <strong>{{ t('storefront.product.colors') }}:</strong>
              {{ product.available_colors.join(', ') }}
            </div>

            <ul v-if="specs.length" class="sf-spec-list">
              <li v-for="spec in specs" :key="spec.key">
                <strong>{{ spec.key }}</strong>
                <span>{{ spec.value }}</span>
              </li>
            </ul>

            <RouterLink to="/contact" class="sf-btn sf-btn-primary" style="margin-top: 1.5rem">
              {{ t('storefront.product.inquire') }}
            </RouterLink>
          </div>
        </div>
      </template>
    </div>
  </section>
</template>
