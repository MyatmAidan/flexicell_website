<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { Icon } from '@iconify/vue'
import PageCard from '@/components/ui/PageCard.vue'
import DataTable from '@/components/ui/DataTable.vue'
import ExcelToolbar from '@/components/ui/ExcelToolbar.vue'
import { productsApi, type Product } from '@/api/products'
import { downloadFile, apiPostForm } from '@/api/client'
import { useDataTable } from '@/composables/useDataTable'
import { usePermissions } from '@/composables/usePermissions'
import { useNotify } from '@/composables/useNotify'
import { getApiErrorMessage } from '@/utils/apiError'
import { formatDate } from '@/utils/format'

const { t } = useI18n()
const router = useRouter()
const { hasAny } = usePermissions()
const { success, error: notifyError, confirm } = useNotify()
const table = useDataTable<Product>((p) => productsApi.list(p), 'created_at')
const importing = ref(false)

const columns = [
  { key: 'model_name', label: t('products.model'), sortable: true },
  { key: 'brand_name', label: t('products.brand') },
  { key: 'product_type', label: t('products.type') },
  { key: 'stock_quantity', label: t('products.stock'), sortable: true },
  { key: 'available_devices_count', label: t('products.availableDevices') },
  { key: 'created_at', label: t('common.createdAt'), sortable: true },
]

async function doExport() {
  try {
    await downloadFile('/products/export', 'products.xlsx')
  } catch (e) {
    notifyError(getApiErrorMessage(e))
  }
}

async function doTemplate() {
  try {
    await downloadFile('/products/template', 'products-template.xlsx')
  } catch (e) {
    notifyError(getApiErrorMessage(e))
  }
}

async function doImport(file: File) {
  importing.value = true
  try {
    const fd = new FormData()
    fd.append('file', file)
    await apiPostForm('/products/import', fd)
    success(t('products.imported'))
    table.refresh()
  } catch (e) {
    notifyError(getApiErrorMessage(e))
  } finally {
    importing.value = false
  }
}

async function remove(product: Product) {
  if (!(await confirm(t('products.deleteConfirm', { name: product.model_name ?? product.id })))) return
  try {
    await productsApi.delete(product.id)
    success(t('products.deleted'))
    table.refresh()
  } catch (e) {
    notifyError(getApiErrorMessage(e))
  }
}
</script>

<template>
  <PageCard :title="t('pages.products.title')" :subtitle="t('pages.products.description')">
    <template #actions>
      <ExcelToolbar
        :can-export="hasAny('products.view')"
        :can-import="hasAny('products.create')"
        @export="doExport"
        @template="doTemplate"
        @import="doImport"
      />
      <button
        v-if="hasAny('products.create')"
        type="button"
        class="btn btn-primary btn-sm"
        @click="router.push('/admin/products/create')"
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
      :loading="table.loading.value || importing"
      :sort-by="table.sortBy.value"
      :sort-dir="table.sortDir.value"
      :page="table.page.value"
      :last-page="table.lastPage.value"
      :total="table.total.value"
      @sort="table.setSort"
      @page-change="table.setPage"
    >
      <template #cell-product_type="{ value }">
        <span class="badge">{{ value }}</span>
      </template>
      <template #cell-model_name="{ item }">
        <RouterLink :to="{ name: 'products-show', params: { id: (item as Product).id } }" class="link">
          {{ (item as Product).model_name ?? `#${(item as Product).id}` }}
        </RouterLink>
      </template>
      <template #cell-created_at="{ value }">{{ formatDate(value as string) }}</template>
      <template #actions="{ item }">
        <button
          type="button"
          class="btn-icon"
          :title="t('common.view')"
          @click="router.push(`/admin/products/${(item as Product).id}`)"
        >
          <Icon icon="solar:eye-linear" />
        </button>
        <button
          v-if="hasAny('products.update')"
          type="button"
          class="btn-icon"
          @click="router.push(`/admin/products/${(item as Product).id}/edit`)"
        >
          <Icon icon="solar:pen-linear" />
        </button>
        <button
          v-if="hasAny('products.delete')"
          type="button"
          class="btn-icon danger"
          @click="remove(item as Product)"
        >
          <Icon icon="solar:trash-bin-trash-linear" />
        </button>
      </template>
    </DataTable>
  </PageCard>
</template>
