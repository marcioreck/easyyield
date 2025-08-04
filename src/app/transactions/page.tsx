'use client'

import { useEffect, useState } from 'react'
import { Transaction, Asset } from '@prisma/client'

type TransactionWithAsset = Transaction & {
  asset: Asset
}

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<TransactionWithAsset[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchTransactions()
  }, [])

  const fetchTransactions = async () => {
    try {
      const response = await fetch('/api/transactions')
      if (response.ok) {
        const data = await response.json()
        setTransactions(data)
      }
    } catch (error) {
      console.error('Erro ao buscar operações:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta operação?')) return

    try {
      const response = await fetch(`/api/transactions/${id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        fetchTransactions()
      } else {
        alert('Erro ao excluir operação')
      }
    } catch (error) {
      console.error('Erro:', error)
      alert('Erro ao excluir operação')
    }
  }

  if (loading) {
    return <div>Carregando...</div>
  }

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Operações</h1>
        <a
          href="/transactions/new"
          className="bg-blue-500 text-white px-4 py-2 rounded"
        >
          Nova Operação
        </a>
      </div>

      {transactions.length === 0 ? (
        <p>Nenhuma operação cadastrada.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-100">
                <th className="border p-2 text-left">Data</th>
                <th className="border p-2 text-left">Ativo</th>
                <th className="border p-2 text-left">Tipo</th>
                <th className="border p-2 text-left">Quantidade</th>
                <th className="border p-2 text-left">Preço</th>
                <th className="border p-2 text-left">Total</th>
                <th className="border p-2 text-left">Ações</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((transaction) => (
                <tr key={transaction.id}>
                  <td className="border p-2">
                    {new Date(transaction.date).toLocaleDateString()}
                  </td>
                  <td className="border p-2">{transaction.asset.ticker}</td>
                  <td className="border p-2">{transaction.type}</td>
                  <td className="border p-2">{transaction.quantity}</td>
                  <td className="border p-2">
                    {transaction.price.toLocaleString('pt-BR', {
                      style: 'currency',
                      currency: transaction.asset.currency
                    })}
                  </td>
                  <td className="border p-2">
                    {(transaction.quantity * transaction.price).toLocaleString('pt-BR', {
                      style: 'currency',
                      currency: transaction.asset.currency
                    })}
                  </td>
                  <td className="border p-2">
                    <div className="flex gap-2">
                      <a
                        href={`/transactions/${transaction.id}/edit`}
                        className="text-blue-500 hover:underline"
                      >
                        Editar
                      </a>
                      <button
                        onClick={() => handleDelete(transaction.id)}
                        className="text-red-500 hover:underline"
                      >
                        Excluir
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