// Componente para comparar performance com índices

'use client'

import { useEffect, useState } from 'react'
import { Line } from 'react-chartjs-2'
import { formatCurrency } from '@/utils/format'

interface BenchmarkData {
  date: string
  portfolio: number
  ipca: number
  cdi: number
  selic: number
  events?: string[]
}

export function PerformanceBenchmarkChart({ period = 'all' }: { period?: string }) {
  const [data, setData] = useState<BenchmarkData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchBenchmarkData()
  }, [period])

  const fetchBenchmarkData = async () => {
    try {
      setLoading(true)
      setError(null)

      // Buscar dados do portfólio
      const portfolioResponse = await fetch(`/api/portfolio/evolution?period=${period}`)
      const portfolioResult = await portfolioResponse.json()

      if (!portfolioResult.success) {
        throw new Error('Falha ao buscar dados do portfólio')
      }

      // Buscar dados de índices
      const benchmarkResponse = await fetch(`/api/portfolio/benchmarks?period=${period}`)
      const benchmarkResult = await benchmarkResponse.json()

      if (!benchmarkResult.success) {
        throw new Error('Falha ao buscar dados de benchmarks')
      }

      // Combinar dados - alinha as datas
      const portfolioData = portfolioResult.data
      const ipcaData = benchmarkResult.ipca
      const cdiData = benchmarkResult.cdi
      const selicData = benchmarkResult.selic

      // Cria um mapa de benchmarks por data aproximada
      const benchmarkMap = new Map()
      
      ipcaData.forEach((item: any, index: number) => {
        const key = `${index}`
        benchmarkMap.set(key, {
          ipca: item.value,
          cdi: cdiData[index]?.value || item.value,
          selic: selicData[index]?.value || item.value
        })
      })

      // Combina dados do portfólio com benchmarks
      const combinedData = portfolioData.map((point: any, index: number) => {
        const benchmarks = benchmarkMap.get(`${index}`) || { ipca: 10000, cdi: 10000, selic: 10000 }
        
        return {
          date: point.date,
          portfolio: point.total,
          ipca: benchmarks.ipca,
          cdi: benchmarks.cdi,
          selic: benchmarks.selic,
          events: point.events || []
        }
      })

      setData(combinedData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido')
      console.error('Error fetching benchmark data:', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="bg-white p-4 rounded-lg shadow">
        <h3 className="text-lg font-medium mb-4">Performance vs. Benchmarks</h3>
        <div className="animate-pulse h-[400px] bg-gray-200 rounded"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-white p-4 rounded-lg shadow">
        <h3 className="text-lg font-medium mb-4">Performance vs. Benchmarks</h3>
        <div className="text-red-600">Erro: {error}</div>
      </div>
    )
  }

  if (data.length === 0) {
    return (
      <div className="bg-white p-4 rounded-lg shadow">
        <h3 className="text-lg font-medium mb-4">Performance vs. Benchmarks</h3>
        <div className="text-gray-600">Nenhum dado disponível</div>
      </div>
    )
  }

  const chartData = {
    labels: data.map(d => new Date(d.date).toLocaleDateString('pt-BR', { 
      month: 'short', 
      year: '2-digit' 
    })),
    datasets: [
      {
        label: 'Seu Portfólio',
        data: data.map(d => d.portfolio),
        borderColor: 'rgb(255, 99, 132)',
        backgroundColor: 'rgba(255, 99, 132, 0.1)',
        tension: 0.1,
        borderWidth: 3
      },
      {
        label: 'IPCA Acumulado',
        data: data.map(d => d.ipca),
        borderColor: 'rgb(75, 192, 192)',
        backgroundColor: 'rgba(75, 192, 192, 0.1)',
        tension: 0.1,
        borderDash: [5, 5]
      },
      {
        label: 'CDI Acumulado', 
        data: data.map(d => d.cdi),
        borderColor: 'rgb(54, 162, 235)',
        backgroundColor: 'rgba(54, 162, 235, 0.1)',
        tension: 0.1,
        borderDash: [10, 5]
      },
      {
        label: 'SELIC Acumulado',
        data: data.map(d => d.selic),
        borderColor: 'rgb(153, 102, 255)',
        backgroundColor: 'rgba(153, 102, 255, 0.1)',
        tension: 0.1,
        borderDash: [3, 3]
      }
    ]
  }

  // Calcula performance relativa
  const finalPortfolio = data[data.length - 1]?.portfolio || 0
  const finalIPCA = data[data.length - 1]?.ipca || 10000
  const finalCDI = data[data.length - 1]?.cdi || 10000
  
  const vsIPCA = ((finalPortfolio / finalIPCA - 1) * 100).toFixed(1)
  const vsCDI = ((finalPortfolio / finalCDI - 1) * 100).toFixed(1)

  return (
    <div className="bg-white p-4 rounded-lg shadow">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium">Performance vs. Benchmarks</h3>
        <div className="text-sm text-gray-600">
          <span className={`mr-4 ${Number(vsIPCA) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            vs IPCA: {vsIPCA > 0 ? '+' : ''}{vsIPCA}%
          </span>
          <span className={Number(vsCDI) >= 0 ? 'text-green-600' : 'text-red-600'}>
            vs CDI: {vsCDI > 0 ? '+' : ''}{vsCDI}%
          </span>
        </div>
      </div>
      <div className="h-[400px]">
        <Line
          data={chartData}
          options={{
            responsive: true,
            maintainAspectRatio: false,
            scales: {
              y: {
                title: {
                  display: true,
                  text: 'Valor (R$)'
                },
                ticks: {
                  callback: function(value) {
                    return formatCurrency(value as number)
                  }
                }
              },
              x: {
                title: {
                  display: true,
                  text: 'Período'
                }
              }
            },
            plugins: {
              tooltip: {
                callbacks: {
                  label: function(context) {
                    const value = context.parsed.y
                    return `${context.dataset.label}: ${formatCurrency(value)}`
                  },
                  afterLabel: function(context) {
                    if (context.datasetIndex === 0) {
                      const point = data[context.dataIndex]
                      return point?.events?.length > 0 ? `Eventos: ${point.events.join(', ')}` : ''
                    }
                    return ''
                  }
                }
              },
              legend: {
                position: 'top' as const,
              }
            },
            interaction: {
              intersect: false,
              mode: 'index'
            }
          }}
        />
      </div>
      <div className="mt-4 text-sm text-gray-600">
        <p><strong>Nota:</strong> Dados simulados baseados em médias históricas. Em produção, integrar com API oficial do Banco Central.</p>
      </div>
    </div>
  )
}
