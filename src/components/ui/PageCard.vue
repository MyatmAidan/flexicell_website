<script setup lang="ts">
defineProps<{
  title: string
  subtitle?: string
}>()
</script>

<template>
  <div class="page-card">
    <div class="page-card-header">
      <div>
        <h1>{{ title }}</h1>
        <p v-if="subtitle">{{ subtitle }}</p>
      </div>
      <div v-if="$slots.actions" class="page-card-actions">
        <slot name="actions" />
      </div>
    </div>
    <div class="page-card-body">
      <slot />
    </div>
  </div>
</template>
