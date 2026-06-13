export function storageUrl(path: string): string {
  if (path.startsWith('http')) return path
  const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api'
  const origin = apiBase.replace(/\/api\/?$/, '')
  return `${origin}/storage/${path.replace(/^\//, '')}`
}

export function profilePhotoUrl(photo: string | null | undefined, cacheKey?: string | number | null): string | null {
  if (!photo) return null
  let url = photo
  if (!photo.startsWith('http') && !photo.startsWith('blob:') && !photo.startsWith('data:')) {
    url = storageUrl(photo)
  }
  if (cacheKey) {
    const sep = url.includes('?') ? '&' : '?'
    url = `${url}${sep}v=${encodeURIComponent(String(cacheKey))}`
  }
  return url
}

export function productImageUrl(image: string | null | undefined): string | null {
  if (!image) return null
  if (image.startsWith('http')) return image
  return storageUrl(`products/${image}`)
}

export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}
