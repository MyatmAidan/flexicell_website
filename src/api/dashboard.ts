import { apiGet } from '@/api/client'
import type { DashboardStats } from '@/types/dashboard'

export async function fetchDashboardStats() {
  return apiGet<DashboardStats>('/dashboard')
}
