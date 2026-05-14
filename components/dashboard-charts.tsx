"use client"

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Tooltip,
  Filler,
  Legend,
} from "chart.js"
import { Bar, Doughnut, Line, Pie } from "react-chartjs-2"
import type { TimelineItem } from "@/lib/api"

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Tooltip,
  Filler,
  Legend,
)

const FONT_FAMILY =
  'var(--font-montserrat), -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'

// ─────────────────────────────────────────── Timeline (line)

export function TimelineChart({ data }: { data: TimelineItem[] }) {
  const labels = data.map((d) =>
    new Date(d.date).toLocaleDateString("ru-RU", { day: "numeric", month: "short" }),
  )
  const values = data.map((d) => d.count)

  return (
    <Line
      data={{
        labels,
        datasets: [
          {
            label: "Заявки",
            data: values,
            borderColor: "oklch(0.7 0.18 45)",
            backgroundColor: (ctx) => {
              const chart = ctx.chart
              const { ctx: c, chartArea } = chart
              if (!chartArea) return "oklch(0.7 0.18 45 / 0.2)"
              const gradient = c.createLinearGradient(0, chartArea.top, 0, chartArea.bottom)
              gradient.addColorStop(0, "oklch(0.7 0.18 45 / 0.4)")
              gradient.addColorStop(1, "oklch(0.7 0.18 45 / 0)")
              return gradient
            },
            fill: true,
            tension: 0.35,
            pointRadius: 3,
            pointHoverRadius: 5,
            pointBackgroundColor: "oklch(0.7 0.18 45)",
            pointBorderColor: "#fff",
            pointBorderWidth: 2,
            borderWidth: 2,
          },
        ],
      }}
      options={{
        responsive: true,
        maintainAspectRatio: false,
        interaction: { intersect: false, mode: "index" },
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: "rgba(15, 23, 42, 0.95)",
            titleFont: { family: FONT_FAMILY, weight: 600 },
            bodyFont: { family: FONT_FAMILY },
            padding: 10,
            cornerRadius: 8,
            displayColors: false,
            callbacks: { label: (i) => `${i.parsed.y} обращений` },
          },
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: { font: { family: FONT_FAMILY, size: 11 }, color: "#94a3b8" },
          },
          y: {
            beginAtZero: true,
            grid: { color: "rgba(148, 163, 184, 0.15)" },
            ticks: {
              font: { family: FONT_FAMILY, size: 11 },
              color: "#94a3b8",
              precision: 0,
            },
          },
        },
      }}
    />
  )
}

// ─────────────────────────────────────────── Status doughnut

interface StatusRow {
  label: string
  count: number
  color: string
}

const STATUS_COLOR_MAP: Record<string, string> = {
  "bg-blue-500": "#3b82f6",
  "bg-amber-500": "#f59e0b",
  "bg-emerald-500": "#10b981",
  "bg-slate-400": "#94a3b8",
}

function buildStatusChartData(rows: StatusRow[]) {
  return {
    labels: rows.map((r) => r.label),
    datasets: [
      {
        data: rows.map((r) => r.count),
        backgroundColor: rows.map((r) => STATUS_COLOR_MAP[r.color] ?? "#94a3b8"),
        borderColor: "#fff",
        borderWidth: 2,
        hoverOffset: 6,
      },
    ],
  }
}

function buildStatusOptions(rows: StatusRow[], total: number) {
  return {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "right" as const,
        labels: {
          font: { family: FONT_FAMILY, size: 12 },
          padding: 12,
          usePointStyle: true,
          pointStyle: "circle" as const,
          color: "#475569",
          generateLabels: (chart: ChartJS) => {
            const data = chart.data
            if (!data.labels?.length) return []
            return data.labels.map((label, i) => {
              const value = (data.datasets[0].data[i] as number) ?? 0
              const pct = total > 0 ? Math.round((value / total) * 100) : 0
              return {
                text: `${label} — ${value} (${pct}%)`,
                fillStyle: STATUS_COLOR_MAP[rows[i].color] ?? "#94a3b8",
                strokeStyle: "transparent",
                pointStyle: "circle" as const,
                index: i,
              }
            })
          },
        },
      },
      tooltip: {
        backgroundColor: "rgba(15, 23, 42, 0.95)",
        titleFont: { family: FONT_FAMILY, weight: 600 as const },
        bodyFont: { family: FONT_FAMILY },
        padding: 10,
        cornerRadius: 8,
        callbacks: {
          label: (i: { parsed: number }) => {
            const value = i.parsed
            const pct = total > 0 ? Math.round((value / total) * 100) : 0
            return ` ${value} (${pct}%)`
          },
        },
      },
    },
  }
}

export function StatusPie({ rows, total }: { rows: StatusRow[]; total: number }) {
  return <Pie data={buildStatusChartData(rows)} options={buildStatusOptions(rows, total)} />
}

export function StatusDoughnut({ rows, total }: { rows: StatusRow[]; total: number }) {
  return (
    <Doughnut
      data={{
        labels: rows.map((r) => r.label),
        datasets: [
          {
            data: rows.map((r) => r.count),
            backgroundColor: rows.map((r) => STATUS_COLOR_MAP[r.color] ?? "#94a3b8"),
            borderColor: "transparent",
            borderWidth: 0,
            hoverOffset: 6,
          },
        ],
      }}
      options={{
        responsive: true,
        maintainAspectRatio: false,
        cutout: "65%",
        plugins: {
          legend: {
            position: "right",
            labels: {
              font: { family: FONT_FAMILY, size: 12 },
              padding: 12,
              usePointStyle: true,
              pointStyle: "circle",
              color: "#475569",
              generateLabels: (chart) => {
                const data = chart.data
                if (!data.labels?.length) return []
                return data.labels.map((label, i) => {
                  const value = (data.datasets[0].data[i] as number) ?? 0
                  const pct = total > 0 ? Math.round((value / total) * 100) : 0
                  return {
                    text: `${label} — ${value} (${pct}%)`,
                    fillStyle: STATUS_COLOR_MAP[rows[i].color] ?? "#94a3b8",
                    strokeStyle: "transparent",
                    pointStyle: "circle",
                    index: i,
                  }
                })
              },
            },
          },
          tooltip: {
            backgroundColor: "rgba(15, 23, 42, 0.95)",
            titleFont: { family: FONT_FAMILY, weight: 600 },
            bodyFont: { family: FONT_FAMILY },
            padding: 10,
            cornerRadius: 8,
            callbacks: {
              label: (i) => {
                const value = i.parsed
                const pct = total > 0 ? Math.round((value / total) * 100) : 0
                return ` ${value} (${pct}%)`
              },
            },
          },
        },
      }}
    />
  )
}

// ─────────────────────────────────────────── Ratings bar

export function RatingsBar({ distribution }: { distribution: Record<string, number> }) {
  const labels = ["1 ★", "2 ★", "3 ★", "4 ★", "5 ★"]
  const values = [1, 2, 3, 4, 5].map((r) => distribution[String(r)] ?? 0)
  const max = Math.max(1, ...values)

  return (
    <Bar
      data={{
        labels,
        datasets: [
          {
            data: values,
            backgroundColor: "rgba(245, 158, 11, 0.85)",
            borderRadius: 6,
            barThickness: 22,
          },
        ],
      }}
      options={{
        responsive: true,
        maintainAspectRatio: false,
        indexAxis: "y",
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: "rgba(15, 23, 42, 0.95)",
            titleFont: { family: FONT_FAMILY, weight: 600 },
            bodyFont: { family: FONT_FAMILY },
            padding: 10,
            cornerRadius: 8,
            displayColors: false,
            callbacks: { label: (i) => `${i.parsed.x} оценок` },
          },
        },
        scales: {
          x: {
            beginAtZero: true,
            max,
            grid: { color: "rgba(148, 163, 184, 0.15)" },
            ticks: {
              font: { family: FONT_FAMILY, size: 11 },
              color: "#94a3b8",
              precision: 0,
            },
          },
          y: {
            grid: { display: false },
            ticks: { font: { family: FONT_FAMILY, size: 12 }, color: "#475569" },
          },
        },
      }}
    />
  )
}
