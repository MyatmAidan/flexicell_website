<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { Icon } from '@iconify/vue'

const props = defineProps<{
  canExport?: boolean
  canImport?: boolean
}>()

const emit = defineEmits<{
  export: []
  template: []
  import: [file: File]
}>()

const { t } = useI18n()
const fileInput = ref<HTMLInputElement | null>(null)

function onFileChange(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (file) emit('import', file)
  if (fileInput.value) fileInput.value.value = ''
}
</script>

<template>
  <div class="excel-toolbar">
    <button v-if="canExport" type="button" class="btn btn-sm btn-outline" @click="emit('export')">
      <Icon icon="solar:export-linear" /> {{ t('common.export') }}
    </button>
    <button v-if="canImport" type="button" class="btn btn-sm btn-outline" @click="emit('template')">
      <Icon icon="solar:document-add-linear" /> {{ t('common.template') }}
    </button>
    <label v-if="canImport" class="btn btn-sm btn-outline import-btn">
      <Icon icon="solar:import-linear" /> {{ t('common.import') }}
      <input ref="fileInput" type="file" accept=".xlsx,.xls,.csv" hidden @change="onFileChange" />
    </label>
  </div>
</template>
