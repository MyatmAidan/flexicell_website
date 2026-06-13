<script setup lang="ts">
import { Icon } from '@iconify/vue'

const colors = ['#E0E0E0', '#F44336', '#E91E63', '#FF9800', '#FFEB3B', '#4CAF50', '#2196F3', '#9C27B0']

const model = defineModel<string>({ default: '' })
</script>

<template>
  <div class="color-picker">
    <button
      v-for="color in colors"
      :key="color"
      type="button"
      class="color-option"
      :class="{ selected: model === color }"
      :style="{ backgroundColor: color }"
      :title="color"
      @click="model = color"
    >
      <Icon v-if="model === color" icon="solar:check-circle-bold" class="color-check" />
    </button>
  </div>
</template>

<style scoped>
.color-picker {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.color-option {
  width: 40px;
  height: 40px;
  border-radius: 4px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 2px solid rgba(0, 0, 0, 0.08);
  padding: 0;
  transition: transform 0.15s, box-shadow 0.15s;
}

.color-option:hover {
  transform: scale(1.05);
}

.color-option.selected {
  transform: scale(1.1);
  box-shadow: 0 0 5px rgba(0, 0, 0, 0.25);
  border-color: rgba(0, 0, 0, 0.2);
}

.color-check {
  font-size: 1.125rem;
  color: #fff;
  filter: drop-shadow(0 0 2px rgba(0, 0, 0, 0.85));
}
</style>
