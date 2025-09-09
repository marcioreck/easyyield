import { useState, useEffect } from 'react'

interface SemiannualPayment {
  date: string
  expectedAmount: number
  period: string
  status: 'expected' | 'estimated'
}

interface SemiannualPaymentsProps {
  assetId: string
}

export default function SemiannualPayments({ assetId }: SemiannualPaymentsProps) {
  const [payments, setPayments] = useState<SemiannualPayment[]>([])
  const [loading, setLoading] = useState(true)
  const [totalPayments, setTotalPayments] = useState(0)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchPayments = async () => {
      try {
        setLoading(true)
        const response = await fetch(`/api/assets/${assetId}/semiannual-payments`)
        
        if (!response.ok) {
          throw new Error('Failed to fetch payments')
        }
        
        const data = await response.json()
        setPayments(data.payments || [])
        setTotalPayments(data.totalPayments || 0)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setLoading(false)
      }
    }

    if (assetId) {
      fetchPayments()
    }
  }, [assetId])

  if (loading) {
    return (
      <div className="bg-white overflow-hidden shadow rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Histórico de Pagamentos Semestrais</h2>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-300 rounded mb-2"></div>
          <div className="h-4 bg-gray-300 rounded mb-2"></div>
          <div className="h-4 bg-gray-300 rounded"></div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-white overflow-hidden shadow rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Histórico de Pagamentos Semestrais</h2>
        <div className="text-red-600">Erro ao carregar pagamentos: {error}</div>
      </div>
    )
  }

  if (payments.length === 0) {
    return (
      <div className="bg-white overflow-hidden shadow rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Histórico de Pagamentos Semestrais</h2>
        <p className="text-gray-600">Este ativo não possui juros semestrais ou ainda não teve pagamentos.</p>
      </div>
    )
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR')
  }

  return (
    <div className="bg-white overflow-hidden shadow rounded-lg p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Histórico de Pagamentos Semestrais</h2>
        <div className="text-sm text-gray-600">
          <span className="font-medium">{payments.length}</span> pagamentos • 
          <span className="font-medium text-green-600 ml-1">{formatCurrency(totalPayments)}</span> total
        </div>
      </div>

      <div className="space-y-3">
        {payments.map((payment, index) => (
          <div 
            key={index}
            className="flex justify-between items-center p-3 bg-gray-50 rounded-lg border"
          >
            <div>
              <div className="font-medium text-gray-900">{payment.period}</div>
              <div className="text-sm text-gray-600">{formatDate(payment.date)}</div>
            </div>
            <div className="text-right">
              <div className="font-medium text-green-600">{formatCurrency(payment.expectedAmount)}</div>
              <div className="text-xs text-gray-500 capitalize">{payment.status === 'estimated' ? 'Estimado' : 'Esperado'}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 p-3 bg-blue-50 rounded-lg">
        <div className="text-sm text-blue-800">
          <strong>Nota:</strong> Os valores são estimativas baseadas na taxa contratada e quantidade investida. 
          Para conferência exata, consulte seus extratos da corretora e do Tesouro Direto.
        </div>
      </div>
    </div>
  )
}
