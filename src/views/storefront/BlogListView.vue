<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useBlogScrollSection } from '@/composables/useScrollSection'
import BlogCard from '@/components/storefront/BlogCard.vue'
import ScrollPaginationSentinel from '@/components/storefront/ScrollPaginationSentinel.vue'

const { t } = useI18n()

const blogSection = useBlogScrollSection(9)
const { items: blogs, loading, meta, load } = blogSection

const hasMore = computed(() => Boolean(meta.value?.has_more))

onMounted(() => load(true))
</script>

<template>
  <section class="sf-section">
    <div class="sf-container">
      <div class="sf-section-header sf-reveal-up">
        <div>
          <h1 class="sf-section-title">{{ t('storefront.blog.title') }}</h1>
          <p class="sf-section-sub">{{ t('storefront.blog.subtitle') }}</p>
        </div>
      </div>

      <div v-if="loading && !blogs.length" class="sf-blog-grid">
        <div v-for="n in 6" :key="n" class="sf-skeleton" style="height: 260px" />
      </div>

      <div v-else class="sf-blog-grid">
        <BlogCard
          v-for="(blog, i) in blogs"
          :key="blog.id"
          :blog="blog"
          :index="i"
        />
      </div>

      <ScrollPaginationSentinel
        :has-more="hasMore"
        :loading="loading"
        @load="load()"
      />
    </div>
  </section>
</template>
