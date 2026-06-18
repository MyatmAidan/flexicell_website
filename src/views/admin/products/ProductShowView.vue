<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { Icon } from '@iconify/vue'
import PageCard from '@/components/ui/PageCard.vue'
import DataTable from '@/components/ui/DataTable.vue'
import Modal from '@/components/ui/Modal.vue'
import ImageCropInput from '@/components/ui/ImageCropInput.vue'
import { productsApi, type Product } from '@/api/products'
import { devicesApi, type Device } from '@/api/devices'
import { useDataTable } from '@/composables/useDataTable'
import { useVariantOptions } from '@/composables/useVariantOptions'
import { usePermissions } from '@/composables/usePermissions'
import { useNotify } from '@/composables/useNotify'
import { getApiErrorMessage } from '@/utils/apiError'
import { formatCurrency, formatDate, formatDateTime } from '@/utils/format'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const { hasAny } = usePermissions()
const { success, error: notifyError } = useNotify()
const { ramOptions, storageOptions, colorOptions, warranties } = useVariantOptions()

const id = computed(() => Number(route.params.id))
const loadingProduct = ref(true)
const product = ref<Product | null>(null)

const table = useDataTable<Device>(
  (p) => devicesApi.list({ ...p, product_id: id.value }),
  'created_at',
)

const showViewModal = ref(false)
const showEditModal = ref(false)
const saving = ref(false)
const viewing = ref<Device | null>(null)
const editing = ref<Device | null>(null)
const imageFiles = ref<File[]>([])
const imagePreviews = ref<string[]>([])
const existingImages = ref<string[]>([])

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

const productTitle = computed(() => {
  if (!product.value) return t('products.detail')
  const name = product.value.model_name ?? `#${product.value.id}`
  return `${name} (${product.value.product_type})`
})

const deviceColumns = [
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

function deviceRam(device: Device) {
  return device.ram_value ?? (device as Device & { ram?: string }).ram ?? '—'
}

function deviceStorage(device: Device) {
  return device.storage_value ?? (device as Device & { storage?: string }).storage ?? '—'
}

function deviceColor(device: Device) {
  return device.color_value ?? (device as Device & { color?: string }).color ?? '—'
}

async function loadProduct() {
  loadingProduct.value = true
  try {
    const res = await productsApi.get(id.value)
    if (res.success) product.value = res.data ?? null
  } catch (e) {
    notifyError(getApiErrorMessage(e))
  } finally {
    loadingProduct.value = false
  }
}

function resetForm() {
  form.value = {
    product_id: id.value,
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
  existingImages.value = []
}

async function openView(device: Device) {
  try {
    const res = await devicesApi.get(device.id)
    viewing.value = res.data ?? device
    showViewModal.value = true
  } catch (e) {
    notifyError(getApiErrorMessage(e))
  }
}

async function openEdit(device: Device) {
  editing.value = device
  resetForm()
  try {
    const res = await devicesApi.get(device.id)
    const d = res.data
    if (d) {
      form.value = {
        product_id: d.product_id ?? id.value,
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
      existingImages.value = d.image_urls ?? []
    }
  } catch (e) {
    notifyError(getApiErrorMessage(e))
  }
  showEditModal.value = true
}

function onImagesSelected(files: File[]) {
  imageFiles.value = files
  imagePreviews.value = files.map((f) => URL.createObjectURL(f))
}

async function saveDevice() {
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
    showEditModal.value = false
    table.refresh()
    loadProduct()
  } catch (e) {
    notifyError(getApiErrorMessage(e))
  } finally {
    saving.value = false
  }
}

onMounted(async () => {
  await loadProduct()
  table.refresh()
})
</script>

<template>
  <PageCard :title="productTitle" :subtitle="t('pages.products.description')">
    <template #actions>
      <button type="button" class="btn btn-outline btn-sm" @click="router.push('/admin/products')">
        <Icon icon="solar:arrow-left-linear" /> {{ t('common.back') }}
      </button>
      <button
        v-if="hasAny('products.update')"
        type="button"
        class="btn btn-primary btn-sm"
        @click="router.push(`/admin/products/${id}/edit`)"
      >
        <Icon icon="solar:pen-linear" /> {{ t('common.edit') }}
      </button>
    </template>

    <div v-if="loadingProduct" class="page-loading">{{ t('common.loading') }}</div>
    <div v-else-if="product" class="detail-grid">
      <div v-if="product.image_urls?.length" class="detail-section">
        <h3>{{ t('products.images') }}</h3>
        <div class="image-preview-row">
          <img
            v-for="(url, i) in product.image_urls"
            :key="i"
            :src="url"
            class="preview-img detail-photo"
            alt=""
          />
        </div>
      </div>

      <dl class="detail-list">
        <dt>{{ t('products.model') }}</dt>
        <dd>{{ product.model_name ?? '—' }}</dd>
        <dt>{{ t('products.brand') }}</dt>
        <dd>{{ product.brand_name ?? '—' }}</dd>
        <dt>{{ t('products.type') }}</dt>
        <dd>{{ product.product_type }}</dd>
        <dt>{{ t('products.stock') }}</dt>
        <dd>{{ product.stock_quantity ?? 0 }}</dd>
        <dt>{{ t('products.availableDevices') }}</dt>
        <dd>{{ product.available_devices_count ?? 0 }}</dd>
        <dt>{{ t('products.description') }}</dt>
        <dd>{{ product.description ?? '—' }}</dd>
        <dt>{{ t('common.createdAt') }}</dt>
        <dd>{{ formatDateTime(product.created_at) }}</dd>
        <dt>{{ t('common.updatedAt') }}</dt>
        <dd>{{ formatDateTime(product.updated_at) }}</dd>
      </dl>

      <div class="detail-section">
        <div class="form-section-header">
          <h3>{{ t('products.devicesList') }}</h3>
        </div>

        <div class="table-toolbar">
          <input
            type="search"
            class="search-input"
            :placeholder="t('common.search')"
            @input="table.setSearch(($event.target as HTMLInputElement).value)"
          />
        </div>

        <DataTable
          :columns="deviceColumns"
          :items="table.items.value"
          :loading="table.loading.value"
          :sort-by="table.sortBy.value"
          :sort-dir="table.sortDir.value"
          :page="table.page.value"
          :last-page="table.lastPage.value"
          :total="table.total.value"
          :empty-text="t('products.devicesEmpty')"
          @sort="table.setSort"
          @page-change="table.setPage"
        >
          <template #cell-ram_value="{ item }">{{ deviceRam(item as Device) }}</template>
          <template #cell-storage_value="{ item }">{{ deviceStorage(item as Device) }}</template>
          <template #cell-color_value="{ item }">{{ deviceColor(item as Device) }}</template>
          <template #cell-status="{ value }"><span class="badge">{{ value }}</span></template>
          <template #cell-selling_price="{ value }">
            {{ value != null ? formatCurrency(value as number) : '—' }}
          </template>
          <template #cell-created_at="{ value }">{{ formatDate(value as string) }}</template>
          <template #actions="{ item }">
            <button type="button" class="btn-icon" :title="t('common.view')" @click="openView(item as Device)">
              <Icon icon="solar:eye-linear" />
            </button>
            <button
              v-if="hasAny('devices.update')"
              type="button"
              class="btn-icon"
              :title="t('common.edit')"
              @click="openEdit(item as Device)"
            >
              <Icon icon="solar:pen-linear" />
            </button>
          </template>
        </DataTable>
      </div>
    </div>
  </PageCard>

  <Modal :show="showViewModal" :title="t('devices.detail')" size="lg" @close="showViewModal = false">
    <dl v-if="viewing" class="detail-list">
      <dt>{{ t('devices.imei') }}</dt>
      <dd>{{ viewing.imei }}</dd>
      <dt>{{ t('devices.ram') }}</dt>
      <dd>{{ deviceRam(viewing) }}</dd>
      <dt>{{ t('devices.storage') }}</dt>
      <dd>{{ deviceStorage(viewing) }}</dd>
      <dt>{{ t('devices.color') }}</dt>
      <dd>{{ deviceColor(viewing) }}</dd>
      <dt>{{ t('devices.battery') }}</dt>
      <dd>{{ viewing.battery_percentage ?? '—' }}%</dd>
      <dt>{{ t('devices.condition') }}</dt>
      <dd>{{ viewing.condition_grade ?? '—' }}</dd>
      <dt>{{ t('common.status') }}</dt>
      <dd>{{ viewing.status }}</dd>
      <dt>{{ t('devices.purchasePrice') }}</dt>
      <dd>{{ viewing.purchase_price != null ? formatCurrency(viewing.purchase_price) : '—' }}</dd>
      <dt>{{ t('devices.sellingPrice') }}</dt>
      <dd>{{ viewing.selling_price != null ? formatCurrency(viewing.selling_price) : '—' }}</dd>
      <dt>{{ t('devices.warranty') }}</dt>
      <dd>
        {{
          viewing.warranty_months
            ? `${viewing.warranty_months} ${t('products.months')}`
            : t('products.noWarranty')
        }}
      </dd>
      <dt>{{ t('common.createdAt') }}</dt>
      <dd>{{ formatDateTime(viewing.created_at) }}</dd>
    </dl>
    <div v-if="viewing?.image_urls?.length" class="detail-section">
      <h3>{{ t('devices.image') }}</h3>
      <div class="image-preview-row">
        <img v-for="(url, i) in viewing.image_urls" :key="i" :src="url" class="preview-img" alt="" />
      </div>
    </div>
    <template #footer>
      <button type="button" class="btn btn-outline" @click="showViewModal = false">{{ t('common.close') }}</button>
      <button
        v-if="hasAny('devices.update')"
        type="button"
        class="btn btn-primary"
        @click="showViewModal = false; openEdit(viewing!)"
      >
        {{ t('common.edit') }}
      </button>
    </template>
  </Modal>

  <Modal :show="showEditModal" :title="t('devices.edit')" size="xl" @close="showEditModal = false">
    <div class="form-grid two-col">
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
          <img v-for="(url, i) in existingImages" :key="`ex-${i}`" :src="url" class="preview-img" alt="" />
          <img v-for="(url, i) in imagePreviews" :key="`new-${i}`" :src="url" class="preview-img" alt="" />
        </div>
      </div>
    </div>
    <template #footer>
      <button type="button" class="btn btn-outline" @click="showEditModal = false">{{ t('common.cancel') }}</button>
      <button type="button" class="btn btn-primary" :disabled="saving" @click="saveDevice">{{ t('common.save') }}</button>
    </template>
  </Modal>
</template>

<style scoped>
.detail-photo {
  width: 120px;
  height: 120px;
}
</style>
