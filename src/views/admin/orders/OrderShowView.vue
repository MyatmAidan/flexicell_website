<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { Icon } from '@iconify/vue'
import PageCard from '@/components/ui/PageCard.vue'
import { ordersApi, type Order } from '@/api/orders'
import { useNotify } from '@/composables/useNotify'
import { getApiErrorMessage } from '@/utils/apiError'
import { formatCurrency, formatDateTime } from '@/utils/format'

interface OrderItem {
  id: number
  quantity: number
  unit_price: number
  total: number
  product?: { model_name?: string; brand_name?: string }
  device?: { imei?: string }
}

interface OrderDetail extends Order {
  total_amount?: number
  discount_amount?: number
  shipping_address?: string
  customer?: { id: number; name: string; phone?: string; email?: string }
  items?: OrderItem[]
  installment?: {
    id: number
    months: number
    down_payment: number
    monthly_amount?: number
    remaining_amount?: number
    payments?: { id: number; amount: number; status: string; paid_date: string | null }[]
  }
  trade_in?: {
    trade_in_credit: number
    second_phone_purchase?: { imei?: string; model_name?: string; brand_name?: string }
  }
  payment_customer?: { payment_method?: string; amount?: number }
}

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const { error: notifyError } = useNotify()

const id = computed(() => Number(route.params.id))
const loading = ref(true)
const order = ref<OrderDetail | null>(null)

async function load() {
  loading.value = true
  try {
    const res = await ordersApi.get(id.value)
    if (res.success) order.value = (res.data as OrderDetail) ?? null
  } catch (e) {
    notifyError(getApiErrorMessage(e))
  } finally {
    loading.value = false
  }
}

onMounted(load)
</script>

<template>
  <PageCard :title="t('orders.detail', { id })" :subtitle="t('pages.orders.description')">
    <template #actions>
      <button type="button" class="btn btn-outline btn-sm" @click="router.push('/admin/orders')">
        <Icon icon="solar:arrow-left-linear" /> {{ t('common.back') }}
      </button>
      <button type="button" class="btn btn-primary btn-sm" @click="router.push(`/admin/orders/${id}/receipt`)">
        <Icon icon="solar:bill-list-linear" /> {{ t('orders.receipt') }}
      </button>
    </template>

    <div v-if="loading" class="page-loading">{{ t('common.loading') }}</div>
    <div v-else-if="order" class="detail-grid">
      <dl class="detail-list">
        <dt>{{ t('orders.customer') }}</dt>
        <dd>{{ order.customer?.name ?? t('orders.walkIn') }}</dd>
        <dt>{{ t('orders.phone') }}</dt>
        <dd>{{ order.customer?.phone ?? '—' }}</dd>
        <dt>{{ t('orders.status') }}</dt>
        <dd><span class="badge">{{ order.order_status }}</span></dd>
        <dt>{{ t('orders.date') }}</dt>
        <dd>{{ formatDateTime(order.order_date) }}</dd>
        <dt>{{ t('orders.shippingAddress') }}</dt>
        <dd>{{ order.shipping_address ?? '—' }}</dd>
        <dt>{{ t('orders.subtotal') }}</dt>
        <dd>{{ formatCurrency(order.total_amount) }}</dd>
        <dt>{{ t('orders.discount') }}</dt>
        <dd>{{ formatCurrency(order.discount_amount) }}</dd>
        <dt>{{ t('orders.total') }}</dt>
        <dd><strong>{{ formatCurrency(order.grand_total) }}</strong></dd>
      </dl>

      <div class="detail-section">
        <h3>{{ t('orders.items') }}</h3>
        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>{{ t('orders.product') }}</th>
                <th>{{ t('devices.imei') }}</th>
                <th>{{ t('orders.qty') }}</th>
                <th>{{ t('orders.unitPrice') }}</th>
                <th>{{ t('orders.lineTotal') }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in order.items ?? []" :key="item.id">
                <td>
                  {{ item.product?.brand_name }} {{ item.product?.model_name }}
                </td>
                <td>{{ item.device?.imei ?? '—' }}</td>
                <td>{{ item.quantity }}</td>
                <td>{{ formatCurrency(item.unit_price) }}</td>
                <td>{{ formatCurrency(item.total) }}</td>
              </tr>
              <tr v-if="!(order.items?.length)">
                <td colspan="5" class="empty-cell">{{ t('common.noData') }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div v-if="order.installment" class="detail-section">
        <h3>{{ t('orders.installment') }}</h3>
        <dl class="detail-list">
          <dt>{{ t('installments.months') }}</dt>
          <dd>{{ order.installment.months }}</dd>
          <dt>{{ t('installments.downPayment') }}</dt>
          <dd>{{ formatCurrency(order.installment.down_payment) }}</dd>
          <dt>{{ t('installments.monthlyPayment') }}</dt>
          <dd>{{ formatCurrency(order.installment.monthly_amount) }}</dd>
          <dt>{{ t('installments.remaining') }}</dt>
          <dd>{{ formatCurrency(order.installment.remaining_amount) }}</dd>
        </dl>
      </div>

      <div v-if="order.trade_in" class="detail-section">
        <h3>{{ t('orders.tradeIn') }}</h3>
        <dl class="detail-list">
          <dt>{{ t('orders.tradeInCredit') }}</dt>
          <dd>{{ formatCurrency(order.trade_in.trade_in_credit) }}</dd>
          <dt>{{ t('devices.imei') }}</dt>
          <dd>{{ order.trade_in.second_phone_purchase?.imei ?? '—' }}</dd>
        </dl>
      </div>

      <div v-if="order.payment_customer" class="detail-section">
        <h3>{{ t('orders.payment') }}</h3>
        <dl class="detail-list">
          <dt>{{ t('orders.paymentMethod') }}</dt>
          <dd>{{ order.payment_customer.payment_method ?? '—' }}</dd>
          <dt>{{ t('orders.amount') }}</dt>
          <dd>{{ formatCurrency(order.payment_customer.amount) }}</dd>
        </dl>
      </div>
    </div>
  </PageCard>
</template>
