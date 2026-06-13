<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { Icon } from '@iconify/vue'
import { ordersApi } from '@/api/orders'
import { useNotify } from '@/composables/useNotify'
import { getApiErrorMessage } from '@/utils/apiError'
import { formatCurrency } from '@/utils/format'

interface ReceiptData {
  store: { name: string; tagline: string; address: string; phone: string }
  order: {
    id: number
    formatted_id: string
    order_date_display: string
    customer_name: string
    customer_phone?: string
  }
  trade_in?: {
    model: string
    imei: string
    condition_grade: string
    battery_percentage: number
    specs: string[]
    trade_in_credit: number
  }
  items: { product_id: number; model_name: string; imei?: string; unit_price: number; quantity: number; total: number }[]
  totals: { subtotal: number; discount: number; trade_in_credit: number; tax: number; grand_total: number }
  payment: { type: string; months?: number; monthly_amount?: number; down_payment?: number; status?: string; reference?: string }
}

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const { error: notifyError } = useNotify()

const id = computed(() => Number(route.params.id))
const loading = ref(true)
const receipt = ref<ReceiptData | null>(null)

async function load() {
  loading.value = true
  try {
    const res = await ordersApi.receipt(id.value)
    if (res.success) receipt.value = res.data as ReceiptData
  } catch (e) {
    notifyError(getApiErrorMessage(e))
  } finally {
    loading.value = false
  }
}

function printReceipt() {
  window.print()
}

onMounted(load)
</script>

<template>
  <div class="receipt-page">
    <div class="receipt-toolbar no-print">
      <button type="button" class="btn btn-outline btn-sm" @click="router.push(`/admin/orders/${id}`)">
        <Icon icon="solar:arrow-left-linear" /> {{ t('common.back') }}
      </button>
      <button type="button" class="btn btn-primary btn-sm" @click="printReceipt">
        <Icon icon="solar:printer-linear" /> {{ t('orders.print') }}
      </button>
    </div>

    <div v-if="loading" class="page-loading">{{ t('common.loading') }}</div>
    <div v-else-if="receipt" class="receipt-paper">
      <div class="receipt-header">
        <h1>{{ receipt.store.name }}</h1>
        <p>{{ receipt.store.tagline }}</p>
        <p>{{ receipt.store.address }}</p>
        <p>{{ receipt.store.phone }}</p>
      </div>

      <div class="receipt-meta">
        <p><strong>{{ t('orders.receipt') }} #{{ receipt.order.formatted_id }}</strong></p>
        <p>{{ receipt.order.order_date_display }}</p>
        <p>{{ t('orders.customer') }}: {{ receipt.order.customer_name }}</p>
        <p v-if="receipt.order.customer_phone">{{ receipt.order.customer_phone }}</p>
      </div>

      <div v-if="receipt.trade_in" class="receipt-section">
        <h3>{{ t('orders.tradeIn') }}</h3>
        <p>{{ receipt.trade_in.model }} — {{ receipt.trade_in.imei }}</p>
        <p>{{ receipt.trade_in.condition_grade }} / {{ receipt.trade_in.battery_percentage }}%</p>
        <p v-if="receipt.trade_in.specs.length">{{ receipt.trade_in.specs.join(' / ') }}</p>
        <p>{{ t('orders.tradeInCredit') }}: {{ formatCurrency(receipt.trade_in.trade_in_credit) }}</p>
      </div>

      <table class="receipt-items">
        <thead>
          <tr>
            <th>{{ t('orders.product') }}</th>
            <th>{{ t('orders.unitPrice') }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(item, i) in receipt.items" :key="i">
            <td>
              #{{ item.product_id }} {{ item.model_name }}
              <span v-if="item.imei"><br />IMEI: {{ item.imei }}</span>
            </td>
            <td>{{ formatCurrency(item.unit_price) }}</td>
          </tr>
        </tbody>
      </table>

      <div class="receipt-totals">
        <div class="receipt-row"><span>{{ t('orders.subtotal') }}</span><span>{{ formatCurrency(receipt.totals.subtotal) }}</span></div>
        <div class="receipt-row"><span>{{ t('orders.discount') }}</span><span>{{ formatCurrency(receipt.totals.discount) }}</span></div>
        <div v-if="receipt.totals.trade_in_credit" class="receipt-row">
          <span>{{ t('orders.tradeInCredit') }}</span><span>{{ formatCurrency(receipt.totals.trade_in_credit) }}</span>
        </div>
        <div class="receipt-row total"><span>{{ t('orders.total') }}</span><span>{{ formatCurrency(receipt.totals.grand_total) }}</span></div>
      </div>

      <div class="receipt-payment">
        <p v-if="receipt.payment.type === 'installment'">
          {{ t('orders.installment') }}: {{ receipt.payment.months }} {{ t('products.months') }} ×
          {{ formatCurrency(receipt.payment.monthly_amount) }}
          ({{ t('installments.downPayment') }}: {{ formatCurrency(receipt.payment.down_payment) }})
        </p>
        <p v-else>{{ t('orders.paidCash') }} — {{ receipt.payment.reference }}</p>
      </div>

      <p class="receipt-thanks">{{ t('orders.thankYou') }}</p>
    </div>
  </div>
</template>

<style scoped>
.receipt-page {
  max-width: 420px;
  margin: 0 auto;
}
.receipt-toolbar {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1rem;
}
.receipt-paper {
  background: #fff;
  border: 1px solid var(--fc-border);
  border-radius: var(--fc-radius);
  padding: 1.5rem;
  font-size: 0.8125rem;
}
.receipt-header {
  text-align: center;
  margin-bottom: 1rem;
}
.receipt-header h1 {
  font-size: 1.25rem;
  margin-bottom: 0.25rem;
}
.receipt-meta {
  border-top: 1px dashed var(--fc-border);
  border-bottom: 1px dashed var(--fc-border);
  padding: 0.75rem 0;
  margin-bottom: 0.75rem;
}
.receipt-section {
  margin-bottom: 0.75rem;
}
.receipt-items {
  width: 100%;
  margin-bottom: 0.75rem;
}
.receipt-items th,
.receipt-items td {
  padding: 0.375rem 0;
  border-bottom: 1px dashed var(--fc-border);
}
.receipt-totals {
  border-top: 1px dashed var(--fc-border);
  padding-top: 0.5rem;
}
.receipt-row {
  display: flex;
  justify-content: space-between;
  padding: 0.25rem 0;
}
.receipt-row.total {
  font-weight: 700;
  font-size: 1rem;
}
.receipt-thanks {
  text-align: center;
  margin-top: 1rem;
  color: var(--fc-text-muted);
}
@media print {
  .no-print {
    display: none !important;
  }
  .receipt-paper {
    border: none;
    box-shadow: none;
  }
}
</style>
