<script setup lang="ts">
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
const items = [
  t('storefront.marquee.new'),
  t('storefront.marquee.warranty'),
  t('storefront.marquee.tradeIn'),
  t('storefront.marquee.installment'),
  t('storefront.marquee.mandalay'),
]
const track = [...items, ...items]
</script>

<template>
  <div class="sf-marquee" aria-hidden="true">
    <div class="sf-marquee-track">
      <span v-for="(item, i) in track" :key="i" class="sf-marquee-item">
        {{ item }}
        <span class="sf-marquee-dot">✦</span>
      </span>
    </div>
  </div>
</template>
