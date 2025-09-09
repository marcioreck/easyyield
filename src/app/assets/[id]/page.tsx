'use client'

import { useState, useEffect } from 'react'
import { Asset, Transaction } from '@prisma/client'
import { formatCurrency, formatDate, formatPercent } from '@/utils/format'
import { calculateTreasuryIPCADividendYield, isTreasuryIPCA } from '@/services/treasuryCalculations'

interface AssetWithDetails extends Asset {
  transactions: Transaction[]
  prices: {
    id: string
    date: Date
    price: number
    volume?: number
  }[]
}

interface AssetPosition {
  asset: Asset
  quantity: number
  averagePrice: number
  totalCost: number
  currentPrice: number | null
  currentTotal: number | null
  absoluteReturn: number | null
  percentReturn: number | null
  lastDividendYield: number | null
}

export default function AssetDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const [asset, setAsset] = useState<AssetWithDetails | null>(null)
  const [position, setPosition] = useState<AssetPosition | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [resolvedParams, setResolvedParams] = useState<{ id: string } | null>(null)

  useEffect(() => {
    params.then(setResolvedParams)
  }, [params])

  useEffect(() => {
    if (resolvedParams) {
      fetchAssetDetails()
    }
  }, [resolvedParams])

  const fetchAssetDetails = async () => {
    if (!resolvedParams) return
    
    try {
      setLoading(true)
      
      // Buscar detalhes do ativo
      const assetResponse = await fetch(`/api/assets/${resolvedParams.id}`)
      if (!assetResponse.ok) {
        throw new Error('Ativo não encontrado')
      }
      const assetData = await assetResponse.json()
      
      // Buscar transações
      const transactionsResponse = await fetch(`/api/assets/${resolvedParams.id}/transactions`)
      const transactionsData = transactionsResponse.ok ? await transactionsResponse.json() : []
      
      // Buscar preços
      const pricesResponse = await fetch(`/api/assets/${resolvedParams.id}/prices`)
      const pricesData = pricesResponse.ok ? await pricesResponse.json() : []
      
      // Buscar posição calculada
      const positionResponse = await fetch(`/api/assets/${resolvedParams.id}/position`)
      const positionData = positionResponse.ok ? await positionResponse.json() : null

      setAsset({
        ...assetData,
        transactions: transactionsData,
        prices: pricesData
      })
      
      setPosition(positionData)
      
    } catch (error) {
      console.error('Error fetching asset details:', error)
      setError('Erro ao carregar detalhes do ativo')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="max-w-4xl mx-auto p-4">Carregando...</div>
  }

  if (error || !asset) {
    return (
      <div className="max-w-4xl mx-auto p-4">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error || 'Ativo não encontrado'}
        </div>
        <a href="/" className="text-blue-500 hover:underline mt-4 inline-block">
          ← Voltar ao Dashboard
        </a>
      </div>
    )
  }

  const isRendaFixa = ['TESOURO_DIRETO', 'CDB', 'DEBENTURE', 'CRI', 'FI_INFRA'].includes(asset.type)
  const latestPrice = asset.prices[0]
  
  // Cálculo específico de DY para Tesouro IPCA+
  let treasuryDY = null
  if (latestPrice && isTreasuryIPCA(asset)) {
    treasuryDY = calculateTreasuryIPCADividendYield(
      asset,
      latestPrice.price,
      new Date(latestPrice.date)
    )
  }

  return (
    <div className="max-w-4xl mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">{asset.ticker} - {asset.name}</h1>
        <div className="space-x-2">
          <a
            href={`/assets/${asset.id}/edit`}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Editar
          </a>
          <a
            href="/prices"
            className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
          >
            Gerenciar Preços
          </a>
        </div>
      </div>

      {/* Informações Básicas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">Informações do Ativo</h2>
          <div className="space-y-2">
            <div><strong>Ticker:</strong> {asset.ticker}</div>
            <div><strong>Nome:</strong> {asset.name}</div>
            <div><strong>Tipo:</strong> {asset.type}</div>
            <div><strong>Moeda:</strong> {asset.currency}</div>
            {asset.description && (
              <div><strong>Descrição:</strong> {asset.description}</div>
            )}
            
            {/* Campos específicos de renda fixa */}
            {isRendaFixa && (
              <>
                {asset.indexador && (
                  <div><strong>Indexador:</strong> {asset.indexador}</div>
                )}
                {asset.taxa && (
                  <div><strong>Taxa:</strong> {asset.taxa}% a.a.</div>
                )}
                {asset.vencimento && (
                  <div><strong>Vencimento:</strong> {formatDate(new Date(asset.vencimento))}</div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Posição Atual */}
        {position && (
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-lg font-semibold mb-4">Posição Atual</h2>
            <div className="space-y-2">
              <div><strong>Quantidade:</strong> {position.quantity.toLocaleString('pt-BR', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 6
              })}</div>
              <div><strong>Preço Médio:</strong> {formatCurrency(position.averagePrice, asset.currency)}</div>
              <div><strong>Total Investido:</strong> {formatCurrency(position.totalCost, asset.currency)}</div>
              
              {position.currentPrice && (
                <>
                  <div><strong>Preço Atual:</strong> {formatCurrency(position.currentPrice, asset.currency)}</div>
                  <div><strong>Valor Atual:</strong> {formatCurrency(position.currentTotal!, asset.currency)}</div>
                  <div className={`${position.percentReturn! >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    <strong>Retorno:</strong> {formatPercent(position.percentReturn!)} 
                    ({formatCurrency(position.absoluteReturn!, asset.currency)})
                  </div>
                </>
              )}
              
              {/* Dividend Yield */}
              {position.lastDividendYield && (
                <div><strong>Dividend Yield:</strong> {formatPercent(position.lastDividendYield)}</div>
              )}
              
              {/* DY específico para Tesouro IPCA+ */}
              {treasuryDY && (
                <div className="bg-blue-50 p-3 rounded mt-4">
                  <strong>DY Tesouro IPCA+:</strong> {treasuryDY.toFixed(2)}% a.a.
                  <div className="text-sm text-gray-600 mt-1">
                    Taxa Real: {asset.taxa}% + IPCA: ~4.5% = ~{treasuryDY.toFixed(2)}%
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Últimos Preços */}
      {asset.prices.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <h2 className="text-lg font-semibold mb-4">Últimos Preços</h2>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border p-2 text-left">Data</th>
                  <th className="border p-2 text-right">Preço</th>
                  <th className="border p-2 text-right">Volume</th>
                </tr>
              </thead>
              <tbody>
                {asset.prices.slice(0, 10).map((price) => (
                  <tr key={price.id}>
                    <td className="border p-2">{formatDate(new Date(price.date))}</td>
                    <td className="border p-2 text-right">
                      {formatCurrency(price.price, asset.currency)}
                    </td>
                    <td className="border p-2 text-right">
                      {price.volume || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Transações */}
      {asset.transactions.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">Histórico de Transações</h2>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border p-2 text-left">Data</th>
                  <th className="border p-2 text-left">Tipo</th>
                  <th className="border p-2 text-right">Quantidade</th>
                  <th className="border p-2 text-right">Preço</th>
                  <th className="border p-2 text-right">Total</th>
                  <th className="border p-2 text-left">Observações</th>
                </tr>
              </thead>
              <tbody>
                {asset.transactions
                  .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                  .map((transaction) => (
                  <tr key={transaction.id}>
                    <td className="border p-2">{formatDate(new Date(transaction.date))}</td>
                    <td className={`border p-2 ${
                      transaction.type === 'COMPRA' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {transaction.type}
                    </td>
                    <td className="border p-2 text-right">
                      {transaction.quantity.toLocaleString('pt-BR', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 6
                      })}
                    </td>
                    <td className="border p-2 text-right">
                      {formatCurrency(transaction.price, asset.currency)}
                    </td>
                    <td className="border p-2 text-right">
                      {formatCurrency(transaction.quantity * transaction.price, asset.currency)}
                    </td>
                    <td className="border p-2">{transaction.notes || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="mt-6">
        <a
          href="/"
          className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
        >
          ← Voltar ao Dashboard
        </a>
      </div>
    </div>
  )
}
