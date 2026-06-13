<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useProductScrollSection } from '@/composables/useScrollSection'
import { useReveal } from '@/composables/useReveal'
import ScrollPaginationSentinel from './ScrollPaginationSentinel.vue'
import ProductCard from './ProductCard.vue'

const props = withDefaults(
  defineProps<{
    type: 'new' | 'popular' | 'bestseller'
    titleKey: string
    subtitleKey?: string
    variant?: 'dark' | 'light'
    alt?: boolean
  }>(),
  { variant: 'light', alt: false },
)

const { t } = useI18n()
const { el, visible } = useReveal()
const { items, loading, meta, load } = useProductScrollSection(props.type)

const hasMore = computed(() => Boolean(meta.value?.has_more))

onMounted(() => load(true))
</script>

<template>
  <section ref="el" class="sf-section" :class="{ 'sf-section--alt': alt }">
    <div class="sf-container">
      <div class="sf-section-header sf-reveal" :class="{ 'sf-visible': visible || items.length > 0 }">
        <div>
          <h2 class="sf-section-title">{{ t(titleKey) }}</h2>
          <p v-if="subtitleKey" class="sf-section-sub">{{ t(subtitleKey) }}</p>
        </div>
      </div>

      <div v-if="loading && !items.length" class="sf-product-grid">
        <div v-for="n in 4" :key="n" class="sf-skeleton sf-skeleton-card" />
      </div>

      <div v-else-if="!items.length" class="sf-section-sub" style="text-align: center; padding: 1rem 0">
        {{ t('common.noData') }}
      </div>

      <div v-else class="sf-scroll-row">
        <ProductCard
          v-for="(product, i) in items"
          :key="product.id"
          :product="product"
          :index="i"
          :animate="items.length > 0"
          :variant="variant"
        />
      </div>

      <ScrollPaginationSentinel
        :has-more="hasMore"
        :loading="loading"
        @load="load()"
      />
    </div>
  </section>
</template>
