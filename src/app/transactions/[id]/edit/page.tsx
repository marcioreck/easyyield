'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import { Asset } from '@prisma/client'
import { formatDate, parseUserCurrency, parseUserQuantity } from '@/utils/format'

interface Transaction {
  id: string
  date: string
  type: 'COMPRA' | 'VENDA'
  quantity: number
  price: number
  fees?: number | null
  notes?: string | null
  assetId: string
  asset: {
    ticker: string
    name: string
    currency: 'BRL' | 'USD'
  }
}

export default function EditTransactionPage({
  params
}: {
  params: Promise<{ id: string }>
}) {
  const router = useRouter()
  const resolvedParams = use(params)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [assets, setAssets] = useState<Asset[]>([])
  const [formData, setFormData] = useState({
    date: '',
    type: 'COMPRA',
    assetId: '',
    quantity: '',
    price: '',
    fees: '',
    notes: ''
  })

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Busca a lista de ativos
        const assetsResponse = await fetch('/api/assets')
        if (!assetsResponse.ok) throw new Error('Erro ao carregar ativos')
        const assetsData = await assetsResponse.json()
        setAssets(assetsData)

        // Busca os dados da transação
        const transactionResponse = await fetch(`/api/transactions/${resolvedParams.id}`)
        if (!transactionResponse.ok) throw new Error('Erro ao carregar operação')
        const transaction: Transaction = await transactionResponse.json()

        // Formata os dados para o formulário
        setFormData({
          date: formatDate(new Date(transaction.date)),
          type: transaction.type,
          assetId: transaction.assetId,
          quantity: transaction.quantity.toString().replace('.', ','),
          price: transaction.price.toString().replace('.', ','),
          fees: transaction.fees?.toString().replace('.', ',') || '',
          notes: transaction.notes || ''
        })
      } catch (error) {
        console.error('Error fetching data:', error)
        setError(error instanceof Error ? error.message : 'Erro ao carregar dados')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [resolvedParams.id])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    try {
      // Valida e converte os dados
      const data = {
        date: formData.date, // Mantém a data no formato DD/MM/YYYY para a API converter
        type: formData.type as 'COMPRA' | 'VENDA',
        assetId: formData.assetId,
        quantity: parseUserQuantity(formData.quantity),
        price: parseUserCurrency(formData.price),
        fees: formData.fees ? parseUserCurrency(formData.fees) : null,
        notes: formData.notes || null
      }

      const response = await fetch(`/api/transactions/${resolvedParams.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Erro ao atualizar operação')
      }

      router.push('/transactions')
    } catch (error) {
      console.error('Error updating transaction:', error)
      setError(error instanceof Error ? error.message : 'Erro ao atualizar operação')
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  if (loading) {
    return <div>Carregando...</div>
  }

  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
        {error}
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Editar Operação</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="date" className="block mb-1">
            Data
          </label>
          <input
            type="text"
            id="date"
            name="date"
            value={formData.date}
            onChange={handleInputChange}
            placeholder="DD/MM/YYYY"
            className="w-full border p-2 rounded"
            required
          />
        </div>

        <div>
          <label htmlFor="type" className="block mb-1">
            Tipo
          </label>
          <select
            id="type"
            name="type"
            value={formData.type}
            onChange={handleInputChange}
            className="w-full border p-2 rounded"
            required
          >
            <option value="COMPRA">Compra</option>
            <option value="VENDA">Venda</option>
          </select>
        </div>

        <div>
          <label htmlFor="assetId" className="block mb-1">
            Ativo
          </label>
          <select
            id="assetId"
            name="assetId"
            value={formData.assetId}
            onChange={handleInputChange}
            className="w-full border p-2 rounded"
            required
          >
            <option value="">Selecione um ativo</option>
            {assets.map(asset => (
              <option key={asset.id} value={asset.id}>
                {asset.ticker} - {asset.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="quantity" className="block mb-1">
            Quantidade
          </label>
          <input
            type="text"
            id="quantity"
            name="quantity"
            value={formData.quantity}
            onChange={handleInputChange}
            placeholder="0,00"
            className="w-full border p-2 rounded"
            required
          />
        </div>

        <div>
          <label htmlFor="price" className="block mb-1">
            Preço Unitário
          </label>
          <input
            type="text"
            id="price"
            name="price"
            value={formData.price}
            onChange={handleInputChange}
            placeholder="0,00"
            className="w-full border p-2 rounded"
            required
          />
        </div>

        <div>
          <label htmlFor="fees" className="block mb-1">
            Taxas
          </label>
          <input
            type="text"
            id="fees"
            name="fees"
            value={formData.fees}
            onChange={handleInputChange}
            placeholder="0,00"
            className="w-full border p-2 rounded"
          />
        </div>

        <div>
          <label htmlFor="notes" className="block mb-1">
            Observações
          </label>
          <textarea
            id="notes"
            name="notes"
            value={formData.notes}
            onChange={handleInputChange}
            className="w-full border p-2 rounded"
            rows={3}
          />
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        <div className="flex justify-between">
          <button
            type="button"
            onClick={() => router.push('/transactions')}
            className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Salvar
          </button>
        </div>
      </form>
    </div>
  )
}