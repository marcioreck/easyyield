import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { calculateHistoricalSemiannualPayments } from '@/services/semiannualPayments'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || '1y'

    // Busca a primeira transação do portfolio para determinar data inicial
    const firstTransaction = await prisma.transaction.findFirst({
      orderBy: { date: 'asc' }
    })

    if (!firstTransaction) {
      return NextResponse.json({
        success: true,
        data: [],
        summary: { totalInvested: 0, totalPaymentsReceived: 0, finalValue: 0 }
      })
    }

    // Define o período
    const toDate = new Date()
    let fromDate = new Date()

    if (period === 'all') {
      fromDate = new Date(firstTransaction.date)
    } else {
      switch (period) {
        case '1m':
          fromDate.setMonth(fromDate.getMonth() - 1)
          break
        case '3m':
          fromDate.setMonth(fromDate.getMonth() - 3)
          break
        case '6m':
          fromDate.setMonth(fromDate.getMonth() - 6)
          break
        case '1y':
          fromDate.setFullYear(fromDate.getFullYear() - 1)
          break
      }
      
      if (firstTransaction.date > fromDate) {
        fromDate = new Date(firstTransaction.date)
      }
    }

    // Busca todos os ativos com transações
    const assets = await prisma.asset.findMany({
      include: {
        transactions: {
          orderBy: { date: 'asc' }
        }
      }
    })

    // Calcula total investido
    const allTransactions = await prisma.transaction.findMany()
    let totalInvested = 0
    allTransactions.forEach(t => {
      if (t.type === 'COMPRA') {
        totalInvested += t.quantity * t.price
      } else {
        totalInvested -= t.quantity * t.price
      }
    })

    // Busca último preço conhecido para calcular valor atual
    let currentValue = 0
    for (const asset of assets) {
      const latestPrice = await prisma.price.findFirst({
        where: { assetId: asset.id },
        orderBy: { date: 'desc' }
      })
      
      if (latestPrice) {
        const quantity = asset.transactions.reduce((sum, t) => 
          t.type === 'COMPRA' ? sum + t.quantity : sum - t.quantity, 0)
        currentValue += quantity * latestPrice.price
      }
    }

    // Se não há preços, estima com crescimento
    if (currentValue === 0 && totalInvested > 0) {
      const yearsElapsed = (toDate.getTime() - fromDate.getTime()) / (1000 * 60 * 60 * 24 * 365.25)
      const annualGrowthRate = 0.085
      currentValue = totalInvested * Math.pow(1 + annualGrowthRate, yearsElapsed)
    }

    // Calcula pagamentos semestrais
    const semiannualPaymentsMap = new Map<string, number>()
    
    for (const asset of assets) {
      if (asset.pagaJurosSemestrais) {
        const payments = calculateHistoricalSemiannualPayments(asset, asset.transactions, toDate)
        
        payments.forEach(payment => {
          const paymentDateStr = payment.date.toISOString().split('T')[0]
          const fromDateStr = fromDate.toISOString().split('T')[0]
          const toDateStr = toDate.toISOString().split('T')[0]
          
          if (paymentDateStr >= fromDateStr && paymentDateStr <= toDateStr) {
            const current = semiannualPaymentsMap.get(paymentDateStr) || 0
            semiannualPaymentsMap.set(paymentDateStr, current + payment.expectedAmount)
          }
        })
      }
    }

    // Cria pontos mensais de dados
    const data = []
    const current = new Date(fromDate)
    current.setDate(1)
    let totalPaymentsAccumulated = 0

    while (current <= toDate) {
      const dateStr = current.toISOString().split('T')[0]
      
      // Calcula crescimento do ativo até esta data
      const yearsElapsed = (current.getTime() - fromDate.getTime()) / (1000 * 60 * 60 * 24 * 365.25)
      const annualGrowthRate = 0.085
      const growthFactor = Math.pow(1 + annualGrowthRate, yearsElapsed)
      let assetValue = totalInvested * growthFactor

      // Se temos valor atual real e estamos próximos da data atual, interpola
      const daysFromNow = Math.abs(toDate.getTime() - current.getTime()) / (1000 * 60 * 60 * 24)
      if (currentValue > 0 && daysFromNow < 60) { // Último mês usa valor real
        assetValue = currentValue
      }

      // Adiciona pagamentos semestrais até esta data
      let paymentAtDate = 0
      
      // Calcula total de pagamentos recebidos até esta data
      let currentAccumulated = 0
      for (const [paymentDateStr, amount] of semiannualPaymentsMap.entries()) {
        const paymentDate = new Date(paymentDateStr)
        const currentYearMonth = current.getFullYear() * 12 + current.getMonth()
        const paymentYearMonth = paymentDate.getFullYear() * 12 + paymentDate.getMonth()
        
        // Inclui pagamentos que ocorrem neste mês ou anteriores
        if (paymentYearMonth <= currentYearMonth) {
          currentAccumulated += amount
          
          // Se o pagamento é exatamente neste mês, marca como evento
          if (currentYearMonth === paymentYearMonth) {
            paymentAtDate = amount
          }
        }
      }
      
      totalPaymentsAccumulated = currentAccumulated

      data.push({
        date: dateStr,
        total: assetValue + totalPaymentsAccumulated,
        invested: totalInvested,
        assetValue: assetValue,
        paymentsReceived: totalPaymentsAccumulated,
        events: paymentAtDate > 0 ? [`Pagamento semestral: +R$ ${paymentAtDate.toFixed(2)}`] : [],
        hasPayment: paymentAtDate > 0,
        hasTransaction: false,
        dailyPayment: paymentAtDate,
        dailyInvestment: 0
      })

      current.setMonth(current.getMonth() + 1)
    }

    return NextResponse.json({
      success: true,
      data: data.sort((a, b) => a.date.localeCompare(b.date)),
      summary: {
        totalInvested,
        totalPaymentsReceived: totalPaymentsAccumulated,
        finalValue: data[data.length - 1]?.total || 0
      }
    })
  } catch (error) {
    console.error('Error calculating portfolio evolution:', error)
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to calculate portfolio evolution' 
      },
      { status: 500 }
    )
  }
}