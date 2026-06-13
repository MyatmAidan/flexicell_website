import { onUnmounted, ref, toValue, watch, type MaybeRefOrGetter } from 'vue'

export function useScrollPagination(options: {
  hasMore: MaybeRefOrGetter<boolean>
  loading: MaybeRefOrGetter<boolean>
  onLoadMore: () => void | Promise<void>
  rootMargin?: string
}) {
  const sentinel = ref<HTMLElement | null>(null)
  let observer: IntersectionObserver | null = null

  function disconnect() {
    observer?.disconnect()
    observer = null
  }

  function bindObserver() {
    disconnect()
    if (!sentinel.value) return

    observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0]
        if (!entry?.isIntersecting) return
        if (!toValue(options.hasMore) || toValue(options.loading)) return
        void options.onLoadMore()
      },
      { rootMargin: options.rootMargin ?? '240px 0px' },
    )

    observer.observe(sentinel.value)
  }

  watch(sentinel, bindObserver)

  onUnmounted(disconnect)

  return { sentinel }
}
