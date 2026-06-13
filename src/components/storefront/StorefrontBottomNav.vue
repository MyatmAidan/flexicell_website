<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { Icon } from '@iconify/vue'
import { useAuthStore } from '@/stores/auth'

const { t } = useI18n()
const route = useRoute()
const auth = useAuthStore()

const tabs = computed(() => {
  const accountTab = auth.isCustomer
    ? {
        key: 'account' as const,
        to: '/account',
        icon: 'solar:user-circle-bold',
        label: 'storefront.account.title',
        match: () => route.path === '/account',
      }
    : null

  const base = [
    { key: 'home', to: '/', icon: 'solar:home-2-bold', label: 'storefront.nav.home', match: () => route.name === 'home' },
    { key: 'products', to: '/products', icon: 'solar:bag-3-bold', label: 'storefront.nav.products', match: () => route.path.startsWith('/products') },
    { key: 'warranty', to: '/warranty', icon: 'solar:shield-check-bold', label: 'storefront.nav.warranty', match: () => route.path === '/warranty' },
    { key: 'contact', to: '/contact', icon: 'solar:chat-round-dots-bold', label: 'storefront.nav.contact', match: () => route.path === '/contact' || route.path === '/about' },
  ] as const

  if (accountTab) {
    return [...base.slice(0, 3), accountTab, base[3]]
  }

  return base
})
</script>

<template>
  <nav class="sf-bottom-nav" aria-label="Mobile navigation">
    <RouterLink
      v-for="tab in tabs"
      :key="tab.key"
      :to="tab.to"
      class="sf-bottom-nav-item"
      :class="{ active: tab.match() }"
    >
      <Icon :icon="tab.icon" class="sf-bottom-nav-icon" />
      <span>{{ t(tab.label) }}</span>
    </RouterLink>
  </nav>
</template>
