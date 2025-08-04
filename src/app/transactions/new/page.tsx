'use client'

import { useState, useEffect } from 'react'
import { Asset } from '@prisma/client'
import { formatCurrency, formatDate, formatQuantity, parseQuantity, parseCurrency, parseDate } from '@/utils/format'

interface FormData {
  assetId: string
  type: 'COMPRA' | 'VENDA'
  date: string
  quantity: string
  price: string
  fees?: string
  notes?: string
}

export default function NewTransactionPage() {
  const [assets, setAssets] = useState<Asset[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState<FormData>({
    assetId: '',
    type: 'COMPRA',
    date: formatDate(new Date()),
    quantity: '',
    price: '',
    fees: '',
    notes: ''
  })

  useEffect(() => {
    const fetchAssets = async () => {
      try {
        const response = await fetch('/api/assets')
        if (response.ok) {
          const data = await response.json()
          setAssets(data)
          if (data.length > 0) {
            setFormData(prev => ({ ...prev, assetId: data[0].id }))
          }
        } else {
          throw new Error('Erro ao carregar ativos')
        }
      } catch (error) {
        console.error('Error fetching assets:', error)
        setError('Erro ao carregar lista de ativos')
      }
    }

    fetchAssets()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    try {
      setLoading(true)

      // Valida e converte os valores
      const data = {
        assetId: formData.assetId,
        type: formData.type,
        date: parseDate(formData.date),
        quantity: parseQuantity(formData.quantity),
        price: parseCurrency(formData.price),
        fees: formData.fees ? parseCurrency(formData.fees) : undefined,
        notes: formData.notes
      }

      // Se for venda, verifica quantidade disponível
      if (data.type === 'VENDA') {
        const response = await fetch(`/api/assets/${data.assetId}/available-quantity`)
        if (response.ok) {
          const { quantity: availableQuantity } = await response.json()
          if (data.quantity > availableQuantity) {
            throw new Error(`Quantidade insuficiente. Disponível: ${formatQuantity(availableQuantity)}`)
          }
        } else {
          throw new Error('Erro ao verificar quantidade disponível')
        }
      }

      // Envia a transação
      const response = await fetch('/api/transactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Erro ao criar transação')
      }

      // Redireciona para a lista de transações
      window.location.href = '/transactions'
    } catch (error) {
      console.error('Error creating transaction:', error)
      setError(error instanceof Error ? error.message : 'Erro ao criar transação')
    } finally {
      setLoading(false)
    }
  }

  const selectedAsset = assets.find(a => a.id === formData.assetId)

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Nova Operação</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block mb-1">Ativo</label>
          <select
            value={formData.assetId}
            onChange={(e) => setFormData({ ...formData, assetId: e.target.value })}
            className="w-full border p-2 rounded"
            required
          >
            {assets.map(asset => (
              <option key={asset.id} value={asset.id}>
                {asset.ticker} - {asset.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block mb-1">Tipo</label>
          <select
            value={formData.type}
            onChange={(e) => setFormData({ ...formData, type: e.target.value as 'COMPRA' | 'VENDA' })}
            className="w-full border p-2 rounded"
            required
          >
            <option value="COMPRA">Compra</option>
            <option value="VENDA">Venda</option>
          </select>
        </div>

        <div>
          <label className="block mb-1">Data</label>
          <input
            type="date"
            value={formData.date}
            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            max={formatDate(new Date(), 'yyyy-MM-dd')}
            className="w-full border p-2 rounded"
            required
          />
        </div>

        <div>
          <label className="block mb-1">Quantidade</label>
          <input
            type="text"
            value={formData.quantity}
            onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
            placeholder="0,00"
            className="w-full border p-2 rounded"
            required
          />
        </div>

        <div>
          <label className="block mb-1">
            Preço ({selectedAsset?.currency === 'USD' ? 'USD' : 'R$'})
          </label>
          <input
            type="text"
            value={formData.price}
            onChange={(e) => setFormData({ ...formData, price: e.target.value })}
            placeholder="0,00"
            className="w-full border p-2 rounded"
            required
          />
        </div>

        <div>
          <label className="block mb-1">
            Taxas ({selectedAsset?.currency === 'USD' ? 'USD' : 'R$'}) - Opcional
          </label>
          <input
            type="text"
            value={formData.fees}
            onChange={(e) => setFormData({ ...formData, fees: e.target.value })}
            placeholder="0,00"
            className="w-full border p-2 rounded"
          />
        </div>

        <div>
          <label className="block mb-1">Observações</label>
          <textarea
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            className="w-full border p-2 rounded"
            rows={3}
          />
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        <div className="flex gap-2">
          <button
            type="submit"
            disabled={loading}
            className={`bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 ${
              loading ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {loading ? 'Salvando...' : 'Salvar'}
          </button>
          <a
            href="/transactions"
            className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
          >
            Cancelar
          </a>
        </div>
      </form>
    </div>
  )
}