import { ref } from 'vue'
import type { PosProduct } from '@/composables/usePos'
import { isNewProduct, isSecondHand } from '@/composables/usePos'

export function usePosDragDrop(
  products: () => PosProduct[],
  onDropProduct: (product: PosProduct) => void,
  onSecondHandDrop?: () => void,
) {
  const cartDropHighlight = ref(false)
  const draggingProductId = ref<number | null>(null)

  function onProductDragStart(e: DragEvent, product: PosProduct) {
    if (!isNewProduct(product.product_type)) return
    draggingProductId.value = product.id
    e.dataTransfer?.setData('text/plain', String(product.id))
    if (e.dataTransfer) e.dataTransfer.effectAllowed = 'copy'
    const el = e.currentTarget as HTMLElement
    el.classList.add('dragging')
  }

  function onProductDragEnd(e: DragEvent) {
    draggingProductId.value = null
    cartDropHighlight.value = false
    const el = e.currentTarget as HTMLElement
    el.classList.remove('dragging')
  }

  function onCartDragOver(e: DragEvent) {
    e.preventDefault()
    if (e.dataTransfer) e.dataTransfer.dropEffect = 'copy'
    cartDropHighlight.value = true
  }

  function onCartDragLeave(e: DragEvent) {
    const current = e.currentTarget as HTMLElement
    const related = e.relatedTarget as Node | null
    if (related && current.contains(related)) return
    cartDropHighlight.value = false
  }

  function onCartDrop(e: DragEvent) {
    e.preventDefault()
    cartDropHighlight.value = false
    draggingProductId.value = null

    const id = Number(e.dataTransfer?.getData('text/plain'))
    if (!id) return

    const product = products().find((p) => p.id === id)
    if (!product) return

    if (isSecondHand(product.product_type)) {
      onSecondHandDrop?.()
      return
    }

    if (product.stock_quantity <= 0) return
    onDropProduct(product)
  }

  return {
    cartDropHighlight,
    draggingProductId,
    onProductDragStart,
    onProductDragEnd,
    onCartDragOver,
    onCartDragLeave,
    onCartDrop,
  }
}
