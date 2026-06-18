<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { Icon } from '@iconify/vue'
import PageCard from '@/components/ui/PageCard.vue'
import { phoneModelsApi, type PhoneModel } from '@/api/phoneModels'
import { usePermissions } from '@/composables/usePermissions'
import { useNotify } from '@/composables/useNotify'
import { getApiErrorMessage } from '@/utils/apiError'
import { formatDate, formatDateTime } from '@/utils/format'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const { hasAny } = usePermissions()
const { error: notifyError } = useNotify()

const id = computed(() => Number(route.params.id))
const loading = ref(true)
const model = ref<PhoneModel | null>(null)

const descriptionItems = computed(() => {
  if (!model.value?.description || !Array.isArray(model.value.description)) return []
  return model.value.description as { key?: string; value?: string }[]
})

async function load() {
  loading.value = true
  try {
    const res = await phoneModelsApi.get(id.value)
    if (res.success) model.value = res.data ?? null
  } catch (e) {
    notifyError(getApiErrorMessage(e))
  } finally {
    loading.value = false
  }
}

onMounted(load)
</script>

<template>
  <PageCard :title="model?.model_name ?? t('phoneModels.detail')" :subtitle="t('pages.phoneModels.description')">
    <template #actions>
      <button type="button" class="btn btn-outline btn-sm" @click="router.push('/admin/phone-models')">
        <Icon icon="solar:arrow-left-linear" /> {{ t('common.back') }}
      </button>
      <button
        v-if="hasAny('phone_models.update')"
        type="button"
        class="btn btn-primary btn-sm"
        @click="router.push(`/admin/phone-models/${id}/edit`)"
      >
        <Icon icon="solar:pen-linear" /> {{ t('common.edit') }}
      </button>
    </template>

    <div v-if="loading" class="page-loading">{{ t('common.loading') }}</div>
    <div v-else-if="model" class="detail-grid">
      <div v-if="model.image_urls?.length" class="detail-section">
        <h3>{{ t('phoneModels.images') }}</h3>
        <div class="image-preview-row">
          <img
            v-for="(url, i) in model.image_urls"
            :key="i"
            :src="url"
            class="preview-img detail-photo"
            :alt="model.model_name"
          />
        </div>
      </div>

      <dl class="detail-list">
        <dt>{{ t('phoneModels.brand') }}</dt>
        <dd>{{ model.brand_name ?? '—' }}</dd>
        <dt>{{ t('phoneModels.category') }}</dt>
        <dd>{{ model.category_name ?? '—' }}</dd>
        <dt>{{ t('phoneModels.processor') }}</dt>
        <dd>{{ model.processor ?? '—' }}</dd>
        <dt>{{ t('phoneModels.battery') }}</dt>
        <dd>{{ model.battery_capacity ?? '—' }}</dd>
        <dt>{{ t('phoneModels.releaseYear') }}</dt>
        <dd>{{ model.release_year ?? '—' }}</dd>
        <dt>{{ t('common.createdAt') }}</dt>
        <dd>{{ formatDateTime(model.created_at) }}</dd>
        <dt>{{ t('common.updatedAt') }}</dt>
        <dd>{{ formatDateTime(model.updated_at) }}</dd>
      </dl>

      <div v-if="descriptionItems.length" class="detail-section">
        <h3>{{ t('phoneModels.description') }}</h3>
        <ul>
          <li v-for="(item, i) in descriptionItems" :key="i">
            <strong v-if="item.key">{{ item.key }}:</strong> {{ item.value }}
          </li>
        </ul>
      </div>

    </div>
  </PageCard>
</template>

<style scoped>
.detail-photo {
  width: 120px;
  height: 120px;
}
</style>
