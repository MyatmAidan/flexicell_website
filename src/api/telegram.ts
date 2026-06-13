import { apiGet, apiPost } from '@/api/client'

const BASE = '/telegram'

export const telegramApi = {
  status: () => apiGet<{ configured: boolean }>(`${BASE}/status`),
  dailySales: () => apiPost(`${BASE}/notify/daily-sales`),
  dailyStock: () => apiPost(`${BASE}/notify/daily-stock`),
}
