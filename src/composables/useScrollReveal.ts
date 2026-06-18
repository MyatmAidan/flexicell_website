import { nextTick, onBeforeUnmount, onMounted, type Ref, watch } from 'vue'
import { useRoute } from 'vue-router'

const REVEAL_SELECTOR =
  '.sf-reveal:not(.sf-visible), .sf-reveal-up:not(.sf-visible), .sf-reveal-left:not(.sf-visible), .sf-reveal-right:not(.sf-visible)'

export function useScrollReveal(rootRef: Ref<HTMLElement | null>) {
  const route = useRoute()
  let observer: IntersectionObserver | null = null
  let mutationObserver: MutationObserver | null = null
  const tracked = new WeakSet<Element>()

  function createObserver() {
    return new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue
          entry.target.classList.add('sf-visible')
          observer?.unobserve(entry.target)
          tracked.delete(entry.target)
        }
      },
      { threshold: 0.08, rootMargin: '0px 0px -6% 0px' },
    )
  }

  function scan() {
    const root = rootRef.value
    if (!root || !observer) return

    root.querySelectorAll(REVEAL_SELECTOR).forEach((el) => {
      if (tracked.has(el)) return
      tracked.add(el)
      observer!.observe(el)
    })
  }

  function scheduleScan(delayMs = 0) {
    window.setTimeout(() => {
      void nextTick().then(scan)
    }, delayMs)
  }

  onMounted(async () => {
    observer = createObserver()
    await nextTick()
    scan()

    const root = rootRef.value
    if (root) {
      mutationObserver = new MutationObserver(() => scheduleScan(50))
      mutationObserver.observe(root, { childList: true, subtree: true })
    }
  })

  watch(
    () => route.fullPath,
    () => scheduleScan(400),
  )

  onBeforeUnmount(() => {
    observer?.disconnect()
    mutationObserver?.disconnect()
  })
}
