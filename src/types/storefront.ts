export interface StorefrontProduct {
  id: number
  model_name: string
  category_name: string
  brand_name: string
  brand_logo: string | null
  image: string | null
  selling_price: number
  is_sold_out: boolean
  available_device_count?: number
  url?: string
}

export interface StorefrontBlog {
  id: number
  title: string
  thumbnail: string | null
  date: string
  sections_count?: number
  sections_label?: string
  url?: string
}

export interface StorefrontCategory {
  id: number
  category_name: string
}

export interface StorefrontBrand {
  id: number
  brand_name: string
  logo: string | null
}

export interface ProductSearchResult {
  products: StorefrontProduct[]
  categories: StorefrontCategory[]
  brands: StorefrontBrand[]
}

export interface ProductDetail {
  id: number
  model_name: string
  brand_name: string
  category_name: string
  product_type: string
  description: string | null
  selling_price: number
  stock_quantity: number
  images: string[]
  available_colors: string[]
  specifications: Record<string, string> | string[]
}

export interface BlogDetail {
  id: number
  title: string
  thumbnail: string | null
  date: string
  contents: {
    id: number
    heading: string
    content: string
    order: number
    images: { id: number; url: string }[]
  }[]
}

export interface ScrollMeta {
  current_page: number
  last_page: number
  has_more: boolean
  total: number
}
