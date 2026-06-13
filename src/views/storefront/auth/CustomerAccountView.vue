<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { Icon } from '@iconify/vue'
import { useAuthStore } from '@/stores/auth'
import StorefrontBreadcrumb from '@/components/storefront/StorefrontBreadcrumb.vue'

const router = useRouter()
const { t } = useI18n()
const auth = useAuthStore()

const profile = computed(() => auth.customerProfile ?? auth.user)

async function handleLogout() {
  await auth.logout()
  router.push({ name: 'home' })
}
</script>

<template>
  <div class="fc-page-account">
    <div class="sf-breadcrumb-bar">
      <div class="sf-container">
        <StorefrontBreadcrumb :current="t('storefront.account.title')" />
      </div>
    </div>

    <section class="sf-section">
      <div class="sf-container">
        <div class="fc-account-card">
          <div class="fc-account-header">
            <div class="fc-account-avatar">
              <Icon icon="solar:user-circle-bold" />
            </div>
            <div>
              <p class="fc-brand-kicker">{{ t('storefront.account.kicker') }}</p>
              <h1>{{ profile?.name }}</h1>
              <p class="fc-sublead">{{ t('storefront.account.subtitle') }}</p>
            </div>
          </div>

          <div class="fc-account-grid">
            <div class="fc-account-field">
              <span class="fc-account-label">{{ t('auth.email') }}</span>
              <span class="fc-account-value">{{ profile?.email || '—' }}</span>
            </div>
            <div class="fc-account-field">
              <span class="fc-account-label">{{ t('storefront.contact.phone') }}</span>
              <span class="fc-account-value">{{ profile?.phone || '—' }}</span>
            </div>
            <div class="fc-account-field fc-account-field-full">
              <span class="fc-account-label">{{ t('storefront.auth.address') }}</span>
              <span class="fc-account-value">{{ profile?.address || '—' }}</span>
            </div>
            <div v-if="auth.customerProfile" class="fc-account-field">
              <span class="fc-account-label">{{ t('storefront.account.points') }}</span>
              <span class="fc-account-value fc-account-points">{{ auth.customerProfile.points }}</span>
            </div>
            <div v-if="auth.customerProfile?.created_at" class="fc-account-field">
              <span class="fc-account-label">{{ t('storefront.account.memberSince') }}</span>
              <span class="fc-account-value">
                {{ new Date(auth.customerProfile.created_at).toLocaleDateString() }}
              </span>
            </div>
          </div>

          <div class="fc-account-actions">
            <button type="button" class="sf-btn sf-btn-outline" @click="handleLogout">
              <Icon icon="solar:logout-2-linear" />
              {{ t('auth.logout') }}
            </button>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
.fc-account-card {
  max-width: 720px;
  margin: 0 auto;
  padding: 2rem;
  border: 2px solid var(--sf-border);
  background: #fff;
}

.fc-account-header {
  display: flex;
  gap: 1.25rem;
  align-items: flex-start;
  margin-bottom: 2rem;
}

.fc-account-avatar {
  width: 4rem;
  height: 4rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid var(--sf-accent);
  color: var(--sf-accent);
  font-size: 2.25rem;
  flex-shrink: 0;
}

.fc-account-header h1 {
  margin: 0.25rem 0 0.35rem;
  font-size: 1.75rem;
}

.fc-account-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1.25rem;
}

.fc-account-field-full {
  grid-column: 1 / -1;
}

.fc-account-label {
  display: block;
  font-size: 0.78rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--sf-muted);
  margin-bottom: 0.35rem;
}

.fc-account-value {
  display: block;
  font-size: 1rem;
  color: var(--sf-text);
}

.fc-account-points {
  font-weight: 700;
  color: var(--sf-accent);
}

.fc-account-actions {
  margin-top: 2rem;
  padding-top: 1.5rem;
  border-top: 1px solid var(--sf-border);
}

.fc-account-actions .sf-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
}

@media (max-width: 640px) {
  .fc-account-grid {
    grid-template-columns: 1fr;
  }

  .fc-account-header {
    flex-direction: column;
  }
}
</style>
