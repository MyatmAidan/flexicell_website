<script setup lang="ts">
import { toRef } from 'vue'
import { useI18n } from 'vue-i18n'
import { useScrollPagination } from '@/composables/useScrollPagination'

const props = defineProps<{
  hasMore: boolean
  loading: boolean
}>()

const emit = defineEmits<{ load: [] }>()

const { t } = useI18n()

const { sentinel } = useScrollPagination({
  hasMore: toRef(props, 'hasMore'),
  loading: toRef(props, 'loading'),
  onLoadMore: () => emit('load'),
})
</script>

<template>
  <div v-if="hasMore" ref="sentinel" class="sf-scroll-sentinel">
    <span v-if="loading" class="sf-scroll-sentinel-spinner" />
    <span class="sr-only">{{ loading ? t('common.loading') : t('storefront.scroll.loadMoreHint') }}</span>
  </div>
</template>
