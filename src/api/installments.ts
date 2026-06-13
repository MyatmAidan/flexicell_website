import { apiGet, apiPost } from '@/api/client'
import type { ListParams } from '@/types/list'

export interface Installment {
  id: number
  order_id: number
  total_amount: number
  down_payment: number
  monthly_payment: number
  months: number
  start_date: string | null
  paid_payments_count?: number
  total_payments_count?: number
  order?: { id: number; customer?: { name: string } }
  payments?: { id: number; status: string; amount: number; paid_date: string | null }[]
  created_at: string
}

const BASE = '/installments'

export const installmentsApi = {
  list: (params?: ListParams) => apiGet<Installment[]>(BASE, params),
  get: (id: number) => apiGet<Installment>(`${BASE}/${id}`),
  markPaid: (paymentId: number) => apiPost(`${BASE}/payments/${paymentId}/mark-paid`),
}
