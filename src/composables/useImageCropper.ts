import { ref } from 'vue'

export interface ImageCropperOptions {
  aspectRatio?: number
  outputWidth?: number
  outputHeight?: number
}

function isImageFile(file: File): boolean {
  return file.type.startsWith('image/')
}

export function useImageCropper(options: ImageCropperOptions = {}) {
  const showCropper = ref(false)
  const cropSrc = ref('')
  const aspectRatio = options.aspectRatio ?? 1
  const outputWidth = options.outputWidth ?? 600
  const outputHeight = options.outputHeight ?? 600

  let resolveCurrent: ((file: File | null) => void) | null = null
  let currentFileName = 'cropped.jpg'

  function cropSingle(file: File): Promise<File | null> {
    return new Promise((resolve) => {
      currentFileName = file.name.replace(/\.[^.]+$/, '.jpg') || 'cropped.jpg'
      const reader = new FileReader()
      reader.onload = () => {
        cropSrc.value = reader.result as string
        showCropper.value = true
        resolveCurrent = resolve
      }
      reader.onerror = () => resolve(null)
      reader.readAsDataURL(file)
    })
  }

  async function cropFilesFromEvent(e: Event, multiple = false): Promise<File[]> {
    const input = e.target as HTMLInputElement
    const picked = Array.from(input.files ?? [])
    input.value = ''
    if (!picked.length) return []

    const images = picked.filter(isImageFile)
    const nonImages = picked.filter((f) => !isImageFile(f))

    const cropped: File[] = []
    if (multiple) {
      for (const file of images) {
        const result = await cropSingle(file)
        if (result) cropped.push(result)
      }
    } else if (images[0]) {
      const result = await cropSingle(images[0])
      if (result) cropped.push(result)
    }

    return [...cropped, ...nonImages]
  }

  function onCropConfirm(blob: Blob) {
    const file = new File([blob], currentFileName, { type: 'image/jpeg' })
    resolveCurrent?.(file)
    resolveCurrent = null
    showCropper.value = false
    cropSrc.value = ''
  }

  function onCropCancel() {
    resolveCurrent?.(null)
    resolveCurrent = null
    showCropper.value = false
    cropSrc.value = ''
  }

  return {
    showCropper,
    cropSrc,
    aspectRatio,
    outputWidth,
    outputHeight,
    cropFilesFromEvent,
    onCropConfirm,
    onCropCancel,
  }
}
