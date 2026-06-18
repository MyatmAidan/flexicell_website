<script setup lang="ts">
import { ref } from 'vue'
import { RouterView } from 'vue-router'
import StorefrontHeader from '@/components/storefront/StorefrontHeader.vue'
import StorefrontFooter from '@/components/storefront/StorefrontFooter.vue'
import StorefrontBottomNav from '@/components/storefront/StorefrontBottomNav.vue'
import { useScrollReveal } from '@/composables/useScrollReveal'

const mainEl = ref<HTMLElement | null>(null)
useScrollReveal(mainEl)
</script>

<template>
  <div class="storefront">
    <StorefrontHeader />
    <main ref="mainEl" class="storefront-main">
      <RouterView v-slot="{ Component }">
        <Transition name="sf-page" mode="out-in">
          <component :is="Component" />
        </Transition>
      </RouterView>
    </main>
    <StorefrontFooter />
    <StorefrontBottomNav />
  </div>
</template>
