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
    backgroundColor?: string | string[]
    fill?: boolean
    tension?: number
    borderWidth?: number
  }[]
}

export function PortfolioCharts({ period = 'all' }: { period?: string }) {
  const [evolutionData, setEvolutionData] = useState<ChartData | null>(null)
  const [distributionData, setDistributionData] = useState<ChartData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchEvolutionData()
    fetchDistributionData()
  }, [period])

  const fetchEvolutionData = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/portfolio/evolution?period=${period}`)
      const data = await response.json()
      
      if (data.success && data.data) {
        // Extrair séries dos dados
        const labels = data.data.map((item: any) => {
          const date = new Date(item.date)
          return date.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' })
        })
        
        const assetValues = data.data.map((item: any) => item.assetValue || 0)
        const paymentsReceived = data.data.map((item: any) => item.paymentsReceived || 0)
        const totalValues = data.data.map((item: any) => item.total || 0)
        
        setEvolutionData({
          labels,
          datasets: [
            {
              label: 'Valor dos Ativos',
              data: assetValues,
              borderColor: 'rgb(75, 192, 192)',
              backgroundColor: 'rgba(75, 192, 192, 0.2)',
              fill: false,
              tension: 0.1
            },
            {
              label: 'Pagamentos Recebidos',
              data: paymentsReceived,
              borderColor: 'rgb(255, 99, 132)',
              backgroundColor: 'rgba(255, 99, 132, 0.2)',
              fill: false,
              tension: 0.1
            },
            {
              label: 'Total',
              data: totalValues,
              borderColor: 'rgb(54, 162, 235)',
              backgroundColor: 'rgba(54, 162, 235, 0.2)',
              fill: false,
              tension: 0.1,
              borderWidth: 3
            }
          ]
        })
        
        console.log('Dados de evolução carregados:', {
          points: data.data.length,
          assetRange: [Math.min(...assetValues), Math.max(...assetValues)],
          totalRange: [Math.min(...totalValues), Math.max(...totalValues)]
        })
      } else {
        console.error('Erro nos dados de evolução:', data)
      }
    } catch (error) {
      console.error('Error fetching evolution data:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchDistributionData = async () => {
    try {
      const response = await fetch('/api/portfolio')
      const data = await response.json()
      
      if (data.success && data.summary?.assetDistribution) {
        const distribution = data.summary.assetDistribution
        const labels = Object.keys(distribution)
        const values = Object.values(distribution) as number[]
        
        setDistributionData({
          labels,
          datasets: [
            {
              data: values,
              backgroundColor: [
                'rgba(255, 99, 132, 0.8)',
                'rgba(54, 162, 235, 0.8)',
                'rgba(255, 205, 86, 0.8)',
                'rgba(75, 192, 192, 0.8)',
                'rgba(153, 102, 255, 0.8)',
                'rgba(255, 159, 64, 0.8)'
              ],
              borderColor: [
                'rgba(255, 99, 132, 1)',
                'rgba(54, 162, 235, 1)',
                'rgba(255, 205, 86, 1)',
                'rgba(75, 192, 192, 1)',
                'rgba(153, 102, 255, 1)',
                'rgba(255, 159, 64, 1)'
              ],
              borderWidth: 1
            }
          ]
        })
      }
    } catch (error) {
      console.error('Error fetching distribution data:', error)
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