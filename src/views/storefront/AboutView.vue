<script setup lang="ts">
import { RouterLink } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { Icon } from '@iconify/vue'
import { storefrontImages } from '@/utils/storefrontAssets'
import StorefrontBreadcrumb from '@/components/storefront/StorefrontBreadcrumb.vue'

const { t } = useI18n()

const pills = ['newUsed', 'tradeIn', 'warranty', 'installments'] as const

const featureCards = [
  { key: 'newPhones', icon: 'solar:smartphone-2-bold' },
  { key: 'tradeIn', icon: 'solar:refresh-bold' },
  { key: 'warranty', icon: 'solar:shield-check-bold' },
  { key: 'payments', icon: 'solar:card-bold' },
  { key: 'expertise', icon: 'solar:headphones-round-bold' },
  { key: 'discovery', icon: 'solar:magnifer-bold' },
] as const
</script>

<template>
  <div class="fc-page-about">
    <div class="sf-breadcrumb-bar">
      <div class="sf-container">
        <StorefrontBreadcrumb :current="t('storefront.about.breadcrumb')" />
      </div>
    </div>

    <section class="fc-deco-wrap fc-hero-split">
      <div class="sf-container">
        <div class="fc-hero-row">
          <div class="fc-hero-copy">
            <span class="fc-brand-line">{{ t('storefront.about.kicker') }}</span>
            <h1>{{ t('storefront.about.heroTitle') }}</h1>
            <p>{{ t('storefront.about.heroLead') }}</p>
            <div class="fc-pill-row">
              <span v-for="pill in pills" :key="pill" class="fc-pill">{{ t(`storefront.about.pills.${pill}`) }}</span>
            </div>
          </div>
          <div class="fc-hero-banner">
            <div class="fc-banner-frame">
              <img :src="storefrontImages.bannerPhones" :alt="t('storefront.about.bannerPhonesAlt')" />
            </div>
          </div>
        </div>
      </div>
    </section>

    <section class="sf-section sf-section--alt" style="padding-top: 0">
      <div class="sf-container">
        <h2 class="sf-section-title">{{ t('storefront.photos.shopTitle') }}</h2>
        <p class="sf-section-sub" style="margin-bottom: 1.25rem">{{ t('storefront.photos.shopSub') }}</p>
        <div class="fc-shop-gallery">
          <div v-for="(src, i) in storefrontImages.shops" :key="i" class="fc-shop-photo">
            <img :src="src" :alt="t('storefront.photos.shopAlt')" loading="lazy" />
          </div>
        </div>
      </div>
    </section>

    <section class="sf-section" style="padding-top: 0">
      <div class="sf-container">
        <div class="fc-delivery-band">
          <div class="fc-delivery-img">
            <img :src="storefrontImages.bannerDelivery" :alt="t('storefront.about.bannerDeliveryAlt')" />
          </div>
          <div class="fc-delivery-caption">
            <h2>{{ t('storefront.about.flashTitle') }}</h2>
            <h3>{{ t('storefront.about.flashSubtitle') }}</h3>
            <p>{{ t('storefront.about.flashBody') }}</p>
            <div class="fc-mini-feats">
              <span><Icon icon="solar:map-point-bold" /> {{ t('storefront.about.flashFeat1') }}</span>
              <span><Icon icon="solar:bolt-bold" /> {{ t('storefront.about.flashFeat2') }}</span>
              <span><Icon icon="solar:check-circle-bold" /> {{ t('storefront.about.flashFeat3') }}</span>
            </div>
          </div>
        </div>

        <h2 class="fc-section-title">{{ t('storefront.about.whatWeDo') }}</h2>
        <div class="fc-about-cards">
          <div v-for="card in featureCards" :key="card.key" class="fc-card-about">
            <div class="fc-icon"><Icon :icon="card.icon" /></div>
            <h3>{{ t(`storefront.about.cards.${card.key}.title`) }}</h3>
            <p>{{ t(`storefront.about.cards.${card.key}.body`) }}</p>
          </div>
        </div>

        <h2 class="fc-section-title">{{ t('storefront.about.storyTitle') }}</h2>
        <div class="fc-story">
          <p>{{ t('storefront.about.storyP1') }}</p>
          <p>{{ t('storefront.about.storyP2') }}</p>
          <p>{{ t('storefront.about.storyP3') }}</p>
        </div>

        <div class="fc-cta-bar">
          <p>{{ t('storefront.about.ctaText') }}</p>
          <div class="fc-cta-actions">
            <RouterLink to="/products" class="fc-btn-primary">
              <Icon icon="solar:bag-3-bold" style="margin-right: 6px" />
              {{ t('storefront.about.ctaShop') }}
            </RouterLink>
            <RouterLink to="/contact" class="fc-btn-ghost">
              {{ t('storefront.about.ctaContact') }}
              <Icon icon="solar:arrow-right-linear" style="margin-left: 6px" />
            </RouterLink>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>
