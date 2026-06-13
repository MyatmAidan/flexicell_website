import { apiGet } from '@/api/client'
import type { ListParams } from '@/types/list'

export interface Order {
  id: number
  customer_id: number
  grand_total: number
  order_status: string
  order_date: string | null
  items_count?: number
  customer?: { id: number; name: string }
  items?: unknown[]
  installment?: unknown
  trade_in?: unknown
  created_at: string
}

const BASE = '/orders'

export const ordersApi = {
  list: (params?: ListParams) => apiGet<Order[]>(BASE, params),
  get: (id: number) => apiGet<Order>(`${BASE}/${id}`),
  receipt: (id: number) => apiGet(`${BASE}/${id}/receipt`),
}
