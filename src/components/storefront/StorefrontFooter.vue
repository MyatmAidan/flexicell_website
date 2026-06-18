<script setup lang="ts">
import { RouterLink } from 'vue-router'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
const year = new Date().getFullYear()
</script>

<template>
  <footer class="sf-footer">
    <div class="sf-container">
      <div class="sf-footer-grid">
        <div>
          <img src="/img/flexicell_logo1.png" alt="Flexicell" style="height: 36px; filter: brightness(0) invert(1); margin-bottom: 0.75rem" />
          <p style="font-size: 0.88rem; line-height: 1.6; margin: 0">{{ t('storefront.footer.tagline') }}</p>
        </div>
        <div>
          <h4>{{ t('storefront.footer.quickLinks') }}</h4>
          <ul>
            <li><RouterLink to="/products">{{ t('storefront.nav.products') }}</RouterLink></li>
            <li><RouterLink to="/blog">{{ t('storefront.nav.blog') }}</RouterLink></li>
            <li><RouterLink to="/warranty">{{ t('storefront.nav.warranty') }}</RouterLink></li>
            <li><RouterLink to="/contact">{{ t('storefront.nav.contact') }}</RouterLink></li>
          </ul>
        </div>
        <div>
          <h4>{{ t('storefront.footer.contact') }}</h4>
          <ul>
            <li>09978844466</li>
            <li>flexicell.main.mdy@gmail.com</li>
            <li>Mandalay, Myanmar</li>
          </ul>
        </div>
      </div>
      <div class="sf-footer-bottom">
        © {{ year }} Flexicell Mobile. {{ t('storefront.footer.rights') }}
      </div>
    </div>
  </footer>
</template>
