/** Primary route guard permission → extra permissions that also grant access (flexicell style). */
const ROUTE_FALLBACKS: Record<string, string[]> = {
  'dashboard.view': ['menu.dashboard'],
  'direct_sale.manage': ['menu.direct-sale', 'menu.trade-in'],
  'phone_models.view': ['menu.phone-model', 'phone_model.manage'],
  'products.view': ['menu.product', 'product.manage'],
  'devices.view': ['menu.device', 'device.manage'],
  'brands.view': ['menu.brand', 'brand.manage'],
  'categories.view': ['menu.category', 'category.manage'],
  'orders.view': ['menu.order', 'order.view', 'order.manage'],
  'customers.view': ['menu.customer', 'customer.manage'],
  'suppliers.view': ['menu.supplier', 'supplier.manage'],
  'supplier.manage': ['menu.supplier-purchase'],
  'installments.view': ['menu.installment', 'installment.manage'],
  'installment_rate.manage': ['menu.installment-rate'],
  'warranty_detail.view': ['menu.warranty-detail'],
  'users.view': ['menu.users', 'users.manage'],
  'users.update': ['menu.users', 'users.manage'],
  'roles.view': ['menu.roles', 'roles.manage'],
  'roles.update': ['menu.roles', 'roles.manage'],
  'roles.create': ['menu.roles', 'roles.manage'],
  'blogs.view': ['menu.blog', 'blog.manage'],
}

export function routePermissionNames(primary: string): string[] {
  return [primary, ...(ROUTE_FALLBACKS[primary] ?? [])]
}

export function canAccessRoute(
  hasAny: (...names: string[]) => boolean,
  primary: string,
): boolean {
  return hasAny(...routePermissionNames(primary))
}
