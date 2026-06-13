<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { Icon } from '@iconify/vue'
import { setLocale, supportedLocales, type SupportedLocale } from '@/i18n'

withDefaults(
  defineProps<{
    variant?: 'standalone' | 'menu'
  }>(),
  { variant: 'standalone' },
)

const { locale, t } = useI18n()

function changeLocale(newLocale: SupportedLocale) {
  if (newLocale === locale.value) return
  setLocale(newLocale)
  window.location.reload()
}
</script>

<template>
  <div v-if="variant === 'menu'" class="dropdown-item language-menu-item" @click.stop>
    <Icon icon="solar:global-linear" class="language-menu-icon" />
    <span class="language-menu-label">{{ t('common.language') }}</span>
    <select
      class="language-menu-select"
      :value="locale"
      :aria-label="t('common.language')"
      @change="changeLocale(($event.target as HTMLSelectElement).value as SupportedLocale)"
    >
      <option v-for="loc in supportedLocales" :key="loc" :value="loc">
        {{ loc.toUpperCase() }}
      </option>
    </select>
  </div>

  <div v-else class="language-switcher">
    <label class="sr-only" for="locale-select">{{ t('common.language') }}</label>
    <select
      id="locale-select"
      :value="locale"
      @change="changeLocale(($event.target as HTMLSelectElement).value as SupportedLocale)"
    >
      <option v-for="loc in supportedLocales" :key="loc" :value="loc">
        {{ loc.toUpperCase() }}
      </option>
    </select>
  </div>
</template>
