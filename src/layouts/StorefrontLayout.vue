<script setup lang="ts">
import { RouterView } from 'vue-router'
import StorefrontHeader from '@/components/storefront/StorefrontHeader.vue'
import StorefrontFooter from '@/components/storefront/StorefrontFooter.vue'
import StorefrontBottomNav from '@/components/storefront/StorefrontBottomNav.vue'
</script>

<template>
  <div class="storefront">
    <StorefrontHeader />
    <main class="storefront-main">
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
