<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { Icon } from '@iconify/vue'
import PageCard from '@/components/ui/PageCard.vue'
import ImageCropInput from '@/components/ui/ImageCropInput.vue'
import { productsApi } from '@/api/products'
import { phoneModelsApi, type PhoneModel } from '@/api/phoneModels'
import { useVariantOptions } from '@/composables/useVariantOptions'
import { useNotify } from '@/composables/useNotify'
import { getApiErrorMessage } from '@/utils/apiError'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const { success, error: notifyError } = useNotify()
const { ramOptions, storageOptions, colorOptions, warranties } = useVariantOptions()

const id = computed(() => (route.params.id ? Number(route.params.id) : null))
const isEdit = computed(() => !!id.value && route.name === 'products-edit')

const loading = ref(false)
const saving = ref(false)
const phoneModels = ref<PhoneModel[]>([])
const imageFiles = ref<File[]>([])
const imagePreviews = ref<string[]>([])
const existingImages = ref<string[]>([])

const form = ref({
  phone_model_id: '' as string | number,
  product_type: 'new' as 'new' | 'second hand',
  description: '',
  imei: '',
  ram_option_id: '' as string | number,
  storage_option_id: '' as string | number,
  color_option_id: '' as string | number,
  condition_grade: 'A',
  battery_percentage: 100,
  buy_price: '' as string | number,
  purchase_at: '',
  warranty_id: '' as string | number,
})

const isSecondHand = computed(() => form.value.product_type === 'second hand')
const conditionOptions = ['NEW', 'A', 'B', 'C', 'D']

async function loadPhoneModels() {
  const res = await phoneModelsApi.list({ per_page: 500, page: 1 })
  if (res.success) phoneModels.value = res.data ?? []
}

async function loadProduct() {
  if (!id.value) return
  loading.value = true
  try {
    const res = await productsApi.get(id.value)
    if (res.success && res.data) {
      const p = res.data
      form.value.phone_model_id = p.phone_model_id
      form.value.product_type = p.product_type
      form.value.description = p.description ?? ''
      existingImages.value = p.image_urls ?? []
    }
  } catch (e) {
    notifyError(getApiErrorMessage(e))
  } finally {
    loading.value = false
  }
}

function onImagesSelected(files: File[]) {
  imageFiles.value = files
  imagePreviews.value = files.map((f) => URL.createObjectURL(f))
}

function buildFormData() {
  const fd = new FormData()
  fd.append('phone_model_id', String(form.value.phone_model_id))
  fd.append('product_type', form.value.product_type)
  if (form.value.description) fd.append('description', form.value.description)
  if (form.value.warranty_id) fd.append('warranty_id', String(form.value.warranty_id))

  if (isSecondHand.value && !isEdit.value) {
    fd.append('imei', form.value.imei)
    fd.append('ram_option_id', String(form.value.ram_option_id))
    fd.append('storage_option_id', String(form.value.storage_option_id))
    fd.append('color_option_id', String(form.value.color_option_id))
    fd.append('condition_grade', form.value.condition_grade)
    fd.append('battery_percentage', String(form.value.battery_percentage))
    fd.append('buy_price', String(form.value.buy_price))
    if (form.value.purchase_at) fd.append('purchase_at', form.value.purchase_at)
  }

  imageFiles.value.forEach((file, i) => fd.append(`image[${i}]`, file))
  return fd
}

async function save() {
  saving.value = true
  try {
    const fd = buildFormData()
    if (isEdit.value && id.value) {
      await productsApi.update(id.value, fd)
      success(t('products.updated'))
    } else {
      await productsApi.create(fd)
      success(t('products.created'))
    }
    router.push('/admin/products')
  } catch (e) {
    notifyError(getApiErrorMessage(e))
  } finally {
    saving.value = false
  }
}

onMounted(async () => {
  await loadPhoneModels()
  if (isEdit.value) await loadProduct()
})
</script>

<template>
  <PageCard
    :title="isEdit ? t('products.edit') : t('products.create')"
    :subtitle="t('pages.products.description')"
  >
    <template #actions>
      <button type="button" class="btn btn-outline btn-sm" @click="router.push('/admin/products')">
        <Icon icon="solar:arrow-left-linear" /> {{ t('common.back') }}
      </button>
    </template>

    <div v-if="loading" class="page-loading">{{ t('common.loading') }}</div>
    <form v-else class="form-page" @submit.prevent="save">
      <div class="form-grid two-col">
        <div class="form-group">
          <label>{{ t('products.phoneModel') }} *</label>
          <select v-model="form.phone_model_id" required :disabled="isEdit">
            <option value="">{{ t('products.selectPhoneModel') }}</option>
            <option v-for="m in phoneModels" :key="m.id" :value="m.id">
              {{ m.model_name }} ({{ m.brand_name ?? '—' }})
            </option>
          </select>
        </div>
        <div class="form-group">
          <label>{{ t('products.type') }} *</label>
          <select v-model="form.product_type" required :disabled="isEdit">
            <option value="new">{{ t('products.typeNew') }}</option>
            <option value="second hand">{{ t('products.typeSecondHand') }}</option>
          </select>
        </div>
        <div class="form-group full">
          <label>{{ t('products.description') }}</label>
          <textarea v-model="form.description" rows="3" />
        </div>
        <div class="form-group full">
          <label>{{ t('products.images') }}</label>
          <ImageCropInput multiple @select="onImagesSelected" />
          <div class="image-preview-row">
            <img v-for="(url, i) in existingImages" :key="`ex-${i}`" :src="url" class="preview-img" alt="" />
            <img v-for="(url, i) in imagePreviews" :key="`new-${i}`" :src="url" class="preview-img" alt="" />
          </div>
        </div>
      </div>

      <div v-if="isSecondHand && !isEdit" class="form-section">
        <h3>{{ t('products.secondHandDetails') }}</h3>
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
            <label>{{ t('devices.condition') }} *</label>
            <select v-model="form.condition_grade" required>
              <option v-for="c in conditionOptions" :key="c" :value="c">{{ c }}</option>
            </select>
          </div>
          <div class="form-group">
            <label>{{ t('devices.battery') }} *</label>
            <input v-model.number="form.battery_percentage" type="number" min="0" max="100" required />
          </div>
          <div class="form-group">
            <label>{{ t('products.buyPrice') }} *</label>
            <input v-model="form.buy_price" type="number" min="0" required />
          </div>
          <div class="form-group">
            <label>{{ t('products.purchaseAt') }}</label>
            <input v-model="form.purchase_at" type="datetime-local" />
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
        </div>
      </div>

      <div v-else-if="form.product_type === 'new' && !isEdit" class="alert alert-warning">
        {{ t('products.newStockHint') }}
      </div>

      <div class="form-actions">
        <button type="button" class="btn btn-outline" @click="router.push('/admin/products')">{{ t('common.cancel') }}</button>
        <button type="submit" class="btn btn-primary" :disabled="saving">
          {{ saving ? t('common.loading') : t('common.save') }}
        </button>
      </div>
    </form>
  </PageCard>
</template>
