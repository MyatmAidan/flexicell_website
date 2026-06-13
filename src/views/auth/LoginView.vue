<script setup lang="ts">
import { ref } from 'vue'
import { useRouter, useRoute, RouterLink } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '@/stores/auth'
import { Icon } from '@iconify/vue'
import LanguageSwitcher from '@/components/ui/LanguageSwitcher.vue'

import { adminPath } from '@/config/paths'

const router = useRouter()
const route = useRoute()
const { t } = useI18n()
const auth = useAuthStore()

const email = ref('')
const password = ref('')
const remember = ref(false)
const showPassword = ref(false)
const error = ref('')
const submitting = ref(false)

async function handleSubmit() {
  error.value = ''

  if (!email.value.trim()) {
    error.value = t('validation.emailRequired')
    return
  }
  if (!password.value) {
    error.value = t('validation.passwordRequired')
    return
  }

  submitting.value = true
  try {
    await auth.login({ email: email.value.trim(), password: password.value })
    if (auth.isCustomer) {
      router.push((route.query.redirect as string) || { name: 'home' })
      return
    }
    const redirect = (route.query.redirect as string) || adminPath('/dashboard')
    router.push(redirect)
  } catch (err: unknown) {
    const axiosErr = err as { response?: { data?: { message?: string; errors?: Record<string, string[]> } } }
    const apiMessage = axiosErr.response?.data?.message
    const fieldErrors = axiosErr.response?.data?.errors
    if (fieldErrors?.email?.[0]) {
      error.value = fieldErrors.email[0]
    } else if (fieldErrors?.password?.[0]) {
      error.value = fieldErrors.password[0]
    } else if (apiMessage) {
      error.value = apiMessage
    } else {
      error.value = t('auth.loginFailed')
    }
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

      <div class="auth-container">
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

          <h1 class="auth-title">{{ t('auth.welcome') }}</h1>
          <p class="auth-subtitle">{{ t('auth.subtitle') }}</p>

          <form class="auth-form" @submit.prevent="handleSubmit">
            <div v-if="error" class="auth-error">{{ error }}</div>

            <div class="form-group">
              <label for="email">{{ t('auth.email') }}</label>
              <input
                id="email"
                v-model="email"
                type="email"
                :placeholder="t('auth.emailPlaceholder')"
                autocomplete="email"
                autofocus
              />
            </div>

            <div class="form-group">
              <label for="password">{{ t('auth.password') }}</label>
              <div class="password-field">
                <input
                  id="password"
                  v-model="password"
                  :type="showPassword ? 'text' : 'password'"
                  :placeholder="t('auth.passwordPlaceholder')"
                  autocomplete="current-password"
                />
                <button type="button" class="password-toggle" @click="showPassword = !showPassword">
                  <Icon :icon="showPassword ? 'solar:eye-linear' : 'solar:eye-closed-linear'" />
                </button>
              </div>
            </div>

            <div class="form-check">
              <input id="remember" v-model="remember" type="checkbox" />
              <label for="remember">{{ t('auth.rememberMe') }}</label>
            </div>

            <button type="submit" class="btn btn-primary btn-block" :disabled="submitting">
              {{ submitting ? t('auth.signingIn') : t('auth.signIn') }}
            </button>

            <p class="auth-footer">
              {{ t('auth.newOnPlatform') }}
              <RouterLink to="/register">{{ t('auth.createAccount') }}</RouterLink>
            </p>
          </form>
        </div>
      </div>
    </template>
  </div>
</template>
