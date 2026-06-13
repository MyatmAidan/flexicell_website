import { apiGet, apiPostForm } from '@/api/client'

const BASE = '/trade-in-sale'

export const tradeInSaleApi = {
  bootstrap: () => apiGet(`${BASE}/bootstrap`),
  searchCustomers: (q?: string) => apiGet(`${BASE}/customers`, { q }),
  checkout: (data: FormData) => apiPostForm(`${BASE}/checkout`, data),
}
