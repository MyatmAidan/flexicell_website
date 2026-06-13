import axios from 'axios'
import type { ApiResponse } from '@/types/api'
import i18n, { type SupportedLocale } from '@/i18n'

const publicApi = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api',
  timeout: 15000,
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
})

publicApi.interceptors.request.use((config) => {
  config.headers['X-Locale'] = i18n.global.locale.value as SupportedLocale
  return config
})

export async function publicGet<T>(url: string, params?: Record<string, unknown>): Promise<ApiResponse<T>> {
  const { data } = await publicApi.get<ApiResponse<T>>(url, { params })
  return data
}

export async function publicPost<T>(url: string, body?: unknown): Promise<ApiResponse<T>> {
  const { data } = await publicApi.post<ApiResponse<T>>(url, body)
  return data
}
