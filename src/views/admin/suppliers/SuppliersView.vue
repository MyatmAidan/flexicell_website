<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { Icon } from '@iconify/vue'
import PageCard from '@/components/ui/PageCard.vue'
import DataTable from '@/components/ui/DataTable.vue'
import Modal from '@/components/ui/Modal.vue'
import { suppliersApi, type Supplier } from '@/api/suppliers'
import { useDataTable } from '@/composables/useDataTable'
import { usePermissions } from '@/composables/usePermissions'
import { useNotify } from '@/composables/useNotify'
import { getApiErrorMessage } from '@/utils/apiError'
import { formatCurrency, formatDate } from '@/utils/format'

const { t } = useI18n()
const router = useRouter()
const { hasAny } = usePermissions()
const { success, error: notifyError, confirm } = useNotify()
const table = useDataTable<Supplier>((p) => suppliersApi.list(p))

const showModal = ref(false)
const editing = ref<Supplier | null>(null)
const saving = ref(false)
const form = ref({ company_name: '', phone: '', address: '' })

const columns = [
  { key: 'company_name', label: t('suppliers.companyName'), sortable: true },
  { key: 'phone', label: t('suppliers.phone') },
  { key: 'address', label: t('suppliers.address') },
  { key: 'debt_total', label: t('suppliers.debtTotal'), sortable: true },
  { key: 'purchases_count', label: t('suppliers.purchases') },
  { key: 'created_at', label: t('common.createdAt'), sortable: true },
]

function openCreate() {
  editing.value = null
  form.value = { company_name: '', phone: '', address: '' }
  showModal.value = true
}

function openEdit(supplier: Supplier) {
  editing.value = supplier
  form.value = {
    company_name: supplier.company_name,
    phone: supplier.phone || '',
    address: supplier.address || '',
  }
  showModal.value = true
}

async function save() {
  saving.value = true
  try {
    if (editing.value) {
      await suppliersApi.update(editing.value.id, form.value)
      success(t('suppliers.updated'))
    } else {
      await suppliersApi.create(form.value)
      success(t('suppliers.created'))
    }
    showModal.value = false
    table.refresh()
  } catch (e) {
    notifyError(getApiErrorMessage(e))
  } finally {
    saving.value = false
  }
}

async function remove(supplier: Supplier) {
  if (!(await confirm(t('suppliers.deleteConfirm', { name: supplier.company_name })))) return
  try {
    await suppliersApi.delete(supplier.id)
    success(t('suppliers.deleted'))
    table.refresh()
  } catch (e) {
    notifyError(getApiErrorMessage(e))
  }
}
</script>

<template>
  <PageCard :title="t('pages.suppliers.title')" :subtitle="t('pages.suppliers.description')">
    <template #actions>
      <button v-if="hasAny('suppliers.create')" type="button" class="btn btn-primary btn-sm" @click="openCreate">
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
      <template #cell-company_name="{ item }">
        <RouterLink :to="`/suppliers/${(item as Supplier).id}`" class="link">
          {{ (item as Supplier).company_name }}
        </RouterLink>
      </template>
      <template #cell-debt_total="{ value }">{{ formatCurrency(value as number) }}</template>
      <template #cell-created_at="{ value }">{{ formatDate(value as string) }}</template>
      <template #actions="{ item }">
        <button type="button" class="btn-icon" @click="router.push(`/admin/suppliers/${(item as Supplier).id}`)">
          <Icon icon="solar:eye-linear" />
        </button>
        <button v-if="hasAny('suppliers.update')" type="button" class="btn-icon" @click="openEdit(item as Supplier)">
          <Icon icon="solar:pen-linear" />
        </button>
        <button v-if="hasAny('suppliers.delete')" type="button" class="btn-icon danger" @click="remove(item as Supplier)">
          <Icon icon="solar:trash-bin-trash-linear" />
        </button>
      </template>
    </DataTable>
  </PageCard>

  <Modal :show="showModal" :title="editing ? t('suppliers.edit') : t('suppliers.create')" size="lg" @close="showModal = false">
    <div class="form-grid two-col">
      <div class="form-group">
        <label>{{ t('suppliers.companyName') }} *</label>
        <input v-model="form.company_name" type="text" required />
      </div>
      <div class="form-group">
        <label>{{ t('suppliers.phone') }}</label>
        <input v-model="form.phone" type="text" />
      </div>
      <div class="form-group full">
        <label>{{ t('suppliers.address') }}</label>
        <textarea v-model="form.address" rows="2" />
      </div>
    </div>
    <template #footer>
      <button type="button" class="btn btn-outline" @click="showModal = false">{{ t('common.cancel') }}</button>
      <button type="button" class="btn btn-primary" :disabled="saving" @click="save">
        {{ saving ? t('common.loading') : t('common.save') }}
      </button>
    </template>
  </Modal>
</template>
