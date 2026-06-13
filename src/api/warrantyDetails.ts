import { apiGet } from '@/api/client'
import type { ListParams } from '@/types/list'

export interface WarrantyDetail {
  id: number
  warranty_id: number
  device_id: number
  customer_id: number
  start_date: string
  end_date: string
  status: string
  computed_status: string
  customer?: { name: string; phone: string }
  device?: { imei: string; product_name?: string; device_name?: string }
  warranty?: { months: number }
  created_at: string
}

const BASE = '/warranty-details'

export const warrantyDetailsApi = {
  list: (params?: ListParams) => apiGet<WarrantyDetail[]>(BASE, params),
}
