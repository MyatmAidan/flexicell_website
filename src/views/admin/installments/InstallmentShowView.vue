<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { Icon } from '@iconify/vue'
import PageCard from '@/components/ui/PageCard.vue'
import { installmentsApi, type Installment } from '@/api/installments'
import { usePermissions } from '@/composables/usePermissions'
import { useNotify } from '@/composables/useNotify'
import { getApiErrorMessage } from '@/utils/apiError'
import { formatCurrency, formatDate } from '@/utils/format'

interface InstallmentDetail extends Installment {
  monthly_amount?: number
  remaining_amount?: number
  payments?: { id: number; amount: number; status: string; paid_date: string | null }[]
  order?: {
    id: number
    grand_total: number
    customer?: { name: string; phone?: string }
  }
}

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const { hasAny } = usePermissions()
const { success, error: notifyError, confirm } = useNotify()

const id = computed(() => Number(route.params.id))
const loading = ref(true)
const marking = ref<number | null>(null)
const installment = ref<InstallmentDetail | null>(null)

async function load() {
  loading.value = true
  try {
    const res = await installmentsApi.get(id.value)
    if (res.success) installment.value = (res.data as InstallmentDetail) ?? null
  } catch (e) {
    notifyError(getApiErrorMessage(e))
  } finally {
    loading.value = false
  }
}

async function markPaid(paymentId: number) {
  if (!(await confirm(t('installments.markPaidConfirm')))) return
  marking.value = paymentId
  try {
    await installmentsApi.markPaid(paymentId)
    success(t('installments.markPaidSuccess'))
    await load()
  } catch (e) {
    notifyError(getApiErrorMessage(e))
  } finally {
    marking.value = null
  }
}

onMounted(load)
</script>

<template>
  <PageCard :title="t('installments.detail', { id })" :subtitle="t('pages.installment.description')">
    <template #actions>
      <button type="button" class="btn btn-outline btn-sm" @click="router.push('/admin/installments')">
        <Icon icon="solar:arrow-left-linear" /> {{ t('common.back') }}
      </button>
      <button
        v-if="installment?.order_id"
        type="button"
        class="btn btn-outline btn-sm"
        @click="router.push(`/admin/orders/${installment.order_id}`)"
      >
        <Icon icon="solar:cart-linear" /> {{ t('installments.viewOrder') }}
      </button>
    </template>

    <div v-if="loading" class="page-loading">{{ t('common.loading') }}</div>
    <div v-else-if="installment" class="detail-grid">
      <dl class="detail-list">
        <dt>{{ t('installments.order') }}</dt>
        <dd>#{{ installment.order_id }}</dd>
        <dt>{{ t('installments.customer') }}</dt>
        <dd>{{ installment.order?.customer?.name ?? '—' }}</dd>
        <dt>{{ t('installments.total') }}</dt>
        <dd>{{ formatCurrency(installment.total_amount) }}</dd>
        <dt>{{ t('installments.downPayment') }}</dt>
        <dd>{{ formatCurrency(installment.down_payment) }}</dd>
        <dt>{{ t('installments.monthlyPayment') }}</dt>
        <dd>{{ formatCurrency(installment.monthly_amount ?? installment.monthly_payment) }}</dd>
        <dt>{{ t('installments.remaining') }}</dt>
        <dd>{{ formatCurrency(installment.remaining_amount) }}</dd>
        <dt>{{ t('installments.months') }}</dt>
        <dd>{{ installment.months }}</dd>
        <dt>{{ t('installments.startDate') }}</dt>
        <dd>{{ formatDate(installment.start_date) }}</dd>
      </dl>

      <div class="detail-section">
        <h3>{{ t('installments.payments') }}</h3>
        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>{{ t('installments.amount') }}</th>
                <th>{{ t('common.status') }}</th>
                <th>{{ t('installments.paidDate') }}</th>
                <th>{{ t('common.actions') }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(payment, idx) in installment.payments ?? []" :key="payment.id">
                <td>{{ idx + 1 }}</td>
                <td>{{ formatCurrency(payment.amount) }}</td>
                <td><span class="badge">{{ payment.status }}</span></td>
                <td>{{ formatDate(payment.paid_date) }}</td>
                <td>
                  <button
                    v-if="payment.status === 'pending' && hasAny('installments.update')"
                    type="button"
                    class="btn btn-sm btn-primary"
                    :disabled="marking === payment.id"
                    @click="markPaid(payment.id)"
                  >
                    {{ marking === payment.id ? t('common.loading') : t('installments.markPaid') }}
                  </button>
                </td>
              </tr>
              <tr v-if="!(installment.payments?.length)">
                <td colspan="5" class="empty-cell">{{ t('common.noData') }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </PageCard>
</template>
