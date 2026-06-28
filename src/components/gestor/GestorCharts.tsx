'use client'

import {
  Chart as ChartJS,
  CategoryScale, LinearScale, BarElement,
  ArcElement, Tooltip, Legend,
} from 'chart.js'
import { Bar, Doughnut } from 'react-chartjs-2'

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend)

const fmt = (v: number) =>
  v >= 1_000_000 ? '$' + (v / 1_000_000).toFixed(1) + 'M' : '$' + (v / 1000).toFixed(0) + 'K'

interface MonthlyBarProps {
  labels: string[]
  ingData: number[]
  gasData: number[]
  dark: boolean
}

export function MonthlyBarChart({ labels, ingData, gasData, dark }: MonthlyBarProps) {
  const gridC = dark ? '#2c2c2a' : '#e8e7e2'
  const textC = '#898781'
  return (
    <Bar
      data={{
        labels,
        datasets: [
          { label: 'Ingresos', data: ingData, backgroundColor: '#2a78d6', borderRadius: 4 },
          { label: 'Gastos',   data: gasData, backgroundColor: '#e34948', borderRadius: 4 },
        ],
      }}
      options={{
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { grid: { display: false }, ticks: { color: textC, font: { size: 11 } } },
          y: {
            grid: { color: gridC },
            ticks: { color: textC, font: { size: 11 }, callback: v => fmt(Number(v)) },
          },
        },
      }}
    />
  )
}

interface DoughnutProps {
  labels: string[]
  data: number[]
  colors: string[]
  dark: boolean
}

export function DoughnutChart({ labels, data, colors, dark }: DoughnutProps) {
  const borderColor = dark ? '#1e1e1c' : '#fff'
  return (
    <Doughnut
      data={{
        labels,
        datasets: [{ data, backgroundColor: colors, borderWidth: 2, borderColor }],
      }}
      options={{
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
      }}
    />
  )
}
