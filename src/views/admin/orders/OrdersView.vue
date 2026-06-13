<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { Icon } from '@iconify/vue'
import PageCard from '@/components/ui/PageCard.vue'
import DataTable from '@/components/ui/DataTable.vue'
import { ordersApi, type Order } from '@/api/orders'
import { useDataTable } from '@/composables/useDataTable'
import { formatCurrency, formatDate } from '@/utils/format'

const { t } = useI18n()
const router = useRouter()
const table = useDataTable<Order>((p) => ordersApi.list(p), 'id')

const columns = [
  { key: 'id', label: t('orders.id'), sortable: true },
  { key: 'customer', label: t('orders.customer') },
  { key: 'items_count', label: t('orders.items') },
  { key: 'grand_total', label: t('orders.total'), sortable: true },
  { key: 'order_status', label: t('orders.status'), sortable: true },
  { key: 'order_date', label: t('orders.date'), sortable: true },
]
</script>

<template>
  <PageCard :title="t('pages.orders.title')" :subtitle="t('pages.orders.description')">
    <div class="table-toolbar">
      <input
        type="search"
        class="search-input"
        :placeholder="t('common.search')"
        @input="table.setSearch(($event.target as HTMLInputElement).value)"
      />
    </div>

    <DataTable
      :columns="columns"
      :items="table.items.value"
      :loading="table.loading.value"
      :sort-by="table.sortBy.value"
      :sort-dir="table.sortDir.value"
      :page="table.page.value"
      :last-page="table.lastPage.value"
      :total="table.total.value"
      @sort="table.setSort"
      @page-change="table.setPage"
    >
      <template #cell-id="{ item }">
        <RouterLink :to="`/orders/${(item as Order).id}`" class="link">#{{ (item as Order).id }}</RouterLink>
      </template>
      <template #cell-customer="{ item }">
        {{ (item as Order).customer?.name ?? t('orders.walkIn') }}
      </template>
      <template #cell-grand_total="{ value }">{{ formatCurrency(value as number) }}</template>
      <template #cell-order_status="{ value }"><span class="badge">{{ value }}</span></template>
      <template #cell-order_date="{ value }">{{ formatDate(value as string) }}</template>
      <template #actions="{ item }">
        <button type="button" class="btn-icon" @click="router.push(`/admin/orders/${(item as Order).id}`)">
          <Icon icon="solar:eye-linear" />
        </button>
        <button type="button" class="btn-icon" @click="router.push(`/admin/orders/${(item as Order).id}/receipt`)">
          <Icon icon="solar:bill-list-linear" />
        </button>
      </template>
    </DataTable>
  </PageCard>
</template>
