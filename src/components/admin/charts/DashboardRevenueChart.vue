<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { Chart, CHART_COLORS, formatChartCurrency } from '@/utils/chartSetup'
import type { ChartConfiguration } from 'chart.js'

const props = defineProps<{
  labels: string[]
  revenue: number[]
  orders: number[]
}>()

const { t } = useI18n()
const canvasRef = ref<HTMLCanvasElement>()
let chart: { destroy: () => void } | null = null

function renderChart() {
  if (!canvasRef.value) return

  chart?.destroy()

  const config: ChartConfiguration = {
    type: 'bar',
    data: {
      labels: props.labels,
      datasets: [
        {
          label: t('dashboard.chartRevenueLabel'),
          data: props.revenue,
          backgroundColor: CHART_COLORS.primary,
          borderColor: CHART_COLORS.primaryBorder,
          borderWidth: 1,
          yAxisID: 'y',
          borderRadius: 4,
        },
        {
          label: t('dashboard.chartOrdersLabel'),
          data: props.orders,
          type: 'line',
          backgroundColor: CHART_COLORS.danger,
          borderColor: CHART_COLORS.dangerBorder,
          borderWidth: 2,
          yAxisID: 'y1',
          tension: 0.3,
          pointRadius: 4,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        mode: 'index',
        intersect: false,
      },
      plugins: {
        legend: {
          position: 'bottom',
        },
        tooltip: {
          callbacks: {
            label(context) {
              const label = context.dataset.label ?? ''
              const value = context.parsed.y ?? 0
              if (context.dataset.yAxisID === 'y') {
                return `${label}: ${formatChartCurrency(value)}`
              }
              return `${label}: ${value}`
            },
          },
        },
      },
      scales: {
        y: {
          type: 'linear',
          display: true,
          position: 'left',
          title: {
            display: true,
            text: t('dashboard.chartRevenueAxis'),
          },
          ticks: {
            callback: (value) => formatChartCurrency(Number(value)),
          },
        },
        y1: {
          type: 'linear',
          display: true,
          position: 'right',
          grid: {
            drawOnChartArea: false,
          },
          title: {
            display: true,
            text: t('dashboard.chartOrdersAxis'),
          },
        },
      },
    },
  }

  chart = new Chart(canvasRef.value, config)
}

onMounted(renderChart)
watch(() => [props.labels, props.revenue, props.orders], renderChart, { deep: true })
onBeforeUnmount(() => {
  chart?.destroy()
  chart = null
})
</script>

<template>
  <div class="dashboard-chart-canvas">
    <canvas ref="canvasRef" />
  </div>
</template>
