/** Menu permission (flexicell) with action fallback for sidebar visibility. */
export interface NavPermission {
  menu: string
  fallback: string
}

export const NAV_PERMISSIONS = {
  dashboard: { menu: 'menu.dashboard', fallback: 'dashboard.view' },
  directSale: { menu: 'menu.direct-sale', fallback: 'direct_sale.manage' },
  tradeInSale: { menu: 'menu.trade-in', fallback: 'direct_sale.manage' },
  phoneModels: { menu: 'menu.phone-model', fallback: 'phone_models.view' },
  products: { menu: 'menu.product', fallback: 'products.view' },
  devices: { menu: 'menu.device', fallback: 'devices.view' },
  brands: { menu: 'menu.brand', fallback: 'brands.view' },
  categories: { menu: 'menu.category', fallback: 'categories.view' },
  orders: { menu: 'menu.order', fallback: 'orders.view' },
  customers: { menu: 'menu.customer', fallback: 'customers.view' },
  suppliers: { menu: 'menu.supplier', fallback: 'suppliers.view' },
  supplierPurchases: { menu: 'menu.supplier-purchase', fallback: 'supplier.manage' },
  installments: { menu: 'menu.installment', fallback: 'installments.view' },
  installmentRates: { menu: 'menu.installment-rate', fallback: 'installment_rate.manage' },
  warrantyDetails: { menu: 'menu.warranty-detail', fallback: 'warranty_detail.view' },
  users: { menu: 'menu.users', fallback: 'users.view' },
  roles: { menu: 'menu.roles', fallback: 'roles.view' },
  blogs: { menu: 'menu.blog', fallback: 'blogs.view' },
} as const satisfies Record<string, NavPermission>
