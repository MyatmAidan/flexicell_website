<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { Icon } from '@iconify/vue'
import PageCard from '@/components/ui/PageCard.vue'
import { supplierPurchasesApi, type SupplierPurchase, type SupplierPurchaseItem } from '@/api/supplierPurchases'
import { useVariantOptions } from '@/composables/useVariantOptions'
import { usePermissions } from '@/composables/usePermissions'
import { useNotify } from '@/composables/useNotify'
import { getApiErrorMessage } from '@/utils/apiError'
import { formatCurrency, formatDateTime } from '@/utils/format'

interface ReceiveDevice {
  uid: number
  imei: string
  battery_percentage: number
  condition_grade: string
  selling_price: string | number
  warranty_id: string | number
}

interface ReceiveLine {
  item_id: number
  item: SupplierPurchaseItem
  devices: ReceiveDevice[]
}

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const { hasAny } = usePermissions()
const { success, error: notifyError } = useNotify()
const { warranties } = useVariantOptions()

const id = computed(() => Number(route.params.id))
const loading = ref(true)
const receiving = ref(false)
const purchase = ref<SupplierPurchase | null>(null)
const receiveLines = ref<ReceiveLine[]>([])
let nextUid = 1

const conditionOptions = ['NEW', 'A', 'B', 'C', 'D']
const canReceive = computed(() =>
  hasAny('supplier.manage') &&
  receiveLines.value.some((l) => l.devices.length > 0),
)

function initReceiveLines(p: SupplierPurchase) {
  receiveLines.value = (p.items ?? [])
    .filter((item) => item.remaining_quantity > 0)
    .map((item) => ({
      item_id: item.id,
      item,
      devices: Array.from({ length: Math.min(item.remaining_quantity, 1) }, () => ({
        uid: nextUid++,
        imei: '',
        battery_percentage: 100,
        condition_grade: 'NEW',
        selling_price: '',
        warranty_id: '',
      })),
    }))
}

async function load() {
  loading.value = true
  try {
    const res = await supplierPurchasesApi.get(id.value)
    if (res.success && res.data) {
      purchase.value = res.data
      initReceiveLines(res.data)
    }
  } catch (e) {
    notifyError(getApiErrorMessage(e))
  } finally {
    loading.value = false
  }
}

function addDeviceRow(line: ReceiveLine) {
  const remaining = line.item.remaining_quantity - line.devices.length
  if (remaining <= 0) return
  line.devices.push({
    uid: nextUid++,
    imei: '',
    battery_percentage: 100,
    condition_grade: 'NEW',
    selling_price: '',
    warranty_id: '',
  })
}

function removeDeviceRow(line: ReceiveLine, uid: number) {
  line.devices = line.devices.filter((d) => d.uid !== uid)
}

async function receiveStock() {
  const lines = receiveLines.value
    .filter((l) => l.devices.some((d) => d.imei.trim()))
    .map((l) => ({
      item_id: l.item_id,
      devices: l.devices
        .filter((d) => d.imei.trim())
        .map((d) => ({
          imei: d.imei.trim(),
          battery_percentage: d.battery_percentage,
          condition_grade: d.condition_grade,
          selling_price: d.selling_price !== '' ? Number(d.selling_price) : null,
          warranty_id: d.warranty_id ? Number(d.warranty_id) : null,
        })),
    }))
    .filter((l) => l.devices.length)

  if (!lines.length) {
    notifyError(t('purchases.receiveValidation'))
    return
  }

  receiving.value = true
  try {
    await supplierPurchasesApi.receive(id.value, { lines })
    success(t('purchases.receiveSuccess'))
    await load()
  } catch (e) {
    notifyError(getApiErrorMessage(e))
  } finally {
    receiving.value = false
  }
}

onMounted(load)
</script>

<template>
  <PageCard
    :title="purchase?.invoice_number ?? t('purchases.detail')"
    :subtitle="t('pages.purchases.description')"
  >
    <template #actions>
      <button type="button" class="btn btn-outline btn-sm" @click="router.push('/admin/supplier-purchases')">
        <Icon icon="solar:arrow-left-linear" /> {{ t('common.back') }}
      </button>
    </template>

    <div v-if="loading" class="page-loading">{{ t('common.loading') }}</div>
    <div v-else-if="purchase" class="detail-grid">
      <dl class="detail-list">
        <dt>{{ t('purchases.supplier') }}</dt>
        <dd>{{ purchase.supplier_name ?? '—' }}</dd>
        <dt>{{ t('common.status') }}</dt>
        <dd><span class="badge">{{ purchase.status_label }}</span></dd>
        <dt>{{ t('purchases.grandTotal') }}</dt>
        <dd>{{ formatCurrency(purchase.grand_total) }}</dd>
        <dt>{{ t('purchases.paid') }}</dt>
        <dd>{{ formatCurrency(purchase.paid_amount) }}</dd>
        <dt>{{ t('purchases.credit') }}</dt>
        <dd>{{ formatCurrency(purchase.credit_amount) }}</dd>
        <dt>{{ t('purchases.purchaseDate') }}</dt>
        <dd>{{ formatDateTime(purchase.purchase_at) }}</dd>
        <dt v-if="purchase.received_at">{{ t('purchases.receivedAt') }}</dt>
        <dd v-if="purchase.received_at">{{ formatDateTime(purchase.received_at) }}</dd>
      </dl>

      <div v-if="purchase.notes" class="detail-section">
        <h3>{{ t('purchases.notes') }}</h3>
        <p>{{ purchase.notes }}</p>
      </div>

      <div class="detail-section">
        <h3>{{ t('purchases.lineItems') }}</h3>
        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>{{ t('purchases.variant') }}</th>
                <th>{{ t('purchases.ordered') }}</th>
                <th>{{ t('purchases.received') }}</th>
                <th>{{ t('purchases.unitCost') }}</th>
                <th>{{ t('purchases.lineTotal') }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in purchase.items ?? []" :key="item.id">
                <td>{{ item.variant_label }}</td>
                <td>{{ item.quantity }}</td>
                <td>{{ item.received_quantity }}</td>
                <td>{{ formatCurrency(item.unit_cost) }}</td>
                <td>{{ formatCurrency(item.total_cost) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div v-if="receiveLines.length && hasAny('supplier.manage')" class="detail-section">
        <h3>{{ t('purchases.receiveStock') }}</h3>
        <p class="hint">{{ t('purchases.receiveHint') }}</p>

        <div v-for="line in receiveLines" :key="line.item_id" class="receive-block">
          <div class="receive-block-header">
            <div>
              <strong>{{ line.item.variant_label }}</strong>
              <span class="badge">{{ t('purchases.receiveRemaining', { count: line.item.remaining_quantity }) }}</span>
            </div>
            <button
              type="button"
              class="btn btn-sm btn-outline"
              :disabled="line.devices.length >= line.item.remaining_quantity"
              @click="addDeviceRow(line)"
            >
              <Icon icon="solar:add-circle-linear" /> {{ t('purchases.addUnit') }}
            </button>
          </div>

          <div class="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>{{ t('devices.imei') }} *</th>
                  <th>{{ t('devices.battery') }}</th>
                  <th>{{ t('devices.condition') }}</th>
                  <th>{{ t('devices.sellingPrice') }}</th>
                  <th>{{ t('devices.warranty') }}</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="device in line.devices" :key="device.uid">
                  <td><input v-model="device.imei" type="text" class="input-sm wide" required /></td>
                  <td><input v-model.number="device.battery_percentage" type="number" min="0" max="100" class="input-sm" /></td>
                  <td>
                    <select v-model="device.condition_grade" class="input-sm">
                      <option v-for="c in conditionOptions" :key="c" :value="c">{{ c }}</option>
                    </select>
                  </td>
                  <td><input v-model="device.selling_price" type="number" min="0" class="input-sm" /></td>
                  <td>
                    <select v-model="device.warranty_id" class="input-sm wide">
                      <option value="">{{ t('products.noWarranty') }}</option>
                      <option v-for="w in warranties" :key="w.id" :value="w.id">
                        {{ w.warranty_month }} {{ t('products.months') }}
                      </option>
                    </select>
                  </td>
                  <td>
                    <button type="button" class="btn-icon danger" @click="removeDeviceRow(line, device.uid)">
                      <Icon icon="solar:trash-bin-trash-linear" />
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <button type="button" class="btn btn-primary" :disabled="receiving || !canReceive" @click="receiveStock">
          {{ receiving ? t('common.loading') : t('purchases.receiveIntoInventory') }}
        </button>
      </div>
    </div>
  </PageCard>
</template>

<style scoped>
.hint {
  font-size: 0.8125rem;
  color: var(--fc-text-muted);
  margin-bottom: 1rem;
}
.receive-block {
  border: 1px solid var(--fc-border);
  border-radius: var(--fc-radius);
  padding: 1rem;
  margin-bottom: 1rem;
  background: var(--fc-bg);
}
.receive-block-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
}
.receive-block-header .badge {
  margin-left: 0.5rem;
}
.input-sm {
  padding: 0.375rem 0.5rem;
  border: 1px solid var(--fc-border);
  border-radius: 4px;
  font-size: 0.8125rem;
}
.input-sm.wide {
  min-width: 140px;
}
</style>
