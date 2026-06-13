import { onMounted, ref } from 'vue'
import { tradeInSaleApi } from '@/api/tradeInSale'
import { warrantyDetailsApi } from '@/api/warrantyDetails'

export interface SelectOption {
  id: number
  name: string
  value: string
}

export interface WarrantyOption {
  id: number
  warranty_month: number
}

export function useVariantOptions() {
  const ramOptions = ref<SelectOption[]>([])
  const storageOptions = ref<SelectOption[]>([])
  const colorOptions = ref<SelectOption[]>([])
  const warranties = ref<WarrantyOption[]>([])
  const loading = ref(true)

  async function load() {
    loading.value = true
    try {
      const boot = await tradeInSaleApi.bootstrap()
      if (boot.success && boot.data) {
        const data = boot.data as Record<string, SelectOption[]>
        ramOptions.value = data.ram_options ?? []
        storageOptions.value = data.storage_options ?? []
        colorOptions.value = data.color_options ?? []
      }

      const wd = await warrantyDetailsApi.list({ per_page: 200 })
      const map = new Map<number, number>()
      for (const item of wd.data ?? []) {
        const w = item.warranty as { id?: number; warranty_month?: number; months?: number } | undefined
        if (w?.id) {
          map.set(w.id, w.warranty_month ?? w.months ?? 0)
        } else if (item.warranty_id) {
          map.set(item.warranty_id, item.warranty?.months ?? 0)
        }
      }
      warranties.value = Array.from(map.entries())
        .map(([id, warranty_month]) => ({ id, warranty_month }))
        .sort((a, b) => a.warranty_month - b.warranty_month)
    } finally {
      loading.value = false
    }
  }

  onMounted(load)

  return { ramOptions, storageOptions, colorOptions, warranties, loading, load }
}
