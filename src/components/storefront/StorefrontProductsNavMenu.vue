<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { Icon } from '@iconify/vue'
import { storefrontApi } from '@/api/storefront'
import type { StorefrontBrand, StorefrontCategory } from '@/types/storefront'

defineProps<{
  active?: boolean
}>()

const emit = defineEmits<{
  navigate: []
}>()

const { t } = useI18n()

const categories = ref<StorefrontCategory[]>([])
const brandsCache = ref<Record<number, StorefrontBrand[]>>({})
const brandsLoading = ref<number | null>(null)
const activeCategoryId = ref<number | null>(null)
const productsOpen = ref(false)
const mobileCategoryId = ref<number | null>(null)

function searchLink(categoryId?: number, brandId?: number) {
  const query: Record<string, string> = {}
  if (categoryId) query.category_id = String(categoryId)
  if (brandId) query.brand_id = String(brandId)
  return { path: '/products/search', query }
}

function onNavigate() {
  productsOpen.value = false
  mobileCategoryId.value = null
  activeCategoryId.value = null
  emit('navigate')
}

async function loadBrands(categoryId: number) {
  activeCategoryId.value = categoryId
  if (brandsCache.value[categoryId]) return

  brandsLoading.value = categoryId
  try {
    const res = await storefrontApi.brands(categoryId)
    if (res.success) {
      brandsCache.value = { ...brandsCache.value, [categoryId]: res.data ?? [] }
    }
  } finally {
    if (brandsLoading.value === categoryId) brandsLoading.value = null
  }
}

function toggleMobileProducts() {
  productsOpen.value = !productsOpen.value
  if (!productsOpen.value) mobileCategoryId.value = null
}

function toggleMobileCategory(categoryId: number) {
  mobileCategoryId.value = mobileCategoryId.value === categoryId ? null : categoryId
  void loadBrands(categoryId)
}

onMounted(async () => {
  const res = await storefrontApi.categories()
  if (res.success) categories.value = res.data ?? []
})
</script>

<template>
  <div
    class="sf-nav-dropdown"
    :class="{ 'sf-nav-dropdown--open': productsOpen, 'sf-nav-dropdown--active': active }"
    @mouseleave="activeCategoryId = null"
  >
    <div class="sf-nav-dropdown-trigger">
      <RouterLink
        to="/products"
        class="sf-nav-link"
        :class="{ 'sf-nav-active': active }"
        @click="onNavigate"
      >
        {{ t('storefront.nav.products') }}
      </RouterLink>
      <button
        type="button"
        class="sf-nav-dropdown-toggle"
        :aria-expanded="productsOpen"
        aria-label="Browse product categories"
        @click.stop="toggleMobileProducts"
      >
        <Icon icon="solar:alt-arrow-down-linear" />
      </button>
    </div>

    <div class="sf-nav-panel">
      <RouterLink to="/products" class="sf-nav-panel-head" @click="onNavigate">
        <Icon icon="solar:bag-3-bold" />
        {{ t('storefront.nav.allProducts') }}
      </RouterLink>

      <ul v-if="categories.length" class="sf-nav-cat-list">
        <li
          v-for="cat in categories"
          :key="cat.id"
          class="sf-nav-cat"
          :class="{
            'sf-nav-cat--active': activeCategoryId === cat.id || mobileCategoryId === cat.id,
          }"
          @mouseenter="loadBrands(cat.id)"
        >
          <div class="sf-nav-cat-row">
            <RouterLink
              :to="searchLink(cat.id)"
              class="sf-nav-cat-link"
              @click="onNavigate"
            >
              {{ cat.category_name }}
            </RouterLink>
            <button
              type="button"
              class="sf-nav-cat-expand"
              :aria-expanded="mobileCategoryId === cat.id"
              @click.stop="toggleMobileCategory(cat.id)"
            >
              <Icon icon="solar:alt-arrow-right-linear" />
            </button>
          </div>

          <div
            v-show="activeCategoryId === cat.id || mobileCategoryId === cat.id"
            class="sf-nav-subpanel"
          >
            <div v-if="brandsLoading === cat.id" class="sf-nav-subpanel-loading">
              {{ t('common.loading') }}
            </div>
            <template v-else-if="(brandsCache[cat.id] ?? []).length">
              <RouterLink
                v-for="brand in brandsCache[cat.id]"
                :key="brand.id"
                :to="searchLink(cat.id, brand.id)"
                class="sf-nav-brand-link"
                @click="onNavigate"
              >
                <img v-if="brand.logo" :src="brand.logo" :alt="brand.brand_name" class="sf-nav-brand-logo" />
                <span>{{ brand.brand_name }}</span>
              </RouterLink>
            </template>
            <p v-else class="sf-nav-subpanel-empty">{{ t('storefront.nav.noBrands') }}</p>
          </div>
        </li>
      </ul>

      <p v-else class="sf-nav-subpanel-empty">{{ t('common.noData') }}</p>
    </div>
  </div>
</template>
