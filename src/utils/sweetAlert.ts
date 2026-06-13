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
