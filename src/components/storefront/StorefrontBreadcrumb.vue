<script setup lang="ts">
import { RouterLink } from 'vue-router'
import { useI18n } from 'vue-i18n'

defineProps<{ current: string }>()
const { t } = useI18n()
</script>

<template>
  <nav class="sf-breadcrumb" aria-label="Breadcrumb">
    <RouterLink to="/">{{ t('storefront.nav.home') }}</RouterLink>
    <span class="sf-breadcrumb-sep">/</span>
    <span class="sf-breadcrumb-current">{{ current }}</span>
  </nav>
</template>
