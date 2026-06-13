<script setup lang="ts">
import Cropper from 'cropperjs'
import 'cropperjs/dist/cropper.css'
import { nextTick, onBeforeUnmount, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import Modal from '@/components/ui/Modal.vue'

const props = defineProps<{
  show: boolean
  src: string
  aspectRatio?: number
  outputWidth?: number
  outputHeight?: number
}>()

const emit = defineEmits<{ confirm: [blob: Blob]; close: [] }>()

const { t } = useI18n()
const imgRef = ref<HTMLImageElement>()
let cropper: Cropper | null = null

watch(
  () => props.show,
  async (open) => {
    if (open) {
      await nextTick()
      if (!imgRef.value) return
      cropper?.destroy()
      cropper = new Cropper(imgRef.value, {
        aspectRatio: props.aspectRatio ?? 1,
        viewMode: 1,
        autoCropArea: 1,
      })
      return
    }
    cropper?.destroy()
    cropper = null
  },
)

onBeforeUnmount(() => {
  cropper?.destroy()
  cropper = null
})

function applyCrop() {
  if (!cropper) return
  const canvas = cropper.getCroppedCanvas({
    width: props.outputWidth ?? 600,
    height: props.outputHeight ?? 600,
  })
  canvas.toBlob(
    (blob) => {
      if (blob) emit('confirm', blob)
    },
    'image/jpeg',
    0.92,
  )
}
</script>

<template>
  <Modal
    :show="show"
    :title="t('common.cropImage')"
    size="lg"
    @close="emit('close')"
  >
    <div class="image-cropper-wrap">
      <img ref="imgRef" :src="src" alt="" class="image-cropper-target" />
    </div>
    <template #footer>
      <button type="button" class="btn btn-outline" @click="emit('close')">
        {{ t('common.cancel') }}
      </button>
      <button type="button" class="btn btn-primary" @click="applyCrop">
        {{ t('common.applyCrop') }}
      </button>
    </template>
  </Modal>
</template>

<style scoped>
.image-cropper-wrap {
  max-height: 60vh;
  overflow: hidden;
  background: var(--surface-muted, #f3f4f6);
}

.image-cropper-target {
  display: block;
  max-width: 100%;
}
</style>
