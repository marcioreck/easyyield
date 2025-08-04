'use client'

import { useState, useEffect } from 'react'
import { formatCurrency, formatPercent } from '@/utils/format'

interface PerformanceData {
  period: string
  initialValue: number
  finalValue: number
  absoluteReturn: number
  percentReturn: number
  contributions: number
  withdrawals: number
  dividends: number
  adjustedReturn: number
}

interface PerformanceReportProps {
  selectedTypes: string[]
  selectedPeriod: string
}

export function PerformanceReport({
  selectedTypes,
  selectedPeriod
}: PerformanceReportProps) {
  const [data, setData] = useState<PerformanceData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchPerformanceData()
  }, [selectedTypes, selectedPeriod])

  const fetchPerformanceData = async () => {
    try {
      setLoading(true)
      setError(null)

      const params = new URLSearchParams()
      if (selectedTypes.length > 0) {
        params.set('types', selectedTypes.join(','))
      }
      params.set('period', selectedPeriod)
      
      const response = await fetch(`/api/portfolio/performance?${params}`)
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Erro ao buscar dados de performance')
      }

      const result = await response.json()
      if (result.success) {
        setData(result.data)
      } else {
        throw new Error(result.error || 'Erro ao processar dados de performance')
      }
    } catch (error) {
      console.error('Error fetching performance data:', error)
      setError(error instanceof Error ? error.message : 'Erro ao buscar dados de performance')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="p-4 bg-gray-50 rounded space-y-2">
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                <div className="h-6 bg-gray-200 rounded w-3/4"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="text-red-600">
          <h3 className="text-lg font-medium mb-2">Erro ao carregar relatório</h3>
          <p>{error}</p>
          <button
            onClick={fetchPerformanceData}
            className="mt-2 text-sm text-blue-500 hover:underline"
          >
            Tentar novamente
          </button>
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="bg-white p-4 rounded-lg shadow">
        <p className="text-gray-500">Nenhum dado disponível</p>
      </div>
    )
  }

  return (
    <div className="bg-white p-4 rounded-lg shadow">
      <h3 className="text-lg font-medium mb-4">Relatório de Performance</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="p-4 bg-gray-50 rounded">
          <h4 className="text-sm text-gray-500">Valor Inicial</h4>
          <p className="text-lg font-medium">{formatCurrency(data.initialValue)}</p>
        </div>

        <div className="p-4 bg-gray-50 rounded">
          <h4 className="text-sm text-gray-500">Valor Final</h4>
          <p className="text-lg font-medium">{formatCurrency(data.finalValue)}</p>
        </div>

        <div className="p-4 bg-gray-50 rounded">
          <h4 className="text-sm text-gray-500">Retorno Total</h4>
          <p className={`text-lg font-medium ${
            data.percentReturn >= 0 ? 'text-green-600' : 'text-red-600'
          }`}>
            {formatPercent(data.percentReturn)}
          </p>
          <p className="text-sm text-gray-500">
            {formatCurrency(data.absoluteReturn)}
          </p>
        </div>

        <div className="p-4 bg-gray-50 rounded">
          <h4 className="text-sm text-gray-500">Aportes</h4>
          <p className="text-lg font-medium text-green-600">
            {formatCurrency(data.contributions)}
          </p>
        </div>

        <div className="p-4 bg-gray-50 rounded">
          <h4 className="text-sm text-gray-500">Retiradas</h4>
          <p className="text-lg font-medium text-red-600">
            {formatCurrency(data.withdrawals)}
          </p>
        </div>

        <div className="p-4 bg-gray-50 rounded">
          <h4 className="text-sm text-gray-500">Dividendos</h4>
          <p className="text-lg font-medium text-green-600">
            {formatCurrency(data.dividends)}
          </p>
        </div>

        <div className="p-4 bg-gray-50 rounded md:col-span-2 lg:col-span-3">
          <h4 className="text-sm text-gray-500">Retorno Ajustado</h4>
          <p className={`text-lg font-medium ${
            data.adjustedReturn >= 0 ? 'text-green-600' : 'text-red-600'
          }`}>
            {formatPercent(data.adjustedReturn)}
          </p>
          <p className="text-sm text-gray-500">
            Considera aportes, retiradas e dividendos
          </p>
        </div>
      </div>
    </div>
  )
}