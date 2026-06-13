<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, RouterLink } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { Icon } from '@iconify/vue'
import { useAuthStore } from '@/stores/auth'
import { adminPath } from '@/config/paths'
import { NAV_PERMISSIONS, type NavPermission } from '@/utils/navPermissions'

const emit = defineEmits<{ navigate: [] }>()

const route = useRoute()
const { t } = useI18n()
const auth = useAuthStore()

const openGroups = ref<Record<string, boolean>>({})

interface NavItem {
  name: string
  label: string
  icon: string
  to?: string
  permission?: NavPermission
  children?: NavItem[]
}

function canSee(permission?: NavPermission) {
  if (!permission) return true
  return auth.hasAnyPermission(permission.menu, permission.fallback)
}

function filterItems(items: NavItem[]): NavItem[] {
  return items
    .map((item) => {
      if (item.children) {
        const children = item.children.filter((c) => canSee(c.permission))
        if (!children.length) return null
        return { ...item, children }
      }
      return canSee(item.permission) ? item : null
    })
    .filter(Boolean) as NavItem[]
}

const navSections = computed(() => {
  const sections = [
    {
      title: t('nav.sections.home'),
      items: [
        { name: 'dashboard', label: t('nav.dashboard'), icon: 'solar:home-smile-bold-duotone', to: adminPath('/dashboard'), permission: NAV_PERMISSIONS.dashboard },
        { name: 'direct-sale', label: t('nav.directSale'), icon: 'solar:shop-2-bold-duotone', to: adminPath('/direct-sale'), permission: NAV_PERMISSIONS.directSale },
        { name: 'trade-in-sale', label: t('nav.tradeInSale'), icon: 'solar:transfer-horizontal-bold-duotone', to: adminPath('/trade-in-sale'), permission: NAV_PERMISSIONS.tradeInSale },
      ],
    },
    {
      title: t('nav.sections.catalog'),
      items: [
        {
          name: 'inventory',
          label: t('nav.inventory'),
          icon: 'solar:box-bold-duotone',
          children: [
            { name: 'phone-models', label: t('nav.phoneModels'), icon: '', to: adminPath('/phone-models'), permission: NAV_PERMISSIONS.phoneModels },
            { name: 'products', label: t('nav.products'), icon: '', to: adminPath('/products'), permission: NAV_PERMISSIONS.products },
            { name: 'devices', label: t('nav.devices'), icon: '', to: adminPath('/devices'), permission: NAV_PERMISSIONS.devices },
          ],
        },
        {
          name: 'attributes',
          label: t('nav.attributes'),
          icon: 'solar:tag-bold-duotone',
          children: [
            { name: 'brands', label: t('nav.brands'), icon: '', to: adminPath('/brands'), permission: NAV_PERMISSIONS.brands },
            { name: 'categories', label: t('nav.categories'), icon: '', to: adminPath('/categories'), permission: NAV_PERMISSIONS.categories },
          ],
        },
      ],
    },
    {
      title: t('nav.sections.salesFinance'),
      items: [
        { name: 'orders', label: t('nav.orderList'), icon: 'solar:cart-large-minimalistic-bold-duotone', to: adminPath('/orders'), permission: NAV_PERMISSIONS.orders },
        { name: 'customers', label: t('nav.customers'), icon: 'solar:user-hand-up-bold-duotone', to: adminPath('/customers'), permission: NAV_PERMISSIONS.customers },
        {
          name: 'procurement',
          label: t('nav.procurement'),
          icon: 'solar:delivery-bold-duotone',
          children: [
            { name: 'suppliers', label: t('nav.suppliers'), icon: '', to: adminPath('/suppliers'), permission: NAV_PERMISSIONS.suppliers },
            { name: 'supplier-purchases', label: t('nav.purchases'), icon: '', to: adminPath('/supplier-purchases'), permission: NAV_PERMISSIONS.supplierPurchases },
          ],
        },
        {
          name: 'finance',
          label: t('nav.finance'),
          icon: 'solar:bill-list-bold-duotone',
          children: [
            { name: 'installments', label: t('nav.installment'), icon: '', to: adminPath('/installments'), permission: NAV_PERMISSIONS.installments },
            { name: 'installment-rates', label: t('nav.installmentPlan'), icon: '', to: adminPath('/installment-rates'), permission: NAV_PERMISSIONS.installmentRates },
            { name: 'warranty-details', label: t('nav.warrantyDetails'), icon: '', to: adminPath('/warranty-details'), permission: NAV_PERMISSIONS.warrantyDetails },
          ],
        },
      ],
    },
    {
      title: t('nav.sections.administration'),
      items: [
        {
          name: 'users',
          label: t('nav.userManagement'),
          icon: 'solar:users-group-rounded-bold-duotone',
          children: [
            { name: 'users', label: t('nav.users'), icon: '', to: adminPath('/users'), permission: NAV_PERMISSIONS.users },
            { name: 'roles', label: t('nav.roles'), icon: '', to: adminPath('/roles'), permission: NAV_PERMISSIONS.roles },
          ],
        },
        { name: 'blogs', label: t('nav.blogs'), icon: 'solar:document-text-bold-duotone', to: adminPath('/blogs'), permission: NAV_PERMISSIONS.blogs },
      ],
    },
  ]

  return sections
    .map((section) => ({
      ...section,
      items: filterItems(section.items as NavItem[]),
    }))
    .filter((section) => section.items.length > 0)
})

function isActive(path?: string) {
  if (!path) return false
  return route.path === path || route.path.startsWith(path + '/')
}

function isGroupActive(item: NavItem) {
  return item.children?.some((child) => isActive(child.to)) ?? false
}

function toggleGroup(name: string) {
  openGroups.value[name] = !openGroups.value[name]
}

function onNavigate() {
  emit('navigate')
}
</script>

<template>
  <aside class="admin-sidebar">
    <div class="sidebar-brand">
      <RouterLink :to="adminPath('/dashboard')" class="brand-link" @click="onNavigate">
        <img src="/img/flexicell_logo.png" alt="Flexicell" class="brand-logo-only" />
      </RouterLink>
    </div>

    <nav class="sidebar-nav">
      <div v-for="section in navSections" :key="section.title" class="nav-section">
        <div class="nav-section-title">{{ section.title }}</div>
        <ul class="nav-list">
          <li v-for="item in section.items" :key="item.name" class="nav-item">
            <template v-if="item.children">
              <button
                type="button"
                class="nav-link nav-group-toggle"
                :class="{ active: isGroupActive(item), open: !!openGroups[item.name] }"
                @click="toggleGroup(item.name)"
              >
                <Icon :icon="item.icon" class="nav-icon" />
                <span>{{ item.label }}</span>
                <Icon icon="solar:alt-arrow-down-linear" class="nav-arrow" />
              </button>
              <ul v-show="openGroups[item.name]" class="nav-sublist">
                <li v-for="child in item.children" :key="child.name">
                  <RouterLink
                    :to="child.to!"
                    class="nav-link nav-sublink"
                    :class="{ active: isActive(child.to) }"
                    @click="onNavigate"
                  >
                    {{ child.label }}
                  </RouterLink>
                </li>
              </ul>
            </template>
            <RouterLink
              v-else
              :to="item.to!"
              class="nav-link"
              :class="{ active: isActive(item.to) }"
              @click="onNavigate"
            >
              <Icon :icon="item.icon" class="nav-icon" />
              <span>{{ item.label }}</span>
            </RouterLink>
          </li>
        </ul>
      </div>
    </nav>
  </aside>
</template>
