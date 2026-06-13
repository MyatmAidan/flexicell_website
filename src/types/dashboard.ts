export interface DashboardStats {
  telegram_configured: boolean
  revenue: {
    total: number
    this_month: number
    last_month: number
    growth_percent: number
  }
  orders: {
    total: number
    this_month: number
    last_month: number
    growth_percent: number
  }
  customers: {
    total: number
    new_this_month: number
  }
  products: {
    total: number
    active: number
    low_stock: number
    out_of_stock: number
  }
  devices: {
    total_available: number
    new: number
    second_hand: number
  }
  system: {
    categories: number
    brands: number
    payment_methods: number
  }
  payments: {
    completed_amount: number
    pending_amount: number
    total_amount: number
  }
  installments: {
    upcoming_payments_count: number
    overdue_payments_count: number
    total_remaining_amount: number
  }
  recent_orders: RecentOrder[]
  top_products: TopProduct[]
  charts: {
    revenue_orders: {
      labels: string[]
      revenue: number[]
      orders: number[]
    }
    stock_status: {
      labels: string[]
      data: number[]
    }
    devices_inventory: {
      labels: string[]
      data: number[]
    }
    payments: {
      labels: string[]
      data: number[]
    }
    order_status: {
      labels: string[]
      data: number[]
    }
  }
}

export interface RecentOrder {
  id: number
  customer_name: string | null
  grand_total: number
  order_status: string
  order_date: string | null
  created_at: string | null
}

export interface TopProduct {
  id: number
  model_name: string | null
  brand_name: string | null
  category_name: string | null
  available_device_count: number
}
