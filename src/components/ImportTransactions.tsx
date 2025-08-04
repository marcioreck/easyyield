'use client'

import { useState } from 'react'
import { Asset } from '@prisma/client'

interface ImportPreview {
  date: string
  type: string
  ticker: string
  quantity: number
  price: number
  fees?: number
  notes?: string
  status: 'valid' | 'error'
  error?: string
}

interface ImportTransactionsProps {
  onComplete: () => void
}

export function ImportTransactions({ onComplete }: ImportTransactionsProps) {
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<ImportPreview[]>([])
  const [assets, setAssets] = useState<Asset[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Carrega lista de ativos ao montar o componente
  useState(() => {
    fetchAssets()
  }, [])

  const fetchAssets = async () => {
    try {
      const response = await fetch('/api/assets')
      if (response.ok) {
        const data = await response.json()
        setAssets(data)
      }
    } catch (error) {
      console.error('Error fetching assets:', error)
    }
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setFile(file)
    setError('')
    
    // Verifica extensão
    if (!file.name.endsWith('.csv')) {
      setError('Por favor, selecione um arquivo CSV')
      return
    }

    try {
      const text = await file.text()
      const rows = text.split('\n')
      
      // Verifica cabeçalho
      const header = rows[0].toLowerCase()
      const requiredColumns = ['data', 'tipo', 'ticker', 'quantidade', 'preco']
      const hasRequiredColumns = requiredColumns.every(col => header.includes(col))
      
      if (!hasRequiredColumns) {
        setError('Formato de arquivo inválido. Verifique o modelo.')
        return
      }

      // Processa linhas
      const preview: ImportPreview[] = []
      for (let i = 1; i < rows.length; i++) {
        const row = rows[i].trim()
        if (!row) continue

        const columns = row.split(',')
        const [date, type, ticker, quantity, price, fees, notes] = columns

        // Valida dados
        const asset = assets.find(a => a.ticker === ticker.trim())
        const importRow: ImportPreview = {
          date: date.trim(),
          type: type.trim().toUpperCase(),
          ticker: ticker.trim(),
          quantity: Number(quantity),
          price: Number(price),
          fees: fees ? Number(fees) : undefined,
          notes: notes?.trim(),
          status: 'valid'
        }

        // Validações
        if (!asset) {
          importRow.status = 'error'
          importRow.error = 'Ativo não encontrado'
        } else if (!['COMPRA', 'VENDA'].includes(importRow.type)) {
          importRow.status = 'error'
          importRow.error = 'Tipo inválido'
        } else if (isNaN(importRow.quantity) || importRow.quantity <= 0) {
          importRow.status = 'error'
          importRow.error = 'Quantidade inválida'
        } else if (isNaN(importRow.price) || importRow.price <= 0) {
          importRow.status = 'error'
          importRow.error = 'Preço inválido'
        }

        preview.push(importRow)
      }

      setPreview(preview)
    } catch (error) {
      console.error('Error processing file:', error)
      setError('Erro ao processar arquivo')
    }
  }

  const handleImport = async () => {
    if (!preview.length) return
    
    // Verifica se há erros
    if (preview.some(row => row.status === 'error')) {
      setError('Corrija os erros antes de importar')
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/transactions/import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ transactions: preview })
      })

      if (response.ok) {
        onComplete()
      } else {
        const data = await response.json()
        setError(data.error || 'Erro ao importar operações')
      }
    } catch (error) {
      console.error('Error importing transactions:', error)
      setError('Erro ao importar operações')
    } finally {
      setLoading(false)
    }
  }

  const downloadTemplate = () => {
    const template = 'Data,Tipo,Ticker,Quantidade,Preco,Taxas,Observacoes\n'
    const blob = new Blob([template], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'modelo_importacao.csv'
    a.click()
    window.URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">Importar Operações</h3>
          <p className="text-sm text-gray-500">
            Importe operações em lote usando um arquivo CSV
          </p>
        </div>
        <button
          onClick={downloadTemplate}
          className="text-blue-500 hover:underline text-sm"
        >
          Baixar Modelo
        </button>
      </div>

      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
        <input
          type="file"
          accept=".csv"
          onChange={handleFileChange}
          className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
        />
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {preview.length > 0 && (
        <div>
          <h4 className="font-medium mb-2">Preview da Importação</h4>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border p-2 text-left">Data</th>
                  <th className="border p-2 text-left">Tipo</th>
                  <th className="border p-2 text-left">Ticker</th>
                  <th className="border p-2 text-right">Quantidade</th>
                  <th className="border p-2 text-right">Preço</th>
                  <th className="border p-2 text-right">Taxas</th>
                  <th className="border p-2 text-left">Status</th>
                </tr>
              </thead>
              <tbody>
                {preview.map((row, index) => (
                  <tr key={index} className={row.status === 'error' ? 'bg-red-50' : ''}>
                    <td className="border p-2">{row.date}</td>
                    <td className="border p-2">{row.type}</td>
                    <td className="border p-2">{row.ticker}</td>
                    <td className="border p-2 text-right">{row.quantity}</td>
                    <td className="border p-2 text-right">{row.price}</td>
                    <td className="border p-2 text-right">{row.fees || '-'}</td>
                    <td className="border p-2">
                      {row.status === 'error' ? (
                        <span className="text-red-600">{row.error}</span>
                      ) : (
                        <span className="text-green-600">OK</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-4">
            <button
              onClick={handleImport}
              disabled={loading || preview.some(row => row.status === 'error')}
              className="bg-blue-500 text-white px-4 py-2 rounded disabled:bg-blue-300"
            >
              {loading ? 'Importando...' : 'Confirmar Importação'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}