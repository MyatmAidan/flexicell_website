/** Admin panel base path (mirrors flexicell `/admin/*`). */
export const ADMIN_BASE = '/admin'

export function adminPath(path: string): string {
  const normalized = path.startsWith('/') ? path : `/${path}`
  if (normalized === ADMIN_BASE || normalized.startsWith(`${ADMIN_BASE}/`)) {
    return normalized
  }
  return `${ADMIN_BASE}${normalized}`
}
