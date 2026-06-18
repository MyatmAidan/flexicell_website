<script setup lang="ts">
import { RouterLink } from 'vue-router'
import type { StorefrontBlog } from '@/types/storefront'

defineProps<{
  blog: StorefrontBlog
  index?: number
  animate?: boolean
  variant?: 'dark' | 'light'
}>()
</script>

<template>
  <RouterLink
    :to="`/blog/${blog.id}`"
    class="sf-blog-card sf-reveal-up"
    :class="{ 'sf-visible': animate === false }"
    :style="index != null ? { transitionDelay: `${Math.min(index * 80, 400)}ms` } : undefined"
  >
    <div class="sf-blog-thumb">
      <img v-if="blog.thumbnail" :src="blog.thumbnail" :alt="blog.title" loading="lazy" />
      <div v-else class="sf-skeleton" style="width: 100%; height: 100%" />
    </div>
    <div class="sf-blog-body">
      <div class="sf-blog-date">{{ blog.date }}</div>
      <h3 class="sf-blog-title">{{ blog.title }}</h3>
    </div>
  </RouterLink>
</template>
