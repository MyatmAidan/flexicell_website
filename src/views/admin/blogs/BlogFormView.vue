<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { Icon } from '@iconify/vue'
import PageCard from '@/components/ui/PageCard.vue'
import ImageCropInput from '@/components/ui/ImageCropInput.vue'
import { blogsApi } from '@/api/blogs'
import { useNotify } from '@/composables/useNotify'
import { getApiErrorMessage } from '@/utils/apiError'
import { fileToBase64 } from '@/utils/media'

interface SectionForm {
  id?: number
  title: string
  content: string
  imageFiles: File[]
  imagePreviews: string[]
  existingImages: { id: number; url: string }[]
  removedImageIds: number[]
}

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const { success, error: notifyError } = useNotify()

const id = computed(() => (route.params.id ? Number(route.params.id) : null))
const isEdit = computed(() => !!id.value && route.name === 'blogs-edit')

const loading = ref(false)
const saving = ref(false)
const title = ref('')
const mainImageFile = ref<File | null>(null)
const mainImagePreview = ref<string | null>(null)
const existingThumbnail = ref<string | null>(null)
const removedSectionIds = ref<number[]>([])
const sections = ref<SectionForm[]>([
  { title: '', content: '', imageFiles: [], imagePreviews: [], existingImages: [], removedImageIds: [] },
])

function addSection() {
  sections.value.push({
    title: '',
    content: '',
    imageFiles: [],
    imagePreviews: [],
    existingImages: [],
    removedImageIds: [],
  })
}

function removeSection(idx: number) {
  const sec = sections.value[idx]
  if (sec?.id) removedSectionIds.value.push(sec.id)
  sections.value.splice(idx, 1)
  if (!sections.value.length) addSection()
}

function onMainImageSelected(files: File[]) {
  const file = files[0]
  if (!file) return
  mainImageFile.value = file
  mainImagePreview.value = URL.createObjectURL(file)
}

function onSectionImagesSelected(idx: number, files: File[]) {
  const sec = sections.value[idx]
  if (!sec) return
  sec.imageFiles = files
  sec.imagePreviews = files.map((f) => URL.createObjectURL(f))
}

function removeExistingImage(secIdx: number, imageId: number) {
  const sec = sections.value[secIdx]
  if (!sec) return
  sec.removedImageIds.push(imageId)
  sec.existingImages = sec.existingImages.filter((img) => img.id !== imageId)
}

async function loadBlog() {
  if (!id.value) return
  loading.value = true
  try {
    const res = await blogsApi.get(id.value)
    if (res.success && res.data) {
      const blog = res.data
      title.value = blog.title
      existingThumbnail.value = blog.thumbnail_url
      sections.value = (blog.sections ?? []).map((s) => ({
        id: s.id,
        title: s.heading,
        content: s.content,
        imageFiles: [],
        imagePreviews: [],
        existingImages: (s.images ?? []).map((img) => ({ id: img.id, url: img.image_url })),
        removedImageIds: [],
      }))
      if (!sections.value.length) addSection()
    }
  } catch (e) {
    notifyError(getApiErrorMessage(e))
  } finally {
    loading.value = false
  }
}

async function buildFormData() {
  const fd = new FormData()
  fd.append('title', title.value)

  if (mainImageFile.value) {
    fd.append('thumbnail', mainImageFile.value)
  }

  for (let i = 0; i < sections.value.length; i++) {
    const sec = sections.value[i]!
    fd.append(`section_titles[${i}]`, sec.title)
    fd.append(`section_contents[${i}]`, sec.content)
    if (sec.id) fd.append(`section_ids[${i}]`, String(sec.id))

    for (const file of sec.imageFiles) {
      const base64 = await fileToBase64(file)
      fd.append(`section_images_data[${i}][]`, base64)
    }
  }

  removedSectionIds.value.forEach((sid, i) => {
    fd.append(`removed_sections[${i}]`, String(sid))
  })

  sections.value.forEach((sec, secIdx) => {
    sec.removedImageIds.forEach((imgId, imgIdx) => {
      fd.append(`removed_images[${secIdx}][${imgIdx}]`, String(imgId))
    })
  })

  return fd
}

async function save() {
  if (!title.value.trim()) {
    notifyError(t('blogs.titleRequired'))
    return
  }
  if (sections.value.some((s) => !s.title.trim() || !s.content.trim())) {
    notifyError(t('blogs.sectionRequired'))
    return
  }

  saving.value = true
  try {
    const fd = await buildFormData()
    if (isEdit.value && id.value) {
      await blogsApi.update(id.value, fd)
      success(t('blogs.updated'))
      router.push(`/admin/blogs/${id.value}`)
    } else {
      const res = await blogsApi.create(fd)
      success(t('blogs.created'))
      router.push(`/admin/blogs/${res.data?.id ?? ''}`)
    }
  } catch (e) {
    notifyError(getApiErrorMessage(e))
  } finally {
    saving.value = false
  }
}

onMounted(async () => {
  if (isEdit.value) await loadBlog()
})
</script>

<template>
  <PageCard
    :title="isEdit ? t('blogs.edit') : t('blogs.create')"
    :subtitle="t('pages.blogs.description')"
  >
    <template #actions>
      <button type="button" class="btn btn-outline btn-sm" @click="router.back()">
        <Icon icon="solar:arrow-left-linear" /> {{ t('common.back') }}
      </button>
    </template>

    <div v-if="loading" class="page-loading">{{ t('common.loading') }}</div>
    <form v-else class="form-page" @submit.prevent="save">
      <div class="form-grid">
        <div class="form-group">
          <label>{{ t('blogs.title') }} *</label>
          <input v-model="title" type="text" required />
        </div>
        <div class="form-group">
          <label>{{ t('blogs.mainImage') }}</label>
          <ImageCropInput @select="onMainImageSelected" />
          <div class="image-preview-row">
            <img
              v-if="mainImagePreview"
              :src="mainImagePreview"
              class="preview-img"
              alt=""
            />
            <img
              v-else-if="existingThumbnail"
              :src="existingThumbnail"
              class="preview-img"
              alt=""
            />
          </div>
        </div>
      </div>

      <div class="form-section">
        <div class="form-section-header">
          <h3>{{ t('blogs.sections') }}</h3>
          <button type="button" class="btn btn-outline btn-sm" @click="addSection">
            <Icon icon="solar:add-circle-linear" /> {{ t('blogs.addSection') }}
          </button>
        </div>

        <div v-for="(sec, idx) in sections" :key="idx" class="blog-section-card">
          <div class="blog-section-card-header">
            <strong>{{ t('blogs.section') }} {{ idx + 1 }}</strong>
            <button
              v-if="sections.length > 1"
              type="button"
              class="btn-icon danger"
              @click="removeSection(idx)"
            >
              <Icon icon="solar:trash-bin-trash-linear" />
            </button>
          </div>
          <div class="form-grid">
            <div class="form-group">
              <label>{{ t('blogs.sectionTitle') }} *</label>
              <input v-model="sec.title" type="text" required />
            </div>
            <div class="form-group full">
              <label>{{ t('blogs.sectionContent') }} *</label>
              <textarea v-model="sec.content" rows="5" required />
            </div>
            <div class="form-group full">
              <label>{{ t('blogs.sectionImages') }}</label>
              <ImageCropInput multiple @select="onSectionImagesSelected(idx, $event)" />
              <div class="image-preview-row">
                <div
                  v-for="img in sec.existingImages"
                  :key="img.id"
                  class="preview-img-wrap"
                >
                  <img :src="img.url" class="preview-img" alt="" />
                  <button
                    type="button"
                    class="preview-remove"
                    @click="removeExistingImage(idx, img.id)"
                  >
                    <Icon icon="solar:close-circle-linear" />
                  </button>
                </div>
                <img
                  v-for="(url, pi) in sec.imagePreviews"
                  :key="`new-${pi}`"
                  :src="url"
                  class="preview-img"
                  alt=""
                />
              </div>
            </div>
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

<style scoped>
.form-section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
}
.blog-section-card {
  border: 1px solid var(--fc-border);
  border-radius: var(--fc-radius);
  padding: 1rem;
  margin-bottom: 1rem;
  background: var(--fc-bg);
}
.blog-section-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.75rem;
}
.preview-img-wrap {
  position: relative;
  display: inline-block;
}
.preview-remove {
  position: absolute;
  top: 2px;
  right: 2px;
  border: none;
  background: rgba(0, 0, 0, 0.55);
  color: #fff;
  border-radius: 50%;
  width: 22px;
  height: 22px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}
</style>
