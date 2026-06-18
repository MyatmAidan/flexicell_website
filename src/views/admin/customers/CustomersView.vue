<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { Icon } from '@iconify/vue'
import PageCard from '@/components/ui/PageCard.vue'
import DataTable from '@/components/ui/DataTable.vue'
import Modal from '@/components/ui/Modal.vue'
import { customersApi, type Customer } from '@/api/customers'
import { useDataTable } from '@/composables/useDataTable'
import { usePermissions } from '@/composables/usePermissions'
import { useNotify } from '@/composables/useNotify'
import { getApiErrorMessage } from '@/utils/apiError'
import { formatDate } from '@/utils/format'

const { t } = useI18n()
const router = useRouter()
const { hasAny } = usePermissions()
const { success, error: notifyError, confirm } = useNotify()
const table = useDataTable<Customer>((p) => customersApi.list(p))

const showModal = ref(false)
const editing = ref<Customer | null>(null)
const saving = ref(false)
const form = ref({ name: '', phone: '', email: '', address: '', points: 0 })

const columns = [
  { key: 'name', label: t('customers.name'), sortable: true },
  { key: 'phone', label: t('customers.phone') },
  { key: 'email', label: t('customers.email') },
  { key: 'address', label: t('customers.address') },
  { key: 'account_type', label: t('customers.account') },
  { key: 'points', label: t('customers.points'), sortable: true },
  { key: 'orders_count', label: t('customers.orders') },
  { key: 'created_at', label: t('common.createdAt'), sortable: true },
]

function openCreate() {
  editing.value = null
  form.value = { name: '', phone: '', email: '', address: '', points: 0 }
  showModal.value = true
}

function openEdit(c: Customer) {
  editing.value = c
  form.value = { name: c.name, phone: c.phone || '', email: c.email || '', address: c.address || '', points: c.points }
  showModal.value = true
}

async function save() {
  saving.value = true
  try {
    if (editing.value) {
      await customersApi.update(editing.value.id, form.value)
      success(t('customers.updated'))
    } else {
      await customersApi.create(form.value)
      success(t('customers.created'))
    }
    showModal.value = false
    table.refresh()
  } catch (e) {
    notifyError(getApiErrorMessage(e))
  } finally {
    saving.value = false
  }
}

async function remove(c: Customer) {
  if (!(await confirm(t('customers.deleteConfirm', { name: c.name })))) return
  try {
    await customersApi.delete(c.id)
    success(t('customers.deleted'))
    table.refresh()
  } catch (e) {
    notifyError(getApiErrorMessage(e))
  }
}
</script>

<template>
  <PageCard :title="t('pages.customers.title')" :subtitle="t('pages.customers.description')">
    <template #actions>
      <button v-if="hasAny('customers.create')" type="button" class="btn btn-primary btn-sm" @click="openCreate">
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
      <template #cell-name="{ item }">
        <RouterLink :to="{ name: 'customer-show', params: { id: (item as Customer).id } }" class="link">{{ (item as Customer).name }}</RouterLink>
      </template>
      <template #cell-account_type="{ value }">
        <span class="badge">{{ value }}</span>
      </template>
      <template #cell-created_at="{ value }">{{ formatDate(value as string) }}</template>
      <template #actions="{ item }">
        <button type="button" class="btn-icon" @click="router.push(`/admin/customers/${(item as Customer).id}`)">
          <Icon icon="solar:eye-linear" />
        </button>
        <button v-if="hasAny('customers.update')" type="button" class="btn-icon" @click="openEdit(item as Customer)">
          <Icon icon="solar:pen-linear" />
        </button>
        <button v-if="hasAny('customers.delete')" type="button" class="btn-icon danger" @click="remove(item as Customer)">
          <Icon icon="solar:trash-bin-trash-linear" />
        </button>
      </template>
    </DataTable>
  </PageCard>

  <Modal :show="showModal" :title="editing ? t('customers.edit') : t('customers.create')" size="lg" @close="showModal = false">
    <div class="form-grid two-col">
      <div class="form-group"><label>{{ t('customers.name') }} *</label><input v-model="form.name" required /></div>
      <div class="form-group"><label>{{ t('customers.phone') }}</label><input v-model="form.phone" /></div>
      <div class="form-group"><label>{{ t('customers.email') }}</label><input v-model="form.email" type="email" /></div>
      <div class="form-group"><label>{{ t('customers.points') }}</label><input v-model.number="form.points" type="number" min="0" /></div>
      <div class="form-group full"><label>{{ t('customers.address') }}</label><textarea v-model="form.address" rows="2" /></div>
    </div>
    <template #footer>
      <button type="button" class="btn btn-outline" @click="showModal = false">{{ t('common.cancel') }}</button>
      <button type="button" class="btn btn-primary" :disabled="saving" @click="save">{{ t('common.save') }}</button>
    </template>
  </Modal>
</template>
