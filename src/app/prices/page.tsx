'use client'

import { useState, useEffect } from 'react'
import { Asset } from '@prisma/client'
import { formatCurrency, formatDate, parseDate, parseCurrency } from '@/utils/format'

interface Price {
  id: string
  date: Date
  price: number
  volume?: number
  assetId: string
}

interface FormData {
  assetId: string
  price: string
  date: string
  volume: string
}

export default function ManagePricesPage() {
  const [assets, setAssets] = useState<Asset[]>([])
  const [prices, setPrices] = useState<(Price & { asset: Asset })[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedAsset, setSelectedAsset] = useState<string>('')
  
  const [formData, setFormData] = useState<FormData>({
    assetId: '',
    price: '',
    date: formatDate(new Date()),
    volume: ''
  })

  // Carregar ativos
  useEffect(() => {
    const fetchAssets = async () => {
      try {
        const response = await fetch('/api/assets')
        if (response.ok) {
          const data = await response.json()
          setAssets(data)
          if (data.length > 0 && !formData.assetId) {
            setFormData(prev => ({ ...prev, assetId: data[0].id }))
            setSelectedAsset(data[0].id)
          }
        }
      } catch (error) {
        console.error('Error fetching assets:', error)
        setError('Erro ao carregar ativos')
      }
    }

    fetchAssets()
  }, [])

  // Carregar preços quando um ativo é selecionado
  useEffect(() => {
    if (selectedAsset) {
      fetchPricesForAsset(selectedAsset)
    }
  }, [selectedAsset])

  const fetchPricesForAsset = async (assetId: string) => {
    try {
      const response = await fetch(`/api/assets/${assetId}/prices`)
      if (response.ok) {
        const data = await response.json()
        setPrices(data)
      }
    } catch (error) {
      console.error('Error fetching prices:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const data = {
        assetId: formData.assetId,
        price: parseCurrency(formData.price),
        date: parseDate(formData.date).toISOString(),
        volume: formData.volume ? parseFloat(formData.volume) : 0
      }

      const response = await fetch('/api/add-price', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (response.ok) {
        setFormData({
          ...formData,
          price: '',
          volume: ''
        })
        fetchPricesForAsset(formData.assetId)
        alert('Preço adicionado com sucesso!')
      } else {
        const data = await response.json()
        setError(data.error || 'Erro ao adicionar preço')
      }
    } catch (error) {
      console.error('Erro:', error)
      setError('Erro ao adicionar preço')
    } finally {
      setLoading(false)
    }
  }

  const handleDeletePrice = async (priceId: string) => {
    if (!confirm('Tem certeza que deseja excluir este preço?')) return

    try {
      const response = await fetch(`/api/prices/${priceId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        fetchPricesForAsset(selectedAsset)
        alert('Preço excluído com sucesso!')
      } else {
        alert('Erro ao excluir preço')
      }
    } catch (error) {
      console.error('Error deleting price:', error)
      alert('Erro ao excluir preço')
    }
  }

  const selectedAssetData = assets.find(a => a.id === selectedAsset)

  return (
    <div className="max-w-6xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Gerenciar Preços</h1>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Formulário para adicionar preço */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">Adicionar Preço</h2>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block mb-1">Ativo</label>
              <select
                value={formData.assetId}
                onChange={(e) => {
                  setFormData({...formData, assetId: e.target.value})
                  setSelectedAsset(e.target.value)
                }}
                className="w-full border p-2 rounded"
                required
              >
                <option value="">Selecione um ativo...</option>
                {assets.map((asset) => (
                  <option key={asset.id} value={asset.id}>
                    {asset.ticker} - {asset.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block mb-1">Preço</label>
              <input
                type="text"
                value={formData.price}
                onChange={(e) => setFormData({...formData, price: e.target.value})}
                className="w-full border p-2 rounded"
                placeholder="Ex: 2.854,32"
                required
              />
            </div>

            <div>
              <label className="block mb-1">Data</label>
              <input
                type="text"
                value={formData.date}
                onChange={(e) => setFormData({...formData, date: e.target.value})}
                className="w-full border p-2 rounded"
                placeholder="DD/MM/YYYY"
                required
              />
            </div>

            <div>
              <label className="block mb-1">Volume (opcional)</label>
              <input
                type="number"
                value={formData.volume}
                onChange={(e) => setFormData({...formData, volume: e.target.value})}
                className="w-full border p-2 rounded"
                placeholder="0"
              />
            </div>

            <button
              type="submit"
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:bg-blue-300"
              disabled={loading}
            >
              {loading ? 'Adicionando...' : 'Adicionar Preço'}
            </button>
          </form>
        </div>

        {/* Lista de preços do ativo selecionado */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">
            Preços {selectedAssetData && `- ${selectedAssetData.ticker}`}
          </h2>
          
          {prices.length === 0 ? (
            <p className="text-gray-500">Nenhum preço cadastrado para este ativo.</p>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {prices
                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                .map((price) => (
                <div
                  key={price.id}
                  className="flex justify-between items-center p-3 border rounded"
                >
                  <div>
                    <div className="font-medium">
                      {formatCurrency(price.price, selectedAssetData?.currency)}
                    </div>
                    <div className="text-sm text-gray-500">
                      {formatDate(new Date(price.date))}
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeletePrice(price.id)}
                    className="text-red-500 hover:text-red-700 text-sm"
                  >
                    Excluir
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="mt-6">
        <a
          href="/assets"
          className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
        >
          Voltar para Ativos
        </a>
      </div>
    </div>
  )
}
