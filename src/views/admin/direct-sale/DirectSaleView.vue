<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { Icon } from '@iconify/vue'
import Modal from '@/components/ui/Modal.vue'
import ImageCropperModal from '@/components/ui/ImageCropperModal.vue'
import PosVariantModal from '@/components/pos/PosVariantModal.vue'
import { useImageCropper } from '@/composables/useImageCropper'
import { directSaleApi } from '@/api/directSale'
import {
  usePosCart,
  type InstallmentRate,
  type PosProduct,
  isNewProduct,
  isSecondHand,
} from '@/composables/usePos'
import { usePosVariants } from '@/composables/usePosVariants'
import { usePosDragDrop } from '@/composables/usePosDragDrop'
import { useNotify } from '@/composables/useNotify'
import { getApiErrorMessage } from '@/utils/apiError'
import { formatCurrency } from '@/utils/format'
import { productImageUrl } from '@/utils/media'

interface Customer {
  id: number
  name: string
  phone?: string
  email?: string
  address?: string
}

const { t } = useI18n()
const router = useRouter()
const { success, error: notifyError } = useNotify()

const tradeInCredit = ref(0)
const {
  cart,
  subtotal,
  discountTotal,
  grandTotal,
  unitCount,
  lineTotal,
  clearCart,
  removeLine,
  adjustQty,
  appendItemsToFormData,
} = usePosCart(tradeInCredit)

const products = ref<PosProduct[]>([])
const productQuery = ref('')
const productLoading = ref(false)
const viewMode = ref<'grid' | 'grid-sm' | 'list'>('grid')
const installmentRates = ref<InstallmentRate[]>([])

const imeiInput = ref('')
const imeiLoading = ref(false)

const posVariants = usePosVariants(cart)
const dragDrop = usePosDragDrop(
  () => products.value,
  (product) => void handleProductAdd(product),
  () => notifyError(t('pos.scanImeiHint')),
)

const showCheckoutModal = ref(false)
const customerQuery = ref('')
const customers = ref<Customer[]>([])
const selectedCustomer = ref<Customer | null>(null)
const paymentType = ref<'cash' | 'installment'>('cash')
const installmentRateId = ref<number | null>(null)
const downPayment = ref(0)
const customerNrc = ref('')
const attachmentFiles = ref<File[]>([])
const checkoutLoading = ref(false)

const {
  showCropper: showAttachmentCropper,
  cropSrc: attachmentCropSrc,
  aspectRatio: attachmentAspectRatio,
  outputWidth: attachmentOutputWidth,
  outputHeight: attachmentOutputHeight,
  cropFilesFromEvent: cropAttachmentsFromEvent,
  onCropConfirm: onAttachmentCropConfirm,
  onCropCancel: onAttachmentCropCancel,
} = useImageCropper()

async function onAttachmentsChange(e: Event) {
  attachmentFiles.value = await cropAttachmentsFromEvent(e, true)
}

let productTimer: ReturnType<typeof setTimeout> | null = null
let customerTimer: ReturnType<typeof setTimeout> | null = null

async function loadProducts(q = '') {
  productLoading.value = true
  try {
    const res = await directSaleApi.searchProducts(q || undefined)
    products.value = (res.data ?? []) as PosProduct[]
  } catch (e) {
    notifyError(getApiErrorMessage(e))
  } finally {
    productLoading.value = false
  }
}

async function loadBootstrap() {
  try {
    const res = await directSaleApi.bootstrap()
    installmentRates.value = ((res.data as { installment_rates?: InstallmentRate[] })?.installment_rates ?? [])
    if (installmentRates.value.length) {
      installmentRateId.value = installmentRates.value[0]?.id ?? null
    }
  } catch (e) {
    notifyError(getApiErrorMessage(e))
  }
}

watch(productQuery, (q) => {
  if (productTimer) clearTimeout(productTimer)
  productTimer = setTimeout(() => loadProducts(q), 300)
})

watch(customerQuery, (q) => {
  if (customerTimer) clearTimeout(customerTimer)
  customerTimer = setTimeout(() => searchCustomers(q), 300)
})

async function searchCustomers(q = '') {
  try {
    const res = await directSaleApi.searchCustomers(q || undefined)
    customers.value = (res.data ?? []) as Customer[]
  } catch {
    customers.value = []
  }
}

async function handleProductAdd(product: PosProduct) {
  if (isSecondHand(product.product_type)) {
    notifyError(t('pos.scanImeiHint'))
    return
  }
  if (product.stock_quantity <= 0) {
    notifyError(t('pos.outOfStock'))
    return
  }
  try {
    await posVariants.openVariantModal(product)
  } catch {
    notifyError(t('pos.variantLoadFailed'))
  }
}

function onProductClick(product: PosProduct) {
  void handleProductAdd(product)
}

function addVariantToCart() {
  if (!posVariants.addVariantToCart()) {
    notifyError(t('pos.maxStockReached'))
  }
}

function onAdjustQty(idx: number, delta: number) {
  const ok = adjustQty(idx, delta)
  if (!ok && delta > 0) {
    notifyError(t('pos.maxStockReached'))
  }
}

async function lookupImei() {
  const imei = imeiInput.value.trim()
  if (!imei) return
  imeiLoading.value = true
  try {
    const res = await directSaleApi.searchDevices(imei)
    const device = res.data as {
      device_id: number
      imei: string
      product_id: number
      product_variant_id: number
      product_label: string
      brand: string
      selling_price: number
      ram: string
      storage: string
      color: string
    } | null
    if (!device) {
      notifyError(t('pos.deviceNotFound'))
      return
    }
    const variantLabel = [device.ram, device.storage, device.color].filter((v) => v && v !== '-').join(' / ')
    const key = `d-${device.device_id}`
    if (cart.value.some((x) => x.key === key)) {
      notifyError(t('pos.alreadyInCart'))
      return
    }
    cart.value.push({
      key,
      product_id: device.product_id,
      product_label: `${device.brand} - ${device.product_label}`,
      variant_label: variantLabel || null,
      product_type: 'second hand',
      quantity: 1,
      unit_price: device.selling_price,
      discount_price: 0,
      device_id: device.device_id,
      imei: device.imei,
      product_variant_id: device.product_variant_id,
    })
    imeiInput.value = ''
    success(t('pos.deviceAdded'))
  } catch (e) {
    notifyError(getApiErrorMessage(e))
  } finally {
    imeiLoading.value = false
  }
}

function openCheckout() {
  if (!cart.value.length) {
    notifyError(t('pos.cartEmpty'))
    return
  }
  showCheckoutModal.value = true
  customerQuery.value = ''
  searchCustomers('')
}

function selectCustomer(c: Customer) {
  selectedCustomer.value = c
  customerQuery.value = c.name
  customers.value = []
}

const financePreview = computed(() => {
  const rate = installmentRates.value.find((r) => r.id === installmentRateId.value)
  const months = rate?.month_option ?? 0
  const ratePct = rate?.rate ?? 0
  const g = grandTotal.value
  const down = Math.max(0, downPayment.value)
  const interest = g * (ratePct / 100)
  const totalWithInterest = g * (1 + ratePct / 100)
  const principal = Math.max(0, g - down)
  const remaining = Math.max(0, totalWithInterest - down)
  const monthly = months > 0 ? remaining / months : remaining
  return { interest, principal, monthly, months, ratePct }
})

async function submitCheckout() {
  if (!selectedCustomer.value) {
    notifyError(t('pos.customerRequired'))
    return
  }
  if (paymentType.value === 'installment') {
    if (!customerNrc.value.trim()) {
      notifyError(t('pos.nrcRequired'))
      return
    }
    if (!installmentRateId.value) {
      notifyError(t('pos.planRequired'))
      return
    }
  }

  checkoutLoading.value = true
  try {
    const fd = new FormData()
    appendItemsToFormData(fd)
    fd.append('customer_id', String(selectedCustomer.value.id))
    fd.append('payment_type', paymentType.value)
    if (paymentType.value === 'installment') {
      fd.append('installment_rate_id', String(installmentRateId.value))
      fd.append('down_payment', String(downPayment.value))
      fd.append('customer_nrc', customerNrc.value)
      attachmentFiles.value.forEach((file) => fd.append('attachments[]', file))
    }

    const res = await directSaleApi.checkout(fd)
    const orderId = (res.data as { order_id?: number })?.order_id
    success(t('pos.checkoutSuccess'))
    showCheckoutModal.value = false
    clearCart()
    selectedCustomer.value = null
    if (orderId) router.push(`/admin/orders/${orderId}/receipt`)
  } catch (e) {
    notifyError(getApiErrorMessage(e))
  } finally {
    checkoutLoading.value = false
  }
}

function productBadge(type: string) {
  if (isNewProduct(type)) return t('products.typeNew')
  if (isSecondHand(type)) return t('products.typeSecondHand')
  return type
}

onMounted(() => {
  loadProducts('')
  loadBootstrap()
})
</script>

<template>
  <div class="pos-page">
    <div class="pos-page-header">
      <h1>
        <Icon icon="solar:cart-large-minimalistic-linear" />
        {{ t('pages.directSale.title') }}
      </h1>
      <span class="pos-badge">{{ t('pos.directSaleBadge') }}</span>
    </div>

    <div class="pos-layout">
      <div class="pos-main">
        <div class="pos-catalog">
          <div class="pos-section-title">
            <Icon icon="solar:magnifer-linear" />
            {{ t('pos.products') }}
          </div>

          <div class="pos-search-wrap">
            <Icon icon="solar:magnifer-linear" class="pos-search-icon" />
            <input
              v-model="productQuery"
              type="search"
              class="pos-search-input"
              :placeholder="t('pos.searchProducts')"
            />
          </div>

          <div class="pos-toolbar">
            <div class="pos-imei-wrap">
              <input
                v-model="imeiInput"
                type="text"
                class="mono"
                :placeholder="t('pos.imeiPlaceholder')"
                @keydown.enter.prevent="lookupImei"
              />
              <button
                type="button"
                class="pos-btn-imei"
                :disabled="imeiLoading"
                @click="lookupImei"
              >
                {{ imeiLoading ? t('common.loading') : t('pos.addImei') }}
              </button>
            </div>
            <div class="pos-view-toggle">
              <button
                type="button"
                class="pos-view-btn"
                :class="{ active: viewMode === 'grid' }"
                @click="viewMode = 'grid'"
              >
                <Icon icon="solar:widget-4-linear" />
              </button>
              <button
                type="button"
                class="pos-view-btn"
                :class="{ active: viewMode === 'grid-sm' }"
                @click="viewMode = 'grid-sm'"
              >
                <Icon icon="solar:widget-2-linear" />
              </button>
              <button
                type="button"
                class="pos-view-btn"
                :class="{ active: viewMode === 'list' }"
                @click="viewMode = 'list'"
              >
                <Icon icon="solar:list-linear" />
              </button>
            </div>
          </div>

          <div class="pos-catalog-scroll">
            <div v-if="productLoading" class="pos-cart-empty">{{ t('common.loading') }}</div>
            <div v-else-if="!products.length" class="pos-cart-empty">{{ t('pos.noProducts') }}</div>
            <div
              v-else
              class="pos-product-grid"
              :class="{ 'view-list': viewMode === 'list', 'view-grid-sm': viewMode === 'grid-sm' }"
            >
              <div
                v-for="product in products"
                :key="product.id"
                class="pos-product-item"
                :draggable="isNewProduct(product.product_type)"
                @dragstart="dragDrop.onProductDragStart($event, product)"
                @dragend="dragDrop.onProductDragEnd"
                @click="onProductClick(product)"
              >
                <div class="product-thumb">
                  <img
                    v-if="productImageUrl(product.image)"
                    :src="productImageUrl(product.image)!"
                    alt=""
                  />
                  <Icon v-else icon="solar:smartphone-2-linear" class="thumb-icon" />
                </div>
                <div class="product-meta">
                  <span class="pos-storage-badge">{{ productBadge(product.product_type) }}</span>
                  <div class="pos-card-brand">{{ product.brand }}</div>
                  <div class="pos-card-model">{{ product.label }}</div>
                  <div class="pos-card-footer">
                    <span class="pos-card-stock">{{ product.stock_quantity }} {{ t('pos.left') }}</span>
                  </div>
                  <button
                    v-if="isNewProduct(product.product_type)"
                    type="button"
                    class="pos-card-add"
                    @click.stop="onProductClick(product)"
                  >
                    {{ t('pos.addToCart') }}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <aside
        class="pos-order-sidebar"
        :class="{ 'cart-drop-highlight': dragDrop.cartDropHighlight.value }"
        @dragover="dragDrop.onCartDragOver"
        @dragleave="dragDrop.onCartDragLeave"
        @drop="dragDrop.onCartDrop"
      >
        <div class="pos-order-header">
          <h2 class="pos-order-title">{{ t('pos.currentOrder') }}</h2>
          <button type="button" class="pos-clear-btn" @click="clearCart">{{ t('pos.clear') }}</button>
        </div>
        <p class="pos-order-sub">{{ cart.length }} {{ t('pos.orderItems') }} · {{ unitCount }} {{ t('orders.qty') }}</p>

        <div class="pos-cart-items">
          <div v-if="!cart.length" class="pos-cart-empty">{{ t('pos.cartEmpty') }}</div>
          <div v-for="(line, idx) in cart" :key="line.key" class="pos-cart-line">
            <div class="pos-cart-line-thumb">
              <Icon icon="solar:smartphone-2-linear" />
            </div>
            <div class="pos-cart-line-body">
              <div class="pos-cart-line-title">{{ line.product_label }}</div>
              <div v-if="line.variant_label" class="pos-cart-line-meta">{{ line.variant_label }}</div>
              <div v-if="line.imei" class="pos-cart-line-meta mono">IMEI: {{ line.imei }}</div>
              <span
                class="pos-cart-line-type"
                :class="line.device_id ? 'pos-cart-line-type--imei' : 'pos-cart-line-type--qty'"
              >
                {{ line.device_id ? 'IMEI' : 'Qty' }}
              </span>
              <div class="pos-cart-line-prices">
                <div>
                  <label>{{ t('orders.unitPrice') }}</label>
                  <input v-model.number="line.unit_price" type="number" min="0" step="1" />
                </div>
                <div>
                  <label>{{ t('orders.discount') }}</label>
                  <input v-model.number="line.discount_price" type="number" min="0" step="1" />
                </div>
              </div>
              <div class="pos-cart-line-total">
                {{ t('pos.line') }}: {{ formatCurrency(lineTotal(line)) }}
              </div>
            </div>
            <div class="pos-cart-line-tools">
              <button type="button" class="pos-cart-remove" @click="removeLine(idx)">
                <Icon icon="solar:trash-bin-trash-linear" />
              </button>
              <div v-if="line.device_id" class="pos-qty-pill">
                <span class="pos-qty-val">1</span>
              </div>
              <div v-else class="pos-qty-pill">
                <button type="button" @click="onAdjustQty(idx, -1)">−</button>
                <span class="pos-qty-val">{{ line.quantity }}</span>
                <button type="button" @click="onAdjustQty(idx, 1)">+</button>
              </div>
            </div>
          </div>
        </div>

        <div class="pos-totals-box">
          <div class="pos-total-row">
            <span>{{ t('orders.subtotal') }}</span>
            <span>{{ formatCurrency(subtotal) }}</span>
          </div>
          <div class="pos-total-row">
            <span>{{ t('orders.discount') }}</span>
            <span>{{ formatCurrency(discountTotal) }}</span>
          </div>
          <div class="pos-total-row pos-total-grand">
            <span>{{ t('orders.total') }}</span>
            <span>{{ formatCurrency(grandTotal) }}</span>
          </div>
        </div>

        <button
          type="button"
          class="pos-btn-checkout"
          :disabled="!cart.length"
          @click="openCheckout"
        >
          {{ t('pos.checkout') }}
        </button>
      </aside>
    </div>

    <PosVariantModal :variants="posVariants" @add="addVariantToCart" />

    <ImageCropperModal
      :show="showAttachmentCropper"
      :src="attachmentCropSrc"
      :aspect-ratio="attachmentAspectRatio"
      :output-width="attachmentOutputWidth"
      :output-height="attachmentOutputHeight"
      @confirm="onAttachmentCropConfirm"
      @close="onAttachmentCropCancel"
    />

    <!-- Checkout modal -->
    <Modal
      :show="showCheckoutModal"
      :title="t('pos.checkoutTitle')"
      size="lg"
      @close="showCheckoutModal = false"
    >
      <div v-if="selectedCustomer" class="pos-customer-header">
        <p class="pos-customer-header-name">{{ selectedCustomer.name }}</p>
        <p class="pos-customer-header-meta">
          {{ selectedCustomer.phone || '—' }} · {{ selectedCustomer.email || '—' }}
        </p>
      </div>

      <div class="form-group">
        <label>{{ t('pos.searchCustomer') }}</label>
        <input v-model="customerQuery" type="search" class="search-input" />
        <div v-if="customers.length" class="pos-customer-results">
          <button
            v-for="c in customers"
            :key="c.id"
            type="button"
            class="pos-customer-item"
            @click="selectCustomer(c)"
          >
            <strong>{{ c.name }}</strong>
            <span v-if="c.phone"> — {{ c.phone }}</span>
          </button>
        </div>
      </div>

      <div class="pos-pay-tabs">
        <button
          type="button"
          class="pos-pay-tab"
          :class="{ active: paymentType === 'cash' }"
          @click="paymentType = 'cash'"
        >
          {{ t('pos.cash') }}
        </button>
        <button
          type="button"
          class="pos-pay-tab"
          :class="{ active: paymentType === 'installment' }"
          @click="paymentType = 'installment'"
        >
          {{ t('pos.installment') }}
        </button>
      </div>

      <div v-if="paymentType === 'installment'">
        <div class="form-group">
          <label>{{ t('pos.customerNrc') }} *</label>
          <input v-model="customerNrc" type="text" />
        </div>
        <label class="variant-group-label">{{ t('pos.plan') }}</label>
        <div class="pos-plan-grid">
          <button
            v-for="rate in installmentRates"
            :key="rate.id"
            type="button"
            class="pos-plan-card"
            :class="{ 'is-selected': installmentRateId === rate.id }"
            @click="installmentRateId = rate.id"
          >
            <span class="pos-plan-mo">{{ rate.month_option }} {{ t('installmentRates.months') }}</span>
            <span class="pos-plan-apr">{{ rate.rate }}%</span>
          </button>
        </div>
        <div class="form-group">
          <label>{{ t('installments.downPayment') }}</label>
          <input v-model.number="downPayment" type="number" min="0" />
        </div>
        <div class="pos-finance-summary">
          <div class="pos-finance-row">
            <span>{{ t('pos.financed') }}</span>
            <span>{{ formatCurrency(financePreview.principal) }}</span>
          </div>
          <div class="pos-finance-row">
            <span>{{ t('pos.interest') }}</span>
            <span>{{ formatCurrency(financePreview.interest) }}</span>
          </div>
          <div class="pos-finance-row pos-finance-row-highlight">
            <span>{{ t('pos.monthly') }}</span>
            <span>{{ formatCurrency(financePreview.monthly) }}</span>
          </div>
        </div>
        <div class="form-group">
          <label>{{ t('pos.attachments') }}</label>
          <input
            type="file"
            accept="image/*,.pdf"
            multiple
            @change="onAttachmentsChange"
          />
        </div>
      </div>

      <div class="pos-totals-box">
        <div class="pos-total-row pos-total-grand">
          <span>{{ t('pos.totalDue') }}</span>
          <span>{{ formatCurrency(grandTotal) }}</span>
        </div>
      </div>

      <template #footer>
        <button type="button" class="btn btn-outline" @click="showCheckoutModal = false">
          {{ t('common.cancel') }}
        </button>
        <button type="button" class="btn btn-primary" :disabled="checkoutLoading" @click="submitCheckout">
          {{ checkoutLoading ? t('common.loading') : t('pos.completeSale') }}
        </button>
      </template>
    </Modal>
  </div>
</template>

<style scoped>
.pos-page-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1.25rem;
}
.pos-page-header h1 {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1.35rem;
  font-weight: 800;
}
.pos-badge {
  font-size: 0.75rem;
  font-weight: 600;
  padding: 0.25rem 0.65rem;
  border-radius: 999px;
  background: var(--pos-red-soft, #fef2f2);
  color: var(--pos-red-dark, #991b1b);
  border: 1px solid var(--pos-red-muted, #fecaca);
}
.pos-variant-product {
  font-weight: 700;
  margin-bottom: 1rem;
}
</style>
