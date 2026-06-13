<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { Icon } from '@iconify/vue'
import PageCard from '@/components/ui/PageCard.vue'
import DataTable from '@/components/ui/DataTable.vue'
import Modal from '@/components/ui/Modal.vue'
import ColorPicker from '@/components/ui/ColorPicker.vue'
import ImageCropInput from '@/components/ui/ImageCropInput.vue'
import { brandsApi, type Brand } from '@/api/brands'
import { useDataTable } from '@/composables/useDataTable'
import { usePermissions } from '@/composables/usePermissions'
import { useNotify } from '@/composables/useNotify'
import { getApiErrorMessage } from '@/utils/apiError'
import { formatDate } from '@/utils/format'

const { t } = useI18n()
const { hasAny } = usePermissions()
const { success, error: notifyError, confirm } = useNotify()

const table = useDataTable<Brand>((p) => brandsApi.list(p), 'created_at')

const showModal = ref(false)
const editing = ref<Brand | null>(null)
const saving = ref(false)
const form = ref({ brand_name: '', color: '' })
const logoFile = ref<File | null>(null)
const logoPreview = ref('')

const columns = [
  { key: 'color', label: t('brands.color') },
  { key: 'logo_url', label: t('brands.logo') },
  { key: 'brand_name', label: t('brands.name'), sortable: true },
  { key: 'products_count', label: t('brands.productCount'), sortable: true },
  { key: 'created_at', label: t('common.createdAt'), sortable: true },
]

function openCreate() {
  editing.value = null
  form.value = { brand_name: '', color: '' }
  logoFile.value = null
  logoPreview.value = ''
  showModal.value = true
}

function openEdit(brand: Brand) {
  editing.value = brand
  form.value = { brand_name: brand.brand_name, color: brand.color || '' }
  logoFile.value = null
  logoPreview.value = brand.logo_url || ''
  showModal.value = true
}

function onLogoSelected(files: File[]) {
  const file = files[0]
  if (!file) return
  logoFile.value = file
  logoPreview.value = URL.createObjectURL(file)
}

async function save() {
  saving.value = true
  try {
    const fd = new FormData()
    fd.append('brand_name', form.value.brand_name)
    if (form.value.color) fd.append('color', form.value.color)
    if (logoFile.value) fd.append('logo', logoFile.value)
    if (editing.value) {
      await brandsApi.update(editing.value.id, fd)
      success(t('brands.updated'))
    } else {
      await brandsApi.create(fd)
      success(t('brands.created'))
    }
    showModal.value = false
    table.refresh()
  } catch (e) {
    notifyError(getApiErrorMessage(e))
  } finally {
    saving.value = false
  }
}

async function remove(brand: Brand) {
  if (!(await confirm(t('brands.deleteConfirm', { name: brand.brand_name })))) return
  try {
    await brandsApi.delete(brand.id)
    success(t('brands.deleted'))
    table.refresh()
  } catch (e) {
    notifyError(getApiErrorMessage(e))
  }
}
</script>

<template>
  <PageCard :title="t('pages.brands.title')" :subtitle="t('pages.brands.description')">
    <template #actions>
      <button v-if="hasAny('brands.create')" type="button" class="btn btn-primary btn-sm" @click="openCreate">
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
      <template #cell-color="{ item }">
        <span class="color-swatch" :style="{ backgroundColor: (item as Brand).color || '#ccc' }" />
      </template>
      <template #cell-logo_url="{ item }">
        <img v-if="(item as Brand).logo_url" :src="(item as Brand).logo_url!" class="table-thumb" alt="" />
        <span v-else>—</span>
      </template>
      <template #cell-created_at="{ value }">{{ formatDate(value as string) }}</template>
      <template #actions="{ item }">
        <button
          v-if="hasAny('brands.update')"
          type="button"
          class="btn-icon"
          @click="openEdit(item as Brand)"
        >
          <Icon icon="solar:pen-linear" />
        </button>
        <button
          v-if="hasAny('brands.delete')"
          type="button"
          class="btn-icon danger"
          @click="remove(item as Brand)"
        >
          <Icon icon="solar:trash-bin-trash-linear" />
        </button>
      </template>
    </DataTable>
  </PageCard>

  <Modal :show="showModal" :title="editing ? t('brands.edit') : t('brands.create')" @close="showModal = false">
    <div class="form-grid">
      <div class="form-group">
        <label>{{ t('brands.name') }} *</label>
        <input v-model="form.brand_name" type="text" required />
      </div>
      <div class="form-group">
        <label>{{ t('brands.color') }}</label>
        <ColorPicker v-model="form.color" />
      </div>
      <div class="form-group">
        <label>{{ t('brands.logo') }}</label>
        <ImageCropInput @select="onLogoSelected" />
        <img v-if="logoPreview" :src="logoPreview" class="preview-img" alt="" />
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
