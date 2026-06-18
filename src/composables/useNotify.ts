import { useRoute } from 'vue-router'
import { ADMIN_BASE } from '@/config/paths'
import { showAlert, showConfirm, showSuccessToast, showToast } from '@/utils/sweetAlert'

function isAdminPath(path: string): boolean {
  return path === ADMIN_BASE || path.startsWith(`${ADMIN_BASE}/`)
}

export function useNotify() {
  const route = useRoute()

  function inAdmin(): boolean {
    return isAdminPath(route.path)
  }

  function notify(msg: string, type: 'success' | 'error' | 'info' = 'info', duration = 3000) {
    if (inAdmin()) {
      if (type === 'success') return showSuccessToast(msg, duration)
      return showAlert(type === 'error' ? 'error' : 'info', msg)
    }
    return showToast(type, msg, duration)
  }

  function success(msg: string) {
    if (inAdmin()) return showSuccessToast(msg)
    return showToast('success', msg)
  }

  function error(msg: string) {
    if (inAdmin()) return showAlert('error', msg)
    return showToast('error', msg, 5000)
  }

  function info(msg: string) {
    if (inAdmin()) return showAlert('info', msg)
    return showToast('info', msg)
  }

  function confirm(text: string, title?: string) {
    return showConfirm(text, title)
  }

  return { notify, success, error, info, confirm }
}
