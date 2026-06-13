import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios'
import type { ApiResponse } from '@/types/api'
import i18n, { type SupportedLocale } from '@/i18n'

const TOKEN_KEY = 'flexicell_token'

export function getStoredToken(): string | null {
  const encoded = localStorage.getItem(TOKEN_KEY)
  if (!encoded) return null
  try {
    return atob(encoded)
  } catch {
    return null
  }
}

export function setStoredToken(encodedToken: string) {
  localStorage.setItem(TOKEN_KEY, encodedToken)
}

export function clearStoredToken() {
  localStorage.removeItem(TOKEN_KEY)
}

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api',
  timeout: 15000,
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
})

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = getStoredToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  config.headers['X-Locale'] = i18n.global.locale.value as SupportedLocale
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiResponse>) => {
    if (error.response?.status === 401) {
      clearStoredToken()
      const path = window.location.pathname
      const onAuthPage =
        path === '/login' ||
        path === '/register'
      if (!onAuthPage && path.startsWith('/admin')) {
        window.location.href = '/login?redirect=' + encodeURIComponent(path)
      }
    }
    return Promise.reject(error)
  },
)

export async function apiGet<T>(url: string, params?: Record<string, unknown>): Promise<ApiResponse<T>> {
  const { data } = await api.get<ApiResponse<T>>(url, { params })
  return data
}

export async function apiPost<T>(url: string, body?: unknown): Promise<ApiResponse<T>> {
  const { data } = await api.post<ApiResponse<T>>(url, body)
  return data
}

export async function apiDelete<T>(url: string): Promise<ApiResponse<T>> {
  const { data } = await api.delete<ApiResponse<T>>(url)
  return data
}

export async function apiPostForm<T>(url: string, formData: FormData): Promise<ApiResponse<T>> {
  const { data } = await api.post<ApiResponse<T>>(url, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return data
}

export async function downloadFile(url: string, filename: string, params?: Record<string, unknown>) {
  const response = await api.get(url, { params, responseType: 'blob' })
  const blob = new Blob([response.data])
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = filename
  link.click()
  URL.revokeObjectURL(link.href)
}

export default api
