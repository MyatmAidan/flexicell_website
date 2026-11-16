<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, RouterLink } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { storefrontApi } from '@/api/storefront'
import { formatCurrency } from '@/utils/format'
import type { ProductDetail } from '@/types/storefront'

const { t } = useI18n()
const route = useRoute()
const id = computed(() => Number(route.params.id))

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
  const p = product.value
  if (!p) return []

  const rows: { key: string; value: string }[] = []
  if (p.processor) {
    rows.push({ key: t('storefront.product.processor'), value: p.processor })
  }
  if (p.battery_capacity) {
    rows.push({ key: t('storefront.product.battery'), value: `${p.battery_capacity} mAh` })
  }
  if (p.release_year) {
    rows.push({ key: t('storefront.product.releaseYear'), value: String(p.release_year) })
  }
  if (p.product_type) {
    rows.push({
      key: t('storefront.product.type'),
      value: p.product_type === 'second hand' ? t('storefront.product.typeSecondHand') : t('storefront.product.typeNew'),
    })
  }
  for (const spec of p.specifications ?? []) {
    if (spec?.value) rows.push({ key: spec.key, value: spec.value })
  }
  return rows
})
</script>

<template>
  <section class="sf-section">
    <div class="sf-container">
      <div v-if="loading" class="sf-detail-grid">
        <div class="sf-skeleton" style="aspect-ratio: 1" />
        <div class="sf-skeleton" style="height: 320px" />
      </div>

      <template v-else-if="product">
        <RouterLink to="/products/search" class="sf-btn sf-btn-outline" style="margin-bottom: 1.5rem">
          ← {{ t('common.back') }}
        </RouterLink>

        <div class="sf-detail-grid">
          <div class="sf-reveal-left">
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

          <div class="sf-reveal-right">
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

            <div v-if="product.available_colors?.length" class="sf-color-row">
              <strong>{{ t('storefront.product.colors') }}</strong>
              <div class="sf-color-chips">
                <span v-for="color in product.available_colors" :key="color.name" class="sf-color-chip">
                  <i v-if="color.value" :style="{ background: color.value }" />
                  {{ color.name }}
                </span>
              </div>
            </div>

            <div v-if="specs.length" class="sf-spec-block">
              <h2>{{ t('storefront.product.specs') }}</h2>
              <ul class="sf-spec-list">
                <li v-for="(spec, i) in specs" :key="`${spec.key}-${i}`">
                  <strong>{{ spec.key }}</strong>
                  <span>{{ spec.value }}</span>
                </li>
              </ul>
            </div>

            <RouterLink to="/contact" class="sf-btn sf-btn-primary" style="margin-top: 1.5rem">
              {{ t('storefront.product.inquire') }}
            </RouterLink>
          </div>
        </div>
      </template>
    </div>
  </section>
</template>
