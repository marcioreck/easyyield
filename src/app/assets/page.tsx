'use client'

import { useEffect, useState } from 'react'
import { Asset } from '@prisma/client'

interface AssetWithPrice extends Asset {
  latestPrice?: {
    price: number
    date: string
  }
}

export default function AssetsPage() {
  const [assets, setAssets] = useState<AssetWithPrice[]>([])
  const [loading, setLoading] = useState(true)
  const [importing, setImporting] = useState<string | null>(null)

  useEffect(() => {
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
      console.error('Erro ao buscar ativos:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este ativo?')) return

    try {
      const response = await fetch(`/api/assets/${id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        fetchAssets()
      } else {
        alert('Erro ao excluir ativo')
      }
    } catch (error) {
      console.error('Erro:', error)
      alert('Erro ao excluir ativo')
    }
  }

  const handleImportHistory = async (id: string) => {
    if (!confirm('Deseja reimportar todo o histórico deste ativo? Isso pode demorar alguns minutos.')) return

    setImporting(id)
    try {
      const response = await fetch(`/api/assets/${id}/import-history`, {
        method: 'POST'
      })

      const result = await response.json()
      if (result.success) {
        alert(`Histórico importado com sucesso! ${result.count} registros importados da fonte ${result.source}`)
        fetchAssets()
      } else {
        alert('Erro ao importar histórico: ' + result.error)
      }
    } catch (error) {
      console.error('Erro:', error)
      alert('Erro ao importar histórico')
    } finally {
      setImporting(null)
    }
  }

  if (loading) {
    return <div>Carregando...</div>
  }

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Ativos</h1>
        <a
          href="/assets/new"
          className="bg-blue-500 text-white px-4 py-2 rounded"
        >
          Novo Ativo
        </a>
      </div>

      {assets.length === 0 ? (
        <p>Nenhum ativo cadastrado.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-100">
                <th className="border p-2 text-left">Ticker</th>
                <th className="border p-2 text-left">Nome</th>
                <th className="border p-2 text-left">Tipo</th>
                <th className="border p-2 text-left">Moeda</th>
                <th className="border p-2 text-left">Última Cotação</th>
                <th className="border p-2 text-left">Ações</th>
              </tr>
            </thead>
            <tbody>
              {assets.map((asset) => (
                <tr key={asset.id}>
                  <td className="border p-2">{asset.ticker}</td>
                  <td className="border p-2">{asset.name}</td>
                  <td className="border p-2">{asset.type}</td>
                  <td className="border p-2">{asset.currency}</td>
                  <td className="border p-2">
                    {asset.latestPrice ? (
                      <>
                        {asset.latestPrice.price.toLocaleString('pt-BR', {
                          style: 'currency',
                          currency: asset.currency
                        })}
                        <br />
                        <span className="text-xs text-gray-500">
                          {new Date(asset.latestPrice.date).toLocaleDateString()}
                        </span>
                      </>
                    ) : (
                      'Sem cotação'
                    )}
                  </td>
                  <td className="border p-2">
                    <div className="flex gap-2">
                      <a
                        href={`/assets/${asset.id}/edit`}
                        className="text-blue-500 hover:underline"
                      >
                        Editar
                      </a>
                      <button
                        onClick={() => handleDelete(asset.id)}
                        className="text-red-500 hover:underline"
                      >
                        Excluir
                      </button>
                      <button
                        onClick={() => handleImportHistory(asset.id)}
                        className="text-green-500 hover:underline"
                        disabled={importing === asset.id}
                      >
                        {importing === asset.id ? 'Importando...' : 'Importar Histórico'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}