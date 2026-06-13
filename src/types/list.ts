export interface ListParams {
  search?: string
  sort_by?: string
  sort_dir?: 'asc' | 'desc'
  per_page?: number
  page?: number
  [key: string]: unknown
}
