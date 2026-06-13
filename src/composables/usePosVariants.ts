import { computed, ref, watch } from 'vue'
import { directSaleApi } from '@/api/directSale'
import type { CartLine, PosProduct } from '@/composables/usePos'
import type { Ref } from 'vue'

export interface VariantOption {
  id: number
  name: string
  value: string
}

export interface VariantCombo {
  product_variant_id: number
  ram_option_id: number | null
  storage_option_id: number | null
  color_option_id: number | null
  label: string
  stock: number
  min_price: number | null
  max_price: number | null
}

export interface VariantData {
  product_id: number
  ram: VariantOption[]
  storage: VariantOption[]
  color: VariantOption[]
  combinations: VariantCombo[]
}

function num(v: unknown): number {
  return Number(v)
}

function normalizeOption(opt: { id: unknown; name?: string; value?: string }): VariantOption {
  return { id: num(opt.id), name: String(opt.name ?? ''), value: String(opt.value ?? opt.name ?? '') }
}

function normalizeCombo(c: Record<string, unknown>): VariantCombo {
  return {
    product_variant_id: num(c.product_variant_id),
    ram_option_id: c.ram_option_id != null ? num(c.ram_option_id) : null,
    storage_option_id: c.storage_option_id != null ? num(c.storage_option_id) : null,
    color_option_id: c.color_option_id != null ? num(c.color_option_id) : null,
    label: String(c.label ?? ''),
    stock: num(c.stock),
    min_price: c.min_price != null ? num(c.min_price) : null,
    max_price: c.max_price != null ? num(c.max_price) : null,
  }
}

function normalizeVariantData(raw: Record<string, unknown>): VariantData {
  return {
    product_id: num(raw.product_id),
    ram: ((raw.ram as unknown[]) ?? []).map((o) => normalizeOption(o as { id: unknown; name?: string; value?: string })),
    storage: ((raw.storage as unknown[]) ?? []).map((o) =>
      normalizeOption(o as { id: unknown; name?: string; value?: string }),
    ),
    color: ((raw.color as unknown[]) ?? []).map((o) =>
      normalizeOption(o as { id: unknown; name?: string; value?: string }),
    ),
    combinations: ((raw.combinations as unknown[]) ?? []).map((c) => normalizeCombo(c as Record<string, unknown>)),
  }
}

export function usePosVariants(cart: Ref<CartLine[]>) {
  const showVariantModal = ref(false)
  const variantProduct = ref<PosProduct | null>(null)
  const variantData = ref<VariantData | null>(null)
  const variantLoading = ref(false)
  const variantQty = ref(1)

  const selectedComboId = ref<number | null>(null)
  const selectedRam = ref<number | null>(null)
  const selectedStorage = ref<number | null>(null)
  const selectedColor = ref<number | null>(null)

  const variantStock = ref<{ count: number; min_price: number | null; max_price: number | null } | null>(null)
  const variantResolvedPrice = ref(0)

  const variantUiMode = computed(() => {
    const combos = variantData.value?.combinations ?? []
    return combos.length > 0 ? 'combo' : 'legacy'
  })

  const selectedCombo = computed(() => {
    if (selectedComboId.value == null || !variantData.value) return null
    const id = num(selectedComboId.value)
    return variantData.value.combinations.find((c) => c.product_variant_id === id) ?? null
  })

  watch([selectedComboId, selectedRam, selectedStorage, selectedColor], () => {
    void checkVariantStock()
  })

  async function openVariantModal(product: PosProduct) {
    variantProduct.value = product
    variantQty.value = 1
    selectedComboId.value = null
    selectedRam.value = null
    selectedStorage.value = null
    selectedColor.value = null
    variantStock.value = null
    variantResolvedPrice.value = product.selling_price
    showVariantModal.value = true
    variantLoading.value = true

    try {
      const res = await directSaleApi.variants(product.id)
      variantData.value = normalizeVariantData((res.data ?? {}) as Record<string, unknown>)

      if (variantData.value.combinations.length > 0) {
        selectedComboId.value = variantData.value.combinations[0]?.product_variant_id ?? null
      }

      await checkVariantStock()
    } catch {
      variantData.value = null
      showVariantModal.value = false
      throw new Error('variant_load_failed')
    } finally {
      variantLoading.value = false
    }
  }

  async function checkVariantStock() {
    const product = variantProduct.value
    if (!product) return

    if (variantUiMode.value === 'combo') {
      const combo = selectedCombo.value
      if (!combo) {
        variantStock.value = { count: 0, min_price: null, max_price: null }
        return
      }
      try {
        const res = await directSaleApi.variantStock({
          product_id: product.id,
          product_variant_id: combo.product_variant_id,
        })
        variantStock.value = res.data as { count: number; min_price: number | null; max_price: number | null }
      } catch {
        variantStock.value = {
          count: combo.stock,
          min_price: combo.min_price,
          max_price: combo.max_price,
        }
      }
      const min = variantStock.value?.min_price
      variantResolvedPrice.value = min ?? combo.min_price ?? product.selling_price
      variantQty.value = Math.min(variantQty.value, variantStock.value?.count ?? combo.stock)
      return
    }

    const params: Record<string, unknown> = { product_id: product.id }
    if (selectedRam.value) params.ram = selectedRam.value
    if (selectedStorage.value) params.storage = selectedStorage.value
    if (selectedColor.value) params.color = selectedColor.value

    try {
      const res = await directSaleApi.variantStock(params)
      variantStock.value = res.data as { count: number; min_price: number | null; max_price: number | null }
      variantResolvedPrice.value = variantStock.value?.min_price ?? product.selling_price
    } catch {
      variantStock.value = { count: 0, min_price: null, max_price: null }
    }
  }

  function addVariantToCart() {
    const product = variantProduct.value
    if (!product || !variantStock.value || variantStock.value.count < 1) return false

    if (variantUiMode.value === 'combo') {
      const combo = selectedCombo.value
      if (!combo) return false

      const maxStock = variantStock.value.count
      const qty = Math.min(Math.max(1, variantQty.value), maxStock)
      const unitPrice = variantResolvedPrice.value
      const key = `pv-${product.id}-${combo.product_variant_id}`
      const label = `${product.brand} - ${product.label} (${combo.label})`
      const existing = cart.value.find((x) => x.key === key)
      if (existing) {
        const before = existing.quantity
        existing.quantity = Math.min(existing.quantity + qty, maxStock)
        existing.stock_limit = maxStock
        if (existing.quantity === before) {
          showVariantModal.value = false
          return false
        }
      } else {
        cart.value.push({
          key,
          product_id: product.id,
          product_label: label,
          variant_label: combo.label,
          product_type: product.product_type,
          quantity: qty,
          unit_price: unitPrice,
          discount_price: 0,
          device_id: null,
          imei: null,
          product_variant_id: combo.product_variant_id,
          ram_option_id: combo.ram_option_id,
          storage_option_id: combo.storage_option_id,
          color_option_id: combo.color_option_id,
          stock_limit: maxStock,
        })
      }
    } else {
      const ram = variantData.value?.ram.find((r) => r.id === selectedRam.value)
      const storage = variantData.value?.storage.find((s) => s.id === selectedStorage.value)
      const color = variantData.value?.color.find((c) => c.id === selectedColor.value)
      const opts = [ram?.value, storage?.value, color?.value].filter(Boolean).join(' / ')
      const maxStock = variantStock.value.count
      const qty = Math.min(Math.max(1, variantQty.value), maxStock)
      const key = `p-${product.id}-${selectedRam.value ?? 'any'}-${selectedStorage.value ?? 'any'}-${selectedColor.value ?? 'any'}`
      const existing = cart.value.find((x) => x.key === key)
      if (existing) {
        const before = existing.quantity
        existing.quantity = Math.min(existing.quantity + qty, maxStock)
        existing.stock_limit = maxStock
        if (existing.quantity === before) {
          showVariantModal.value = false
          return false
        }
      } else {
        cart.value.push({
          key,
          product_id: product.id,
          product_label: `${product.brand} - ${product.label}${opts ? ` (${opts})` : ''}`,
          variant_label: opts || null,
          product_type: product.product_type,
          quantity: qty,
          unit_price: variantResolvedPrice.value,
          discount_price: 0,
          device_id: null,
          imei: null,
          product_variant_id: null,
          ram_option_id: selectedRam.value,
          storage_option_id: selectedStorage.value,
          color_option_id: selectedColor.value,
          stock_limit: maxStock,
        })
      }
    }

    showVariantModal.value = false
    return true
  }

  function closeVariantModal() {
    showVariantModal.value = false
  }

  return {
    showVariantModal,
    variantProduct,
    variantData,
    variantLoading,
    variantQty,
    selectedComboId,
    selectedRam,
    selectedStorage,
    selectedColor,
    selectedCombo,
    variantStock,
    variantResolvedPrice,
    variantUiMode,
    openVariantModal,
    checkVariantStock,
    addVariantToCart,
    closeVariantModal,
  }
}
