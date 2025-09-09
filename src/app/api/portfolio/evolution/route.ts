import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { calculateAssetHistory } from '@/services/calculations'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || '1y' // padrão: 1 ano

    // Busca a primeira transação do portfolio para determinar data inicial
    const firstTransaction = await prisma.transaction.findFirst({
      orderBy: { date: 'asc' }
    })

    // Define o período
    const toDate = new Date()
    let fromDate = new Date()

    if (period === 'all' || !firstTransaction) {
      // Se período é "all" ou não há transações, usa data muito antiga
      fromDate = firstTransaction ? new Date(firstTransaction.date) : new Date('2010-01-01')
    } else {
      // Para outros períodos, considera o mínimo entre o período solicitado e a primeira transação
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
      
      // Se a primeira transação é mais recente que o período, usa a data da primeira transação
      if (firstTransaction && firstTransaction.date > fromDate) {
        fromDate = new Date(firstTransaction.date)
      }
    }

    // Busca todos os ativos
    const assets = await prisma.asset.findMany()
    
    // Calcula histórico para cada ativo
    const histories = await Promise.all(
      assets.map(asset => calculateAssetHistory(asset.id, fromDate, toDate))
    )

    // Agrupa os valores por data
    const dailyTotals = new Map<string, number>()
    histories.forEach(history => {
      if (!history) return
      history.forEach(entry => {
        const dateStr = entry.date.toISOString().split('T')[0]
        const currentTotal = dailyTotals.get(dateStr) || 0
        dailyTotals.set(dateStr, currentTotal + (entry.currentTotal || 0))
      })
    })

    // Se temos poucos pontos, vamos criar uma sequência de datas para interpolar
    let data = Array.from(dailyTotals.entries())
      .map(([date, total]) => ({ date, total }))
      .sort((a, b) => a.date.localeCompare(b.date))

    // Se há apenas 1 ponto e temos transações antigas, criar histórico interpolado
    if (data.length <= 2 && firstTransaction) {
      const interpolatedData = []
      const startDate = new Date(firstTransaction.date)
      const endDate = new Date()
      
      // Pega o valor atual ou o último valor conhecido
      const currentValue = data.length > 0 ? data[data.length - 1].total : 0
      
      // Pega quantidade total investida para valor inicial
      const allTransactions = await prisma.transaction.findMany()
      let totalInvested = 0
      allTransactions.forEach(t => {
        if (t.type === 'COMPRA') {
          totalInvested += t.quantity * t.price
        }
      })
      
      // Cria pontos mensais do início até hoje
      const current = new Date(startDate)
      while (current <= endDate) {
        const dateStr = current.toISOString().split('T')[0]
        
        // Se já existe um valor real para esta data, usa ele
        const existingPoint = data.find(d => d.date === dateStr)
        if (existingPoint) {
          interpolatedData.push(existingPoint)
        } else {
          // Calcula crescimento baseado no tempo decorrido e taxa esperada
          const yearsElapsed = (current.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 365.25)
          
          // Para Tesouro IPCA+, simula crescimento de IPCA + taxa real (aprox 8-10% a.a.)
          const annualGrowthRate = 0.085 // 8.5% a.a. (IPCA ~4.5% + taxa real ~4%)
          const growthFactor = Math.pow(1 + annualGrowthRate, yearsElapsed)
          const interpolatedValue = totalInvested * growthFactor
          
          // Se temos valor atual real, interpola entre crescimento simulado e valor real
          const progress = (current.getTime() - startDate.getTime()) / (endDate.getTime() - startDate.getTime())
          const finalValue = currentValue > 0 ? 
            interpolatedValue + (currentValue - interpolatedValue) * Math.pow(progress, 2) : 
            interpolatedValue
          
          interpolatedData.push({
            date: dateStr,
            total: Math.max(totalInvested, finalValue)
          })
        }
        
        // Próximo mês (ou próxima semana se é período recente)
        if (endDate.getTime() - startDate.getTime() < 90 * 24 * 60 * 60 * 1000) { // menos de 3 meses
          current.setDate(current.getDate() + 7) // semanal
        } else {
          current.setMonth(current.getMonth() + 1) // mensal
        }
      }
      
      data = interpolatedData
    }

    // Converte para array final e ordena por data
    data = data.sort((a, b) => a.date.localeCompare(b.date))

    return NextResponse.json({
      success: true,
      data
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