<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { Icon } from '@iconify/vue'
import PageCard from '@/components/ui/PageCard.vue'
import SearchSelect from '@/components/ui/SearchSelect.vue'
import { supplierPurchasesApi } from '@/api/supplierPurchases'
import { suppliersApi, type Supplier } from '@/api/suppliers'
import { useNotify } from '@/composables/useNotify'
import { getApiErrorMessage } from '@/utils/apiError'
import { formatCurrency } from '@/utils/format'

interface VariantResult {
  id: number
  label: string
  price: number | null
  stock: number
}

interface LineItem {
  uid: number
  variant_id: number | ''
  variant: VariantResult | null
  quantity: number
  unit_cost: number
}

const { t } = useI18n()
const router = useRouter()
const { success, error: notifyError } = useNotify()

const suppliers = ref<Supplier[]>([])
const variants = ref<VariantResult[]>([])
const saving = ref(false)
const nextUid = ref(1)
const lines = ref<LineItem[]>([])

const form = ref({
  supplier_id: '' as string | number,
  purchase_at: new Date().toISOString().slice(0, 16),
  notes: '',
  tax_amount: 0,
  discount_amount: 0,
  paid_amount: 0,
})

const subtotal = computed(() =>
  lines.value.reduce((sum, line) => sum + line.quantity * line.unit_cost, 0),
)
const grandTotal = computed(() =>
  Math.max(0, subtotal.value + Number(form.value.tax_amount) - Number(form.value.discount_amount)),
)

const variantOptions = computed(() =>
  variants.value.map((v) => ({
    id: v.id,
    label: `${v.label} (${t('purchases.stock')}: ${v.stock})`,
  })),
)

function addLine() {
  lines.value.push({
    uid: nextUid.value++,
    variant_id: '',
    variant: null,
    quantity: 1,
    unit_cost: 0,
  })
}

function removeLine(uid: number) {
  lines.value = lines.value.filter((l) => l.uid !== uid)
}

function onVariantChange(line: LineItem, id: number | '') {
  line.variant_id = id
  const variant = variants.value.find((v) => v.id === Number(id)) ?? null
  line.variant = variant
  if (variant?.price != null && line.unit_cost <= 0) {
    line.unit_cost = variant.price
  }
}

async function loadSuppliers() {
  const res = await suppliersApi.list({ per_page: 500, page: 1 })
  if (res.success) suppliers.value = res.data ?? []
}

async function loadVariants() {
  try {
    const res = await supplierPurchasesApi.searchVariants('', 500)
    variants.value = (res.data ?? []) as VariantResult[]
  } catch {
    variants.value = []
    notifyError(t('purchases.variantLoadError'))
  }
}

async function save() {
  const validLines = lines.value.filter((l) => l.variant)
  if (!form.value.supplier_id || !validLines.length) {
    notifyError(t('purchases.validationError'))
    return
  }

  saving.value = true
  try {
    const payload = {
      supplier_id: Number(form.value.supplier_id),
      purchase_at: form.value.purchase_at || null,
      notes: form.value.notes || null,
      tax_amount: Number(form.value.tax_amount) || 0,
      discount_amount: Number(form.value.discount_amount) || 0,
      paid_amount: Number(form.value.paid_amount) || 0,
      items: validLines.map((l) => ({
        product_variant_id: l.variant!.id,
        quantity: l.quantity,
        unit_cost: l.unit_cost,
      })),
    }
    const res = await supplierPurchasesApi.create(payload)
    success(t('purchases.created'))
    router.push(`/admin/supplier-purchases/${res.data?.id ?? ''}`)
  } catch (e) {
    notifyError(getApiErrorMessage(e))
  } finally {
    saving.value = false
  }
}

onMounted(() => {
  loadSuppliers()
  loadVariants()
  addLine()
})
</script>

<template>
  <PageCard :title="t('purchases.create')" :subtitle="t('purchases.createHint')">
    <template #actions>
      <button type="button" class="btn btn-outline btn-sm" @click="router.push('/admin/supplier-purchases')">
        <Icon icon="solar:arrow-left-linear" /> {{ t('common.back') }}
      </button>
    </template>

    <form class="form-page" @submit.prevent="save">
      <div class="form-grid two-col">
        <div class="form-group">
          <label>{{ t('purchases.supplier') }} *</label>
          <select v-model="form.supplier_id" required>
            <option value="">{{ t('purchases.selectSupplier') }}</option>
            <option v-for="s in suppliers" :key="s.id" :value="s.id">{{ s.company_name }}</option>
          </select>
        </div>
        <div class="form-group">
          <label>{{ t('purchases.purchaseDate') }}</label>
          <input v-model="form.purchase_at" type="datetime-local" />
        </div>
        <div class="form-group">
          <label>{{ t('purchases.paid') }}</label>
          <input v-model.number="form.paid_amount" type="number" min="0" />
        </div>
        <div class="form-group">
          <label>{{ t('purchases.tax') }}</label>
          <input v-model.number="form.tax_amount" type="number" min="0" />
        </div>
        <div class="form-group">
          <label>{{ t('purchases.discount') }}</label>
          <input v-model.number="form.discount_amount" type="number" min="0" />
        </div>
        <div class="form-group full">
          <label>{{ t('purchases.notes') }}</label>
          <textarea v-model="form.notes" rows="2" />
        </div>
      </div>

      <div class="detail-section">
        <div class="section-header">
          <h3>{{ t('purchases.lineItems') }}</h3>
          <button type="button" class="btn btn-sm btn-outline" @click="addLine">
            <Icon icon="solar:add-circle-linear" /> {{ t('purchases.addLine') }}
          </button>
        </div>

        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>{{ t('purchases.variant') }}</th>
                <th>{{ t('purchases.qty') }}</th>
                <th>{{ t('purchases.unitCost') }}</th>
                <th>{{ t('purchases.lineTotal') }}</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="line in lines" :key="line.uid">
                <td class="variant-cell">
                  <SearchSelect
                    :model-value="line.variant_id"
                    :options="variantOptions"
                    :placeholder="t('purchases.selectVariant')"
                    :search-placeholder="t('purchases.searchVariant')"
                    :empty-text="t('common.noData')"
                    @update:model-value="(id) => onVariantChange(line, id)"
                  />
                </td>
                <td><input v-model.number="line.quantity" type="number" min="1" max="500" class="input-sm" /></td>
                <td><input v-model.number="line.unit_cost" type="number" min="0" class="input-sm" /></td>
                <td>{{ formatCurrency(line.quantity * line.unit_cost) }}</td>
                <td>
                  <button type="button" class="btn-icon danger" @click="removeLine(line.uid)">
                    <Icon icon="solar:trash-bin-trash-linear" />
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <dl class="summary-list">
          <dt>{{ t('purchases.subtotal') }}</dt>
          <dd>{{ formatCurrency(subtotal) }}</dd>
          <dt>{{ t('purchases.grandTotal') }}</dt>
          <dd><strong>{{ formatCurrency(grandTotal) }}</strong></dd>
        </dl>
      </div>

      <div class="form-actions">
        <button type="button" class="btn btn-outline" @click="router.push('/admin/supplier-purchases')">{{ t('common.cancel') }}</button>
        <button type="submit" class="btn btn-primary" :disabled="saving">
          {{ saving ? t('common.loading') : t('purchases.saveOrder') }}
        </button>
      </div>
    </form>
  </PageCard>
</template>

<style scoped>
.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.75rem;
}
.variant-cell {
  min-width: 280px;
}
.input-sm {
  width: 100px;
  padding: 0.375rem 0.5rem;
  border: 1px solid var(--fc-border);
  border-radius: 4px;
}
.summary-list {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 0.25rem 1rem;
  max-width: 280px;
  margin-left: auto;
  margin-top: 1rem;
  font-size: 0.875rem;
}
.summary-list dt {
  color: var(--fc-text-muted);
}
.summary-list dd {
  text-align: right;
  margin: 0;
}
</style>
