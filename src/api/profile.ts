import { apiDelete, apiGet, apiPost, apiPostForm } from '@/api/client'
import type { User } from '@/types/auth'

const BASE = '/profile'

export const profileApi = {
  get: () => apiGet<User>(BASE),
  update: (data: Record<string, unknown>) => apiPost<User>(BASE, data),
  updatePhoto: (file: File) => {
    const fd = new FormData()
    fd.append('profile_photo', file)
    return apiPostForm<User>(`${BASE}/photo`, fd)
  },
  removePhoto: () => apiDelete<User>(`${BASE}/photo`),
  changePassword: (data: Record<string, unknown>) => apiPost(`${BASE}/change-password`, data),
}
