<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { Icon } from '@iconify/vue'
import PageCard from '@/components/ui/PageCard.vue'
import DataTable from '@/components/ui/DataTable.vue'
import Modal from '@/components/ui/Modal.vue'
import ImageCropInput from '@/components/ui/ImageCropInput.vue'
import ExcelToolbar from '@/components/ui/ExcelToolbar.vue'
import { devicesApi, type Device } from '@/api/devices'
import { productsApi, type Product } from '@/api/products'
import { downloadFile, apiPostForm } from '@/api/client'
import { useDataTable } from '@/composables/useDataTable'
import { useVariantOptions } from '@/composables/useVariantOptions'
import { usePermissions } from '@/composables/usePermissions'
import { useNotify } from '@/composables/useNotify'
import { getApiErrorMessage } from '@/utils/apiError'
import { formatCurrency, formatDate } from '@/utils/format'

const { t } = useI18n()
const { hasAny } = usePermissions()
const { success, error: notifyError, confirm } = useNotify()
const { ramOptions, storageOptions, colorOptions, warranties } = useVariantOptions()

const table = useDataTable<Device>((p) => devicesApi.list(p), 'created_at')
const importing = ref(false)
const showModal = ref(false)
const saving = ref(false)
const editing = ref<Device | null>(null)
const products = ref<Product[]>([])
const imageFiles = ref<File[]>([])
const imagePreviews = ref<string[]>([])

const form = ref({
  product_id: '' as string | number,
  imei: '',
  ram_option_id: '' as string | number,
  storage_option_id: '' as string | number,
  color_option_id: '' as string | number,
  battery_percentage: 100,
  condition_grade: 'NEW',
  status: 'available',
  purchase_price: '' as string | number,
  selling_price: '' as string | number,
  warranty_id: '' as string | number,
})

const statusOptions = ['available', 'sold', 'reserved', 'defective']
const conditionOptions = ['NEW', 'A', 'B', 'C', 'D']

const columns = [
  { key: 'product_name', label: t('devices.product') },
  { key: 'brand_name', label: t('devices.brand') },
  { key: 'imei', label: t('devices.imei'), sortable: true },
  { key: 'ram_value', label: t('devices.ram') },
  { key: 'storage_value', label: t('devices.storage') },
  { key: 'color_value', label: t('devices.color') },
  { key: 'battery_percentage', label: t('devices.battery') },
  { key: 'condition_grade', label: t('devices.condition') },
  { key: 'status', label: t('common.status') },
  { key: 'selling_price', label: t('devices.sellingPrice') },
  { key: 'created_at', label: t('common.createdAt'), sortable: true },
]

async function loadProducts() {
  const res = await productsApi.list({ per_page: 500, page: 1 })
  if (res.success) products.value = res.data ?? []
}

async function doExport() {
  try {
    await downloadFile('/devices/export', 'devices.xlsx')
  } catch (e) {
    notifyError(getApiErrorMessage(e))
  }
}

async function doTemplate() {
  try {
    await downloadFile('/devices/template', 'devices-template.xlsx')
  } catch (e) {
    notifyError(getApiErrorMessage(e))
  }
}

async function doImport(file: File) {
  importing.value = true
  try {
    const fd = new FormData()
    fd.append('file', file)
    await apiPostForm('/devices/import', fd)
    success(t('devices.imported'))
    table.refresh()
  } catch (e) {
    notifyError(getApiErrorMessage(e))
  } finally {
    importing.value = false
  }
}

function resetForm() {
  form.value = {
    product_id: '',
    imei: '',
    ram_option_id: '',
    storage_option_id: '',
    color_option_id: '',
    battery_percentage: 100,
    condition_grade: 'NEW',
    status: 'available',
    purchase_price: '',
    selling_price: '',
    warranty_id: '',
  }
  imageFiles.value = []
  imagePreviews.value = []
}

async function openEdit(device: Device) {
  editing.value = device
  resetForm()
  try {
    const res = await devicesApi.get(device.id)
    const d = res.data
    if (d) {
      form.value = {
        product_id: d.product_id,
        imei: d.imei,
        ram_option_id: d.ram_option_id ?? '',
        storage_option_id: d.storage_option_id ?? '',
        color_option_id: d.color_option_id ?? '',
        battery_percentage: d.battery_percentage ?? 100,
        condition_grade: d.condition_grade ?? 'NEW',
        status: d.status,
        purchase_price: d.purchase_price ?? '',
        selling_price: d.selling_price ?? '',
        warranty_id: d.warranty_id ?? '',
      }
    }
  } catch (e) {
    notifyError(getApiErrorMessage(e))
  }
  showModal.value = true
}

function onImagesSelected(files: File[]) {
  imageFiles.value = files
  imagePreviews.value = files.map((f) => URL.createObjectURL(f))
}

async function save() {
  if (!editing.value) return
  saving.value = true
  try {
    const fd = new FormData()
    fd.append('product_id', String(form.value.product_id))
    fd.append('imei', form.value.imei)
    fd.append('ram_option_id', String(form.value.ram_option_id))
    fd.append('storage_option_id', String(form.value.storage_option_id))
    fd.append('color_option_id', String(form.value.color_option_id))
    fd.append('battery_percentage', String(form.value.battery_percentage))
    fd.append('condition_grade', form.value.condition_grade)
    fd.append('status', form.value.status)
    if (form.value.purchase_price !== '') fd.append('purchase_price', String(form.value.purchase_price))
    if (form.value.selling_price !== '') fd.append('selling_price', String(form.value.selling_price))
    if (form.value.warranty_id) fd.append('warranty_id', String(form.value.warranty_id))
    imageFiles.value.forEach((file, i) => fd.append(`image[${i}]`, file))

    await devicesApi.update(editing.value.id, fd)
    success(t('devices.updated'))
    showModal.value = false
    table.refresh()
  } catch (e) {
    notifyError(getApiErrorMessage(e))
  } finally {
    saving.value = false
  }
}

async function remove(device: Device) {
  if (!(await confirm(t('devices.deleteConfirm', { imei: device.imei })))) return
  try {
    await devicesApi.delete(device.id)
    success(t('devices.deleted'))
    table.refresh()
  } catch (e) {
    notifyError(getApiErrorMessage(e))
  }
}

loadProducts()
</script>

<template>
  <PageCard :title="t('pages.devices.title')" :subtitle="t('pages.devices.description')">
    <template #actions>
      <ExcelToolbar
        :can-export="hasAny('devices.view')"
        :can-import="hasAny('devices.create')"
        @export="doExport"
        @template="doTemplate"
        @import="doImport"
      />
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
      <template #cell-ram_value="{ item }">{{ (item as Device).ram_value ?? (item as Device & { ram?: string }).ram ?? '—' }}</template>
      <template #cell-storage_value="{ item }">{{ (item as Device).storage_value ?? (item as Device & { storage?: string }).storage ?? '—' }}</template>
      <template #cell-color_value="{ item }">{{ (item as Device).color_value ?? (item as Device & { color?: string }).color ?? '—' }}</template>
      <template #cell-status="{ value }"><span class="badge">{{ value }}</span></template>
      <template #cell-selling_price="{ value }">{{ value != null ? formatCurrency(value as number) : '—' }}</template>
      <template #cell-created_at="{ value }">{{ formatDate(value as string) }}</template>
      <template #actions="{ item }">
        <button v-if="hasAny('devices.update')" type="button" class="btn-icon" @click="openEdit(item as Device)">
          <Icon icon="solar:pen-linear" />
        </button>
        <button v-if="hasAny('devices.delete')" type="button" class="btn-icon danger" @click="remove(item as Device)">
          <Icon icon="solar:trash-bin-trash-linear" />
        </button>
      </template>
    </DataTable>
  </PageCard>

  <Modal :show="showModal" :title="t('devices.edit')" size="xl" @close="showModal = false">
    <div class="form-grid two-col">
      <div class="form-group">
        <label>{{ t('devices.product') }} *</label>
        <select v-model="form.product_id" required>
          <option value="">{{ t('common.select') }}</option>
          <option v-for="p in products" :key="p.id" :value="p.id">
            {{ p.model_name }} ({{ p.product_type }})
          </option>
        </select>
      </div>
      <div class="form-group">
        <label>{{ t('devices.imei') }} *</label>
        <input v-model="form.imei" type="text" required />
      </div>
      <div class="form-group">
        <label>{{ t('devices.ram') }} *</label>
        <select v-model="form.ram_option_id" required>
          <option value="">{{ t('common.select') }}</option>
          <option v-for="o in ramOptions" :key="o.id" :value="o.id">{{ o.value || o.name }}</option>
        </select>
      </div>
      <div class="form-group">
        <label>{{ t('devices.storage') }} *</label>
        <select v-model="form.storage_option_id" required>
          <option value="">{{ t('common.select') }}</option>
          <option v-for="o in storageOptions" :key="o.id" :value="o.id">{{ o.value || o.name }}</option>
        </select>
      </div>
      <div class="form-group">
        <label>{{ t('devices.color') }} *</label>
        <select v-model="form.color_option_id" required>
          <option value="">{{ t('common.select') }}</option>
          <option v-for="o in colorOptions" :key="o.id" :value="o.id">{{ o.name }} ({{ o.value }})</option>
        </select>
      </div>
      <div class="form-group">
        <label>{{ t('devices.battery') }} *</label>
        <input v-model.number="form.battery_percentage" type="number" min="0" max="100" required />
      </div>
      <div class="form-group">
        <label>{{ t('devices.condition') }} *</label>
        <select v-model="form.condition_grade" required>
          <option v-for="c in conditionOptions" :key="c" :value="c">{{ c }}</option>
        </select>
      </div>
      <div class="form-group">
        <label>{{ t('common.status') }}</label>
        <select v-model="form.status">
          <option v-for="s in statusOptions" :key="s" :value="s">{{ s }}</option>
        </select>
      </div>
      <div class="form-group">
        <label>{{ t('devices.purchasePrice') }}</label>
        <input v-model="form.purchase_price" type="number" min="0" />
      </div>
      <div class="form-group">
        <label>{{ t('devices.sellingPrice') }}</label>
        <input v-model="form.selling_price" type="number" min="0" />
      </div>
      <div class="form-group">
        <label>{{ t('devices.warranty') }}</label>
        <select v-model="form.warranty_id">
          <option value="">{{ t('products.noWarranty') }}</option>
          <option v-for="w in warranties" :key="w.id" :value="w.id">
            {{ w.warranty_month }} {{ t('products.months') }}
          </option>
        </select>
      </div>
      <div class="form-group full">
        <label>{{ t('devices.image') }}</label>
        <ImageCropInput multiple @select="onImagesSelected" />
        <div class="image-preview-row">
          <img v-for="(url, i) in imagePreviews" :key="i" :src="url" class="preview-img" alt="" />
        </div>
      </div>
    </div>
    <template #footer>
      <button type="button" class="btn btn-outline" @click="showModal = false">{{ t('common.cancel') }}</button>
      <button type="button" class="btn btn-primary" :disabled="saving" @click="save">{{ t('common.save') }}</button>
    </template>
  </Modal>
</template>
