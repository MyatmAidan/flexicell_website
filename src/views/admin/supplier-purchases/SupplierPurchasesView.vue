<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { Icon } from '@iconify/vue'
import PageCard from '@/components/ui/PageCard.vue'
import DataTable from '@/components/ui/DataTable.vue'
import { supplierPurchasesApi, type SupplierPurchase } from '@/api/supplierPurchases'
import { useDataTable } from '@/composables/useDataTable'
import { usePermissions } from '@/composables/usePermissions'
import { formatCurrency, formatDate } from '@/utils/format'

const { t } = useI18n()
const router = useRouter()
const { hasAny } = usePermissions()
const table = useDataTable<SupplierPurchase>((p) => supplierPurchasesApi.list(p), 'id')

function getReceiveProgress(item: SupplierPurchase): { received: number; total: number } | null {
  const p = item.receive_progress
  if (p && typeof p === 'object' && 'received' in p && 'total' in p) {
    return p as { received: number; total: number }
  }
  return null
}

const columns = [
  { key: 'invoice_number', label: t('purchases.invoice'), sortable: true },
  { key: 'supplier_name', label: t('purchases.supplier') },
  { key: 'grand_total', label: t('purchases.grandTotal'), sortable: true },
  { key: 'paid_amount', label: t('purchases.paid') },
  { key: 'credit_amount', label: t('purchases.credit') },
  { key: 'status_label', label: t('common.status') },
  { key: 'receive_progress', label: t('purchases.progress') },
  { key: 'purchase_at', label: t('purchases.purchaseDate'), sortable: true },
]
</script>

<template>
  <PageCard :title="t('pages.purchases.title')" :subtitle="t('pages.purchases.description')">
    <template #actions>
      <button
        v-if="hasAny('supplier.manage')"
        type="button"
        class="btn btn-primary btn-sm"
        @click="router.push('/admin/supplier-purchases/create')"
      >
        <Icon icon="solar:add-circle-linear" /> {{ t('common.create') }}
      </button>
    </template>

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
      <template #cell-invoice_number="{ item }">
        <RouterLink :to="`/supplier-purchases/${(item as SupplierPurchase).id}`" class="link">
          {{ (item as SupplierPurchase).invoice_number }}
        </RouterLink>
      </template>
      <template #cell-grand_total="{ value }">{{ formatCurrency(value as number) }}</template>
      <template #cell-paid_amount="{ value }">{{ formatCurrency(value as number) }}</template>
      <template #cell-credit_amount="{ value }">{{ formatCurrency(value as number) }}</template>
      <template #cell-status_label="{ value }"><span class="badge">{{ value }}</span></template>
      <template #cell-receive_progress="{ item }">
        <template v-if="getReceiveProgress(item as SupplierPurchase)">
          {{ getReceiveProgress(item as SupplierPurchase)!.received }}
          / {{ getReceiveProgress(item as SupplierPurchase)!.total }}
        </template>
        <template v-else>—</template>
      </template>
      <template #cell-purchase_at="{ value }">{{ formatDate(value as string) }}</template>
      <template #actions="{ item }">
        <button type="button" class="btn-icon" @click="router.push(`/admin/supplier-purchases/${(item as SupplierPurchase).id}`)">
          <Icon icon="solar:eye-linear" />
        </button>
      </template>
    </DataTable>
  </PageCard>
</template>
