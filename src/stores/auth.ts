import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { fetchCurrentUser, login as apiLogin, logout as apiLogout, register as apiRegister } from '@/api/auth'
import { clearStoredToken, setStoredToken } from '@/api/client'
import type { LoginPayload, RegisterPayload, User } from '@/types/auth'

const CUSTOMER_ROLE_CODE = 'user'

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null)
  const loading = ref(false)
  const initializing = ref(false)
  const initialized = ref(false)

  const isAuthenticated = computed(() => !!user.value)
  const isCustomer = computed(() => user.value?.role_code === CUSTOMER_ROLE_CODE)
  const isStaff = computed(() => isAuthenticated.value && !isCustomer.value)
  const customerProfile = computed(() => user.value?.customer ?? null)
  const permissions = computed(() => user.value?.permissions?.map((p) => p.name) ?? [])

  function hasPermission(name: string): boolean {
    return permissions.value.includes(name)
  }

  function hasAnyPermission(...names: string[]): boolean {
    return names.some((name) => permissions.value.includes(name))
  }

  async function login(payload: LoginPayload) {
    loading.value = true
    try {
      const response = await apiLogin(payload)
      if (!response.success) {
        throw new Error(response.message)
      }
      setStoredToken(response.data.token)
      user.value = response.data.user
      return response
    } finally {
      loading.value = false
    }
  }

  async function register(payload: RegisterPayload) {
    loading.value = true
    try {
      const response = await apiRegister(payload)
      if (!response.success) {
        throw new Error(response.message)
      }
      setStoredToken(response.data.token)
      user.value = response.data.user
      return response
    } finally {
      loading.value = false
    }
  }

  async function logout() {
    loading.value = true
    try {
      await apiLogout()
    } catch {
      // ignore logout errors
    } finally {
      clearStoredToken()
      user.value = null
      loading.value = false
    }
  }

  async function fetchUser(): Promise<User | null> {
    try {
      const response = await fetchCurrentUser()
      if (response.success) {
        user.value = response.data
        return response.data
      }
      clearStoredToken()
      user.value = null
      return null
    } catch {
      clearStoredToken()
      user.value = null
      return null
    }
  }

  async function initialize() {
    if (initialized.value) return

    initializing.value = true
    try {
      const token = localStorage.getItem('flexicell_token')
      if (token) {
        await fetchUser()
      }
    } finally {
      initializing.value = false
      initialized.value = true
    }
  }

  return {
    user,
    loading,
    initializing,
    initialized,
    isAuthenticated,
    isCustomer,
    isStaff,
    customerProfile,
    permissions,
    hasPermission,
    hasAnyPermission,
    login,
    register,
    logout,
    fetchUser,
    initialize,
  }
})
