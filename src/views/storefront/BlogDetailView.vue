<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, RouterLink } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { storefrontApi } from '@/api/storefront'
import { useReveal } from '@/composables/useReveal'
import type { BlogDetail } from '@/types/storefront'

const { t } = useI18n()
const route = useRoute()
const id = computed(() => Number(route.params.id))
const { el, visible } = useReveal({ threshold: 0.05 })

const loading = ref(true)
const blog = ref<BlogDetail | null>(null)

onMounted(async () => {
  try {
    const res = await storefrontApi.blogDetail(id.value)
    if (res.success) blog.value = res.data ?? null
  } finally {
    loading.value = false
  }
})

const sections = computed(() =>
  [...(blog.value?.contents ?? [])].sort((a, b) => a.order - b.order),
)
</script>

<template>
  <section class="sf-section">
    <div ref="el" class="sf-container" style="max-width: 800px">
      <div v-if="loading" class="sf-skeleton" style="height: 400px" />

      <template v-else-if="blog">
        <RouterLink to="/blog" class="sf-btn sf-btn-outline" style="margin-bottom: 1.5rem">
          ← {{ t('storefront.blog.back') }}
        </RouterLink>

        <article class="sf-reveal" :class="{ 'sf-visible': visible }">
          <div v-if="blog.thumbnail" style="border-radius: var(--sf-radius); overflow: hidden; margin-bottom: 1.5rem">
            <img :src="blog.thumbnail" :alt="blog.title" style="width: 100%; max-height: 360px; object-fit: cover" />
          </div>
          <p style="color: var(--sf-muted); font-size: 0.88rem; margin: 0 0 0.5rem">{{ blog.date }}</p>
          <h1 style="margin: 0 0 2rem; font-size: clamp(1.5rem, 4vw, 2rem)">{{ blog.title }}</h1>

          <section
            v-for="(section, i) in sections"
            :key="section.id"
            class="sf-reveal"
            :class="{ 'sf-visible': visible }"
            :style="{ transitionDelay: `${Math.min(i * 100, 500)}ms`, marginBottom: '2rem' }"
          >
            <h2 v-if="section.heading" style="font-size: 1.2rem; margin: 0 0 0.75rem">{{ section.heading }}</h2>
            <div style="line-height: 1.75; color: var(--sf-dark); white-space: pre-wrap">{{ section.content }}</div>
            <div v-if="section.images.length" style="display: grid; gap: 0.75rem; margin-top: 1rem">
              <img
                v-for="img in section.images"
                :key="img.id"
                :src="img.url"
                alt=""
                style="width: 100%; border-radius: 8px"
                loading="lazy"
              />
            </div>
          </section>
        </article>
      </template>
    </div>
  </section>
</template>
