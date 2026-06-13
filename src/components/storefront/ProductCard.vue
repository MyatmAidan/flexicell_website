<script setup lang="ts">
import { RouterLink } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { formatCurrency } from '@/utils/format'
import type { StorefrontProduct } from '@/types/storefront'

defineProps<{
  product: StorefrontProduct
  index?: number
  animate?: boolean
  variant?: 'dark' | 'light'
}>()

const { t } = useI18n()
</script>

<template>
  <RouterLink
    :to="`/products/${product.id}`"
    class="sf-product-card sf-reveal"
    :class="{ 'sf-visible': animate !== false }"
    :style="index != null ? { transitionDelay: `${Math.min(index * 55, 350)}ms` } : undefined"
  >
    <div class="sf-product-img-wrap">
      <img v-if="product.image" :src="product.image" :alt="product.model_name" loading="lazy" />
      <div v-else class="sf-skeleton" style="width: 100%; height: 100%" />
      <span v-if="product.is_sold_out" class="sf-product-badge sold">{{ t('storefront.soldOut') }}</span>
      <span v-else class="sf-product-badge">{{ t('storefront.new') }}</span>
    </div>
    <div class="sf-product-body">
      <div class="sf-product-brand">{{ product.brand_name || product.category_name }}</div>
      <h3 class="sf-product-name">{{ product.model_name }}</h3>
      <div class="sf-product-price">{{ formatCurrency(product.selling_price) }}</div>
    </div>
  </RouterLink>
</template>
