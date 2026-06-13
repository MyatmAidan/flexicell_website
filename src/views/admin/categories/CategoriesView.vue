<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { Icon } from '@iconify/vue'
import PageCard from '@/components/ui/PageCard.vue'
import DataTable from '@/components/ui/DataTable.vue'
import Modal from '@/components/ui/Modal.vue'
import ColorPicker from '@/components/ui/ColorPicker.vue'
import { categoriesApi, type Category } from '@/api/categories'
import { useDataTable } from '@/composables/useDataTable'
import { usePermissions } from '@/composables/usePermissions'
import { useNotify } from '@/composables/useNotify'
import { getApiErrorMessage } from '@/utils/apiError'
import { formatDate } from '@/utils/format'

const { t } = useI18n()
const { hasAny } = usePermissions()
const { success, error: notifyError, confirm } = useNotify()
const table = useDataTable<Category>((p) => categoriesApi.list(p))

const showModal = ref(false)
const editing = ref<Category | null>(null)
const saving = ref(false)
const form = ref({ category_name: '', color: '' })

const columns = [
  { key: 'color', label: t('categories.color') },
  { key: 'category_name', label: t('categories.name'), sortable: true },
  { key: 'products_count', label: t('categories.productCount') },
  { key: 'created_at', label: t('common.createdAt'), sortable: true },
]

function openCreate() {
  editing.value = null
  form.value = { category_name: '', color: '' }
  showModal.value = true
}

function openEdit(cat: Category) {
  editing.value = cat
  form.value = { category_name: cat.category_name, color: cat.color || '' }
  showModal.value = true
}

async function save() {
  saving.value = true
  try {
    const payload = { ...form.value }
    if (editing.value) {
      await categoriesApi.update(editing.value.id, payload)
      success(t('categories.updated'))
    } else {
      await categoriesApi.create(payload)
      success(t('categories.created'))
    }
    showModal.value = false
    table.refresh()
  } catch (e) {
    notifyError(getApiErrorMessage(e))
  } finally {
    saving.value = false
  }
}

async function remove(cat: Category) {
  if (!(await confirm(t('categories.deleteConfirm', { name: cat.category_name })))) return
  try {
    await categoriesApi.delete(cat.id)
    success(t('categories.deleted'))
    table.refresh()
  } catch (e) {
    notifyError(getApiErrorMessage(e))
  }
}
</script>

<template>
  <PageCard :title="t('pages.categories.title')" :subtitle="t('pages.categories.description')">
    <template #actions>
      <button v-if="hasAny('categories.create')" type="button" class="btn btn-primary btn-sm" @click="openCreate">
        <Icon icon="solar:add-circle-linear" /> {{ t('common.create') }}
      </button>
    </template>
    <div class="table-toolbar">
      <input type="search" class="search-input" :placeholder="t('common.search')" @input="table.setSearch(($event.target as HTMLInputElement).value)" />
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
      <template #cell-color="{ item }">
        <span class="color-swatch" :style="{ backgroundColor: (item as Category).color || '#ccc' }" />
      </template>
      <template #cell-created_at="{ value }">{{ formatDate(value as string) }}</template>
      <template #actions="{ item }">
        <button v-if="hasAny('categories.update')" type="button" class="btn-icon" @click="openEdit(item as Category)">
          <Icon icon="solar:pen-linear" />
        </button>
        <button v-if="hasAny('categories.delete')" type="button" class="btn-icon danger" @click="remove(item as Category)">
          <Icon icon="solar:trash-bin-trash-linear" />
        </button>
      </template>
    </DataTable>
  </PageCard>

  <Modal :show="showModal" :title="editing ? t('categories.edit') : t('categories.create')" @close="showModal = false">
    <div class="form-grid">
      <div class="form-group">
        <label>{{ t('categories.name') }} *</label>
        <input v-model="form.category_name" type="text" required />
      </div>
      <div class="form-group">
        <label>{{ t('categories.color') }}</label>
        <ColorPicker v-model="form.color" />
      </div>
    </div>
    <template #footer>
      <button type="button" class="btn btn-outline" @click="showModal = false">{{ t('common.cancel') }}</button>
      <button type="button" class="btn btn-primary" :disabled="saving" @click="save">{{ t('common.save') }}</button>
    </template>
  </Modal>
</template>
