<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { Icon } from '@iconify/vue'
import { useAuthStore } from '@/stores/auth'
import { profilePhotoUrl } from '@/utils/media'
import LanguageSwitcher from '@/components/ui/LanguageSwitcher.vue'
import StorefrontProductsNavMenu from '@/components/storefront/StorefrontProductsNavMenu.vue'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const menuOpen = ref(false)
const headerPhotoFailed = ref(false)

const headerPhoto = computed(() => {
  if (!auth.user?.profile_photo || headerPhotoFailed.value) return null
  return profilePhotoUrl(auth.user.profile_photo, auth.user.updated_at)
})

const userInitial = computed(() => auth.user?.name?.charAt(0)?.toUpperCase() || 'U')

watch(
  () => [auth.user?.profile_photo, auth.user?.updated_at],
  () => {
    headerPhotoFailed.value = false
  },
)

function closeMenu() {
  menuOpen.value = false
}

async function handleLogout() {
  await auth.logout()
  router.push({ name: 'home' })
}

type NavKey = 'home' | 'products' | 'blog' | 'warranty' | 'contact' | 'about'

function isNavActive(key: NavKey): boolean {
  const path = route.path
  if (key === 'home') return route.name === 'home'
  if (key === 'products') return path.startsWith('/products')
  if (key === 'blog') return path.startsWith('/blog')
  if (key === 'warranty') return path === '/warranty'
  if (key === 'contact') return path === '/contact'
  if (key === 'about') return path === '/about'
  return false
}

function navClass(key: NavKey) {
  return { 'sf-nav-active': isNavActive(key) }
}
</script>

<template>
  <header class="sf-header">
    <div class="sf-top-bar">
      <div class="sf-container">
        <div class="sf-top-links">
          <a href="tel:09978844466"><Icon icon="solar:phone-linear" /> 09978844466</a>
          <a href="mailto:flexicell.main.mdy@gmail.com"><Icon icon="solar:letter-linear" /> flexicell.main.mdy@gmail.com</a>
          <span><Icon icon="solar:map-point-linear" /> MANDALAY</span>
        </div>
        <div class="sf-top-links">
          <LanguageSwitcher />
        </div>
      </div>
    </div>

    <div class="sf-nav-row">
      <div class="sf-container">
        <RouterLink to="/" class="sf-logo" @click="closeMenu">
          <img src="/img/flexicell_logo.png" alt="Flexicell" />
        </RouterLink>

        <nav class="sf-nav" :class="{ open: menuOpen }">
          <RouterLink to="/" :class="navClass('home')" @click="closeMenu">{{ t('storefront.nav.home') }}</RouterLink>
          <StorefrontProductsNavMenu :active="isNavActive('products')" @navigate="closeMenu" />
          <RouterLink to="/blog" :class="navClass('blog')" @click="closeMenu">{{ t('storefront.nav.blog') }}</RouterLink>
          <RouterLink to="/warranty" :class="navClass('warranty')" @click="closeMenu">{{ t('storefront.nav.warranty') }}</RouterLink>
          <RouterLink to="/contact" :class="navClass('contact')" @click="closeMenu">{{ t('storefront.nav.contact') }}</RouterLink>
          <RouterLink to="/about" :class="navClass('about')" @click="closeMenu">{{ t('storefront.nav.about') }}</RouterLink>
        </nav>

        <div class="sf-nav-actions">
          <template v-if="auth.isCustomer">
            <RouterLink to="/account" class="sf-user-chip" @click="closeMenu">
              <span class="sf-user-avatar">
                <img
                  v-if="headerPhoto"
                  :src="headerPhoto"
                  alt=""
                  @error="headerPhotoFailed = true"
                />
                <span v-else class="sf-user-initial">{{ userInitial }}</span>
              </span>
              <span class="sf-user-name">{{ auth.user?.name }}</span>
            </RouterLink>
            <button type="button" class="sf-btn sf-btn-outline sf-logout-btn" @click="handleLogout">
              {{ t('auth.logout') }}
            </button>
          </template>
          <template v-else>
            <RouterLink to="/login" class="sf-btn sf-btn-outline" @click="closeMenu">{{ t('storefront.nav.login') }}</RouterLink>
            <RouterLink to="/register" class="sf-btn sf-btn-primary sf-register-btn" @click="closeMenu">{{ t('storefront.nav.register') }}</RouterLink>
          </template>
          <button type="button" class="sf-mobile-toggle" @click="menuOpen = !menuOpen">
            <Icon :icon="menuOpen ? 'solar:close-circle-linear' : 'solar:hamburger-menu-linear'" />
          </button>
        </div>
      </div>
    </div>
  </header>
</template>

<style scoped>
.sf-top-links {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem 1.25rem;
  align-items: center;
}

.sf-top-links a,
.sf-top-links span {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
}

.sf-register-btn {
  padding: 0.45rem 0.9rem;
  font-size: 0.82rem;
}

.sf-user-chip {
  display: inline-flex;
  align-items: center;
  gap: 0.55rem;
  padding: 0.35rem 0.85rem 0.35rem 0.35rem;
  border: 2px solid var(--sf-border);
  font-size: 0.88rem;
  font-weight: 600;
  max-width: 200px;
  border-radius: 999px;
}

.sf-user-avatar {
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 50%;
  overflow: hidden;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--sf-red);
  color: #fff;
}

.sf-user-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center;
}

.sf-user-initial {
  font-size: 1rem;
  font-weight: 700;
  line-height: 1;
}

.sf-user-name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.sf-logout-btn {
  padding: 0.45rem 0.75rem;
  font-size: 0.82rem;
}

@media (max-width: 768px) {
  .sf-register-btn,
  .sf-logout-btn {
    display: none;
  }

  .sf-user-chip {
    max-width: 148px;
    padding-right: 0.65rem;
  }

  .sf-user-avatar {
    width: 2.15rem;
    height: 2.15rem;
  }

  .sf-user-name {
    font-size: 0.75rem;
  }
}
</style>
