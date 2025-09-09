import { prisma } from '@/lib/prisma'
import { Asset, Transaction } from '@prisma/client'
import { getLatestPrice } from './priceHistory'
import { calculateTreasuryIPCADividendYield, isTreasuryIPCA } from './treasuryCalculations'

export interface AssetPosition {
  asset: Asset
  quantity: number
  averagePrice: number
  totalCost: number
  currentPrice: number | null
  currentTotal: number | null
  absoluteReturn: number | null
  percentReturn: number | null
  lastDividendYield: number | null
}

export async function calculateAssetPosition(assetId: string): Promise<AssetPosition | null> {
  try {
    const asset = await prisma.asset.findUnique({
      where: { id: assetId },
      include: {
        transactions: {
          orderBy: { date: 'asc' }
        }
      }
    })

    if (!asset || !asset.transactions.length) {
      return null
    }

    let quantity = 0
    let totalInvested = 0
    let totalQuantityBought = 0
    let totalCostBought = 0

    // Calcula posição atual e preço médio
    for (const transaction of asset.transactions) {
      if (transaction.type === 'COMPRA') {
        quantity += transaction.quantity
        totalInvested += transaction.quantity * transaction.price
        totalQuantityBought += transaction.quantity
        totalCostBought += transaction.quantity * transaction.price
      } else {
        quantity -= transaction.quantity
      }
    }

    const averagePrice = totalQuantityBought > 0 ? totalCostBought / totalQuantityBought : 0
    const latestPrice = await getLatestPrice(assetId)
    
    // Calcula dividend yield específico para cada tipo de ativo
    let dividendYield = latestPrice?.dividendYield || null
    
    // Para Tesouro IPCA+, calcula DY específico
    if (latestPrice && isTreasuryIPCA(asset)) {
      const treasuryDY = calculateTreasuryIPCADividendYield(
        asset,
        latestPrice.price,
        latestPrice.date
      )
      if (treasuryDY !== null) {
        dividendYield = treasuryDY
      }
    }

    return {
      asset,
      quantity,
      averagePrice,
      totalCost: totalInvested,
      currentPrice: latestPrice?.price || null,
      currentTotal: latestPrice ? quantity * latestPrice.price : null,
      absoluteReturn: latestPrice ? (quantity * latestPrice.price) - totalInvested : null,
      percentReturn: latestPrice && totalInvested > 0 
        ? (((quantity * latestPrice.price) - totalInvested) / totalInvested) * 100 
        : null,
      lastDividendYield: dividendYield
    }
  } catch (error) {
    console.error('Error calculating asset position:', error)
    return null
  }
}

export async function calculatePortfolioSummary() {
  try {
    const assets = await prisma.asset.findMany({
      include: {
        transactions: true
      }
    })

    let totalInvested = 0
    let currentTotal = 0
    let positions: AssetPosition[] = []

    for (const asset of assets) {
      const position = await calculateAssetPosition(asset.id)
      if (position) {
        positions.push(position)
        totalInvested += position.totalCost
        if (position.currentTotal) {
          currentTotal += position.currentTotal
        }
      }
    }

    return {
      totalInvested,
      currentTotal,
      absoluteReturn: currentTotal - totalInvested,
      percentReturn: totalInvested > 0 ? ((currentTotal - totalInvested) / totalInvested) * 100 : 0,
      positions
    }
  } catch (error) {
    console.error('Error calculating portfolio summary:', error)
    return null
  }
}

export async function calculateAssetHistory(assetId: string, fromDate: Date, toDate: Date) {
  try {
    // Busca preços no período especificado
    const prices = await prisma.price.findMany({
      where: {
        assetId,
        date: {
          gte: fromDate,
          lte: toDate
        }
      },
      orderBy: { date: 'asc' }
    })

    // Busca TODAS as transações até a data final (para calcular posição correta)
    const allTransactions = await prisma.transaction.findMany({
      where: {
        assetId,
        date: {
          lte: toDate
        }
      },
      orderBy: { date: 'asc' }
    })

    // Calcula posição inicial (antes do fromDate)
    let quantity = 0
    let totalInvested = 0
    let transactionsInPeriod = [...allTransactions]
    
    // Processa transações antes do período para ter posição inicial correta
    const transactionsBeforePeriod = allTransactions.filter(t => t.date < fromDate)
    for (const transaction of transactionsBeforePeriod) {
      if (transaction.type === 'COMPRA') {
        quantity += transaction.quantity
        totalInvested += transaction.quantity * transaction.price
      } else {
        quantity -= transaction.quantity
        // Mantém o custo médio proporcional
        if (quantity > 0) {
          const avgPrice = totalInvested / (quantity + transaction.quantity)
          totalInvested = quantity * avgPrice
        } else {
          totalInvested = 0
        }
      }
    }
    
    // Filtra transações para só as do período
    transactionsInPeriod = allTransactions.filter(t => t.date >= fromDate && t.date <= toDate)

    const history = []
    let currentQuantity = quantity
    let currentTotalInvested = totalInvested
    const averagePrice = currentQuantity > 0 ? currentTotalInvested / currentQuantity : 0

    for (const price of prices) {
      // Atualiza posição com transações até esta data
      while (transactionsInPeriod.length > 0 && transactionsInPeriod[0].date <= price.date) {
        const transaction = transactionsInPeriod.shift()!
        if (transaction.type === 'COMPRA') {
          currentQuantity += transaction.quantity
          currentTotalInvested += transaction.quantity * transaction.price
        } else {
          currentQuantity -= transaction.quantity
          // Mantém custo médio proporcional
          if (currentQuantity > 0) {
            const avgPrice = currentTotalInvested / (currentQuantity + transaction.quantity)
            currentTotalInvested = currentQuantity * avgPrice
          } else {
            currentTotalInvested = 0
          }
        }
      }

      const currentTotal = currentQuantity * price.price
      const absoluteReturn = currentTotal - currentTotalInvested
      const percentReturn = currentTotalInvested > 0 ? (absoluteReturn / currentTotalInvested) * 100 : 0

      history.push({
        date: price.date,
        price: price.price,
        quantity: currentQuantity,
        averagePrice: currentQuantity > 0 ? currentTotalInvested / currentQuantity : 0,
        totalInvested: currentTotalInvested,
        currentTotal,
        absoluteReturn,
        percentReturn,
        dividendYield: price.dividendYield
      })
    }

    return history
  } catch (error) {
    console.error('Error calculating asset history:', error)
    return null
  }
}