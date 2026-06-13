<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { fetchDashboardStats } from '@/api/dashboard'
import { telegramApi } from '@/api/telegram'
import { useAuthStore } from '@/stores/auth'
import { useNotify } from '@/composables/useNotify'
import { getApiErrorMessage } from '@/utils/apiError'
import StatCard from '@/components/admin/StatCard.vue'
import DashboardRevenueChart from '@/components/admin/charts/DashboardRevenueChart.vue'
import DashboardDoughnutChart from '@/components/admin/charts/DashboardDoughnutChart.vue'
import DashboardBarChart from '@/components/admin/charts/DashboardBarChart.vue'
import type { DashboardStats } from '@/types/dashboard'

const { t } = useI18n()
const auth = useAuthStore()
const { success, error: notifyError } = useNotify()

const stats = ref<DashboardStats | null>(null)
const loading = ref(true)
const error = ref('')
const telegramLoading = ref('')

function formatCurrency(value: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'MMK', maximumFractionDigits: 0 }).format(value)
}

function orderStatusClass(status: string) {
  if (status === 'delivered' || status === 'completed') return 'success'
  if (status === 'processing' || status === 'pending') return 'warning'
  return 'default'
}

onMounted(async () => {
  if (!auth.hasPermission('dashboard.view')) {
    loading.value = false
    return
  }

  try {
    const response = await fetchDashboardStats()
    if (response.success) {
      stats.value = response.data
    }
  } catch {
    error.value = t('dashboard.loadError')
  } finally {
    loading.value = false
  }
})

async function sendTelegram(type: 'sales' | 'stock') {
  telegramLoading.value = type
  try {
    const res = type === 'sales' ? await telegramApi.dailySales() : await telegramApi.dailyStock()
    success(res.message)
  } catch (e) {
    notifyError(getApiErrorMessage(e))
  } finally {
    telegramLoading.value = ''
  }
}
</script>

<template>
  <div class="page dashboard-page">
    <div class="page-header dashboard-header">
      <div>
        <h1>{{ t('dashboard.title') }}</h1>
        <p>{{ t('dashboard.subtitle') }}</p>
      </div>
      <div v-if="auth.hasPermission('dashboard.view')" class="dashboard-actions">
        <button
          type="button"
          class="btn btn-sm btn-outline"
          :disabled="!!telegramLoading"
          @click="sendTelegram('sales')"
        >
          {{ telegramLoading === 'sales' ? t('common.loading') : t('dashboard.telegramSales') }}
        </button>
        <button
          type="button"
          class="btn btn-sm btn-outline"
          :disabled="!!telegramLoading"
          @click="sendTelegram('stock')"
        >
          {{ telegramLoading === 'stock' ? t('common.loading') : t('dashboard.telegramStock') }}
        </button>
      </div>
    </div>

    <div v-if="!auth.hasPermission('dashboard.view')" class="alert alert-warning">
      {{ t('dashboard.noPermission') }}
    </div>

    <div v-else-if="loading" class="page-loading">{{ t('common.loading') }}</div>

    <div v-else-if="error" class="alert alert-danger">{{ error }}</div>

    <template v-else-if="stats">
      <div class="stats-grid">
        <StatCard
          :title="t('dashboard.totalRevenue')"
          :value="formatCurrency(stats.revenue.total)"
          :subtitle="`${t('dashboard.revenueThisMonth')}: ${formatCurrency(stats.revenue.this_month)}`"
          :growth="stats.revenue.growth_percent"
          variant="primary"
        />
        <StatCard
          :title="t('dashboard.totalOrders')"
          :value="stats.orders.total"
          :subtitle="`${t('dashboard.ordersThisMonth')}: ${stats.orders.this_month}`"
          :growth="stats.orders.growth_percent"
        />
        <StatCard
          :title="t('dashboard.totalCustomers')"
          :value="stats.customers.total"
          :subtitle="`${t('dashboard.newCustomersThisMonth')}: ${stats.customers.new_this_month}`"
          variant="success"
        />
        <StatCard
          :title="t('dashboard.availableDevices')"
          :value="stats.devices.total_available"
          :subtitle="`${t('dashboard.newDevices')}: ${stats.devices.new} | ${t('dashboard.secondHandDevices')}: ${stats.devices.second_hand}`"
        />
      </div>

      <div class="stats-grid stats-grid-sm">
        <StatCard
          :title="t('dashboard.products')"
          :value="stats.products.total"
          :subtitle="`${t('dashboard.activeProducts')}: ${stats.products.active} | ${t('dashboard.lowStock')}: ${stats.products.low_stock} | ${t('dashboard.outOfStock')}: ${stats.products.out_of_stock}`"
          variant="warning"
        />
        <StatCard
          :title="t('dashboard.payments')"
          :value="formatCurrency(stats.payments.total_amount)"
          :subtitle="`${t('dashboard.completedPayments')}: ${formatCurrency(stats.payments.completed_amount)} | ${t('dashboard.pendingPayments')}: ${formatCurrency(stats.payments.pending_amount)}`"
        />
        <StatCard
          :title="t('dashboard.installments')"
          :value="formatCurrency(stats.installments.total_remaining_amount)"
          :subtitle="`${t('dashboard.upcomingPayments')}: ${stats.installments.upcoming_payments_count} | ${t('dashboard.overduePayments')}: ${stats.installments.overdue_payments_count}`"
          variant="danger"
        />
        <StatCard
          :title="t('dashboard.telegramStatus')"
          :value="stats.telegram_configured ? t('dashboard.telegramConfigured') : t('dashboard.telegramNotConfigured')"
          :subtitle="`${t('dashboard.categories')}: ${stats.system.categories} | ${t('dashboard.brands')}: ${stats.system.brands}`"
        />
      </div>

      <div class="dashboard-charts-row">
        <div class="panel dashboard-chart-main">
          <h2>{{ t('dashboard.revenueChart') }}</h2>
          <DashboardRevenueChart
            :labels="stats.charts.revenue_orders.labels"
            :revenue="stats.charts.revenue_orders.revenue"
            :orders="stats.charts.revenue_orders.orders"
          />
        </div>

        <div class="dashboard-charts-side">
          <div class="panel">
            <h2>{{ t('dashboard.stockChart') }}</h2>
            <DashboardDoughnutChart
              :labels="[
                t('dashboard.activeProducts'),
                t('dashboard.lowStock'),
                t('dashboard.outOfStock'),
              ]"
              :data="stats.charts.stock_status.data"
              :colors="['#16a34a', '#f59e0b', '#dc2626']"
            />
          </div>

          <div class="panel dashboard-system-overview">
            <h2>{{ t('dashboard.systemOverview') }}</h2>
            <ul class="overview-list">
              <li>
                <span>{{ t('dashboard.phoneModels') }}</span>
                <span class="overview-badge primary">{{ stats.products.total }}</span>
              </li>
              <li>
                <span>{{ t('dashboard.categories') }}</span>
                <span class="overview-badge muted">{{ stats.system.categories }}</span>
              </li>
              <li>
                <span>{{ t('dashboard.brands') }}</span>
                <span class="overview-badge info">{{ stats.system.brands }}</span>
              </li>
              <li>
                <span>{{ t('dashboard.paymentMethods') }}</span>
                <span class="overview-badge success">{{ stats.system.payment_methods }}</span>
              </li>
              <li>
                <span>{{ t('dashboard.outOfStock') }}</span>
                <span class="overview-badge danger">{{ stats.products.out_of_stock }}</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div class="dashboard-charts-row dashboard-charts-row-secondary">
        <div class="panel">
          <h2>{{ t('dashboard.deviceInventory') }}</h2>
          <DashboardDoughnutChart
            :labels="[t('dashboard.newDevices'), t('dashboard.secondHandDevices')]"
            :data="stats.charts.devices_inventory.data"
            :colors="['#2563eb', '#f59e0b']"
          />
        </div>
        <div class="panel">
          <h2>{{ t('dashboard.paymentChart') }}</h2>
          <DashboardDoughnutChart
            :labels="[t('dashboard.completedPayments'), t('dashboard.pendingPayments')]"
            :data="stats.charts.payments.data"
            :colors="['#16a34a', '#dc2626']"
            currency
          />
        </div>
        <div class="panel">
          <h2>{{ t('dashboard.orderStatusChart') }}</h2>
          <DashboardBarChart
            v-if="stats.charts.order_status.data.length"
            :labels="stats.charts.order_status.labels"
            :data="stats.charts.order_status.data"
          />
          <p v-else class="empty-chart">{{ t('common.noData') }}</p>
        </div>
      </div>

      <div class="dashboard-panels">
        <div class="panel">
          <h2>{{ t('dashboard.recentOrders') }}</h2>
          <div class="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>{{ t('dashboard.orderId') }}</th>
                  <th>{{ t('dashboard.customer') }}</th>
                  <th>{{ t('dashboard.amount') }}</th>
                  <th>{{ t('dashboard.orderStatus') }}</th>
                  <th>{{ t('dashboard.date') }}</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="order in stats.recent_orders" :key="order.id">
                  <td>#{{ order.id }}</td>
                  <td>{{ order.customer_name || '—' }}</td>
                  <td>{{ formatCurrency(order.grand_total) }}</td>
                  <td>
                    <span class="badge" :class="orderStatusClass(order.order_status)">
                      {{ order.order_status }}
                    </span>
                  </td>
                  <td>{{ order.order_date ? new Date(order.order_date).toLocaleDateString() : '—' }}</td>
                </tr>
                <tr v-if="!stats.recent_orders.length">
                  <td colspan="5" class="empty-cell">{{ t('common.noData') }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div class="panel">
          <h2>{{ t('dashboard.topProducts') }}</h2>
          <div class="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>{{ t('dashboard.product') }}</th>
                  <th>{{ t('dashboard.brand') }}</th>
                  <th>{{ t('dashboard.category') }}</th>
                  <th>{{ t('dashboard.stock') }}</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="product in stats.top_products" :key="product.id">
                  <td>{{ product.model_name || '—' }}</td>
                  <td>{{ product.brand_name || '—' }}</td>
                  <td>{{ product.category_name || '—' }}</td>
                  <td>
                    <span
                      class="badge"
                      :class="
                        product.available_device_count > 10
                          ? 'success'
                          : product.available_device_count > 0
                            ? 'warning'
                            : 'danger'
                      "
                    >
                      {{ product.available_device_count }}
                    </span>
                  </td>
                </tr>
                <tr v-if="!stats.top_products.length">
                  <td colspan="4" class="empty-cell">{{ t('common.noData') }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>
