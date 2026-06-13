<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { Icon } from '@iconify/vue'
import PageCard from '@/components/ui/PageCard.vue'
import DataTable from '@/components/ui/DataTable.vue'
import Modal from '@/components/ui/Modal.vue'
import { installmentRatesApi, type InstallmentRate } from '@/api/installmentRates'
import { useDataTable } from '@/composables/useDataTable'
import { usePermissions } from '@/composables/usePermissions'
import { useNotify } from '@/composables/useNotify'
import { getApiErrorMessage } from '@/utils/apiError'
import { formatDate } from '@/utils/format'

const { t } = useI18n()
const { hasAny } = usePermissions()
const { success, error: notifyError, confirm } = useNotify()
const table = useDataTable<InstallmentRate>((p) => installmentRatesApi.list(p), 'installment_month')

const showModal = ref(false)
const editing = ref<InstallmentRate | null>(null)
const saving = ref(false)
const form = ref({ installment_month: 1, installment_rate: 0 })

const columns = [
  { key: 'installment_month', label: t('installmentRates.month'), sortable: true },
  { key: 'installment_rate', label: t('installmentRates.rate'), sortable: true },
  { key: 'created_at', label: t('common.createdAt'), sortable: true },
]

function openCreate() {
  editing.value = null
  form.value = { installment_month: 1, installment_rate: 0 }
  showModal.value = true
}

function openEdit(rate: InstallmentRate) {
  editing.value = rate
  form.value = {
    installment_month: rate.installment_month,
    installment_rate: rate.installment_rate,
  }
  showModal.value = true
}

async function save() {
  saving.value = true
  try {
    if (editing.value) {
      await installmentRatesApi.update(editing.value.id, form.value)
      success(t('installmentRates.updated'))
    } else {
      await installmentRatesApi.create(form.value)
      success(t('installmentRates.created'))
    }
    showModal.value = false
    table.refresh()
  } catch (e) {
    notifyError(getApiErrorMessage(e))
  } finally {
    saving.value = false
  }
}

async function remove(rate: InstallmentRate) {
  if (!(await confirm(t('installmentRates.deleteConfirm', { month: rate.installment_month })))) return
  try {
    await installmentRatesApi.delete(rate.id)
    success(t('installmentRates.deleted'))
    table.refresh()
  } catch (e) {
    notifyError(getApiErrorMessage(e))
  }
}
</script>

<template>
  <PageCard :title="t('pages.installmentPlan.title')" :subtitle="t('pages.installmentPlan.description')">
    <template #actions>
      <button v-if="hasAny('installment_rate.manage')" type="button" class="btn btn-primary btn-sm" @click="openCreate">
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
      <template #cell-installment_month="{ value }">{{ value }} {{ t('installmentRates.months') }}</template>
      <template #cell-installment_rate="{ value }">{{ value }}%</template>
      <template #cell-created_at="{ value }">{{ formatDate(value as string) }}</template>
      <template #actions="{ item }">
        <button
          v-if="hasAny('installment_rate.manage')"
          type="button"
          class="btn-icon"
          @click="openEdit(item as InstallmentRate)"
        >
          <Icon icon="solar:pen-linear" />
        </button>
        <button
          v-if="hasAny('installment_rate.manage')"
          type="button"
          class="btn-icon danger"
          @click="remove(item as InstallmentRate)"
        >
          <Icon icon="solar:trash-bin-trash-linear" />
        </button>
      </template>
    </DataTable>
  </PageCard>

  <Modal
    :show="showModal"
    :title="editing ? t('installmentRates.edit') : t('installmentRates.create')"
    @close="showModal = false"
  >
    <div class="form-grid">
      <div class="form-group">
        <label>{{ t('installmentRates.month') }} *</label>
        <input v-model.number="form.installment_month" type="number" min="1" max="60" required />
      </div>
      <div class="form-group">
        <label>{{ t('installmentRates.rate') }} (%) *</label>
        <input v-model.number="form.installment_rate" type="number" min="0" max="100" step="0.01" required />
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
