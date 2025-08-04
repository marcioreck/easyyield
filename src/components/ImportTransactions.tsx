'use client'

import { useState, useEffect } from 'react'
import { Asset } from '@prisma/client'
import { formatCurrency, formatQuantity, parseDate, parseCsvQuantity, parseCsvCurrency } from '@/utils/format'

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
  const [importing, setImporting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [assets, setAssets] = useState<Asset[]>([])

  useEffect(() => {
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
    fetchAssets()
  }, [])

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setFile(file)
    setError(null)
    setPreview([])

    const reader = new FileReader()
    reader.onload = async (e) => {
      try {
        const text = e.target?.result as string
        const lines = text.split('\n')
          .map(line => line.trim())
          .filter(line => line && !line.startsWith('#'))

        // Remove header
        const header = lines.shift()
        if (!header?.toLowerCase().startsWith('data,tipo,ticker')) {
          throw new Error('Formato de arquivo inválido. Use o modelo fornecido.')
        }

        const previewData: ImportPreview[] = []

        for (const line of lines) {
          if (!line) continue

          try {
            const [date, type, ticker, quantity, price, fees, ...notesArr] = line.split(',')
            const notes = notesArr.join(',') // Reconstrói as observações que podem conter vírgulas

            // Validações básicas
            if (!date || !type || !ticker || !quantity || !price) {
              throw new Error('Campos obrigatórios faltando')
            }

            if (!['COMPRA', 'VENDA'].includes(type.trim().toUpperCase())) {
              throw new Error('Tipo deve ser COMPRA ou VENDA')
            }

            const asset = assets.find(a => a.ticker === ticker.trim())
            if (!asset) {
              throw new Error(`Ativo ${ticker} não encontrado`)
            }

            const parsedDate = parseDate(date.trim())
            if (isNaN(parsedDate.getTime())) {
              throw new Error('Data inválida')
            }

            const parsedQuantity = parseCsvQuantity(quantity.trim())
            if (isNaN(parsedQuantity) || parsedQuantity <= 0) {
              throw new Error('Quantidade inválida')
            }

            const parsedPrice = parseCsvCurrency(price.trim())
            if (isNaN(parsedPrice) || parsedPrice <= 0) {
              throw new Error('Preço inválido')
            }

            const parsedFees = fees ? parseCsvCurrency(fees.trim()) : undefined
            if (parsedFees !== undefined && (isNaN(parsedFees) || parsedFees < 0)) {
              throw new Error('Taxas inválidas')
            }

            previewData.push({
              date: date.trim(),
              type: type.trim().toUpperCase(),
              ticker: ticker.trim(),
              quantity: parsedQuantity,
              price: parsedPrice,
              fees: parsedFees,
              notes: notes?.trim(),
              status: 'valid'
            })
          } catch (error) {
            previewData.push({
              date: '',
              type: '',
              ticker: '',
              quantity: 0,
              price: 0,
              status: 'error',
              error: error instanceof Error ? error.message : 'Erro desconhecido'
            })
          }
        }

        setPreview(previewData)
      } catch (error) {
        setError(error instanceof Error ? error.message : 'Erro ao ler arquivo')
      }
    }

    reader.readAsText(file)
  }

  const handleImport = async () => {
    if (!preview.length) return

    setImporting(true)
    setError(null)

    try {
      const response = await fetch('/api/transactions/import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ transactions: preview.filter(p => p.status === 'valid') })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao importar operações')
      }

      onComplete()
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Erro ao importar operações')
    } finally {
      setImporting(false)
    }
  }

  const downloadTemplate = () => {
    const template = 'Data,Tipo,Ticker,Quantidade,Preco,Taxas,Observacoes\n' +
                    '30/10/2019,COMPRA,T2050B,1,4956.01,,RENTABILIDADE CONTRATADA IPCA + 3.28%\n' +
                    '# Use ponto como separador decimal (ex: 4956.01 = R$ 4.956,01)\n' +
                    '# Data no formato DD/MM/YYYY\n' +
                    '# Tipo deve ser COMPRA ou VENDA\n' +
                    '# Ticker deve estar cadastrado no sistema\n' +
                    '# Quantidade e Preço são obrigatórios\n' +
                    '# Taxas e Observações são opcionais'
    const blob = new Blob([template], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'modelo_importacao.csv'
    a.click()
    window.URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium mb-2">Como Importar Operações</h3>
        <div className="bg-blue-50 p-4 rounded-lg space-y-3 text-sm">
          <p className="font-medium">Siga os passos abaixo para importar suas operações:</p>
          <ol className="list-decimal list-inside space-y-2">
            <li>Baixe o modelo de arquivo CSV clicando no botão "Baixar Modelo"</li>
            <li>Abra o arquivo em um editor de planilhas (Excel, Google Sheets, etc.)</li>
            <li>Preencha os dados seguindo o formato:
              <ul className="list-disc list-inside ml-4 mt-1 text-gray-600">
                <li>Data: formato DD/MM/YYYY (ex: 30/10/2019)</li>
                <li>Tipo: COMPRA ou VENDA (em maiúsculas)</li>
                <li>Ticker: exatamente como cadastrado no sistema</li>
                <li>Quantidade: número com ponto decimal (ex: 1.5)</li>
                <li>Preco: valor unitário com ponto decimal (ex: 4956.01 = R$ 4.956,01)</li>
                <li>Taxas: opcional, valor com ponto decimal (ex: 2.50 = R$ 2,50)</li>
                <li>Observacoes: opcional, pode incluir vírgulas</li>
              </ul>
            </li>
            <li>Salve o arquivo no formato CSV</li>
            <li>Selecione o arquivo para ver um preview das operações</li>
            <li>Verifique se há erros no preview antes de confirmar a importação</li>
          </ol>
          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
            <p className="font-medium text-yellow-800">⚠️ Importante:</p>
            <ul className="mt-2 list-disc list-inside text-yellow-700">
              <li>Use PONTO como separador decimal (não use vírgula)</li>
              <li>Exemplo: 4956.01 será importado como R$ 4.956,01</li>
              <li>O ativo (ticker) deve estar previamente cadastrado no sistema</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="flex space-x-4">
        <button
          onClick={downloadTemplate}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Baixar Modelo
        </button>

        <div>
          <input
            type="file"
            accept=".csv"
            onChange={handleFileChange}
            className="block w-full text-sm text-gray-500
              file:mr-4 file:py-2 file:px-4
              file:rounded file:border-0
              file:text-sm file:font-semibold
              file:bg-blue-50 file:text-blue-700
              hover:file:bg-blue-100"
          />
        </div>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {preview.length > 0 && (
        <div>
          <h4 className="text-lg font-medium mb-2">Preview das Operações</h4>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border p-2 text-left">Status</th>
                  <th className="border p-2 text-left">Data</th>
                  <th className="border p-2 text-left">Tipo</th>
                  <th className="border p-2 text-left">Ticker</th>
                  <th className="border p-2 text-right">Quantidade</th>
                  <th className="border p-2 text-right">Preço</th>
                  <th className="border p-2 text-right">Taxas</th>
                  <th className="border p-2 text-left">Observações</th>
                </tr>
              </thead>
              <tbody>
                {preview.map((item, index) => (
                  <tr key={index} className={item.status === 'error' ? 'bg-red-50' : 'hover:bg-gray-50'}>
                    <td className="border p-2">
                      {item.status === 'valid' ? '✅' : '❌'}
                    </td>
                    <td className="border p-2">{item.date || '-'}</td>
                    <td className="border p-2">{item.type || '-'}</td>
                    <td className="border p-2">{item.ticker || '-'}</td>
                    <td className="border p-2 text-right">
                      {item.status === 'valid' ? formatQuantity(item.quantity) : '-'}
                    </td>
                    <td className="border p-2 text-right">
                      {item.status === 'valid' ? formatCurrency(item.price, 'BRL') : '-'}
                    </td>
                    <td className="border p-2 text-right">
                      {item.status === 'valid' && item.fees ? formatCurrency(item.fees, 'BRL') : '-'}
                    </td>
                    <td className="border p-2">
                      {item.status === 'valid' ? (item.notes || '-') : item.error}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {preview.some(item => item.status === 'valid') && (
            <div className="mt-4">
              <button
                onClick={handleImport}
                disabled={importing}
                className={`px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {importing ? 'Importando...' : 'Confirmar Importação'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}