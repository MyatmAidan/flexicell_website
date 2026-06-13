<script setup lang="ts">
import { ref } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '@/stores/auth'
import { Icon } from '@iconify/vue'
import LanguageSwitcher from '@/components/ui/LanguageSwitcher.vue'

const router = useRouter()
const { t } = useI18n()
const auth = useAuthStore()

const form = ref({
  name: '',
  email: '',
  phone: '',
  address: '',
  password: '',
  password_confirmation: '',
})
const showPassword = ref(false)
const showConfirmPassword = ref(false)
const error = ref('')
const submitting = ref(false)

async function handleSubmit() {
  error.value = ''

  if (!form.value.name.trim()) {
    error.value = t('validation.nameRequired')
    return
  }
  if (!form.value.email.trim()) {
    error.value = t('validation.emailRequired')
    return
  }
  if (!form.value.password) {
    error.value = t('validation.passwordRequired')
    return
  }
  if (form.value.password !== form.value.password_confirmation) {
    error.value = t('validation.passwordMismatch')
    return
  }

  submitting.value = true
  try {
    await auth.register({
      name: form.value.name.trim(),
      email: form.value.email.trim(),
      phone: form.value.phone.trim(),
      address: form.value.address.trim(),
      password: form.value.password,
      password_confirmation: form.value.password_confirmation,
    })
    router.push({ name: 'home' })
  } catch (err: unknown) {
    const axiosErr = err as { response?: { data?: { message?: string; errors?: Record<string, string[]> } } }
    const fieldErrors = axiosErr.response?.data?.errors
    const firstFieldError = fieldErrors ? Object.values(fieldErrors).flat()[0] : undefined
    error.value = firstFieldError || axiosErr.response?.data?.message || t('common.error')
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <div class="auth-page">
    <div class="auth-bg-shapes" aria-hidden="true">
      <div class="auth-shape auth-shape-pattern" />
    </div>

    <div v-if="auth.initializing" class="auth-boot">
      <span class="auth-boot-spinner" />
      {{ t('common.loading') }}
    </div>

    <template v-else>
      <div class="auth-lang">
        <LanguageSwitcher />
      </div>

      <div class="auth-container auth-container-wide">
        <div class="auth-card-shapes" aria-hidden="true">
          <div class="auth-shape auth-shape-glow auth-shape-glow-tr" />
          <div class="auth-shape auth-shape-glow auth-shape-glow-bl" />
          <div class="auth-shape auth-shape-dots auth-shape-dots-tr" />
          <div class="auth-shape auth-shape-dots auth-shape-dots-bl" />
          <div class="auth-shape auth-shape-block auth-shape-block-fill" />
          <div class="auth-shape auth-shape-block auth-shape-block-outline" />
        </div>

        <div class="auth-card">
          <div class="auth-logo-wrap">
            <img src="/img/flexicell_logo.png" alt="Flexicell" class="auth-logo" />
          </div>

          <h1 class="auth-title">{{ t('storefront.auth.registerTitle') }}</h1>
          <p class="auth-subtitle">{{ t('storefront.auth.registerSubtitle') }}</p>

          <form class="auth-form auth-form-register" @submit.prevent="handleSubmit">
            <div v-if="error" class="auth-error auth-error-full">{{ error }}</div>

            <div class="auth-form-grid">
              <div class="form-group">
                <label for="name">{{ t('storefront.auth.fullName') }}</label>
                <input
                  id="name"
                  v-model="form.name"
                  type="text"
                  :placeholder="t('storefront.auth.fullNamePlaceholder')"
                  autocomplete="name"
                  autofocus
                />
              </div>

              <div class="form-group">
                <label for="email">{{ t('auth.email') }}</label>
                <input
                  id="email"
                  v-model="form.email"
                  type="email"
                  :placeholder="t('auth.emailPlaceholder')"
                  autocomplete="email"
                />
              </div>

              <div class="form-group">
                <label for="phone">
                  {{ t('storefront.contact.phone') }}
                  <span class="auth-label-optional">{{ t('storefront.contact.optional') }}</span>
                </label>
                <input
                  id="phone"
                  v-model="form.phone"
                  type="tel"
                  :placeholder="t('storefront.auth.phonePlaceholder')"
                  autocomplete="tel"
                />
              </div>

              <div class="form-group">
                <label for="address">
                  {{ t('storefront.auth.address') }}
                  <span class="auth-label-optional">{{ t('storefront.contact.optional') }}</span>
                </label>
                <textarea
                  id="address"
                  v-model="form.address"
                  rows="2"
                  :placeholder="t('storefront.auth.addressPlaceholder')"
                  autocomplete="street-address"
                />
              </div>

              <div class="form-group">
                <label for="password">{{ t('auth.password') }}</label>
                <div class="password-field">
                  <input
                    id="password"
                    v-model="form.password"
                    :type="showPassword ? 'text' : 'password'"
                    :placeholder="t('auth.passwordPlaceholder')"
                    autocomplete="new-password"
                  />
                  <button type="button" class="password-toggle" @click="showPassword = !showPassword">
                    <Icon :icon="showPassword ? 'solar:eye-linear' : 'solar:eye-closed-linear'" />
                  </button>
                </div>
              </div>

              <div class="form-group">
                <label for="password_confirmation">{{ t('storefront.auth.confirmPassword') }}</label>
                <div class="password-field">
                  <input
                    id="password_confirmation"
                    v-model="form.password_confirmation"
                    :type="showConfirmPassword ? 'text' : 'password'"
                    :placeholder="t('storefront.auth.confirmPasswordPlaceholder')"
                    autocomplete="new-password"
                  />
                  <button type="button" class="password-toggle" @click="showConfirmPassword = !showConfirmPassword">
                    <Icon :icon="showConfirmPassword ? 'solar:eye-linear' : 'solar:eye-closed-linear'" />
                  </button>
                </div>
              </div>
            </div>

            <button type="submit" class="btn btn-primary btn-block" :disabled="submitting">
              {{ submitting ? t('storefront.auth.registering') : t('storefront.auth.registerButton') }}
            </button>

            <p class="auth-footer">
              {{ t('storefront.auth.hasAccount') }}
              <RouterLink to="/login">{{ t('storefront.auth.loginLink') }}</RouterLink>
            </p>
          </form>
        </div>
      </div>
    </template>
  </div>
</template>
