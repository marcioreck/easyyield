'use client'

import { useState } from 'react'

interface ImportResult {
  created: number
  ignored: number
  createdTickers: string[]
  errors: { ticker: string; message: string }[]
}

export function ImportAssetsFromText({
  onComplete
}: {
  onComplete?: () => void
}) {
  const [rawText, setRawText] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<ImportResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setResult(null)
    setLoading(true)
    try {
      const res = await fetch('/api/assets/import-from-text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rawText: rawText.trim() })
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Erro ao importar')
        return
      }
      setResult(data)
      setRawText('')
      onComplete?.()
    } catch {
      setError('Erro de conexão')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white shadow sm:rounded-lg p-4">
      <h3 className="text-lg font-medium text-gray-900 mb-2">
        Importar ativos por texto
      </h3>
      <p className="text-sm text-gray-500 mb-3">
        Cole uma tabela (Excel/CSV em texto), uma linha por ativo ou dados
        corridos. A IA irá interpretar e cadastrar cada ativo.
      </p>
      <form onSubmit={handleSubmit} className="space-y-3">
        <textarea
          value={rawText}
          onChange={(e) => setRawText(e.target.value)}
          placeholder="Exemplo:&#10;PETR4 Petróleo BR  ACAO_BR  BRL&#10;VALE3 Vale  ACAO_BR  BRL&#10;ou tabela colada do Excel..."
          className="w-full border border-gray-300 rounded-md p-2 font-mono text-sm min-h-[120px]"
          rows={6}
          disabled={loading}
        />
        {error && (
          <p className="text-sm text-red-600" role="alert">
            {error}
          </p>
        )}
        {result && (
          <div className="text-sm text-gray-700 p-2 bg-gray-50 rounded">
            <p>
              <strong>Cadastrados:</strong> {result.created}
              {result.createdTickers.length > 0 &&
                ` (${result.createdTickers.join(', ')})`}
            </p>
            {result.ignored > 0 && (
              <p>
                <strong>Ignorados/erro:</strong> {result.ignored}
                {result.errors.length > 0 && (
                  <span className="block mt-1 text-red-600">
                    {result.errors.map((e) => `${e.ticker}: ${e.message}`).join('; ')}
                  </span>
                )}
              </p>
            )}
          </div>
        )}
        <button
          type="submit"
          disabled={loading || !rawText.trim()}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Interpretando e cadastrando...' : 'Interpretar e cadastrar'}
        </button>
      </form>
    </div>
  )
}
