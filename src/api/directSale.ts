import api, { apiGet, apiPost, apiPostForm } from '@/api/client'

const BASE = '/direct-sale'

export const directSaleApi = {
  bootstrap: () => apiGet(`${BASE}/bootstrap`),
  searchProducts: (q?: string) => apiGet(`${BASE}/products`, { q }),
  searchCustomers: (q?: string) => apiGet(`${BASE}/customers`, { q }),
  searchDevices: (imei: string) => apiGet(`${BASE}/devices`, { imei }),
  variantStock: (params: Record<string, unknown>) => apiGet(`${BASE}/variant-stock`, params),
  variants: (productId: number) => apiGet(`${BASE}/products/${productId}/variants`),
  checkout: (data: FormData) => apiPostForm(`${BASE}/checkout`, data),
}
