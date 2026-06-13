import { apiDelete, apiGet, apiPost } from '@/api/client'
import type { ListParams } from '@/types/list'

export interface SupplierPurchaseItem {
  id: number
  product_variant_id: number
  variant_label: string
  quantity: number
  received_quantity: number
  remaining_quantity: number
  unit_cost: number
  total_cost: number
}

export interface SupplierPurchase {
  id: number
  supplier_id: number
  supplier_name?: string
  invoice_number: string
  grand_total: number
  paid_amount: number
  credit_amount: number
  status: string
  status_label: string
  purchase_at: string | null
  received_at: string | null
  notes: string | null
  receive_progress?: string | { received: number; total: number }
  items?: SupplierPurchaseItem[]
  created_at: string
  updated_at: string
}

const BASE = '/supplier-purchases'

export const supplierPurchasesApi = {
  list: (params?: ListParams) => apiGet<SupplierPurchase[]>(BASE, params),
  get: (id: number) => apiGet<SupplierPurchase>(`${BASE}/${id}`),
  create: (data: Record<string, unknown>) => apiPost<SupplierPurchase>(BASE, data),
  receive: (id: number, data: Record<string, unknown>) => apiPost(`${BASE}/${id}/receive`, data),
  delete: (id: number) => apiDelete(`${BASE}/${id}`),
  searchVariants: (q: string) => apiGet<unknown[]>(`${BASE}/search-variants`, { q }),
}
