import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { calculateAssetHistory } from '@/services/calculations'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || '1y' // padrão: 1 ano

    // Define o período
    const toDate = new Date()
    const fromDate = new Date()
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
      case 'all':
        fromDate.setFullYear(2010)
        break
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

    // Converte para array e ordena por data
    const data = Array.from(dailyTotals.entries())
      .map(([date, total]) => ({ date, total }))
      .sort((a, b) => a.date.localeCompare(b.date))

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