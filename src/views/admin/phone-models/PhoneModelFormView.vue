<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { Icon } from '@iconify/vue'
import PageCard from '@/components/ui/PageCard.vue'
import ImageCropInput from '@/components/ui/ImageCropInput.vue'
import { phoneModelsApi } from '@/api/phoneModels'
import { brandsApi, type Brand } from '@/api/brands'
import { categoriesApi, type Category } from '@/api/categories'
import { useNotify } from '@/composables/useNotify'
import { getApiErrorMessage } from '@/utils/apiError'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const { success, error: notifyError } = useNotify()

const id = computed(() => (route.params.id ? Number(route.params.id) : null))
const isEdit = computed(() => !!id.value && route.name === 'phone-models-edit')

const loading = ref(false)
const saving = ref(false)
const brands = ref<Brand[]>([])
const categories = ref<Category[]>([])
const imageFiles = ref<File[]>([])
const imagePreviews = ref<string[]>([])
const existingImages = ref<string[]>([])

const form = ref({
  name: '',
  brand_id: '' as string | number,
  category_id: '' as string | number,
  processor: '',
  battery_capacity: '' as string | number,
  release_year: '' as string | number,
  description: '',
})

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
  loading.value = true
  try {
    const res = await phoneModelsApi.get(id.value)
    if (res.success && res.data) {
      const m = res.data
      form.value = {
        name: m.model_name,
        brand_id: m.brand_id,
        category_id: m.category_id ?? '',
        processor: m.processor ?? '',
        battery_capacity: m.battery_capacity ?? '',
        release_year: m.release_year ?? '',
        description: Array.isArray(m.description)
          ? (m.description as { key?: string; value?: string }[]).map((d) => d.value).filter(Boolean).join('\n')
          : '',
      }
      existingImages.value = m.image_urls ?? []
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
  fd.append('name', form.value.name)
  fd.append('brand_id', String(form.value.brand_id))
  if (form.value.category_id) fd.append('category_id', String(form.value.category_id))
  fd.append('processor', form.value.processor)
  fd.append('battery_capacity', String(form.value.battery_capacity))
  if (form.value.release_year) fd.append('release_year', String(form.value.release_year))
  if (form.value.description.trim()) {
    fd.append('description[0][key]', 'Details')
    fd.append('description[0][value]', form.value.description.trim())
  }
  imageFiles.value.forEach((file, i) => fd.append(`image[${i}]`, file))
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

onMounted(async () => {
  await loadOptions()
  if (isEdit.value) await loadModel()
})
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
    <form v-else class="form-page" @submit.prevent="save">
      <div class="form-grid two-col">
        <div class="form-group">
          <label>{{ t('phoneModels.name') }} *</label>
          <input v-model="form.name" type="text" required />
        </div>
        <div class="form-group">
          <label>{{ t('phoneModels.brand') }} *</label>
          <select v-model="form.brand_id" required>
            <option value="">{{ t('phoneModels.selectBrand') }}</option>
            <option v-for="b in brands" :key="b.id" :value="b.id">{{ b.brand_name }}</option>
          </select>
        </div>
        <div class="form-group">
          <label>{{ t('phoneModels.category') }}</label>
          <select v-model="form.category_id">
            <option value="">{{ t('phoneModels.selectCategory') }}</option>
            <option v-for="c in categories" :key="c.id" :value="c.id">{{ c.category_name }}</option>
          </select>
        </div>
        <div class="form-group">
          <label>{{ t('phoneModels.processor') }} *</label>
          <input v-model="form.processor" type="text" required />
        </div>
        <div class="form-group">
          <label>{{ t('phoneModels.battery') }} *</label>
          <input v-model="form.battery_capacity" type="number" min="0" required />
        </div>
        <div class="form-group">
          <label>{{ t('phoneModels.releaseYear') }}</label>
          <input v-model="form.release_year" type="number" min="2000" max="2099" />
        </div>
        <div class="form-group full">
          <label>{{ t('phoneModels.description') }}</label>
          <textarea v-model="form.description" rows="4" />
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
