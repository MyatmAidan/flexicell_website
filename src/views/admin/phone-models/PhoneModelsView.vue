<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { Icon } from '@iconify/vue'
import PageCard from '@/components/ui/PageCard.vue'
import DataTable from '@/components/ui/DataTable.vue'
import ExcelToolbar from '@/components/ui/ExcelToolbar.vue'
import { phoneModelsApi, type PhoneModel } from '@/api/phoneModels'
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
const table = useDataTable<PhoneModel>((p) => phoneModelsApi.list(p), 'created_at')
const importing = ref(false)

const columns = [
  { key: 'model_name', label: t('phoneModels.name'), sortable: true },
  { key: 'brand_name', label: t('phoneModels.brand') },
  { key: 'category_name', label: t('phoneModels.category') },
  { key: 'processor', label: t('phoneModels.processor') },
  { key: 'battery_capacity', label: t('phoneModels.battery') },
  { key: 'release_year', label: t('phoneModels.releaseYear') },
  { key: 'created_at', label: t('common.createdAt'), sortable: true },
]

async function doExport() {
  try {
    await downloadFile('/phone-models/export', 'phone-models.xlsx')
  } catch (e) {
    notifyError(getApiErrorMessage(e))
  }
}

async function doTemplate() {
  try {
    await downloadFile('/phone-models/template', 'phone-models-template.xlsx')
  } catch (e) {
    notifyError(getApiErrorMessage(e))
  }
}

async function doImport(file: File) {
  importing.value = true
  try {
    const fd = new FormData()
    fd.append('file', file)
    await apiPostForm('/phone-models/import', fd)
    success(t('phoneModels.imported'))
    table.refresh()
  } catch (e) {
    notifyError(getApiErrorMessage(e))
  } finally {
    importing.value = false
  }
}

async function remove(model: PhoneModel) {
  if (!(await confirm(t('phoneModels.deleteConfirm', { name: model.model_name })))) return
  try {
    await phoneModelsApi.delete(model.id)
    success(t('phoneModels.deleted'))
    table.refresh()
  } catch (e) {
    notifyError(getApiErrorMessage(e))
  }
}
</script>

<template>
  <PageCard :title="t('pages.phoneModels.title')" :subtitle="t('pages.phoneModels.description')">
    <template #actions>
      <ExcelToolbar
        :can-export="hasAny('phone_models.view')"
        :can-import="hasAny('phone_models.create')"
        @export="doExport"
        @template="doTemplate"
        @import="doImport"
      />
      <button
        v-if="hasAny('phone_models.create')"
        type="button"
        class="btn btn-primary btn-sm"
        @click="router.push('/admin/phone-models/create')"
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
      <template #cell-model_name="{ item }">
        <RouterLink :to="`/phone-models/${(item as PhoneModel).id}`" class="link">
          {{ (item as PhoneModel).model_name }}
        </RouterLink>
      </template>
      <template #cell-created_at="{ value }">{{ formatDate(value as string) }}</template>
      <template #actions="{ item }">
        <button type="button" class="btn-icon" @click="router.push(`/admin/phone-models/${(item as PhoneModel).id}`)">
          <Icon icon="solar:eye-linear" />
        </button>
        <button
          v-if="hasAny('phone_models.update')"
          type="button"
          class="btn-icon"
          @click="router.push(`/admin/phone-models/${(item as PhoneModel).id}/edit`)"
        >
          <Icon icon="solar:pen-linear" />
        </button>
        <button
          v-if="hasAny('phone_models.delete')"
          type="button"
          class="btn-icon danger"
          @click="remove(item as PhoneModel)"
        >
          <Icon icon="solar:trash-bin-trash-linear" />
        </button>
      </template>
    </DataTable>
  </PageCard>
</template>
