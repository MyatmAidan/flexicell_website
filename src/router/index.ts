import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { canAccessRoute } from '@/utils/routePermissions'
import { ADMIN_BASE } from '@/config/paths'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      component: () => import('@/layouts/StorefrontLayout.vue'),
      children: [
        {
          path: '',
          name: 'home',
          component: () => import('@/views/storefront/HomeView.vue'),
        },
        {
          path: 'products/search',
          name: 'product-search',
          component: () => import('@/views/storefront/ProductSearchView.vue'),
        },
        {
          path: 'products/:id',
          name: 'product-detail',
          component: () => import('@/views/storefront/ProductDetailView.vue'),
        },
        {
          path: 'products',
          name: 'shop',
          component: () => import('@/views/storefront/ProductsView.vue'),
        },
        {
          path: 'blog/:id',
          name: 'blog-detail',
          component: () => import('@/views/storefront/BlogDetailView.vue'),
        },
        {
          path: 'blog',
          name: 'blog',
          component: () => import('@/views/storefront/BlogListView.vue'),
        },
        {
          path: 'warranty',
          name: 'warranty',
          component: () => import('@/views/storefront/WarrantyCheckView.vue'),
        },
        {
          path: 'contact',
          name: 'contact',
          component: () => import('@/views/storefront/ContactView.vue'),
        },
        {
          path: 'about',
          name: 'about',
          component: () => import('@/views/storefront/AboutView.vue'),
        },
        {
          path: 'account',
          name: 'customer-account',
          component: () => import('@/views/storefront/auth/CustomerAccountView.vue'),
          meta: { requiresCustomer: true },
        },
      ],
    },
    {
      path: '/login',
      name: 'customer-login',
      component: () => import('@/views/auth/LoginView.vue'),
      meta: { customerGuest: true },
    },
    {
      path: '/register',
      name: 'customer-register',
      component: () => import('@/views/auth/RegisterView.vue'),
      meta: { customerGuest: true },
    },
    {
      path: `${ADMIN_BASE}/login`,
      redirect: { name: 'customer-login' },
    },
    {
      path: ADMIN_BASE,
      component: () => import('@/layouts/AdminLayout.vue'),
      meta: { requiresAuth: true },
      children: [
        { path: '', redirect: `${ADMIN_BASE}/dashboard` },
        {
          path: 'dashboard',
          name: 'dashboard',
          component: () => import('@/views/admin/DashboardView.vue'),
          meta: { permission: 'dashboard.view' },
        },
        {
          path: 'direct-sale',
          name: 'direct-sale',
          component: () => import('@/views/admin/direct-sale/DirectSaleView.vue'),
          meta: { permission: 'direct_sale.manage' },
        },
        {
          path: 'trade-in-sale',
          name: 'trade-in-sale',
          component: () => import('@/views/admin/trade-in-sale/TradeInSaleView.vue'),
          meta: { permission: 'direct_sale.manage' },
        },
        {
          path: 'phone-models/create',
          name: 'phone-models-create',
          component: () => import('@/views/admin/phone-models/PhoneModelFormView.vue'),
          meta: { permission: 'phone_models.create' },
        },
        {
          path: 'phone-models/:id/edit',
          name: 'phone-models-edit',
          component: () => import('@/views/admin/phone-models/PhoneModelFormView.vue'),
          meta: { permission: 'phone_models.update' },
        },
        {
          path: 'phone-models/:id',
          name: 'phone-models-show',
          component: () => import('@/views/admin/phone-models/PhoneModelShowView.vue'),
          meta: { permission: 'phone_models.view' },
        },
        {
          path: 'phone-models',
          name: 'phone-models',
          component: () => import('@/views/admin/phone-models/PhoneModelsView.vue'),
          meta: { permission: 'phone_models.view' },
        },
        {
          path: 'products/create',
          name: 'products-create',
          component: () => import('@/views/admin/products/ProductFormView.vue'),
          meta: { permission: 'products.create' },
        },
        {
          path: 'products/:id/edit',
          name: 'products-edit',
          component: () => import('@/views/admin/products/ProductFormView.vue'),
          meta: { permission: 'products.update' },
        },
        {
          path: 'products',
          name: 'products',
          component: () => import('@/views/admin/products/ProductsView.vue'),
          meta: { permission: 'products.view' },
        },
        {
          path: 'devices',
          name: 'devices',
          component: () => import('@/views/admin/devices/DevicesView.vue'),
          meta: { permission: 'devices.view' },
        },
        {
          path: 'brands',
          name: 'brands',
          component: () => import('@/views/admin/brands/BrandsView.vue'),
          meta: { permission: 'brands.view' },
        },
        {
          path: 'categories',
          name: 'categories',
          component: () => import('@/views/admin/categories/CategoriesView.vue'),
          meta: { permission: 'categories.view' },
        },
        {
          path: 'orders/:id/receipt',
          name: 'orders-receipt',
          component: () => import('@/views/admin/orders/OrderReceiptView.vue'),
          meta: { permission: 'orders.view' },
        },
        {
          path: 'orders/:id',
          name: 'orders-show',
          component: () => import('@/views/admin/orders/OrderShowView.vue'),
          meta: { permission: 'orders.view' },
        },
        {
          path: 'orders',
          name: 'orders',
          component: () => import('@/views/admin/orders/OrdersView.vue'),
          meta: { permission: 'orders.view' },
        },
        {
          path: 'customers/:id',
          name: 'customer-show',
          component: () => import('@/views/admin/customers/CustomerShowView.vue'),
          meta: { permission: 'customers.view' },
        },
        {
          path: 'customers',
          name: 'customers',
          component: () => import('@/views/admin/customers/CustomersView.vue'),
          meta: { permission: 'customers.view' },
        },
        {
          path: 'suppliers/:id',
          name: 'supplier-show',
          component: () => import('@/views/admin/suppliers/SupplierShowView.vue'),
          meta: { permission: 'suppliers.view' },
        },
        {
          path: 'suppliers',
          name: 'suppliers',
          component: () => import('@/views/admin/suppliers/SuppliersView.vue'),
          meta: { permission: 'suppliers.view' },
        },
        {
          path: 'supplier-purchases/create',
          name: 'supplier-purchases-create',
          component: () => import('@/views/admin/supplier-purchases/SupplierPurchaseCreateView.vue'),
          meta: { permission: 'supplier.manage' },
        },
        {
          path: 'supplier-purchases/:id',
          name: 'supplier-purchases-show',
          component: () => import('@/views/admin/supplier-purchases/SupplierPurchaseShowView.vue'),
          meta: { permission: 'supplier.manage' },
        },
        {
          path: 'supplier-purchases',
          name: 'supplier-purchases',
          component: () => import('@/views/admin/supplier-purchases/SupplierPurchasesView.vue'),
          meta: { permission: 'supplier.manage' },
        },
        {
          path: 'installments/:id',
          name: 'installments-show',
          component: () => import('@/views/admin/installments/InstallmentShowView.vue'),
          meta: { permission: 'installments.view' },
        },
        {
          path: 'installments',
          name: 'installments',
          component: () => import('@/views/admin/installments/InstallmentsView.vue'),
          meta: { permission: 'installments.view' },
        },
        {
          path: 'installment-rates',
          name: 'installment-rates',
          component: () => import('@/views/admin/installment-rates/InstallmentRatesView.vue'),
          meta: { permission: 'installment_rate.manage' },
        },
        {
          path: 'warranty-details',
          name: 'warranty-details',
          component: () => import('@/views/admin/warranty-details/WarrantyDetailsView.vue'),
          meta: { permission: 'warranty_detail.view' },
        },
        {
          path: 'users/:id/permissions',
          name: 'user-permissions',
          component: () => import('@/views/admin/users/UserPermissionsView.vue'),
          meta: { permission: 'users.update' },
        },
        {
          path: 'users',
          name: 'users',
          component: () => import('@/views/admin/users/UsersView.vue'),
          meta: { permission: 'users.view' },
        },
        {
          path: 'roles/:id/edit',
          name: 'role-edit',
          component: () => import('@/views/admin/roles/RoleEditView.vue'),
          meta: { permission: 'roles.update' },
        },
        {
          path: 'roles',
          name: 'roles',
          component: () => import('@/views/admin/roles/RolesView.vue'),
          meta: { permission: 'roles.view' },
        },
        {
          path: 'blogs/create',
          name: 'blogs-create',
          component: () => import('@/views/admin/blogs/BlogFormView.vue'),
          meta: { permission: 'blogs.create' },
        },
        {
          path: 'blogs/:id/edit',
          name: 'blogs-edit',
          component: () => import('@/views/admin/blogs/BlogFormView.vue'),
          meta: { permission: 'blogs.update' },
        },
        {
          path: 'blogs/:id',
          name: 'blogs-show',
          component: () => import('@/views/admin/blogs/BlogShowView.vue'),
          meta: { permission: 'blogs.view' },
        },
        {
          path: 'blogs',
          name: 'blogs',
          component: () => import('@/views/admin/blogs/BlogsView.vue'),
          meta: { permission: 'blogs.view' },
        },
        {
          path: 'profile',
          name: 'profile',
          component: () => import('@/views/admin/profile/ProfileView.vue'),
        },
      ],
    },
    {
      path: '/:pathMatch(.*)*',
      redirect: '/',
    },
  ],
})

router.beforeEach(async (to) => {
  const auth = useAuthStore()

  if (!auth.initialized) {
    await auth.initialize()
  }

  if (to.matched.some((r) => r.meta.requiresAuth)) {
    if (!auth.isAuthenticated) {
      return { name: 'customer-login', query: { redirect: to.fullPath } }
    }
    if (auth.isCustomer) {
      return { name: 'home' }
    }
  }

  if (to.meta.requiresCustomer) {
    if (!auth.isAuthenticated) {
      return { name: 'customer-login', query: { redirect: to.fullPath } }
    }
    if (!auth.isCustomer) {
      return { name: 'dashboard' }
    }
  }

  if (to.meta.customerGuest && auth.isAuthenticated) {
    if (auth.isStaff) {
      return { name: 'dashboard' }
    }
    return { name: 'home' }
  }

  const permission = to.meta.permission as string | undefined
  if (permission && auth.isAuthenticated && !canAccessRoute(auth.hasAnyPermission.bind(auth), permission)) {
    return { name: 'dashboard' }
  }

  return true
})

export default router
