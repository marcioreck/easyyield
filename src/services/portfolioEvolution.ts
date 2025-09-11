// Nova lógica para incluir pagamentos semestrais na evolução patrimonial

import { prisma } from '@/lib/prisma'
import { calculateHistoricalSemiannualPayments } from '@/services/semiannualPayments'

export async function calculatePortfolioEvolutionWithPayments(fromDate: Date, toDate: Date) {
  // 1. Buscar todos os ativos
  const assets = await prisma.asset.findMany({
    include: {
      transactions: true,
      prices: true
    }
  })

  // 2. Criar timeline de eventos (transações + pagamentos)
  const timeline = new Map<string, { 
    type: 'transaction' | 'payment' | 'price_update',
    amount: number,
    assetId: string,
    description: string 
  }[]>()

  for (const asset of assets) {
    // Adicionar transações
    asset.transactions.forEach(transaction => {
      const dateStr = transaction.date.toISOString().split('T')[0]
      if (!timeline.has(dateStr)) timeline.set(dateStr, [])
      
      timeline.get(dateStr)!.push({
        type: 'transaction',
        amount: transaction.type === 'COMPRA' 
          ? transaction.quantity * transaction.price 
          : -transaction.quantity * transaction.price,
        assetId: asset.id,
        description: `${transaction.type} ${transaction.quantity} ${asset.ticker}`
      })
    })

    // Adicionar pagamentos semestrais se aplicável
    if (asset.pagaJurosSemestrais) {
      const payments = calculateHistoricalSemiannualPayments(asset, asset.transactions, toDate)
      
      payments.forEach(payment => {
        const dateStr = payment.date.toISOString().split('T')[0]
        if (!timeline.has(dateStr)) timeline.set(dateStr, [])
        
        timeline.get(dateStr)!.push({
          type: 'payment',
          amount: payment.expectedAmount,
          assetId: asset.id,
          description: `Pagamento semestral ${payment.period} - ${asset.ticker}`
        })
      })
    }

    // Adicionar atualizações de preço
    asset.prices.forEach(price => {
      const dateStr = price.date.toISOString().split('T')[0]
      if (!timeline.has(dateStr)) timeline.set(dateStr, [])
      
      // Calcular valor atual da posição
      const currentQuantity = asset.transactions
        .filter(t => t.date <= price.date)
        .reduce((sum, t) => t.type === 'COMPRA' ? sum + t.quantity : sum - t.quantity, 0)
      
      timeline.get(dateStr)!.push({
        type: 'price_update',
        amount: currentQuantity * price.price,
        assetId: asset.id,
        description: `Valor atual ${asset.ticker}: ${price.price}`
      })
    })
  }

  // 3. Processar timeline cronologicamente
  const sortedDates = Array.from(timeline.keys()).sort()
  const evolutionData = []
  let currentValue = 0
  let investedAmount = 0

  for (const date of sortedDates) {
    if (date >= fromDate.toISOString().split('T')[0] && date <= toDate.toISOString().split('T')[0]) {
      const events = timeline.get(date)!
      
      // Processar eventos do dia
      let dayChange = 0
      let hasPayment = false
      let hasTransaction = false
      
      events.forEach(event => {
        if (event.type === 'transaction') {
          investedAmount += event.amount
          hasTransaction = true
        } else if (event.type === 'payment') {
          dayChange += event.amount // Pagamentos aumentam o patrimônio
          hasPayment = true
        } else if (event.type === 'price_update') {
          // Atualização de preço - recalcula valor total
          currentValue = event.amount + (currentValue - investedAmount) // mantém ganhos/perdas anteriores
        }
      })

      evolutionData.push({
        date,
        total: currentValue + dayChange,
        invested: investedAmount,
        events: events.map(e => e.description),
        hasPayment,
        hasTransaction,
        changeFromPayments: hasPayment ? dayChange : 0
      })
      
      currentValue += dayChange
    }
  }

  return evolutionData
}
