'use client'

import { useState, useEffect } from 'react'
import { Asset, Transaction } from '@prisma/client'

export default function EditTransactionPage({ params }: { params: { id: string } }) {
  const [assets, setAssets] = useState<Asset[]>([])
  const [formData, setFormData] = useState({
    assetId: '',
    type: 'COMPRA',
    date: new Date().toISOString().split('T')[0],
    quantity: '',
    price: '',
    fees: '',
    notes: ''
  })

  useEffect(() => {
    fetchAssets()
    fetchTransaction()
  }, [])

  const fetchAssets = async () => {
    try {
      const response = await fetch('/api/assets')
      if (response.ok) {
        const data = await response.json()
        setAssets(data)
      }
    } catch (error) {
      console.error('Erro ao buscar ativos:', error)
    }
  }

  const fetchTransaction = async () => {
    try {
      const response = await fetch(`/api/transactions/${params.id}`)
      if (response.ok) {
        const data = await response.json()
        setFormData({
          assetId: data.assetId,
          type: data.type,
          date: new Date(data.date).toISOString().split('T')[0],
          quantity: data.quantity.toString(),
          price: data.price.toString(),
          fees: data.fees?.toString() || '',
          notes: data.notes || ''
        })
      }
    } catch (error) {
      console.error('Erro ao buscar operação:', error)
      alert('Erro ao buscar operação')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const response = await fetch(`/api/transactions/${params.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          quantity: Number(formData.quantity),
          price: Number(formData.price),
          fees: formData.fees ? Number(formData.fees) : null
        }),
      })

      if (response.ok) {
        window.location.href = '/transactions'
      } else {
        alert('Erro ao atualizar operação')
      }
    } catch (error) {
      console.error('Erro:', error)
      alert('Erro ao atualizar operação')
    }
  }

  return (
    <div className="max-w-2xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Editar Operação</h1>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block mb-1">Ativo</label>
          <select
            value={formData.assetId}
            onChange={(e) => setFormData({...formData, assetId: e.target.value})}
            className="w-full border p-2"
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
            onChange={(e) => setFormData({...formData, type: e.target.value})}
            className="w-full border p-2"
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
            onChange={(e) => setFormData({...formData, date: e.target.value})}
            className="w-full border p-2"
            required
          />
        </div>

        <div>
          <label className="block mb-1">Quantidade</label>
          <input
            type="number"
            step="0.000001"
            value={formData.quantity}
            onChange={(e) => setFormData({...formData, quantity: e.target.value})}
            className="w-full border p-2"
            required
          />
        </div>

        <div>
          <label className="block mb-1">Preço Unitário</label>
          <input
            type="number"
            step="0.01"
            value={formData.price}
            onChange={(e) => setFormData({...formData, price: e.target.value})}
            className="w-full border p-2"
            required
          />
        </div>

        <div>
          <label className="block mb-1">Taxas/Custos (opcional)</label>
          <input
            type="number"
            step="0.01"
            value={formData.fees}
            onChange={(e) => setFormData({...formData, fees: e.target.value})}
            className="w-full border p-2"
          />
        </div>

        <div>
          <label className="block mb-1">Observações (opcional)</label>
          <textarea
            value={formData.notes}
            onChange={(e) => setFormData({...formData, notes: e.target.value})}
            className="w-full border p-2"
            rows={3}
          />
        </div>

        <div className="flex gap-2">
          <button
            type="submit"
            className="bg-blue-500 text-white px-4 py-2 rounded"
          >
            Salvar
          </button>
          <a
            href="/transactions"
            className="bg-gray-500 text-white px-4 py-2 rounded"
          >
            Cancelar
          </a>
        </div>
      </form>
    </div>
  )
}