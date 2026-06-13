<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { Icon } from '@iconify/vue'
import PageCard from '@/components/ui/PageCard.vue'
import { suppliersApi, type Supplier } from '@/api/suppliers'
import { useNotify } from '@/composables/useNotify'
import { getApiErrorMessage } from '@/utils/apiError'
import { formatCurrency, formatDate } from '@/utils/format'

interface SupplierPurchase {
  id: number
  purchase_at: string | null
  grand_total: number
  paid_amount: number
  credit_amount: number
  status: number
  status_label: string | null
}

interface SupplierDetail extends Supplier {
  purchases?: SupplierPurchase[]
}

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const { error: notifyError } = useNotify()

const loading = ref(true)
const supplier = ref<SupplierDetail | null>(null)

async function load() {
  loading.value = true
  try {
    const id = Number(route.params.id)
    const response = await suppliersApi.get(id)
    supplier.value = response.data
  } catch (e) {
    notifyError(getApiErrorMessage(e))
    supplier.value = null
  } finally {
    loading.value = false
  }
}

onMounted(load)
</script>

<template>
  <PageCard
    :title="supplier?.company_name || t('suppliers.details')"
    :subtitle="t('suppliers.detailsSubtitle')"
  >
    <template #actions>
      <button type="button" class="btn btn-outline btn-sm" @click="router.push('/admin/suppliers')">
        <Icon icon="solar:alt-arrow-left-linear" /> {{ t('common.back') }}
      </button>
    </template>

    <div v-if="loading" class="page-loading">{{ t('common.loading') }}</div>

    <template v-else-if="supplier">
      <div class="detail-grid">
        <div class="detail-item">
          <span class="detail-label">{{ t('suppliers.companyName') }}</span>
          <span class="detail-value">{{ supplier.company_name }}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">{{ t('suppliers.phone') }}</span>
          <span class="detail-value">{{ supplier.phone || '—' }}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">{{ t('suppliers.address') }}</span>
          <span class="detail-value">{{ supplier.address || '—' }}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">{{ t('suppliers.debtTotal') }}</span>
          <span class="detail-value">{{ formatCurrency(supplier.debt_total) }}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">{{ t('suppliers.purchases') }}</span>
          <span class="detail-value">{{ supplier.purchases_count ?? 0 }}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">{{ t('common.createdAt') }}</span>
          <span class="detail-value">{{ formatDate(supplier.created_at) }}</span>
        </div>
      </div>

      <div class="panel detail-panel">
        <h2>{{ t('suppliers.purchaseHistory') }}</h2>
        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>{{ t('suppliers.purchaseId') }}</th>
                <th>{{ t('suppliers.purchaseDate') }}</th>
                <th>{{ t('suppliers.grandTotal') }}</th>
                <th>{{ t('suppliers.paidAmount') }}</th>
                <th>{{ t('suppliers.creditAmount') }}</th>
                <th>{{ t('common.status') }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="purchase in supplier.purchases || []" :key="purchase.id">
                <td>#{{ purchase.id }}</td>
                <td>{{ formatDate(purchase.purchase_at) }}</td>
                <td>{{ formatCurrency(purchase.grand_total) }}</td>
                <td>{{ formatCurrency(purchase.paid_amount) }}</td>
                <td>{{ formatCurrency(purchase.credit_amount) }}</td>
                <td><span class="badge">{{ purchase.status_label || purchase.status }}</span></td>
              </tr>
              <tr v-if="!(supplier.purchases || []).length">
                <td colspan="6" class="empty-cell">{{ t('common.noData') }}</td>
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
