<script setup lang="ts">
/** Decorative floating orbs — Flexicell brand, not copied from external sites */
const bubbles = [
  { size: 220, top: '8%', left: '-4%', delay: '0s', duration: '8s', opacity: 0.12 },
  { size: 140, top: '62%', left: '6%', delay: '-4s', duration: '7s', opacity: 0.1 },
  { size: 96, top: '18%', left: '72%', delay: '-2s', duration: '6s', opacity: 0.14 },
  { size: 180, top: '70%', left: '78%', delay: '-6s', duration: '10s', opacity: 0.09 },
  { size: 64, top: '42%', left: '88%', delay: '-1s', duration: '5s', opacity: 0.16 },
  { size: 48, top: '85%', left: '42%', delay: '-3s', duration: '6s', opacity: 0.11 },
  { size: 32, top: '28%', left: '48%', delay: '-5s', duration: '4s', opacity: 0.08 },
  { size: 120, top: '-6%', left: '38%', delay: '-7s', duration: '8s', opacity: 0.07 },
] as const
</script>

<template>
  <div class="sf-ambient" aria-hidden="true">
    <span
      v-for="(bubble, i) in bubbles"
      :key="i"
      class="sf-ambient-bubble"
      :style="{
        width: `${bubble.size}px`,
        height: `${bubble.size}px`,
        top: bubble.top,
        left: bubble.left,
        animationDelay: bubble.delay,
        animationDuration: bubble.duration,
        '--sf-bubble-opacity': bubble.opacity,
      }"
    />
  </div>
</template>
