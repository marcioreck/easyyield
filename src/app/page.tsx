'use client'

import { useEffect, useState } from 'react'
import { AssetType } from '@prisma/client'
import { Card } from '@/components/Card'
import { PortfolioCharts } from '@/components/PortfolioCharts'
import { PortfolioFilters } from '@/components/PortfolioFilters'
import { PerformanceReport } from '@/components/PerformanceReport'
import { ImportTransactions } from '@/components/ImportTransactions'
import { AssetPosition } from '@/services/calculations'
import { formatCurrency, formatPercent } from '@/utils/format'

interface PortfolioSummary {
  totalInvested: number
  currentTotal: number
  absoluteReturn: number
  percentReturn: number
  positions: AssetPosition[]
}

export default function Home() {
  const [summary, setSummary] = useState<PortfolioSummary | null>(null)
  const [selectedTypes, setSelectedTypes] = useState<AssetType[]>([])
  const [selectedPeriod, setSelectedPeriod] = useState('1y')
  const [showImport, setShowImport] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchSummary()
  }, [selectedTypes, selectedPeriod])

  const fetchSummary = async () => {
    try {
      const params = new URLSearchParams({
        types: selectedTypes.join(','),
        period: selectedPeriod
      })
      
      const response = await fetch(`/api/portfolio/summary?${params}`)
      if (response.ok) {
        const data = await response.json()
        setSummary(data)
      }
    } catch (error) {
      console.error('Erro ao buscar resumo:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="text-center py-8">Carregando...</div>
  }

  if (!summary) {
    return <div className="text-center py-8">Erro ao carregar dados</div>
  }

  // Filtrar ativos com pagamentos semestrais
  const semiannualAssets = summary.positions.filter(p => 
    p.asset.type === 'TESOURO_DIRETO' && (p.asset as any).pagaJurosSemestrais
  )

  const getNextSemiannualDates = () => {
    const currentDate = new Date()
    const currentYear = currentDate.getFullYear()
    const january = new Date(currentYear, 0, 15)
    const july = new Date(currentYear, 6, 15)
    const nextJanuary = new Date(currentYear + 1, 0, 15)

    if (currentDate < january) {
      return [january, july]
    } else if (currentDate < july) {
      return [july, nextJanuary]
    } else {
      return [nextJanuary, new Date(currentYear + 1, 6, 15)]
    }
  }

  return (
    <div className="space-y-6">
      <div className="md:flex md:items-center md:justify-between">
        <div className="min-w-0 flex-1">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
            Dashboard
          </h2>
        </div>
        <div className="mt-4 flex md:ml-4 md:mt-0">
          <button
            onClick={() => setShowImport(!showImport)}
            className="ml-3 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
          >
            Importar Operações
          </button>
        </div>
      </div>

      {showImport && (
        <div className="bg-white shadow sm:rounded-lg p-4">
          <ImportTransactions
            onComplete={() => {
              setShowImport(false)
              fetchSummary()
            }}
          />
        </div>
      )}

      <PortfolioFilters
        selectedTypes={selectedTypes}
        selectedPeriod={selectedPeriod}
        onTypeChange={setSelectedTypes}
        onPeriodChange={setSelectedPeriod}
      />

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <Card
          title="Patrimônio Total"
          value={formatCurrency(summary.currentTotal)}
          change={formatPercent(summary.percentReturn)}
          changeType={summary.percentReturn >= 0 ? 'increase' : 'decrease'}
        />
        <Card
          title="Total Investido"
          value={formatCurrency(summary.totalInvested)}
          change={formatCurrency(summary.absoluteReturn)}
          changeType={summary.absoluteReturn >= 0 ? 'increase' : 'decrease'}
        />
        <Card
          title="Retorno Total"
          value={formatPercent(summary.percentReturn)}
          change={formatCurrency(summary.absoluteReturn)}
          changeType={summary.percentReturn >= 0 ? 'increase' : 'decrease'}
        />
      </div>

      <PerformanceReport
        selectedTypes={selectedTypes}
        selectedPeriod={selectedPeriod}
      />

      {/* Seção de Próximos Pagamentos */}
      {semiannualAssets.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow mb-8">
          <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">
            📅 Próximos Pagamentos Semestrais
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">Próximas Datas</h4>
              {getNextSemiannualDates().map((date, index) => (
                <div key={index} className="text-sm text-blue-700">
                  {date.toLocaleDateString('pt-BR', { 
                    day: '2-digit', 
                    month: 'long', 
                    year: 'numeric' 
                  })}
                </div>
              ))}
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <h4 className="font-medium text-green-900 mb-2">Ativos Participantes</h4>
              {semiannualAssets.map(position => (
                <div key={position.asset.id} className="text-sm text-green-700 mb-1">
                  <a 
                    href={`/assets/${position.asset.id}`} 
                    className="hover:underline"
                  >
                    {position.asset.ticker}
                  </a>
                  <span className="text-gray-600 ml-2">
                    ({formatCurrency(position.currentTotal!, position.asset.currency)})
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <PortfolioCharts period={selectedPeriod} />

      <div className="mt-8">
        <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">
          Posição por Ativo
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-100">
                <th className="border p-2 text-left">Ativo</th>
                <th className="border p-2 text-left">Tipo</th>
                <th className="border p-2 text-center">Pagamentos</th>
                <th className="border p-2 text-right">Quantidade</th>
                <th className="border p-2 text-right">Preço Médio</th>
                <th className="border p-2 text-right">Preço Atual</th>
                <th className="border p-2 text-right">Total</th>
                <th className="border p-2 text-right">Retorno</th>
                <th className="border p-2 text-right">DY</th>
              </tr>
            </thead>
            <tbody>
              {summary.positions
                .filter(position => 
                  selectedTypes.length === 0 || selectedTypes.includes(position.asset.type)
                )
                .map((position) => (
                  <tr key={position.asset.id}>
                    <td className="border p-2">
                      <a 
                        href={`/assets/${position.asset.id}`}
                        className="text-blue-500 hover:underline"
                      >
                        {position.asset.ticker}
                      </a>
                    </td>
                    <td className="border p-2">{position.asset.type}</td>
                    <td className="border p-2 text-center">
                      {position.asset.type === 'TESOURO_DIRETO' && (position.asset as any).pagaJurosSemestrais ? (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
                          <span className="w-2 h-2 bg-green-500 rounded-full mr-1"></span>
                          Semestral
                        </span>
                      ) : ['TESOURO_DIRETO', 'CDB', 'DEBENTURE', 'CRI', 'FI_INFRA'].includes(position.asset.type) ? (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-600">
                          <span className="w-2 h-2 bg-gray-400 rounded-full mr-1"></span>
                          Vencimento
                        </span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="border p-2 text-right">
                      {position.quantity.toLocaleString('pt-BR', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 6
                      })}
                    </td>
                    <td className="border p-2 text-right">
                      {formatCurrency(position.averagePrice, position.asset.currency)}
                    </td>
                    <td className="border p-2 text-right">
                      {position.currentPrice 
                        ? formatCurrency(position.currentPrice, position.asset.currency)
                        : '-'
                      }
                    </td>
                    <td className="border p-2 text-right">
                      {position.currentTotal 
                        ? formatCurrency(position.currentTotal, position.asset.currency)
                        : '-'
                      }
                    </td>
                    <td className={`border p-2 text-right ${
                      position.percentReturn && position.percentReturn >= 0 
                        ? 'text-green-600' 
                        : 'text-red-600'
                    }`}>
                      {position.percentReturn 
                        ? `${formatPercent(position.percentReturn)} (${
                            formatCurrency(position.absoluteReturn!, position.asset.currency)
                          })`
                        : '-'
                      }
                    </td>
                    <td className="border p-2 text-right">
                      {position.lastDividendYield 
                        ? formatPercent(position.lastDividendYield)
                        : '-'
                      }
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}