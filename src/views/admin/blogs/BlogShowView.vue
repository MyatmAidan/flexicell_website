<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { Icon } from '@iconify/vue'
import PageCard from '@/components/ui/PageCard.vue'
import { blogsApi, type Blog } from '@/api/blogs'
import { usePermissions } from '@/composables/usePermissions'
import { useNotify } from '@/composables/useNotify'
import { getApiErrorMessage } from '@/utils/apiError'
import { formatDateTime } from '@/utils/format'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const { hasAny } = usePermissions()
const { error: notifyError } = useNotify()

const id = computed(() => Number(route.params.id))
const loading = ref(true)
const blog = ref<Blog | null>(null)

async function load() {
  loading.value = true
  try {
    const res = await blogsApi.get(id.value)
    if (res.success) blog.value = res.data ?? null
  } catch (e) {
    notifyError(getApiErrorMessage(e))
  } finally {
    loading.value = false
  }
}

onMounted(load)
</script>

<template>
  <PageCard :title="blog?.title ?? t('blogs.detail')" :subtitle="t('pages.blogs.description')">
    <template #actions>
      <button type="button" class="btn btn-outline btn-sm" @click="router.push('/admin/blogs')">
        <Icon icon="solar:arrow-left-linear" /> {{ t('common.back') }}
      </button>
      <button
        v-if="hasAny('blogs.update')"
        type="button"
        class="btn btn-primary btn-sm"
        @click="router.push(`/admin/blogs/${id}/edit`)"
      >
        <Icon icon="solar:pen-linear" /> {{ t('common.edit') }}
      </button>
    </template>

    <div v-if="loading" class="page-loading">{{ t('common.loading') }}</div>
    <div v-else-if="blog" class="detail-grid">
      <dl class="detail-list">
        <dt>{{ t('common.createdAt') }}</dt>
        <dd>{{ formatDateTime(blog.created_at) }}</dd>
        <dt>{{ t('common.updatedAt') }}</dt>
        <dd>{{ formatDateTime(blog.updated_at) }}</dd>
      </dl>

      <div v-if="blog.thumbnail_url" class="detail-section">
        <h3>{{ t('blogs.mainImage') }}</h3>
        <img :src="blog.thumbnail_url" class="blog-main-thumb" alt="" />
      </div>

      <div
        v-for="(section, idx) in blog.sections"
        :key="section.id"
        class="detail-section blog-content-section"
      >
        <h3>{{ section.heading || `${t('blogs.section')} ${idx + 1}` }}</h3>
        <div class="blog-section-content">{{ section.content }}</div>
        <div v-if="section.images?.length" class="image-preview-row">
          <img
            v-for="img in section.images"
            :key="img.id"
            :src="img.image_url"
            class="preview-img"
            alt=""
          />
        </div>
      </div>
    </div>
  </PageCard>
</template>

<style scoped>
.blog-main-thumb {
  max-width: 320px;
  width: 100%;
  border-radius: var(--fc-radius);
  border: 1px solid var(--fc-border);
}
.blog-content-section {
  padding: 1rem;
  border: 1px solid var(--fc-border);
  border-radius: var(--fc-radius);
  background: var(--fc-surface);
}
.blog-section-content {
  white-space: pre-wrap;
  font-size: 0.9rem;
  line-height: 1.6;
  color: var(--fc-text);
}
</style>
