<script setup lang="ts">
defineProps<{
  title: string
  value: string | number
  subtitle?: string
  growth?: number
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'danger'
}>()
</script>

<template>
  <div class="stat-card" :class="variant || 'default'">
    <div class="stat-title">{{ title }}</div>
    <div class="stat-value">{{ value }}</div>
    <div v-if="subtitle" class="stat-subtitle">{{ subtitle }}</div>
    <div v-if="growth !== undefined" class="stat-growth" :class="{ positive: growth >= 0, negative: growth < 0 }">
      {{ growth >= 0 ? '+' : '' }}{{ growth }}%
    </div>
  </div>
</template>
