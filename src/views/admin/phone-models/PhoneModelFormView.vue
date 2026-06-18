<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { Icon } from '@iconify/vue'
import PageCard from '@/components/ui/PageCard.vue'
import ImageCropInput from '@/components/ui/ImageCropInput.vue'
import { phoneModelsApi, type PhoneModel } from '@/api/phoneModels'
import { brandsApi, type Brand } from '@/api/brands'
import { categoriesApi, type Category } from '@/api/categories'
import { useNotify } from '@/composables/useNotify'
import { getApiErrorMessage } from '@/utils/apiError'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const { success, error: notifyError } = useNotify()

const id = computed(() => {
  const raw = route.params.id
  if (!raw || Array.isArray(raw)) return null
  const parsed = Number(raw)
  return Number.isFinite(parsed) ? parsed : null
})

const isEdit = computed(
  () => (route.name === 'phone-models-edit' || String(route.path).endsWith('/edit')) && id.value != null,
)

const loading = ref(true)
const saving = ref(false)
const brands = ref<Brand[]>([])
const categories = ref<Category[]>([])
const imageFiles = ref<File[]>([])
const imagePreviews = ref<string[]>([])
const existingImages = ref<string[]>([])

function emptyFormData() {
  return {
    name: '',
    brand_id: '' as string | number,
    category_id: '' as string | number,
    processor: '',
    battery_capacity: '' as string | number,
    release_year: '' as string | number,
    description: '',
  }
}

const formData = ref(emptyFormData())

function resetFormData() {
  formData.value = emptyFormData()
  imageFiles.value = []
  imagePreviews.value = []
  existingImages.value = []
}

function applyModel(model: PhoneModel) {
  formData.value.name = model.model_name ?? ''
  formData.value.brand_id = model.brand_id
  formData.value.category_id = model.category_id ?? ''
  formData.value.processor = model.processor ?? ''
  formData.value.battery_capacity = model.battery_capacity ?? ''
  formData.value.release_year = model.release_year ?? ''
  formData.value.description = Array.isArray(model.description)
    ? (model.description as { key?: string; value?: string }[]).map((d) => d.value).filter(Boolean).join('\n')
    : ''
  existingImages.value = model.image_urls ?? []
  imageFiles.value = []
  imagePreviews.value = []
}

async function loadOptions() {
  const [brandsRes, categoriesRes] = await Promise.all([
    brandsApi.list({ 'no-pagination': true }),
    categoriesApi.list({ 'no-pagination': true }),
  ])
  if (brandsRes.success) brands.value = brandsRes.data ?? []
  if (categoriesRes.success) categories.value = categoriesRes.data ?? []
}

async function loadModel() {
  if (!id.value) return
  const res = await phoneModelsApi.get(id.value)
  if (res.success && res.data) {
    applyModel(res.data)
    return
  }
  throw new Error(res.message || 'Failed to load phone model')
}

async function bootstrap() {
  loading.value = true
  try {
    await loadOptions()
    if (isEdit.value) {
      await loadModel()
    } else {
      resetFormData()
    }
  } catch (e) {
    notifyError(getApiErrorMessage(e))
    if (isEdit.value) {
      router.push('/admin/phone-models')
    }
  } finally {
    loading.value = false
  }
}

function onImagesSelected(files: File[]) {
  imageFiles.value = files
  imagePreviews.value = files.map((f) => URL.createObjectURL(f))
}

function imageFilenameFromUrl(url: string): string | null {
  const parts = url.split('/')
  const filename = parts[parts.length - 1]
  return filename || null
}

function buildFormData() {
  const fd = new FormData()
  fd.append('name', formData.value.name)
  fd.append('brand_id', String(formData.value.brand_id))
  if (formData.value.category_id) fd.append('category_id', String(formData.value.category_id))
  fd.append('processor', formData.value.processor)
  fd.append('battery_capacity', String(formData.value.battery_capacity))
  if (formData.value.release_year) fd.append('release_year', String(formData.value.release_year))
  if (formData.value.description.trim()) {
    fd.append('description[0][key]', 'Details')
    fd.append('description[0][value]', formData.value.description.trim())
  }

  let imageIndex = 0
  if (isEdit.value) {
    for (const url of existingImages.value) {
      const filename = imageFilenameFromUrl(url)
      if (filename) {
        fd.append(`image[${imageIndex}]`, filename)
        imageIndex++
      }
    }
  }
  imageFiles.value.forEach((file, i) => fd.append(`image[${imageIndex + i}]`, file))
  return fd
}

async function save() {
  saving.value = true
  try {
    const fd = buildFormData()
    if (isEdit.value && id.value) {
      await phoneModelsApi.update(id.value, fd)
      success(t('phoneModels.updated'))
      router.push(`/admin/phone-models/${id.value}`)
    } else {
      const res = await phoneModelsApi.create(fd)
      success(t('phoneModels.created'))
      router.push(`/admin/phone-models/${res.data?.id ?? ''}`)
    }
  } catch (e) {
    notifyError(getApiErrorMessage(e))
  } finally {
    saving.value = false
  }
}

watch(
  () => [route.name, route.params.id] as const,
  () => {
    bootstrap()
  },
  { immediate: true },
)
</script>

<template>
  <PageCard
    :title="isEdit ? t('phoneModels.edit') : t('phoneModels.create')"
    :subtitle="t('pages.phoneModels.description')"
  >
    <template #actions>
      <button type="button" class="btn btn-outline btn-sm" @click="router.back()">
        <Icon icon="solar:arrow-left-linear" /> {{ t('common.back') }}
      </button>
    </template>

    <div v-if="loading" class="page-loading">{{ t('common.loading') }}</div>
    <form v-else :key="route.fullPath" class="form-page" @submit.prevent="save">
      <div class="form-grid two-col">
        <div class="form-group">
          <label>{{ t('phoneModels.name') }} *</label>
          <input v-model="formData.name" type="text" required />
        </div>
        <div class="form-group">
          <label>{{ t('phoneModels.brand') }} *</label>
          <select v-model="formData.brand_id" required>
            <option value="">{{ t('phoneModels.selectBrand') }}</option>
            <option v-for="b in brands" :key="b.id" :value="b.id">{{ b.brand_name }}</option>
          </select>
        </div>
        <div class="form-group">
          <label>{{ t('phoneModels.category') }}</label>
          <select v-model="formData.category_id">
            <option value="">{{ t('phoneModels.selectCategory') }}</option>
            <option v-for="c in categories" :key="c.id" :value="c.id">{{ c.category_name }}</option>
          </select>
        </div>
        <div class="form-group">
          <label>{{ t('phoneModels.processor') }} *</label>
          <input v-model="formData.processor" type="text" required />
        </div>
        <div class="form-group">
          <label>{{ t('phoneModels.battery') }} *</label>
          <input v-model="formData.battery_capacity" type="number" min="0" required />
        </div>
        <div class="form-group">
          <label>{{ t('phoneModels.releaseYear') }}</label>
          <input v-model="formData.release_year" type="number" min="2000" max="2099" />
        </div>
        <div class="form-group full">
          <label>{{ t('phoneModels.description') }}</label>
          <textarea v-model="formData.description" rows="4" />
        </div>
        <div class="form-group full">
          <label>{{ t('phoneModels.images') }}</label>
          <ImageCropInput multiple @select="onImagesSelected" />
          <div class="image-preview-row">
            <img v-for="(url, i) in existingImages" :key="`ex-${i}`" :src="url" class="preview-img" alt="" />
            <img v-for="(url, i) in imagePreviews" :key="`new-${i}`" :src="url" class="preview-img" alt="" />
          </div>
        </div>
      </div>
      <div class="form-actions">
        <button type="button" class="btn btn-outline" @click="router.back()">{{ t('common.cancel') }}</button>
        <button type="submit" class="btn btn-primary" :disabled="saving">
          {{ saving ? t('common.loading') : t('common.save') }}
        </button>
      </div>
    </form>
  </PageCard>
</template>
