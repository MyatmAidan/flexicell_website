import { apiDelete, apiGet, apiPost } from '@/api/client'
import type { ListParams } from '@/types/list'

export interface InstallmentRate {
  id: number
  month_option: number
  rate: number
  installment_month: number
  installment_rate: number
  created_at: string
  updated_at: string
}

const BASE = '/installment-rates'

export const installmentRatesApi = {
  list: (params?: ListParams) => apiGet<InstallmentRate[]>(BASE, params),
  get: (id: number) => apiGet<InstallmentRate>(`${BASE}/${id}`),
  create: (data: Record<string, unknown>) => apiPost<InstallmentRate>(BASE, data),
  update: (id: number, data: Record<string, unknown>) => apiPost<InstallmentRate>(`${BASE}/${id}`, data),
  delete: (id: number) => apiDelete(`${BASE}/${id}`),
  bulkDelete: (ids: number[]) => apiPost(`${BASE}/bulk-delete`, { ids }),
}
