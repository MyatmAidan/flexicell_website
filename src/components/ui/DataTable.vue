<script setup lang="ts" generic="T">
import { Icon } from '@iconify/vue'

export interface TableColumn {
  key: string
  label: string
  sortable?: boolean
  class?: string
}

defineProps<{
  columns: TableColumn[]
  items: T[]
  loading?: boolean
  sortBy?: string
  sortDir?: 'asc' | 'desc'
  page?: number
  lastPage?: number
  total?: number
  emptyText?: string
}>()

const emit = defineEmits<{ sort: [key: string]; 'page-change': [page: number] }>()
</script>

<template>
  <div class="data-table-wrap">
    <div v-if="loading" class="table-loading">{{ $t('common.loading') }}</div>
    <div v-else class="table-responsive">
      <table class="data-table">
        <thead>
          <tr>
            <th
              v-for="col in columns"
              :key="col.key"
              :class="[col.class, { sortable: col.sortable }]"
              @click="col.sortable && emit('sort', col.key)"
            >
              {{ col.label }}
              <Icon
                v-if="col.sortable && sortBy === col.key"
                :icon="sortDir === 'asc' ? 'solar:alt-arrow-up-linear' : 'solar:alt-arrow-down-linear'"
                class="sort-icon"
              />
            </th>
            <th v-if="$slots.actions" class="actions-col">{{ $t('common.actions') }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(item, idx) in items" :key="idx">
            <td v-for="col in columns" :key="col.key" :class="col.class">
              <slot :name="`cell-${col.key}`" :item="item" :value="(item as Record<string, unknown>)[col.key]">
                {{ (item as Record<string, unknown>)[col.key] }}
              </slot>
            </td>
            <td v-if="$slots.actions" class="actions-col">
              <slot name="actions" :item="item" />
            </td>
          </tr>
          <tr v-if="!items.length">
            <td :colspan="columns.length + ($slots.actions ? 1 : 0)" class="empty-cell">
              {{ emptyText || $t('common.noData') }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="lastPage && lastPage > 1" class="table-pagination">
      <button type="button" class="btn btn-sm" :disabled="(page || 1) <= 1" @click="emit('page-change', (page || 1) - 1)">
        <Icon icon="solar:alt-arrow-left-linear" />
      </button>
      <span>{{ page }} / {{ lastPage }} ({{ total }})</span>
      <button
        type="button"
        class="btn btn-sm"
        :disabled="(page || 1) >= lastPage"
        @click="emit('page-change', (page || 1) + 1)"
      >
        <Icon icon="solar:alt-arrow-right-linear" />
      </button>
    </div>
  </div>
</template>
