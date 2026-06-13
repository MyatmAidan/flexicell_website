<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { Icon } from '@iconify/vue'
import PageCard from '@/components/ui/PageCard.vue'
import { customersApi, type Customer } from '@/api/customers'
import { useNotify } from '@/composables/useNotify'
import { getApiErrorMessage } from '@/utils/apiError'
import { formatCurrency, formatDate } from '@/utils/format'

interface CustomerOrder {
  id: number
  order_date: string | null
  status: string | null
  total_amount: number | null
  user?: { id: number; name: string } | null
}

interface CustomerDetail extends Customer {
  orders?: CustomerOrder[]
}

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const { error: notifyError } = useNotify()

const loading = ref(true)
const customer = ref<CustomerDetail | null>(null)

async function load() {
  loading.value = true
  try {
    const id = Number(route.params.id)
    const response = await customersApi.get(id)
    customer.value = response.data
  } catch (e) {
    notifyError(getApiErrorMessage(e))
    customer.value = null
  } finally {
    loading.value = false
  }
}

onMounted(load)
</script>

<template>
  <PageCard
    :title="customer?.name || t('customers.details')"
    :subtitle="t('customers.detailsSubtitle')"
  >
    <template #actions>
      <button type="button" class="btn btn-outline btn-sm" @click="router.push('/admin/customers')">
        <Icon icon="solar:alt-arrow-left-linear" /> {{ t('common.back') }}
      </button>
    </template>

    <div v-if="loading" class="page-loading">{{ t('common.loading') }}</div>

    <template v-else-if="customer">
      <div class="detail-grid">
        <div class="detail-item">
          <span class="detail-label">{{ t('customers.name') }}</span>
          <span class="detail-value">{{ customer.name }}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">{{ t('customers.phone') }}</span>
          <span class="detail-value">{{ customer.phone || '—' }}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">{{ t('customers.email') }}</span>
          <span class="detail-value">{{ customer.email || '—' }}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">{{ t('customers.address') }}</span>
          <span class="detail-value">{{ customer.address || '—' }}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">{{ t('customers.account') }}</span>
          <span class="detail-value"><span class="badge">{{ customer.account_type }}</span></span>
        </div>
        <div class="detail-item">
          <span class="detail-label">{{ t('customers.points') }}</span>
          <span class="detail-value">{{ customer.points }}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">{{ t('customers.orders') }}</span>
          <span class="detail-value">{{ customer.orders_count ?? 0 }}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">{{ t('common.createdAt') }}</span>
          <span class="detail-value">{{ formatDate(customer.created_at) }}</span>
        </div>
      </div>

      <div class="panel detail-panel">
        <h2>{{ t('customers.orderHistory') }}</h2>
        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>{{ t('customers.orderId') }}</th>
                <th>{{ t('customers.orderDate') }}</th>
                <th>{{ t('customers.orderAmount') }}</th>
                <th>{{ t('common.status') }}</th>
                <th>{{ t('customers.soldBy') }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="order in customer.orders || []" :key="order.id">
                <td>#{{ order.id }}</td>
                <td>{{ formatDate(order.order_date) }}</td>
                <td>{{ formatCurrency(order.total_amount) }}</td>
                <td><span class="badge">{{ order.status || '—' }}</span></td>
                <td>{{ order.user?.name || '—' }}</td>
              </tr>
              <tr v-if="!(customer.orders || []).length">
                <td colspan="5" class="empty-cell">{{ t('common.noData') }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </template>
  </PageCard>
</template>

<style scoped>
.detail-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.detail-item {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.detail-label {
  font-size: 0.75rem;
  color: var(--fc-text-muted);
  font-weight: 600;
}

.detail-value {
  font-size: 0.9375rem;
}

.detail-panel {
  margin-top: 0.5rem;
}

@media (max-width: 768px) {
  .detail-grid {
    grid-template-columns: 1fr;
  }
}
</style>
