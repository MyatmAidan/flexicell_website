import { Chart, registerables } from 'chart.js'

Chart.register(...registerables)

export { Chart }

export const CHART_COLORS = {
  primary: 'rgba(37, 99, 235, 0.7)',
  primaryBorder: 'rgb(37, 99, 235)',
  danger: 'rgba(220, 38, 38, 0.7)',
  dangerBorder: 'rgb(220, 38, 38)',
  success: '#16a34a',
  warning: '#f59e0b',
  dangerSolid: '#dc2626',
  info: '#0ea5e9',
  muted: '#94a3b8',
}

export function formatChartCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'MMK',
    maximumFractionDigits: 0,
  }).format(value)
}
