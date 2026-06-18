import { computed, ref } from 'vue'

export interface PosProduct {
  id: number
  label: string
  brand: string
  product_type: string
  stock_quantity: number
  available_devices: number
  image: string | null
}

export interface CartLine {
  key: string
  product_id: number
  product_label: string
  variant_label?: string | null
  product_type: string
  quantity: number
  unit_price: number
  discount_price: number
  device_id?: number | null
  imei?: string | null
  product_variant_id?: number | null
  ram_option_id?: number | null
  storage_option_id?: number | null
  color_option_id?: number | null
  /** Max quantity allowed for this line (variant/device stock). */
  stock_limit?: number
}

export interface InstallmentRate {
  id: number
  month_option: number
  rate: number
}

export function usePosCart(tradeInCredit = ref(0)) {
  const cart = ref<CartLine[]>([])

  const subtotal = computed(() =>
    cart.value.reduce((sum, l) => sum + Number(l.unit_price) * Number(l.quantity), 0),
  )

  const discountTotal = computed(() =>
    cart.value.reduce((sum, l) => sum + Number(l.discount_price) * Number(l.quantity), 0),
  )

  const grandTotal = computed(() =>
    Math.max(0, subtotal.value - discountTotal.value - tradeInCredit.value),
  )

  const unitCount = computed(() =>
    cart.value.reduce((sum, l) => sum + Number(l.quantity), 0),
  )

  function lineTotal(line: CartLine) {
    return (Number(line.unit_price) - Number(line.discount_price)) * Number(line.quantity)
  }

  function clearCart() {
    cart.value = []
  }

  function removeLine(idx: number) {
    cart.value.splice(idx, 1)
  }

  function adjustQty(idx: number, delta: number): boolean {
    const line = cart.value[idx]
    if (!line || line.device_id) return false

    const current = Number(line.quantity)
    const max = line.stock_limit ?? Number.POSITIVE_INFINITY

    if (delta < 0) {
      if (current <= 1) {
        cart.value.splice(idx, 1)
      } else {
        line.quantity = current + delta
      }
      return true
    }

    if (delta > 0) {
      if (current >= max) return false
      line.quantity = Math.min(current + delta, max)
      return true
    }

    return false
  }

  function appendItemsToFormData(fd: FormData) {
    cart.value.forEach((line, idx) => {
      fd.append(`items[${idx}][product_id]`, String(line.product_id))
      fd.append(`items[${idx}][quantity]`, String(line.device_id ? 1 : line.quantity))
      fd.append(`items[${idx}][unit_price]`, String(line.unit_price))
      fd.append(`items[${idx}][discount_price]`, String(line.discount_price))
      if (line.device_id) fd.append(`items[${idx}][device_id]`, String(line.device_id))
      if (line.imei) fd.append(`items[${idx}][imei]`, line.imei)
      if (!line.device_id && line.product_variant_id) {
        fd.append(`items[${idx}][product_variant_id]`, String(line.product_variant_id))
      }
      if (line.ram_option_id) fd.append(`items[${idx}][ram_option_id]`, String(line.ram_option_id))
      if (line.storage_option_id) {
        fd.append(`items[${idx}][storage_option_id]`, String(line.storage_option_id))
      }
      if (line.color_option_id) fd.append(`items[${idx}][color_option_id]`, String(line.color_option_id))
    })
  }

  return {
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
  }
}

export function isNewProduct(type: string) {
  return String(type).toLowerCase() === 'new'
}

export function isSecondHand(type: string) {
  return String(type).toLowerCase().includes('second')
}
