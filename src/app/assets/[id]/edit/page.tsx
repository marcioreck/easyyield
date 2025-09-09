'use client'

import { useEffect, useState } from 'react'
import { use } from 'react'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

type AssetType = 
  | 'TESOURO_DIRETO'
  | 'POUPANCA'
  | 'CDB'
  | 'FII'
  | 'REIT'
  | 'ACAO_BR'
  | 'ACAO_US'
  | 'DEBENTURE'
  | 'RENDA_FIXA_DIGITAL'
  | 'STAKING_CRYPTO'
  | 'CRI'
  | 'FI_INFRA'
  | 'OUTROS'

const ASSET_TYPE_LABELS: Record<AssetType, string> = {
  TESOURO_DIRETO: 'Tesouro Direto',
  POUPANCA: 'Poupança',
  CDB: 'CDB',
  FII: 'FII',
  REIT: 'REIT',
  ACAO_BR: 'Ação BR',
  ACAO_US: 'Ação US',
  DEBENTURE: 'Debênture',
  RENDA_FIXA_DIGITAL: 'Renda Fixa Digital',
  STAKING_CRYPTO: 'Staking Crypto',
  CRI: 'CRI',
  FI_INFRA: 'FI-Infra',
  OUTROS: 'Outros'
}

interface FormData {
  ticker: string
  name: string
  type: AssetType
  currency: 'BRL' | 'USD'
  description: string
  indexador?: string
  taxa?: number
  vencimento?: string
  pagaJurosSemestrais?: boolean
}

export default function EditAssetPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const [formData, setFormData] = useState<FormData>({
    ticker: '',
    name: '',
    type: 'ACAO_BR',
    currency: 'BRL',
    description: ''
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAsset()
  }, [])

  const fetchAsset = async () => {
    try {
      const response = await fetch(`/api/assets/${resolvedParams.id}`)
      if (response.ok) {
        const data = await response.json()
        setFormData({
          ticker: data.ticker,
          name: data.name,
          type: data.type,
          currency: data.currency,
          description: data.description || '',
          indexador: data.indexador,
          taxa: data.taxa,
          vencimento: data.vencimento ? new Date(data.vencimento).toISOString().split('T')[0] : undefined,
          pagaJurosSemestrais: data.pagaJurosSemestrais || false
        })
      }
    } catch (error) {
      console.error('Erro ao buscar ativo:', error)
      alert('Erro ao buscar ativo')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const response = await fetch(`/api/assets/${resolvedParams.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        window.location.href = '/assets'
      } else {
        const data = await response.json()
        alert(data.error || 'Erro ao atualizar ativo')
      }
    } catch (error) {
      console.error('Erro:', error)
      alert('Erro ao atualizar ativo')
    }
  }

  if (loading) {
    return <div>Carregando...</div>
  }

  const showRendaFixaFields = ['TESOURO_DIRETO', 'CDB', 'DEBENTURE', 'CRI', 'FI_INFRA'].includes(formData.type)

  return (
    <div className="max-w-2xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Editar Ativo</h1>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block mb-1">Ticker</label>
          <input
            type="text"
            value={formData.ticker}
            onChange={(e) => setFormData({...formData, ticker: e.target.value})}
            className="w-full border p-2 rounded"
            required
          />
        </div>

        <div>
          <label className="block mb-1">Nome</label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({...formData, name: e.target.value})}
            className="w-full border p-2 rounded"
            required
          />
        </div>

        <div>
          <label className="block mb-1">Tipo</label>
          <select
            value={formData.type}
            onChange={(e) => setFormData({...formData, type: e.target.value as AssetType})}
            className="w-full border p-2 rounded"
            required
          >
            {Object.entries(ASSET_TYPE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block mb-1">Moeda</label>
          <select
            value={formData.currency}
            onChange={(e) => setFormData({...formData, currency: e.target.value as 'BRL' | 'USD'})}
            className="w-full border p-2 rounded"
            required
          >
            <option value="BRL">BRL</option>
            <option value="USD">USD</option>
          </select>
        </div>

        {showRendaFixaFields && (
          <>
            <div>
              <label className="block mb-1">Indexador</label>
              <select
                value={formData.indexador || ''}
                onChange={(e) => setFormData({...formData, indexador: e.target.value})}
                className="w-full border p-2 rounded"
              >
                <option value="">Selecione...</option>
                <option value="PRE">Prefixado</option>
                <option value="CDI">CDI</option>
                <option value="IPCA">IPCA</option>
                <option value="SELIC">SELIC</option>
              </select>
            </div>

            <div>
              <label className="block mb-1">Taxa (% a.a.)</label>
              <input
                type="number"
                step="0.01"
                value={formData.taxa || ''}
                onChange={(e) => setFormData({...formData, taxa: parseFloat(e.target.value)})}
                className="w-full border p-2 rounded"
                placeholder="Ex: 12.5"
              />
            </div>

            <div>
              <label className="block mb-1">Vencimento</label>
              <input
                type="date"
                value={formData.vencimento || ''}
                onChange={(e) => setFormData({...formData, vencimento: e.target.value})}
                className="w-full border p-2 rounded"
              />
            </div>

            <div>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={formData.pagaJurosSemestrais || false}
                  onChange={(e) => setFormData({...formData, pagaJurosSemestrais: e.target.checked})}
                  className="rounded"
                />
                <span>Paga juros semestrais (Janeiro e Julho)</span>
              </label>
              <p className="text-sm text-gray-600 mt-1">
                Marque esta opção se o título distribui juros a cada 6 meses
              </p>
            </div>
          </>
        )}

        <div>
          <label className="block mb-1">Descrição</label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({...formData, description: e.target.value})}
            className="w-full border p-2 rounded"
            rows={3}
          />
        </div>

        <div className="flex gap-2">
          <button
            type="submit"
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Salvar
          </button>
          <a
            href="/assets"
            className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
          >
            Cancelar
          </a>
        </div>
      </form>
    </div>
  )
}