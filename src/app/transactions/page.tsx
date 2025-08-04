'use client'

import { useState, useEffect } from 'react'
import { formatCurrency, formatDate } from '@/utils/format'
import { ConfirmDialog } from '@/components/ConfirmDialog'

interface Transaction {
  id: string
  date: string
  type: 'COMPRA' | 'VENDA'
  quantity: number
  price: number
  fees?: number
  notes?: string
  asset: {
    ticker: string
    name: string
    currency: 'BRL' | 'USD'
  }
}

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deleteTransaction, setDeleteTransaction] = useState<Transaction | null>(null)

  useEffect(() => {
    fetchTransactions()
  }, [])

  const fetchTransactions = async () => {
    try {
      const response = await fetch('/api/transactions')
      if (response.ok) {
        const data = await response.json()
        setTransactions(data)
      } else {
        throw new Error('Erro ao carregar transações')
      }
    } catch (error) {
      console.error('Error fetching transactions:', error)
      setError('Erro ao carregar transações')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteClick = (transaction: Transaction) => {
    setDeleteTransaction(transaction)
  }

  const handleDeleteConfirm = async () => {
    if (!deleteTransaction) return

    try {
      const response = await fetch(`/api/transactions/${deleteTransaction.id}`, {
        method: 'DELETE'
      })

      const data = await response.json()

      if (response.ok) {
        setTransactions(transactions.filter(t => t.id !== deleteTransaction.id))
      } else {
        throw new Error(data.error || 'Erro ao excluir transação')
      }
    } catch (error) {
      console.error('Error deleting transaction:', error)
      alert(error instanceof Error ? error.message : 'Erro ao excluir transação')
    } finally {
      setDeleteTransaction(null)
    }
  }

  const handleDeleteCancel = () => {
    setDeleteTransaction(null)
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
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Operações</h1>
        <a
          href="/transactions/new"
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Nova Operação
        </a>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-100">
              <th className="border p-2 text-left">Data</th>
              <th className="border p-2 text-left">Tipo</th>
              <th className="border p-2 text-left">Ativo</th>
              <th className="border p-2 text-right">Quantidade</th>
              <th className="border p-2 text-right">Preço</th>
              <th className="border p-2 text-right">Total</th>
              <th className="border p-2 text-right">Taxas</th>
              <th className="border p-2 text-left">Observações</th>
              <th className="border p-2 text-center">Ações</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map(transaction => (
              <tr key={transaction.id} className="hover:bg-gray-50">
                <td className="border p-2">
                  {formatDate(new Date(transaction.date))}
                </td>
                <td className="border p-2">
                  <span className={transaction.type === 'COMPRA' ? 'text-green-600' : 'text-red-600'}>
                    {transaction.type}
                  </span>
                </td>
                <td className="border p-2">
                  <span className="font-medium">{transaction.asset.ticker}</span>
                  <br />
                  <span className="text-sm text-gray-500">{transaction.asset.name}</span>
                </td>
                <td className="border p-2 text-right">
                  {transaction.quantity.toLocaleString('pt-BR', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 6
                  })}
                </td>
                <td className="border p-2 text-right">
                  {formatCurrency(transaction.price, transaction.asset.currency)}
                </td>
                <td className="border p-2 text-right">
                  {formatCurrency(
                    transaction.price * transaction.quantity,
                    transaction.asset.currency
                  )}
                </td>
                <td className="border p-2 text-right">
                  {transaction.fees
                    ? formatCurrency(transaction.fees, transaction.asset.currency)
                    : '-'}
                </td>
                <td className="border p-2 text-sm">
                  {transaction.notes || '-'}
                </td>
                <td className="border p-2 text-center">
                  <div className="flex justify-center space-x-2">
                    <a
                      href={`/transactions/${transaction.id}/edit`}
                      className="text-blue-500 hover:underline"
                      title="Editar"
                    >
                      ✏️
                    </a>
                    <button
                      onClick={() => handleDeleteClick(transaction)}
                      className="text-red-500 hover:text-red-700"
                      title="Excluir"
                    >
                      🗑️
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {transactions.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          Nenhuma operação encontrada.
          <br />
          <a href="/transactions/new" className="text-blue-500 hover:underline">
            Adicionar primeira operação
          </a>
        </div>
      )}

      <ConfirmDialog
        isOpen={deleteTransaction !== null}
        title="Confirmar Exclusão"
        message={
          deleteTransaction
            ? `Tem certeza que deseja excluir a ${deleteTransaction.type.toLowerCase()} de ${
                deleteTransaction.quantity
              } ${deleteTransaction.asset.ticker} realizada em ${formatDate(
                new Date(deleteTransaction.date)
              )}?`
            : ''
        }
        confirmLabel="Excluir"
        cancelLabel="Cancelar"
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
      />
    </div>
  )
}