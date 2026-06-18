<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { Icon } from '@iconify/vue'
import PageCard from '@/components/ui/PageCard.vue'
import DataTable from '@/components/ui/DataTable.vue'
import { installmentsApi, type Installment } from '@/api/installments'
import { useDataTable } from '@/composables/useDataTable'
import { formatCurrency, formatDate } from '@/utils/format'

const { t } = useI18n()
const router = useRouter()
const table = useDataTable<Installment>((p) => installmentsApi.list(p), 'id')

const columns = [
  { key: 'id', label: t('installments.id'), sortable: true },
  { key: 'order_id', label: t('installments.order'), sortable: true },
  { key: 'customer', label: t('installments.customer') },
  { key: 'total_amount', label: t('installments.total'), sortable: true },
  { key: 'months', label: t('installments.months') },
  { key: 'progress', label: t('installments.progress') },
  { key: 'start_date', label: t('installments.startDate') },
]
</script>

<template>
  <PageCard :title="t('pages.installment.title')" :subtitle="t('pages.installment.description')">
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
        <RouterLink :to="{ name: 'installments-show', params: { id: (item as Installment).id } }" class="link">
          {{ (item as Installment).id }}
        </RouterLink>
      </template>
      <template #cell-customer="{ item }">
        {{ (item as Installment).order?.customer?.name ?? '—' }}
      </template>
      <template #cell-total_amount="{ value }">{{ formatCurrency(value as number) }}</template>
      <template #cell-progress="{ item }">
        {{ (item as Installment & { payments_paid_count?: number; payments_total_count?: number }).payments_paid_count ?? (item as Installment).paid_payments_count ?? 0 }}
        /
        {{ (item as Installment & { payments_total_count?: number }).payments_total_count ?? (item as Installment).total_payments_count ?? (item as Installment).months }}
      </template>
      <template #cell-start_date="{ value }">{{ formatDate(value as string) }}</template>
      <template #actions="{ item }">
        <button type="button" class="btn-icon" @click="router.push(`/admin/installments/${(item as Installment).id}`)">
          <Icon icon="solar:eye-linear" />
        </button>
      </template>
    </DataTable>
  </PageCard>
</template>
