<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { Chart } from '@/utils/chartSetup'
import type { ChartConfiguration } from 'chart.js'

const props = withDefaults(
  defineProps<{
    labels: string[]
    data: number[]
    colors?: string[]
    currency?: boolean
  }>(),
  {
    colors: () => ['#16a34a', '#f59e0b', '#dc2626', '#2563eb', '#0ea5e9'],
    currency: false,
  },
)

const canvasRef = ref<HTMLCanvasElement>()
let chart: { destroy: () => void } | null = null

function renderChart() {
  if (!canvasRef.value) return

  chart?.destroy()

  const config: ChartConfiguration<'doughnut'> = {
    type: 'doughnut',
    data: {
      labels: props.labels,
      datasets: [
        {
          data: props.data,
          backgroundColor: props.colors.slice(0, props.data.length),
          borderWidth: 1,
          hoverOffset: 6,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            padding: 16,
            usePointStyle: true,
          },
        },
        tooltip: {
          callbacks: props.currency
            ? {
                label(context) {
                  const value = context.parsed
                  const formatted = new Intl.NumberFormat('en-US', {
                    style: 'currency',
                    currency: 'MMK',
                    maximumFractionDigits: 0,
                  }).format(value)
                  return `${context.label}: ${formatted}`
                },
              }
            : undefined,
        },
      },
      cutout: '68%',
    },
  }

  chart = new Chart(canvasRef.value, config)
}

onMounted(renderChart)
watch(() => [props.labels, props.data, props.colors], renderChart, { deep: true })
onBeforeUnmount(() => {
  chart?.destroy()
  chart = null
})
</script>

<template>
  <div class="dashboard-chart-canvas dashboard-chart-canvas-sm">
    <canvas ref="canvasRef" />
  </div>
</template>
