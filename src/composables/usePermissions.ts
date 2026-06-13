import { computed } from 'vue'
import { useAuthStore } from '@/stores/auth'

export function usePermissions() {
  const auth = useAuthStore()

  const can = (permission: string) => computed(() => auth.hasPermission(permission))

  function hasAny(...permissions: string[]) {
    return auth.hasAnyPermission(...permissions)
  }

  function hasAll(...permissions: string[]) {
    return permissions.every((p) => auth.hasPermission(p))
  }

  return { can, hasAny, hasAll, auth }
}
