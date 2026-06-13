<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '@/stores/auth'
import LanguageSwitcher from '@/components/ui/LanguageSwitcher.vue'
import { profilePhotoUrl } from '@/utils/media'
import { adminPath } from '@/config/paths'
import { Icon } from '@iconify/vue'

defineEmits<{ 'toggle-sidebar': [] }>()

const router = useRouter()
const { t } = useI18n()
const auth = useAuthStore()
const menuOpen = ref(false)
const headerPhotoFailed = ref(false)

const headerPhoto = computed(() => {
  if (!auth.user?.profile_photo || headerPhotoFailed.value) return null
  return profilePhotoUrl(auth.user.profile_photo, auth.user.updated_at)
})

watch(
  () => [auth.user?.profile_photo, auth.user?.updated_at],
  () => {
    headerPhotoFailed.value = false
  },
)

async function handleLogout() {
  await auth.logout()
  router.push({ name: 'home' })
}
</script>

<template>
  <header class="admin-header">
    <button type="button" class="sidebar-toggle" @click="$emit('toggle-sidebar')">
      <Icon icon="solar:hamburger-menu-linear" />
      <span class="sr-only">{{ t('header.toggleSidebar') }}</span>
    </button>

    <div class="header-actions">
      <div class="user-menu" :class="{ open: menuOpen }">
        <button type="button" class="user-trigger" @click="menuOpen = !menuOpen">
          <div class="user-avatar">
            <img
              v-if="headerPhoto"
              :src="headerPhoto"
              alt=""
              class="user-avatar-img"
              @error="headerPhotoFailed = true"
            />
            <span v-else>{{ auth.user?.name?.charAt(0)?.toUpperCase() || 'U' }}</span>
          </div>
          <span class="user-name">{{ auth.user?.name }}</span>
          <Icon icon="solar:alt-arrow-down-linear" class="user-arrow" />
        </button>

        <div v-if="menuOpen" class="user-dropdown">
          <div class="user-info">
            <div class="user-info-name">{{ auth.user?.name }}</div>
            <div class="user-info-email">{{ auth.user?.email }}</div>
          </div>
          <RouterLink :to="adminPath('/profile')" class="dropdown-item" @click="menuOpen = false">
            <Icon icon="solar:user-linear" />
            {{ t('header.profile') }}
          </RouterLink>
          <LanguageSwitcher variant="menu" />
          <button type="button" class="dropdown-item logout" @click="handleLogout">
            <Icon icon="solar:logout-2-linear" />
            {{ t('header.logout') }}
          </button>
        </div>
      </div>
    </div>
  </header>
</template>
