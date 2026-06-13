<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { storefrontApi } from '@/api/storefront'
import { useReveal } from '@/composables/useReveal'
import { useNotify } from '@/composables/useNotify'

const { t } = useI18n()
const notify = useNotify()
const { el, visible } = useReveal()

const imei = ref('')
const loading = ref(false)
const result = ref<{
  found: boolean
  device?: Record<string, unknown>
  warranty?: Record<string, unknown> | null
} | null>(null)

async function check() {
  if (!imei.value.trim()) {
    notify.error(t('storefront.warranty.imeiRequired'))
    return
  }
  loading.value = true
  result.value = null
  try {
    const res = await storefrontApi.warrantyCheck(imei.value.trim())
    if (res.success) {
      result.value = res.data as typeof result.value
    } else {
      result.value = { found: false }
    }
  } catch (err: unknown) {
    const axiosErr = err as { response?: { status?: number; data?: { message?: string } } }
    if (axiosErr.response?.status === 404) {
      result.value = { found: false }
    } else {
      notify.error(axiosErr.response?.data?.message || t('common.error'))
    }
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <section class="sf-section">
    <div ref="el" class="sf-container">
      <div class="sf-section-header sf-reveal" :class="{ 'sf-visible': visible }">
        <div>
          <h1 class="sf-section-title">{{ t('storefront.warranty.title') }}</h1>
          <p class="sf-section-sub">{{ t('storefront.warranty.subtitle') }}</p>
        </div>
      </div>

      <div class="sf-form-card sf-reveal" :class="{ 'sf-visible': visible }">
        <form @submit.prevent="check">
          <div class="sf-field">
            <label for="imei">{{ t('storefront.warranty.imeiLabel') }}</label>
            <input id="imei" v-model="imei" type="text" :placeholder="t('storefront.warranty.imeiPlaceholder')" />
          </div>
          <button type="submit" class="sf-btn sf-btn-primary" :disabled="loading" style="width: 100%">
            {{ loading ? t('common.loading') : t('storefront.warranty.check') }}
          </button>
        </form>

        <div v-if="result" style="margin-top: 1.5rem; padding-top: 1.5rem; border-top: 1px solid var(--sf-border)">
          <template v-if="result.found && result.device">
            <h3 style="margin: 0 0 1rem; color: var(--sf-red)">{{ t('storefront.warranty.found') }}</h3>
            <ul class="sf-spec-list">
              <li v-if="result.device.model_name"><strong>{{ t('storefront.warranty.model') }}</strong><span>{{ result.device.model_name }}</span></li>
              <li v-if="result.device.brand_name"><strong>{{ t('storefront.warranty.brand') }}</strong><span>{{ result.device.brand_name }}</span></li>
              <li v-if="result.device.imei"><strong>IMEI</strong><span>{{ result.device.imei }}</span></li>
              <li v-if="result.device.color"><strong>{{ t('storefront.warranty.color') }}</strong><span>{{ result.device.color }}</span></li>
            </ul>
            <div v-if="result.warranty" style="margin-top: 1rem">
              <h4>{{ t('storefront.warranty.warrantyInfo') }}</h4>
              <ul class="sf-spec-list">
                <li v-if="result.warranty.status"><strong>{{ t('common.status') }}</strong><span>{{ result.warranty.status }}</span></li>
                <li v-if="result.warranty.start_date"><strong>{{ t('storefront.warranty.start') }}</strong><span>{{ result.warranty.start_date }}</span></li>
                <li v-if="result.warranty.end_date"><strong>{{ t('storefront.warranty.end') }}</strong><span>{{ result.warranty.end_date }}</span></li>
              </ul>
            </div>
            <p v-else style="color: var(--sf-muted); margin-top: 1rem">{{ t('storefront.warranty.noWarranty') }}</p>
          </template>
          <p v-else style="color: var(--sf-muted); margin: 0">{{ t('storefront.warranty.notFound') }}</p>
        </div>
      </div>
    </div>
  </section>
</template>
