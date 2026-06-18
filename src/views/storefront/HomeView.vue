<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { Icon } from '@iconify/vue'
import { storefrontApi } from '@/api/storefront'
import { useBlogScrollSection } from '@/composables/useScrollSection'
import { storefrontImages } from '@/utils/storefrontAssets'
import MarqueeStrip from '@/components/storefront/MarqueeStrip.vue'
import StorefrontAmbientBubbles from '@/components/storefront/StorefrontAmbientBubbles.vue'
import ProductScrollSection from '@/components/storefront/ProductScrollSection.vue'
import BlogCard from '@/components/storefront/BlogCard.vue'
import ScrollPaginationSentinel from '@/components/storefront/ScrollPaginationSentinel.vue'
import type { StorefrontCategory } from '@/types/storefront'

const { t } = useI18n()
const categories = ref<StorefrontCategory[]>([])
const categoriesLoading = ref(true)

const blogSection = useBlogScrollSection()
const { items: blogItems, loading: blogLoading, meta: blogMeta, load: loadBlogs } = blogSection

onMounted(async () => {
  try {
    const res = await storefrontApi.categories()
    if (res.success) categories.value = res.data ?? []
  } finally {
    categoriesLoading.value = false
  }
  await loadBlogs(true)
})
</script>

<template>
  <div>
    <MarqueeStrip />

    <section class="sf-tiktok-hero sf-hero-ambient">
      <StorefrontAmbientBubbles />
      <div class="sf-container sf-tiktok-hero-grid">
        <div class="sf-reveal-left">
          <span class="sf-tiktok-kicker">
            <Icon icon="solar:fire-bold" />
            {{ t('storefront.hero.badge') }}
          </span>
          <h1 v-html="t('storefront.hero.title')" />
          <p class="sf-tiktok-lead">{{ t('storefront.hero.subtitle') }}</p>
          <div class="sf-tiktok-actions">
            <RouterLink to="/products" class="sf-btn sf-btn-primary">{{ t('storefront.hero.shopNow') }}</RouterLink>
            <RouterLink to="/products/search" class="sf-btn sf-btn-outline">{{ t('storefront.tiktok.explore') }}</RouterLink>
          </div>
        </div>

        <div class="sf-hero-photo-wrap sf-reveal-right">
          <div class="sf-hero-photo-frame">
            <img :src="storefrontImages.ads" :alt="t('storefront.photos.hotdealAlt')" />
          </div>
          <div class="sf-hero-photo-stack">
            <img v-for="(src, i) in storefrontImages.showcase" :key="i" :src="src" :alt="t('storefront.photos.productAlt')" loading="lazy" />
          </div>
        </div>
      </div>
    </section>

    <section class="sf-section sf-section--alt">
      <div class="sf-container">
        <div class="sf-section-header sf-reveal-up">
          <div>
            <h2 class="sf-section-title">{{ t('storefront.categories.title') }}</h2>
            <p class="sf-section-sub">{{ t('storefront.categories.subtitle') }}</p>
          </div>
          <RouterLink to="/products" class="sf-btn sf-btn-primary">{{ t('storefront.viewAll') }}</RouterLink>
        </div>

        <div v-if="categoriesLoading" class="sf-cat-rail">
          <div v-for="n in 6" :key="n" class="sf-skeleton" style="width: 140px; height: 52px; border-radius: 999px; flex-shrink: 0" />
        </div>

        <div v-else class="sf-cat-rail">
          <RouterLink
            v-for="(cat, i) in categories"
            :key="cat.id"
            :to="{ path: '/products/search', query: { category_id: cat.id } }"
            class="sf-cat-pill sf-reveal-up"
            :style="{ transitionDelay: `${Math.min(i * 55, 330)}ms` }"
          >
            <span class="sf-cat-pill-icon">
              <Icon icon="solar:smartphone-2-bold" />
            </span>
            {{ cat.category_name }}
          </RouterLink>
        </div>
      </div>
    </section>

    <ProductScrollSection
      type="new"
      variant="light"
      title-key="storefront.sections.newArrivals"
      subtitle-key="storefront.sections.newArrivalsSub"
    />
    <ProductScrollSection
      type="popular"
      variant="light"
      alt
      title-key="storefront.sections.popular"
      subtitle-key="storefront.sections.popularSub"
    />
    <ProductScrollSection
      type="bestseller"
      variant="light"
      title-key="storefront.sections.bestsellers"
      subtitle-key="storefront.sections.bestsellersSub"
    />

    <section class="sf-section sf-section--alt">
      <div class="sf-container">
        <div class="sf-section-header sf-reveal-up">
          <div>
            <h2 class="sf-section-title">{{ t('storefront.photos.shopTitle') }}</h2>
            <p class="sf-section-sub">{{ t('storefront.photos.shopSub') }}</p>
          </div>
        </div>
        <div class="fc-shop-gallery">
          <div v-for="(src, i) in storefrontImages.shops" :key="i" class="fc-shop-photo sf-reveal-up" :style="{ transitionDelay: `${Math.min(i * 90, 360)}ms` }">
            <img :src="src" :alt="t('storefront.photos.shopAlt')" loading="lazy" />
          </div>
        </div>
      </div>
    </section>

    <section class="sf-section">
      <div class="sf-container">
        <div class="sf-section-header sf-reveal-up">
          <div>
            <h2 class="sf-section-title">{{ t('storefront.sections.latestBlog') }}</h2>
            <p class="sf-section-sub">{{ t('storefront.sections.latestBlogSub') }}</p>
          </div>
          <RouterLink to="/blog" class="sf-btn sf-btn-primary">{{ t('storefront.viewAll') }}</RouterLink>
        </div>

        <div v-if="blogLoading && !blogItems.length" class="sf-blog-grid">
          <div v-for="n in 3" :key="n" class="sf-skeleton" style="height: 260px; border-radius: 20px" />
        </div>

        <div v-else class="sf-blog-grid">
          <BlogCard
            v-for="(blog, i) in blogItems"
            :key="blog.id"
            :blog="blog"
            :index="i"
            variant="light"
          />
        </div>

        <ScrollPaginationSentinel
          :has-more="Boolean(blogMeta?.has_more)"
          :loading="blogLoading"
          @load="loadBlogs()"
        />
      </div>
    </section>
  </div>
</template>
