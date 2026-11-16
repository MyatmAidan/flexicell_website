<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { Icon } from '@iconify/vue'

export interface SearchSelectOption {
  id: number
  label: string
}

const props = withDefaults(
  defineProps<{
    modelValue: number | string | ''
    options: SearchSelectOption[]
    placeholder?: string
    searchPlaceholder?: string
    emptyText?: string
  }>(),
  {
    placeholder: 'Select…',
    searchPlaceholder: 'Search…',
    emptyText: 'No data available',
  },
)

const emit = defineEmits<{
  'update:modelValue': [value: number | '']
}>()

const open = ref(false)
const query = ref('')
const triggerRef = ref<HTMLElement | null>(null)
const panelRef = ref<HTMLElement | null>(null)
const searchRef = ref<HTMLInputElement | null>(null)
const panelStyle = ref<Record<string, string>>({})

const selected = computed(
  () => props.options.find((o) => o.id === Number(props.modelValue)) ?? null,
)

const filtered = computed(() => {
  const q = query.value.trim().toLowerCase()
  if (!q) return props.options
  return props.options.filter((o) => o.label.toLowerCase().includes(q))
})

function positionPanel() {
  const trigger = triggerRef.value
  if (!trigger) return
  const rect = trigger.getBoundingClientRect()
  const width = Math.min(Math.max(rect.width, 280), window.innerWidth - 16)
  const left = Math.min(Math.max(8, rect.left), window.innerWidth - width - 8)
  const gap = 4
  const panelH = 280
  const spaceBelow = window.innerHeight - rect.bottom - 8
  const placeAbove = spaceBelow < 180 && rect.top > spaceBelow

  panelStyle.value = {
    position: 'fixed',
    left: `${left}px`,
    width: `${width}px`,
    zIndex: '400',
    ...(placeAbove
      ? { top: 'auto', bottom: `${window.innerHeight - rect.top + gap}px` }
      : { top: `${rect.bottom + gap}px`, bottom: 'auto' }),
    maxHeight: `${Math.min(panelH, placeAbove ? rect.top - 8 : spaceBelow)}px`,
  }
}

async function toggle() {
  if (open.value) {
    close()
    return
  }
  open.value = true
  query.value = ''
  await nextTick()
  positionPanel()
  searchRef.value?.focus()
}

function close() {
  open.value = false
  query.value = ''
}

function pick(id: number) {
  emit('update:modelValue', id)
  close()
}

function onDocumentPointerDown(e: MouseEvent) {
  const target = e.target as Node
  if (triggerRef.value?.contains(target) || panelRef.value?.contains(target)) return
  close()
}

function onReposition() {
  if (open.value) positionPanel()
}

watch(open, (isOpen) => {
  if (isOpen) void nextTick(positionPanel)
})

onMounted(() => {
  window.addEventListener('resize', onReposition)
  window.addEventListener('scroll', onReposition, true)
  document.addEventListener('mousedown', onDocumentPointerDown)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', onReposition)
  window.removeEventListener('scroll', onReposition, true)
  document.removeEventListener('mousedown', onDocumentPointerDown)
})
</script>

<template>
  <div class="search-select">
    <button
      ref="triggerRef"
      type="button"
      class="search-select-trigger"
      :class="{ open }"
      @click="toggle"
      @keydown.esc.prevent="close"
    >
      <span class="search-select-value" :class="{ placeholder: !selected }">
        {{ selected?.label || placeholder }}
      </span>
      <Icon icon="solar:alt-arrow-down-linear" class="search-select-caret" />
    </button>

    <Teleport to="body">
      <div
        v-if="open"
        ref="panelRef"
        class="search-select-panel"
        :style="panelStyle"
        @keydown.esc.prevent="close"
      >
        <div class="search-select-search">
          <Icon icon="solar:magnifer-linear" />
          <input
            ref="searchRef"
            v-model="query"
            type="text"
            :placeholder="searchPlaceholder"
            autocomplete="off"
          />
        </div>
        <ul class="search-select-list">
          <li v-if="!filtered.length" class="search-select-empty">{{ emptyText }}</li>
          <li v-for="option in filtered" :key="option.id">
            <button
              type="button"
              :class="{ active: option.id === Number(modelValue) }"
              @mousedown.prevent="pick(option.id)"
            >
              {{ option.label }}
            </button>
          </li>
        </ul>
      </div>
    </Teleport>
  </div>
</template>

<style scoped>
.search-select {
  width: 100%;
  min-width: 220px;
}
.search-select-trigger {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  width: 100%;
  padding: 0.5rem 0.75rem;
  border: 1px solid var(--fc-border);
  border-radius: 6px;
  background: var(--fc-surface);
  color: var(--fc-text);
  text-align: left;
  cursor: pointer;
  font-size: 0.8125rem;
  line-height: 1.3;
}
.search-select-trigger.open,
.search-select-trigger:focus {
  outline: none;
  border-color: var(--fc-red);
}
.search-select-value {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.search-select-value.placeholder {
  color: var(--fc-text-muted);
}
.search-select-caret {
  flex-shrink: 0;
  font-size: 1rem;
  color: var(--fc-text-muted);
}
.search-select-panel {
  display: flex;
  flex-direction: column;
  background: var(--fc-surface);
  border: 1px solid var(--fc-border);
  border-radius: 8px;
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.14);
  overflow: hidden;
}
.search-select-search {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  border-bottom: 1px solid var(--fc-border);
  color: var(--fc-text-muted);
  flex-shrink: 0;
}
.search-select-search input {
  width: 100%;
  border: none;
  outline: none;
  background: transparent;
  font-size: 0.8125rem;
}
.search-select-list {
  list-style: none;
  margin: 0;
  padding: 0.25rem 0;
  flex: 1;
  min-height: 0;
  max-height: 200px;
  overflow-y: auto;
}
.search-select-list button {
  display: block;
  width: 100%;
  text-align: left;
  padding: 0.45rem 0.75rem;
  border: none;
  background: none;
  cursor: pointer;
  font-size: 0.8125rem;
  line-height: 1.35;
  color: var(--fc-text);
}
.search-select-list button:hover,
.search-select-list button.active {
  background: var(--fc-bg);
}
.search-select-empty {
  padding: 0.75rem;
  font-size: 0.8125rem;
  color: var(--fc-text-muted);
}
</style>
