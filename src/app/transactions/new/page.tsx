'use client'

import { useState, useEffect } from 'react'
import { Asset } from '@prisma/client'
import { validateTransaction, ValidationError } from '@/utils/validations'
import { formatCurrency, parseCurrency, parseQuantity } from '@/utils/format'

export default function NewTransactionPage() {
  const [assets, setAssets] = useState<Asset[]>([])
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null)
  const [formData, setFormData] = useState({
    assetId: '',
    type: 'COMPRA',
    date: new Date().toISOString().split('T')[0],
    quantity: '',
    price: '',
    fees: '',
    notes: ''
  })
  const [errors, setErrors] = useState<ValidationError[]>([])
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetchAssets()
  }, [])

  const fetchAssets = async () => {
    try {
      const response = await fetch('/api/assets')
      if (response.ok) {
        const data = await response.json()
        setAssets(data)
        if (data.length > 0) {
          setFormData(prev => ({ ...prev, assetId: data[0].id }))
          setSelectedAsset(data[0])
        }
      }
    } catch (error) {
      console.error('Erro ao buscar ativos:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrors([])
    
    const numericData = {
      ...formData,
      quantity: parseQuantity(formData.quantity),
      price: parseCurrency(formData.price),
      fees: formData.fees ? parseCurrency(formData.fees) : null
    }

    // Validar dados
    const validationErrors = await validateTransaction(numericData, selectedAsset)
    if (validationErrors.length > 0) {
      setErrors(validationErrors)
      return
    }

    setSubmitting(true)
    try {
      const response = await fetch('/api/transactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(numericData),
      })

      if (response.ok) {
        window.location.href = '/transactions'
      } else {
        const data = await response.json()
        setErrors([{ field: 'submit', message: data.error || 'Erro ao salvar operação' }])
      }
    } catch (error) {
      console.error('Erro:', error)
      setErrors([{ field: 'submit', message: 'Erro ao salvar operação' }])
    } finally {
      setSubmitting(false)
    }
  }

  const getFieldError = (field: string) => {
    return errors.find(error => error.field === field)?.message
  }

  const handleAssetChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const asset = assets.find(a => a.id === e.target.value)
    setSelectedAsset(asset || null)
    setFormData(prev => ({ ...prev, assetId: e.target.value }))
  }

  return (
    <div className="max-w-2xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Nova Operação</h1>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block mb-1">Ativo</label>
          <select
            value={formData.assetId}
            onChange={handleAssetChange}
            className={`w-full border p-2 ${getFieldError('assetId') ? 'border-red-500' : ''}`}
            required
          >
            {assets.map(asset => (
              <option key={asset.id} value={asset.id}>
                {asset.ticker} - {asset.name}
              </option>
            ))}
          </select>
          {getFieldError('assetId') && (
            <p className="text-red-500 text-sm mt-1">{getFieldError('assetId')}</p>
          )}
        </div>

        <div>
          <label className="block mb-1">Tipo</label>
          <select
            value={formData.type}
            onChange={(e) => setFormData({...formData, type: e.target.value})}
            className={`w-full border p-2 ${getFieldError('type') ? 'border-red-500' : ''}`}
            required
          >
            <option value="COMPRA">Compra</option>
            <option value="VENDA">Venda</option>
          </select>
          {getFieldError('type') && (
            <p className="text-red-500 text-sm mt-1">{getFieldError('type')}</p>
          )}
        </div>

        <div>
          <label className="block mb-1">Data</label>
          <input
            type="date"
            value={formData.date}
            onChange={(e) => setFormData({...formData, date: e.target.value})}
            className={`w-full border p-2 ${getFieldError('date') ? 'border-red-500' : ''}`}
            required
            max={new Date().toISOString().split('T')[0]}
          />
          {getFieldError('date') && (
            <p className="text-red-500 text-sm mt-1">{getFieldError('date')}</p>
          )}
        </div>

        <div>
          <label className="block mb-1">Quantidade</label>
          <input
            type="text"
            value={formData.quantity}
            onChange={(e) => {
              const value = e.target.value.replace(/[^\d,]/g, '').replace(/,/g, '.')
              setFormData({...formData, quantity: value})
            }}
            className={`w-full border p-2 ${getFieldError('quantity') ? 'border-red-500' : ''}`}
            required
            placeholder="0,00"
          />
          {getFieldError('quantity') && (
            <p className="text-red-500 text-sm mt-1">{getFieldError('quantity')}</p>
          )}
        </div>

        <div>
          <label className="block mb-1">Preço Unitário ({selectedAsset?.currency})</label>
          <input
            type="text"
            value={formData.price}
            onChange={(e) => {
              const value = e.target.value.replace(/[^\d,]/g, '').replace(/,/g, '.')
              setFormData({...formData, price: value})
            }}
            className={`w-full border p-2 ${getFieldError('price') ? 'border-red-500' : ''}`}
            required
            placeholder="0,00"
          />
          {getFieldError('price') && (
            <p className="text-red-500 text-sm mt-1">{getFieldError('price')}</p>
          )}
        </div>

        <div>
          <label className="block mb-1">Taxas/Custos ({selectedAsset?.currency}) (opcional)</label>
          <input
            type="text"
            value={formData.fees}
            onChange={(e) => {
              const value = e.target.value.replace(/[^\d,]/g, '').replace(/,/g, '.')
              setFormData({...formData, fees: value})
            }}
            className={`w-full border p-2 ${getFieldError('fees') ? 'border-red-500' : ''}`}
            placeholder="0,00"
          />
          {getFieldError('fees') && (
            <p className="text-red-500 text-sm mt-1">{getFieldError('fees')}</p>
          )}
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

        {getFieldError('submit') && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {getFieldError('submit')}
          </div>
        )}

        <div className="flex gap-2">
          <button
            type="submit"
            className="bg-blue-500 text-white px-4 py-2 rounded disabled:bg-blue-300"
            disabled={submitting}
          >
            {submitting ? 'Salvando...' : 'Salvar'}
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