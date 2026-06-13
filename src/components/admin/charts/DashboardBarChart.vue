<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { Chart, CHART_COLORS } from '@/utils/chartSetup'
import type { ChartConfiguration } from 'chart.js'

const props = defineProps<{
  labels: string[]
  data: number[]
}>()

const canvasRef = ref<HTMLCanvasElement>()
let chart: { destroy: () => void } | null = null

function renderChart() {
  if (!canvasRef.value) return

  chart?.destroy()

  const config: ChartConfiguration<'bar'> = {
    type: 'bar',
    data: {
      labels: props.labels,
      datasets: [
        {
          data: props.data,
          backgroundColor: CHART_COLORS.primary,
          borderColor: CHART_COLORS.primaryBorder,
          borderWidth: 1,
          borderRadius: 4,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      indexAxis: 'y',
      plugins: {
        legend: {
          display: false,
        },
      },
      scales: {
        x: {
          beginAtZero: true,
          ticks: {
            precision: 0,
          },
        },
      },
    },
  }

  chart = new Chart(canvasRef.value, config)
}

onMounted(renderChart)
watch(() => [props.labels, props.data], renderChart, { deep: true })
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
