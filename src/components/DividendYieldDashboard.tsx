'use client'

import { useEffect, useState } from 'react'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js'
import { Bar } from 'react-chartjs-2'
import { formatPercent } from '@/utils/format'

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend)

interface DyMetricRow {
  assetId: string
  ticker: string
  type: string
  currency: string
  dyMonthly: number | null
  dyAccumulated: number | null
  dyAnnual: number | null
  dividendsInPeriod: number
  currentValue: number | null
}

interface DyMetricsData {
  period: string
  metrics: DyMetricRow[]
}

export function DividendYieldDashboard({ period }: { period: string }) {
  const [data, setData] = useState<DyMetricsData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    fetch(`/api/portfolio/dy-metrics?period=${period}`)
      .then((res) => res.json())
      .then((json) => {
        if (!cancelled) setData(json)
      })
      .catch(() => {
        if (!cancelled) setData(null)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [period])

  if (loading) {
    return (
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Dividend Yield (comparativo)
        </h3>
        <p className="text-gray-500">Carregando...</p>
      </div>
    )
  }

  if (!data?.metrics?.length) {
    return (
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Dividend Yield (comparativo)
        </h3>
        <p className="text-gray-500">Nenhum ativo com dados de DY no período.</p>
      </div>
    )
  }

  const filtered = data.metrics.filter(
    (m) => m.dyMonthly != null || m.dyAccumulated != null || m.dyAnnual != null
  )
  const chartLabels = filtered.slice(0, 20).map((m) => m.ticker)
  const chartData = {
    labels: chartLabels,
    datasets: [
      {
        label: 'DY mensal (%)',
        data: filtered.slice(0, 20).map((m) => m.dyMonthly ?? 0),
        backgroundColor: 'rgba(59, 130, 246, 0.6)'
      },
      {
        label: 'DY acumulado período (%)',
        data: filtered.slice(0, 20).map((m) => m.dyAccumulated ?? 0),
        backgroundColor: 'rgba(34, 197, 94, 0.6)'
      },
      {
        label: 'DY anual (%)',
        data: filtered.slice(0, 20).map((m) => m.dyAnnual ?? 0),
        backgroundColor: 'rgba(168, 85, 247, 0.6)'
      }
    ]
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow space-y-4">
      <h3 className="text-lg font-medium text-gray-900">
        Dividend Yield (comparativo)
      </h3>
      <p className="text-sm text-gray-500">
        DY mensal (último mês), acumulado no período e anual (últimos 12 meses).
      </p>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="bg-gray-100">
              <th className="border p-2 text-left">Ativo</th>
              <th className="border p-2 text-left">Tipo</th>
              <th className="border p-2 text-right">DY mensal</th>
              <th className="border p-2 text-right">DY acumulado</th>
              <th className="border p-2 text-right">DY anual</th>
            </tr>
          </thead>
          <tbody>
            {data.metrics.map((m) => (
              <tr key={m.assetId}>
                <td className="border p-2">
                  <a
                    href={`/assets/${m.assetId}`}
                    className="text-blue-600 hover:underline"
                  >
                    {m.ticker}
                  </a>
                </td>
                <td className="border p-2">{m.type}</td>
                <td className="border p-2 text-right">
                  {m.dyMonthly != null ? formatPercent(m.dyMonthly) : '-'}
                </td>
                <td className="border p-2 text-right">
                  {m.dyAccumulated != null ? formatPercent(m.dyAccumulated) : '-'}
                </td>
                <td className="border p-2 text-right">
                  {m.dyAnnual != null ? formatPercent(m.dyAnnual) : '-'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {chartLabels.length > 0 && (
        <div className="h-64">
          <Bar
            data={chartData}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: { position: 'top' },
                title: { display: true, text: 'DY por ativo (até 20)' }
              },
              scales: {
                y: { beginAtZero: true }
              }
            }}
          />
        </div>
      )}
    </div>
  )
}
