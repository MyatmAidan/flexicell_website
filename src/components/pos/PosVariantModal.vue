<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import Modal from '@/components/ui/Modal.vue'
import { formatCurrency } from '@/utils/format'
import type { usePosVariants } from '@/composables/usePosVariants'

const props = defineProps<{
  variants: ReturnType<typeof usePosVariants>
}>()

const emit = defineEmits<{ add: [] }>()

const { t } = useI18n()
const v = () => props.variants

const show = computed(() => v().showVariantModal.value)
const loading = computed(() => v().variantLoading.value)
const product = computed(() => v().variantProduct.value)
const data = computed(() => v().variantData.value)
const uiMode = computed(() => v().variantUiMode.value)
const stock = computed(() => v().variantStock.value)
const resolvedPrice = computed(() => v().variantResolvedPrice.value)

function toId(val: unknown): number | null {
  if (val === null || val === undefined || val === '') return null
  const n = Number(val)
  return Number.isFinite(n) ? n : null
}

const selectedComboId = computed({
  get: () => v().selectedComboId.value,
  set: (val) => {
    v().selectedComboId.value = toId(val)
  },
})

const selectedRam = computed({
  get: () => v().selectedRam.value ?? '',
  set: (val) => {
    v().selectedRam.value = toId(val)
  },
})

const selectedStorage = computed({
  get: () => v().selectedStorage.value ?? '',
  set: (val) => {
    v().selectedStorage.value = toId(val)
  },
})

const selectedColor = computed({
  get: () => v().selectedColor.value ?? '',
  set: (val) => {
    v().selectedColor.value = toId(val)
  },
})

const variantQty = computed({
  get: () => v().variantQty.value,
  set: (val) => {
    v().variantQty.value = val
  },
})

function comboOptionLabel(combo: {
  label: string
  stock: number
  min_price: number | null
  max_price: number | null
}) {
  const price =
    combo.min_price != null
      ? combo.max_price != null && combo.max_price !== combo.min_price
        ? `${formatCurrency(combo.min_price)} – ${formatCurrency(combo.max_price)}`
        : formatCurrency(combo.min_price)
      : ''
  return [combo.label, `${combo.stock} ${t('pos.inStock')}`, price].filter(Boolean).join(' · ')
}
</script>

<template>
  <Modal :show="show" :title="t('pos.selectVariant')" size="lg" @close="v().closeVariantModal()">
    <div v-if="loading" class="page-loading">{{ t('common.loading') }}</div>
    <div v-else-if="product">
      <p class="pos-variant-product">{{ product.brand }} — {{ product.label }}</p>

      <template v-if="uiMode === 'combo'">
        <div class="form-group">
          <label class="variant-group-label">{{ t('pos.variant') }}</label>
          <select v-model="selectedComboId" class="variant-select">
            <option
              v-for="combo in data?.combinations"
              :key="combo.product_variant_id"
              :value="combo.product_variant_id"
            >
              {{ comboOptionLabel(combo) }}
            </option>
          </select>
        </div>
      </template>

      <template v-else>
        <div v-if="data?.ram.length" class="form-group">
          <label class="variant-group-label">RAM</label>
          <select v-model="selectedRam" class="variant-select">
            <option value="">{{ t('pos.any') }}</option>
            <option v-for="opt in data.ram" :key="opt.id" :value="opt.id">
              {{ opt.value || opt.name }}
            </option>
          </select>
        </div>

        <div v-if="data?.storage.length" class="form-group">
          <label class="variant-group-label">{{ t('devices.storage') }}</label>
          <select v-model="selectedStorage" class="variant-select">
            <option value="">{{ t('pos.any') }}</option>
            <option v-for="opt in data.storage" :key="opt.id" :value="opt.id">
              {{ opt.value || opt.name }}
            </option>
          </select>
        </div>

        <div v-if="data?.color.length" class="form-group">
          <label class="variant-group-label">{{ t('devices.color') }}</label>
          <select v-model="selectedColor" class="variant-select">
            <option value="">{{ t('pos.any') }}</option>
            <option v-for="opt in data.color" :key="opt.id" :value="opt.id">
              {{ opt.name }}
            </option>
          </select>
        </div>
      </template>

      <div class="form-group" style="margin-top: 1rem">
        <label>{{ t('orders.qty') }}</label>
        <input v-model.number="variantQty" type="number" min="1" :max="stock?.count ?? 99" />
      </div>
      <p v-if="stock">
        <strong>{{ stock.count }}</strong> {{ t('pos.available') }}
        · {{ formatCurrency(resolvedPrice) }}
      </p>
    </div>

    <template #footer>
      <button type="button" class="btn btn-outline" @click="v().closeVariantModal()">{{ t('common.cancel') }}</button>
      <button type="button" class="btn btn-primary" :disabled="!stock || stock.count < 1" @click="emit('add')">
        {{ t('pos.addToCart') }}
      </button>
    </template>
  </Modal>
</template>
