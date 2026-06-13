import { apiGet, apiPost } from '@/api/client'
import type { LoginPayload, LoginResponse, RegisterPayload, User } from '@/types/auth'

export async function login(payload: LoginPayload) {
  return apiPost<LoginResponse>('/login', payload)
}

export async function register(payload: RegisterPayload) {
  return apiPost<LoginResponse>('/register', payload)
}

export async function logout() {
  return apiPost<null>('/logout')
}

export async function fetchCurrentUser() {
  return apiGet<User>('/user')
}
