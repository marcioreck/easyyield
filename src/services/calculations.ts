import { prisma } from '@/lib/prisma'
import { Asset, Transaction } from '@prisma/client'
import { getLatestPrice } from './priceHistory'

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
      lastDividendYield: latestPrice?.dividendYield || null
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

    const transactions = await prisma.transaction.findMany({
      where: {
        assetId,
        date: {
          lte: toDate
        }
      },
      orderBy: { date: 'asc' }
    })

    let history = []
    let quantity = 0
    let totalInvested = 0
    let averagePrice = 0

    for (const price of prices) {
      // Atualiza posição com transações até esta data
      while (transactions.length > 0 && transactions[0].date <= price.date) {
        const transaction = transactions.shift()!
        if (transaction.type === 'COMPRA') {
          quantity += transaction.quantity
          totalInvested += transaction.quantity * transaction.price
          averagePrice = totalInvested / quantity
        } else {
          quantity -= transaction.quantity
          totalInvested = quantity * averagePrice
        }
      }

      history.push({
        date: price.date,
        price: price.price,
        quantity,
        averagePrice,
        totalInvested,
        currentTotal: quantity * price.price,
        absoluteReturn: (quantity * price.price) - totalInvested,
        percentReturn: totalInvested > 0 ? (((quantity * price.price) - totalInvested) / totalInvested) * 100 : 0,
        dividendYield: price.dividendYield
      })
    }

    return history
  } catch (error) {
    console.error('Error calculating asset history:', error)
    return null
  }
}