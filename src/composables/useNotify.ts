import { showConfirm, showToast } from '@/utils/sweetAlert'

export function useNotify() {
  function notify(msg: string, type: 'success' | 'error' | 'info' = 'info', duration = 3000) {
    return showToast(type, msg, duration)
  }

  function success(msg: string) {
    return showToast('success', msg)
  }

  function error(msg: string) {
    return showToast('error', msg, 5000)
  }

  function info(msg: string) {
    return showToast('info', msg)
  }

  function confirm(text: string, title?: string) {
    return showConfirm(text, title)
  }

  return { notify, success, error, info, confirm }
}
