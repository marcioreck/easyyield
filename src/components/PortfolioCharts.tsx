'use client'

import { useEffect, useState } from 'react'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
} from 'chart.js'
import { Line, Pie } from 'react-chartjs-2'
import { formatCurrency } from '@/utils/format'

// Registrar componentes do Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
)

interface ChartData {
  labels: string[]
  datasets: {
    label: string
    data: number[]
    borderColor?: string
    backgroundColor?: string
  }[]
}

export function PortfolioCharts() {
  const [evolutionData, setEvolutionData] = useState<ChartData | null>(null)
  const [distributionData, setDistributionData] = useState<ChartData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchChartData()
  }, [])

  const fetchChartData = async () => {
    try {
      // Busca dados de evolução patrimonial
      const evolutionResponse = await fetch('/api/portfolio/evolution')
      const evolutionResult = await evolutionResponse.json()

      if (evolutionResult.success) {
        setEvolutionData({
          labels: evolutionResult.data.map((d: any) => d.date),
          datasets: [{
            label: 'Patrimônio Total',
            data: evolutionResult.data.map((d: any) => d.total),
            borderColor: 'rgb(75, 192, 192)',
            backgroundColor: 'rgba(75, 192, 192, 0.5)',
          }]
        })
      }

      // Busca dados de distribuição
      const distributionResponse = await fetch('/api/portfolio/distribution')
      const distributionResult = await distributionResponse.json()

      if (distributionResult.success) {
        const colors = [
          'rgb(255, 99, 132)',
          'rgb(54, 162, 235)',
          'rgb(255, 206, 86)',
          'rgb(75, 192, 192)',
          'rgb(153, 102, 255)',
          'rgb(255, 159, 64)',
        ]

        setDistributionData({
          labels: distributionResult.data.map((d: any) => d.type),
          datasets: [{
            label: 'Distribuição por Tipo',
            data: distributionResult.data.map((d: any) => d.total),
            backgroundColor: colors,
          }]
        })
      }
    } catch (error) {
      console.error('Error fetching chart data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div>Carregando gráficos...</div>
  }

  return (
    <div className="space-y-8">
      {evolutionData && (
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-lg font-medium mb-4">Evolução Patrimonial</h3>
          <div className="h-[300px]">
            <Line
              data={evolutionData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: 'top' as const,
                  },
                  tooltip: {
                    callbacks: {
                      label: function(context) {
                        return formatCurrency(context.parsed.y)
                      }
                    }
                  }
                },
                scales: {
                  y: {
                    ticks: {
                      callback: function(value) {
                        return formatCurrency(value as number)
                      }
                    }
                  }
                }
              }}
            />
          </div>
        </div>
      )}

      {distributionData && (
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-lg font-medium mb-4">Distribuição por Tipo</h3>
          <div className="h-[300px]">
            <Pie
              data={distributionData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: 'right' as const,
                  },
                  tooltip: {
                    callbacks: {
                      label: function(context) {
                        const value = context.parsed
                        const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0)
                        const percentage = ((value / total) * 100).toFixed(1)
                        return `${context.label}: ${formatCurrency(value)} (${percentage}%)`
                      }
                    }
                  }
                }
              }}
            />
          </div>
        </div>
      )}
    </div>
  )
}