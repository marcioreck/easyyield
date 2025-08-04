import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { AssetType } from '@prisma/client'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const types = searchParams.get('types')?.split(',').filter(Boolean) as AssetType[] || []
    const period = searchParams.get('period') || '1y'

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
      case 'ytd':
        fromDate.setMonth(0, 1) // 1º de janeiro do ano atual
        break
      case 'all':
        fromDate.setFullYear(2010)
        break
    }

    // Busca ativos do tipo selecionado
    const assets = await prisma.asset.findMany({
      where: types.length > 0 ? { type: { in: types } } : undefined,
      include: {
        transactions: {
          where: {
            date: {
              gte: fromDate,
              lte: toDate
            }
          },
          orderBy: {
            date: 'asc'
          }
        },
        prices: {
          where: {
            date: {
              gte: fromDate,
              lte: toDate
            }
          },
          orderBy: {
            date: 'asc'
          }
        }
      }
    })

    // Calcula valores iniciais e finais
    let initialValue = 0
    let finalValue = 0
    let contributions = 0
    let withdrawals = 0
    let dividends = 0

    for (const asset of assets) {
      // Encontra preço mais próximo do início do período
      const initialPrice = asset.prices[0]?.price || 0
      const finalPrice = asset.prices[asset.prices.length - 1]?.price || 0

      // Calcula quantidade no início e fim do período
      let initialQuantity = 0
      let finalQuantity = 0
      
      for (const transaction of asset.transactions) {
        if (transaction.type === 'COMPRA') {
          contributions += transaction.quantity * transaction.price
          finalQuantity += transaction.quantity
        } else {
          withdrawals += transaction.quantity * transaction.price
          finalQuantity -= transaction.quantity
        }
      }

      initialValue += initialQuantity * initialPrice
      finalValue += finalQuantity * finalPrice
    }

    // Calcula retornos
    const absoluteReturn = finalValue - initialValue
    const percentReturn = initialValue > 0 ? (absoluteReturn / initialValue) * 100 : 0
    
    // Calcula retorno ajustado (considerando aportes e retiradas)
    const netContributions = contributions - withdrawals
    const adjustedReturn = netContributions > 0 
      ? ((finalValue - netContributions) / netContributions) * 100 
      : 0

    return NextResponse.json({
      success: true,
      data: {
        period,
        initialValue,
        finalValue,
        absoluteReturn,
        percentReturn,
        contributions,
        withdrawals,
        dividends,
        adjustedReturn
      }
    })
  } catch (error) {
    console.error('Error calculating performance:', error)
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to calculate performance' 
      },
      { status: 500 }
    )
  }
}