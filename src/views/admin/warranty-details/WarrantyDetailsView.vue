<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import PageCard from '@/components/ui/PageCard.vue'
import DataTable from '@/components/ui/DataTable.vue'
import { warrantyDetailsApi, type WarrantyDetail } from '@/api/warrantyDetails'
import { useDataTable } from '@/composables/useDataTable'
import { formatDate } from '@/utils/format'

const { t } = useI18n()
const table = useDataTable<WarrantyDetail>((p) => warrantyDetailsApi.list(p))

const columns = [
  { key: 'customer', label: t('warranty.customer') },
  { key: 'device', label: t('warranty.device') },
  { key: 'imei', label: t('warranty.imei') },
  { key: 'start_date', label: t('warranty.startDate'), sortable: true },
  { key: 'end_date', label: t('warranty.endDate'), sortable: true },
  { key: 'computed_status', label: t('common.status') },
  { key: 'created_at', label: t('common.createdAt'), sortable: true },
]
</script>

<template>
  <PageCard :title="t('pages.warrantyDetails.title')" :subtitle="t('pages.warrantyDetails.description')">
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
      <template #cell-customer="{ item }">
        {{ (item as WarrantyDetail).customer?.name || '—' }}
      </template>
      <template #cell-device="{ item }">
        {{ (item as WarrantyDetail).device?.device_name || (item as WarrantyDetail).device?.product_name || '—' }}
      </template>
      <template #cell-imei="{ item }">
        {{ (item as WarrantyDetail).device?.imei || '—' }}
      </template>
      <template #cell-start_date="{ value }">{{ formatDate(value as string) }}</template>
      <template #cell-end_date="{ value }">{{ formatDate(value as string) }}</template>
      <template #cell-computed_status="{ value }">
        <span class="badge">{{ value }}</span>
      </template>
      <template #cell-created_at="{ value }">{{ formatDate(value as string) }}</template>
    </DataTable>
  </PageCard>
</template>
