import type { AxiosError } from 'axios'
import type { ApiResponse } from '@/types/api'

export function getApiErrorMessage(error: unknown, fallback = 'Something went wrong'): string {
  const axiosErr = error as AxiosError<ApiResponse>
  const data = axiosErr.response?.data
  if (data?.errors) {
    const first = Object.values(data.errors)[0]
    if (Array.isArray(first) && first[0]) return first[0]
  }
  if (data?.message) return data.message
  if (axiosErr.message) return axiosErr.message
  return fallback
}
