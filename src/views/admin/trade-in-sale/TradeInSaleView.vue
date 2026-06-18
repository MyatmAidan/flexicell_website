<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { Icon } from '@iconify/vue'
import Modal from '@/components/ui/Modal.vue'
import ImageCropInput from '@/components/ui/ImageCropInput.vue'
import PosVariantModal from '@/components/pos/PosVariantModal.vue'
import { directSaleApi } from '@/api/directSale'
import { tradeInSaleApi } from '@/api/tradeInSale'
import {
  usePosCart,
  type InstallmentRate,
  type PosProduct,
  isNewProduct,
} from '@/composables/usePos'
import { usePosVariants } from '@/composables/usePosVariants'
import { usePosDragDrop } from '@/composables/usePosDragDrop'
import { useNotify } from '@/composables/useNotify'
import { getApiErrorMessage } from '@/utils/apiError'
import { formatCurrency } from '@/utils/format'
import { productImageUrl } from '@/utils/media'

interface PhoneModel {
  id: number
  model_name: string
  brand?: { brand_name?: string }
}

interface SelectOption {
  id: number
  name: string
  value: string
}

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

const tradeInCredit = computed(() => Math.max(0, Number(tradeInForm.value.buy_price) || 0))
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

const phoneModels = ref<PhoneModel[]>([])
const ramOptions = ref<SelectOption[]>([])
const storageOptions = ref<SelectOption[]>([])
const colorOptions = ref<SelectOption[]>([])
const installmentRates = ref<InstallmentRate[]>([])
const bootstrapLoading = ref(true)

const tradeInForm = ref({
  phone_model_id: '' as string | number,
  imei: '',
  ram: '',
  storage: '',
  color: '',
  condition: 'A',
  battery: 100,
  buy_price: 0,
  purchase_at: '',
})
const tradeInImageFiles = ref<File[]>([])

const products = ref<PosProduct[]>([])
const productQuery = ref('')
const productLoading = ref(false)
const viewMode = ref<'grid' | 'list'>('grid')

const posVariants = usePosVariants(cart)
const dragDrop = usePosDragDrop(
  () => products.value,
  (product) => void handleProductAdd(product),
)

const showCheckoutModal = ref(false)
const customerQuery = ref('')
const customers = ref<Customer[]>([])
const selectedCustomer = ref<Customer | null>(null)
const showNewCustomer = ref(false)
const newCustomer = ref({ name: '', phone: '', nrc: '', address: '' })
const paymentType = ref<'cash' | 'installment'>('cash')
const installmentRateId = ref<number | null>(null)
const downPayment = ref(0)
const checkoutLoading = ref(false)

let productTimer: ReturnType<typeof setTimeout> | null = null
let customerTimer: ReturnType<typeof setTimeout> | null = null

async function loadBootstrap() {
  bootstrapLoading.value = true
  try {
    const res = await tradeInSaleApi.bootstrap()
    const data = res.data as {
      phone_models?: PhoneModel[]
      ram_options?: SelectOption[]
      storage_options?: SelectOption[]
      color_options?: SelectOption[]
      installment_rates?: InstallmentRate[]
    }
    phoneModels.value = data.phone_models ?? []
    ramOptions.value = data.ram_options ?? []
    storageOptions.value = data.storage_options ?? []
    colorOptions.value = data.color_options ?? []
    installmentRates.value = data.installment_rates ?? []
    if (installmentRates.value.length) {
      installmentRateId.value = installmentRates.value[0]?.id ?? null
    }
  } catch (e) {
    notifyError(getApiErrorMessage(e))
  } finally {
    bootstrapLoading.value = false
  }
}

async function loadProducts(q = '') {
  productLoading.value = true
  try {
    const res = await directSaleApi.searchProducts(q || undefined)
    products.value = ((res.data ?? []) as PosProduct[]).filter((p) => isNewProduct(p.product_type))
  } catch (e) {
    notifyError(getApiErrorMessage(e))
  } finally {
    productLoading.value = false
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
    const res = await tradeInSaleApi.searchCustomers(q || undefined)
    customers.value = (res.data ?? []) as Customer[]
  } catch {
    customers.value = []
  }
}

async function handleProductAdd(product: PosProduct) {
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

function onTradeInImagesSelected(files: File[]) {
  tradeInImageFiles.value = files
}

function openCheckout() {
  if (!tradeInForm.value.phone_model_id) {
    notifyError(t('pos.tradeInModelRequired'))
    return
  }
  if (!tradeInForm.value.imei.trim()) {
    notifyError(t('pos.tradeInImeiRequired'))
    return
  }
  if (!cart.value.length) {
    notifyError(t('pos.cartEmpty'))
    return
  }
  showCheckoutModal.value = true
  searchCustomers('')
}

function selectCustomer(c: Customer) {
  selectedCustomer.value = c
  showNewCustomer.value = false
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
  const remaining = Math.max(0, totalWithInterest - down)
  const monthly = months > 0 ? remaining / months : remaining
  return { interest, monthly, principal: Math.max(0, g - down) }
})

async function submitCheckout() {
  const hasCustomer = selectedCustomer.value || (showNewCustomer.value && newCustomer.value.name.trim())
  if (!hasCustomer) {
    notifyError(t('pos.customerRequired'))
    return
  }
  if (paymentType.value === 'installment' && !installmentRateId.value) {
    notifyError(t('pos.planRequired'))
    return
  }

  checkoutLoading.value = true
  try {
    const fd = new FormData()
    fd.append('tradein_phone_model_id', String(tradeInForm.value.phone_model_id))
    fd.append('tradein_imei', tradeInForm.value.imei.trim())
    fd.append('tradein_ram', tradeInForm.value.ram)
    fd.append('tradein_storage', tradeInForm.value.storage)
    fd.append('tradein_color', tradeInForm.value.color)
    fd.append('tradein_condition', tradeInForm.value.condition)
    fd.append('tradein_battery', String(tradeInForm.value.battery))
    fd.append('tradein_buy_price', String(tradeInForm.value.buy_price))
    if (tradeInForm.value.purchase_at) {
      fd.append('tradein_purchase_at', tradeInForm.value.purchase_at)
    }

    for (const file of tradeInImageFiles.value) {
      fd.append('tradein_image_files[]', file)
    }

    if (selectedCustomer.value) {
      fd.append('customer_id', String(selectedCustomer.value.id))
    } else {
      fd.append('customer_name', newCustomer.value.name)
      fd.append('customer_phone', newCustomer.value.phone)
      fd.append('customer_nrc', newCustomer.value.nrc)
      fd.append('customer_address', newCustomer.value.address)
    }

    fd.append('payment_type', paymentType.value)
    if (paymentType.value === 'installment') {
      fd.append('installment_rate_id', String(installmentRateId.value))
      fd.append('down_payment', String(downPayment.value))
    }

    appendItemsToFormData(fd)

    const res = await tradeInSaleApi.checkout(fd)
    const orderId = (res.data as { order_id?: number })?.order_id
    success(t('pos.checkoutSuccess'))
    showCheckoutModal.value = false
    clearCart()
    if (orderId) router.push(`/admin/orders/${orderId}/receipt`)
  } catch (e) {
    notifyError(getApiErrorMessage(e))
  } finally {
    checkoutLoading.value = false
  }
}

onMounted(async () => {
  await loadBootstrap()
  loadProducts('')
})
</script>

<template>
  <div class="pos-page">
    <div class="pos-page-header">
      <h1>
        <Icon icon="solar:refresh-circle-linear" />
        {{ t('pages.tradeInSale.title') }}
      </h1>
      <span class="pos-badge">{{ t('pos.tradeInBadge') }}</span>
    </div>

    <div v-if="bootstrapLoading" class="page-loading">{{ t('common.loading') }}</div>
    <template v-else>
      <div class="pos-layout">
        <div class="pos-main">
          <!-- Trade-in device -->
          <div class="pos-catalog" style="margin-bottom: 1rem">
            <div class="pos-section-title">
              <Icon icon="solar:smartphone-2-linear" />
              {{ t('pos.tradeInDevice') }}
            </div>
            <div class="form-grid two-col pos-tradein-grid">
              <div class="form-group full">
                <label>{{ t('pos.phoneModel') }} *</label>
                <select v-model="tradeInForm.phone_model_id" required>
                  <option value="">{{ t('pos.selectModel') }}</option>
                  <option v-for="m in phoneModels" :key="m.id" :value="m.id">
                    {{ m.brand?.brand_name }} {{ m.model_name }}
                  </option>
                </select>
              </div>
              <div class="form-group">
                <label>{{ t('devices.imei') }} *</label>
                <input v-model="tradeInForm.imei" type="text" class="mono" required />
              </div>
              <div class="form-group">
                <label>{{ t('devices.condition') }} *</label>
                <select v-model="tradeInForm.condition">
                  <option value="A">A</option>
                  <option value="B">B</option>
                  <option value="C">C</option>
                </select>
              </div>
              <div class="form-group">
                <label>{{ t('devices.ram') }}</label>
                <select v-model="tradeInForm.ram">
                  <option value="">{{ t('pos.any') }}</option>
                  <option v-for="o in ramOptions" :key="o.id" :value="o.value">{{ o.value }}</option>
                </select>
              </div>
              <div class="form-group">
                <label>{{ t('devices.storage') }}</label>
                <select v-model="tradeInForm.storage">
                  <option value="">{{ t('pos.any') }}</option>
                  <option v-for="o in storageOptions" :key="o.id" :value="o.value">{{ o.value }}</option>
                </select>
              </div>
              <div class="form-group">
                <label>{{ t('devices.color') }}</label>
                <select v-model="tradeInForm.color">
                  <option value="">{{ t('pos.any') }}</option>
                  <option v-for="o in colorOptions" :key="o.id" :value="o.value">{{ o.value }}</option>
                </select>
              </div>
              <div class="form-group">
                <label>{{ t('devices.battery') }} % *</label>
                <input v-model.number="tradeInForm.battery" type="number" min="0" max="100" />
              </div>
              <div class="form-group">
                <label>{{ t('pos.tradeInValue') }} *</label>
                <input v-model.number="tradeInForm.buy_price" type="number" min="0" />
              </div>
              <div class="form-group">
                <label>{{ t('pos.purchaseDate') }}</label>
                <input v-model="tradeInForm.purchase_at" type="date" />
              </div>
              <div class="form-group full">
                <label>{{ t('pos.tradeInPhotos') }}</label>
                <ImageCropInput multiple @select="onTradeInImagesSelected" />
              </div>
            </div>
          </div>

          <!-- Products -->
          <div class="pos-catalog">
            <div class="pos-section-title">
              <Icon icon="solar:bag-4-linear" />
              {{ t('pos.newProducts') }}
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
            <div class="pos-catalog-scroll">
              <div v-if="productLoading" class="pos-cart-empty">{{ t('common.loading') }}</div>
              <div v-else-if="!products.length" class="pos-cart-empty">{{ t('pos.noProducts') }}</div>
              <div
                v-else
                class="pos-product-grid"
                :class="{ 'view-list': viewMode === 'list' }"
              >
                <div
                  v-for="product in products"
                  :key="product.id"
                  class="pos-product-item"
                  draggable="true"
                  @dragstart="dragDrop.onProductDragStart($event, product)"
                  @dragend="dragDrop.onProductDragEnd"
                  @click="handleProductAdd(product)"
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
                    <div class="pos-card-brand">{{ product.brand }}</div>
                    <div class="pos-card-model">{{ product.label }}</div>
                    <div class="pos-card-footer">
                      <span class="pos-card-stock">{{ product.stock_quantity }} {{ t('pos.left') }}</span>
                    </div>
                    <button type="button" class="pos-card-add" @click.stop="handleProductAdd(product)">
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
                <span class="pos-cart-line-type pos-cart-line-type--qty">Qty</span>
                <div class="pos-cart-line-prices">
                  <div>
                    <label>{{ t('orders.unitPrice') }}</label>
                    <input v-model.number="line.unit_price" type="number" min="0" />
                  </div>
                  <div>
                    <label>{{ t('orders.discount') }}</label>
                    <input v-model.number="line.discount_price" type="number" min="0" />
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
                <div class="pos-qty-pill">
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
            <div class="pos-total-row pos-total-credit">
              <span>{{ t('orders.tradeInCredit') }}</span>
              <span>− {{ formatCurrency(tradeInCredit) }}</span>
            </div>
            <div class="pos-total-row pos-total-grand">
              <span>{{ t('orders.total') }}</span>
              <span>{{ formatCurrency(grandTotal) }}</span>
            </div>
          </div>

          <button type="button" class="pos-btn-checkout" :disabled="!cart.length" @click="openCheckout">
            {{ t('pos.checkout') }}
          </button>
        </aside>
      </div>

      <PosVariantModal :variants="posVariants" @add="addVariantToCart" />

      <!-- Checkout modal -->
      <Modal :show="showCheckoutModal" :title="t('pos.checkoutTitle')" size="lg" @close="showCheckoutModal = false">
        <div v-if="selectedCustomer" class="pos-customer-header">
          <p class="pos-customer-header-name">{{ selectedCustomer.name }}</p>
          <p class="pos-customer-header-meta">{{ selectedCustomer.phone || '—' }}</p>
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

        <button type="button" class="btn btn-outline btn-sm" style="margin-bottom: 1rem" @click="showNewCustomer = !showNewCustomer">
          {{ t('pos.newCustomer') }}
        </button>

        <div v-if="showNewCustomer && !selectedCustomer" class="form-grid two-col">
          <div class="form-group">
            <label>{{ t('customers.name') }} *</label>
            <input v-model="newCustomer.name" type="text" />
          </div>
          <div class="form-group">
            <label>{{ t('customers.phone') }}</label>
            <input v-model="newCustomer.phone" type="text" />
          </div>
          <div class="form-group full">
            <label>{{ t('pos.customerNrc') }}</label>
            <input v-model="newCustomer.nrc" type="text" />
          </div>
          <div class="form-group full">
            <label>{{ t('customers.address') }}</label>
            <input v-model="newCustomer.address" type="text" />
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
            <div class="pos-finance-row pos-finance-row-highlight">
              <span>{{ t('pos.monthly') }}</span>
              <span>{{ formatCurrency(financePreview.monthly) }}</span>
            </div>
          </div>
        </div>

        <div class="pos-totals-box">
          <div class="pos-total-row pos-total-credit">
            <span>{{ t('orders.tradeInCredit') }}</span>
            <span>− {{ formatCurrency(tradeInCredit) }}</span>
          </div>
          <div class="pos-total-row pos-total-grand">
            <span>{{ t('pos.totalDue') }}</span>
            <span>{{ formatCurrency(grandTotal) }}</span>
          </div>
        </div>

        <template #footer>
          <button type="button" class="btn btn-outline" @click="showCheckoutModal = false">{{ t('common.cancel') }}</button>
          <button type="button" class="btn btn-primary" :disabled="checkoutLoading" @click="submitCheckout">
            {{ checkoutLoading ? t('common.loading') : t('pos.completeSale') }}
          </button>
        </template>
      </Modal>
    </template>
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
</style>
