import { onBeforeUnmount, onMounted, ref, type Ref } from 'vue'

export function useReveal(options?: { threshold?: number; rootMargin?: string }) {
  const el = ref<HTMLElement | null>(null)
  const visible = ref(false)
  let observer: IntersectionObserver | null = null

  onMounted(() => {
    if (!el.value) return
    observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          visible.value = true
          observer?.disconnect()
        }
      },
      {
        threshold: options?.threshold ?? 0.12,
        rootMargin: options?.rootMargin ?? '0px 0px -40px 0px',
      },
    )
    observer.observe(el.value)
  })

  onBeforeUnmount(() => observer?.disconnect())

  return { el, visible }
}

export function useRevealList(count: Ref<number> | (() => number)) {
  function delay(index: number): string {
    const total = typeof count === 'function' ? count() : count.value
    const ms = Math.min(index * 70, 420)
    return `${ms}ms`
  }

  return { delay }
}
