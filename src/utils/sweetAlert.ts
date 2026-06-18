import Swal from 'sweetalert2'
import i18n from '@/i18n'

export const Toast = Swal.mixin({
  toast: true,
  position: 'top-end',
  showConfirmButton: false,
  timer: 3000,
  timerProgressBar: true,
})

export function showToast(
  icon: 'success' | 'error' | 'info' | 'warning',
  title: string,
  timer = 3000,
) {
  return Toast.fire({ icon, title, timer })
}

/** Admin success — top-right toast only */
export function showSuccessToast(title: string, timer = 3000) {
  return Toast.fire({ icon: 'success', title, timer })
}

/** Admin errors/info — centered modal, not toast */
export function showAlert(
  icon: 'error' | 'info' | 'warning',
  title: string,
) {
  return Swal.fire({
    icon,
    title,
    confirmButtonText: i18n.global.t('common.close'),
  })
}

export async function showConfirm(text: string, title?: string): Promise<boolean> {
  const result = await Swal.fire({
    title: title ?? i18n.global.t('common.confirm'),
    text,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: i18n.global.t('common.yes'),
    cancelButtonText: i18n.global.t('common.no'),
    reverseButtons: true,
  })

  return result.isConfirmed
}
