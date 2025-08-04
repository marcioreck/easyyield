'use client'

import { useState } from 'react'
import { AssetType, Currency } from '@prisma/client'
import { validateAsset, ValidationError } from '@/utils/validations'

export default function NewAssetPage() {
  const [formData, setFormData] = useState({
    ticker: '',
    name: '',
    type: 'ACAO_BR',
    currency: 'BRL',
    description: ''
  })
  const [errors, setErrors] = useState<ValidationError[]>([])
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrors([])
    
    // Validar dados
    const validationErrors = validateAsset(formData)
    if (validationErrors.length > 0) {
      setErrors(validationErrors)
      return
    }

    setSubmitting(true)
    try {
      const response = await fetch('/api/assets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        window.location.href = '/assets'
      } else {
        const data = await response.json()
        setErrors([{ field: 'submit', message: data.error || 'Erro ao salvar ativo' }])
      }
    } catch (error) {
      console.error('Erro:', error)
      setErrors([{ field: 'submit', message: 'Erro ao salvar ativo' }])
    } finally {
      setSubmitting(false)
    }
  }

  const getFieldError = (field: string) => {
    return errors.find(error => error.field === field)?.message
  }

  return (
    <div className="max-w-2xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Novo Ativo</h1>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block mb-1">Ticker</label>
          <input
            type="text"
            value={formData.ticker}
            onChange={(e) => setFormData({...formData, ticker: e.target.value.toUpperCase()})}
            className={`w-full border p-2 ${getFieldError('ticker') ? 'border-red-500' : ''}`}
            required
            maxLength={10}
            pattern="[A-Z0-9.]+"
          />
          {getFieldError('ticker') && (
            <p className="text-red-500 text-sm mt-1">{getFieldError('ticker')}</p>
          )}
        </div>

        <div>
          <label className="block mb-1">Nome</label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({...formData, name: e.target.value})}
            className={`w-full border p-2 ${getFieldError('name') ? 'border-red-500' : ''}`}
            required
            maxLength={100}
          />
          {getFieldError('name') && (
            <p className="text-red-500 text-sm mt-1">{getFieldError('name')}</p>
          )}
        </div>

        <div>
          <label className="block mb-1">Tipo</label>
          <select
            value={formData.type}
            onChange={(e) => {
              const newType = e.target.value
              // Ajusta a moeda automaticamente baseado no tipo
              const newCurrency = ['ACAO_US', 'REIT'].includes(newType) ? 'USD' : 'BRL'
              setFormData({...formData, type: newType, currency: newCurrency})
            }}
            className={`w-full border p-2 ${getFieldError('type') ? 'border-red-500' : ''}`}
            required
          >
            <option value="TESOURO_DIRETO">Tesouro Direto</option>
            <option value="POUPANCA">Poupança</option>
            <option value="CDB">CDB</option>
            <option value="FII">FII</option>
            <option value="REIT">REIT</option>
            <option value="ACAO_BR">Ação BR</option>
            <option value="ACAO_US">Ação US</option>
            <option value="DEBENTURE">Debênture</option>
            <option value="RENDA_FIXA_DIGITAL">Renda Fixa Digital</option>
            <option value="STAKING_CRYPTO">Staking Crypto</option>
            <option value="OUTROS">Outros</option>
          </select>
          {getFieldError('type') && (
            <p className="text-red-500 text-sm mt-1">{getFieldError('type')}</p>
          )}
        </div>

        <div>
          <label className="block mb-1">Moeda</label>
          <select
            value={formData.currency}
            onChange={(e) => setFormData({...formData, currency: e.target.value})}
            className={`w-full border p-2 ${getFieldError('currency') ? 'border-red-500' : ''}`}
            required
          >
            <option value="BRL">BRL</option>
            <option value="USD">USD</option>
          </select>
          {getFieldError('currency') && (
            <p className="text-red-500 text-sm mt-1">{getFieldError('currency')}</p>
          )}
        </div>

        <div>
          <label className="block mb-1">Descrição (opcional)</label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({...formData, description: e.target.value})}
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
            href="/assets"
            className="bg-gray-500 text-white px-4 py-2 rounded"
          >
            Cancelar
          </a>
        </div>
      </form>
    </div>
  )
}