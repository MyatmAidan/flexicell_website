<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { Icon } from '@iconify/vue'
import { storefrontApi } from '@/api/storefront'
import { useReveal } from '@/composables/useReveal'
import type { StorefrontCategory } from '@/types/storefront'

const { t } = useI18n()
const { el, visible } = useReveal()
const categories = ref<StorefrontCategory[]>([])
const loading = ref(true)

onMounted(async () => {
  try {
    const res = await storefrontApi.categories()
    if (res.success) categories.value = res.data ?? []
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <section class="sf-section">
    <div ref="el" class="sf-container">
      <div class="sf-section-header sf-reveal" :class="{ 'sf-visible': visible || categories.length > 0 }">
        <div>
          <h1 class="sf-section-title">{{ t('storefront.productsPage.title') }}</h1>
          <p class="sf-section-sub">{{ t('storefront.productsPage.subtitle') }}</p>
        </div>
        <RouterLink to="/products/search" class="sf-btn sf-btn-primary">{{ t('storefront.productsPage.searchAll') }}</RouterLink>
      </div>

      <div v-if="loading" class="sf-category-grid">
        <div v-for="n in 8" :key="n" class="sf-skeleton" style="height: 130px" />
      </div>

      <div v-else class="sf-category-grid">
        <RouterLink
          v-for="(cat, i) in categories"
          :key="cat.id"
          :to="{ path: '/products/search', query: { category_id: cat.id } }"
          class="sf-category-card sf-reveal"
          :class="{ 'sf-visible': visible || categories.length > 0 }"
          :style="{ transitionDelay: `${Math.min(i * 55, 400)}ms` }"
        >
          <div class="sf-category-icon">
            <Icon icon="solar:smartphone-2-bold-duotone" />
          </div>
          <div class="sf-category-name">{{ cat.category_name }}</div>
        </RouterLink>
      </div>
    </div>
  </section>
</template>
