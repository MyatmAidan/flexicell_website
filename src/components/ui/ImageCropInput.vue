<script setup lang="ts">
import { useImageCropper } from '@/composables/useImageCropper'
import ImageCropperModal from '@/components/ui/ImageCropperModal.vue'

const props = withDefaults(
  defineProps<{
    multiple?: boolean
    aspectRatio?: number
    outputWidth?: number
    outputHeight?: number
  }>(),
  {
    multiple: false,
    aspectRatio: 1,
    outputWidth: 600,
    outputHeight: 600,
  },
)

const emit = defineEmits<{ select: [files: File[]] }>()

const {
  showCropper,
  cropSrc,
  aspectRatio,
  outputWidth,
  outputHeight,
  cropFilesFromEvent,
  onCropConfirm,
  onCropCancel,
} = useImageCropper({
  aspectRatio: props.aspectRatio,
  outputWidth: props.outputWidth,
  outputHeight: props.outputHeight,
})

async function onChange(e: Event) {
  const files = await cropFilesFromEvent(e, props.multiple)
  if (files.length) emit('select', files)
}
</script>

<template>
  <input
    type="file"
    accept="image/*"
    :multiple="multiple"
    v-bind="$attrs"
    @change="onChange"
  />
  <ImageCropperModal
    :show="showCropper"
    :src="cropSrc"
    :aspect-ratio="aspectRatio"
    :output-width="outputWidth"
    :output-height="outputHeight"
    @confirm="onCropConfirm"
    @close="onCropCancel"
  />
</template>
