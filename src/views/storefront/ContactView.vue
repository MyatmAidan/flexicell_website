<script setup lang="ts">
import { ref } from 'vue'
import { RouterLink } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { Icon } from '@iconify/vue'
import { storefrontApi } from '@/api/storefront'
import { useNotify } from '@/composables/useNotify'
import { storefrontImages } from '@/utils/storefrontAssets'
import StorefrontBreadcrumb from '@/components/storefront/StorefrontBreadcrumb.vue'
import StorefrontAmbientBubbles from '@/components/storefront/StorefrontAmbientBubbles.vue'

const { t } = useI18n()
const notify = useNotify()

const form = ref({ name: '', email: '', phone: '', subject: '', message: '' })
const loading = ref(false)

const mapEmbed = 'https://www.google.com/maps?q=Mandalay%2C+Myanmar&hl=en&z=13&output=embed'
const mapLink = 'https://www.google.com/maps/search/?api=1&query=Mandalay%2C+Myanmar'

async function submit() {
  loading.value = true
  try {
    const res = await storefrontApi.contact(form.value)
    if (res.success) {
      notify.success(res.message || t('storefront.contact.success'))
      form.value = { name: '', email: '', phone: '', subject: '', message: '' }
    } else {
      notify.error(res.message || t('common.error'))
    }
  } catch {
    notify.error(t('common.error'))
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="fc-page-contact">
    <div class="sf-breadcrumb-bar">
      <div class="sf-container">
        <StorefrontBreadcrumb :current="t('storefront.contact.breadcrumb')" />
      </div>
    </div>

    <section class="fc-contact-hero fc-hero-ambient">
      <StorefrontAmbientBubbles />
      <div class="sf-container">
        <div class="fc-contact-hero-inner">
          <div class="fc-contact-logo-wrap sf-reveal-left">
            <img :src="storefrontImages.logo" alt="Flexicell Mobile" />
          </div>
          <div class="fc-contact-hero-copy sf-reveal-up">
            <p class="fc-brand-kicker">{{ t('storefront.contact.kicker') }}</p>
            <h1>{{ t('storefront.contact.title') }}</h1>
            <p class="fc-sublead">{{ t('storefront.contact.subtitle') }}</p>
          </div>
          <div class="fc-contact-hero-side sf-reveal-right">
            <img :src="storefrontImages.contact" :alt="t('storefront.photos.shopAlt')" />
          </div>
        </div>
      </div>
    </section>

    <section class="sf-section" style="padding-top: 20px">
      <div class="sf-container">
        <div class="fc-contact-cards">
          <div class="fc-contact-card sf-reveal-up" style="transition-delay: 0ms">
            <Icon icon="solar:phone-bold" class="fc-c-icon" />
            <h3>{{ t('storefront.contact.phone') }}</h3>
            <p><a href="tel:09978844466">09978844466</a></p>
          </div>
          <div class="fc-contact-card sf-reveal-up" style="transition-delay: 80ms">
            <Icon icon="solar:letter-bold" class="fc-c-icon" />
            <h3>{{ t('storefront.contact.email') }}</h3>
            <p><a href="mailto:flexicell.main.mdy@gmail.com">flexicell.main.mdy@gmail.com</a></p>
          </div>
          <div class="fc-contact-card sf-reveal-up" style="transition-delay: 160ms">
            <Icon icon="solar:map-point-bold" class="fc-c-icon" />
            <h3>{{ t('storefront.contact.location') }}</h3>
            <p>{{ t('storefront.contact.locationValue') }}</p>
          </div>
          <div class="fc-contact-card sf-reveal-up" style="transition-delay: 240ms">
            <Icon icon="solar:clock-circle-bold" class="fc-c-icon" />
            <h3>{{ t('storefront.contact.hours') }}</h3>
            <p>{{ t('storefront.contact.hoursValue') }}</p>
          </div>
        </div>

        <div class="fc-map-section sf-reveal-up">
          <div class="fc-map-head">
            <h2>
              <Icon icon="solar:map-bold" style="margin-right: 8px; color: var(--sf-red)" />
              {{ t('storefront.contact.mapTitle') }}
            </h2>
            <a :href="mapLink" target="_blank" rel="noopener noreferrer">
              {{ t('storefront.contact.openMaps') }}
              <Icon icon="solar:square-arrow-right-up-linear" style="margin-left: 4px" />
            </a>
          </div>
          <div class="fc-map-frame">
            <iframe
              title="Mandalay — Flexicell service area"
              :src="mapEmbed"
              allowfullscreen
              loading="lazy"
              referrerpolicy="no-referrer-when-downgrade"
            />
          </div>
          <p class="fc-quick-footnote" style="margin-top: 12px">{{ t('storefront.contact.mapNote') }}</p>
        </div>

        <div class="fc-contact-layout">
          <div class="fc-form-shell sf-reveal-left">
            <div class="fc-form-accent" />
            <div class="fc-form-inner">
              <div class="fc-form-title-row">
                <div class="fc-form-title-icon">
                  <Icon icon="solar:plain-bold" />
                </div>
                <div>
                  <h2>{{ t('storefront.contact.formTitle') }}</h2>
                  <p class="fc-sub">{{ t('storefront.contact.formHint') }}</p>
                </div>
              </div>

              <form @submit.prevent="submit">
                <div class="fc-form-grid">
                  <div class="sf-field">
                    <label for="name">{{ t('storefront.contact.name') }} <span class="fc-req">*</span></label>
                    <input id="name" v-model="form.name" type="text" required autocomplete="name" :placeholder="t('storefront.contact.namePlaceholder')" />
                  </div>
                  <div class="sf-field">
                    <label for="email">{{ t('storefront.contact.email') }} <span class="fc-req">*</span></label>
                    <input id="email" v-model="form.email" type="email" required autocomplete="email" placeholder="name@example.com" />
                  </div>
                  <div class="sf-field">
                    <label for="phone">{{ t('storefront.contact.phone') }} <span class="fc-opt">({{ t('storefront.contact.optional') }})</span></label>
                    <input id="phone" v-model="form.phone" type="tel" autocomplete="tel" placeholder="09 xxx xxx xxx" />
                  </div>
                  <div class="sf-field">
                    <label for="subject">{{ t('storefront.contact.subject') }} <span class="fc-opt">({{ t('storefront.contact.optional') }})</span></label>
                    <input id="subject" v-model="form.subject" type="text" :placeholder="t('storefront.contact.subjectPlaceholder')" />
                  </div>
                </div>
                <div class="sf-field">
                  <label for="message">{{ t('storefront.contact.message') }} <span class="fc-req">*</span></label>
                  <textarea id="message" v-model="form.message" rows="5" required :placeholder="t('storefront.contact.messagePlaceholder')" />
                </div>
                <div class="fc-form-actions">
                  <button type="submit" class="fc-submit-btn" :disabled="loading">
                    <Icon icon="solar:plain-bold" style="margin-right: 8px" />
                    {{ loading ? t('common.loading') : t('storefront.contact.send') }}
                  </button>
                  <p class="fc-form-call-hint" v-html="t('storefront.contact.callHint')" />
                </div>
              </form>
            </div>
          </div>

          <aside class="fc-quick-panel sf-reveal-right">
            <h2>{{ t('storefront.contact.quickLinks') }}</h2>
            <p class="fc-sub">{{ t('storefront.contact.quickLinksSub') }}</p>
            <div class="fc-quick-links">
              <RouterLink to="/warranty"><Icon icon="solar:shield-check-bold" /> {{ t('storefront.nav.warranty') }}</RouterLink>
              <RouterLink to="/products"><Icon icon="solar:smartphone-2-bold" /> {{ t('storefront.nav.products') }}</RouterLink>
              <RouterLink to="/about"><Icon icon="solar:info-circle-bold" /> {{ t('storefront.nav.about') }}</RouterLink>
              <RouterLink to="/blog"><Icon icon="solar:document-text-bold" /> {{ t('storefront.nav.blog') }}</RouterLink>
            </div>
            <hr class="fc-divider" />
            <p class="fc-quick-footnote">{{ t('storefront.contact.urgentNote') }}</p>
          </aside>
        </div>
      </div>
    </section>
  </div>
</template>
