import { prisma } from '@/lib/prisma'
import { Asset } from '@prisma/client'
import { getBrapiHistoricalData } from './brapi'
import { getYahooHistoricalData } from './yahoo'

export async function importHistoricalData(asset: Asset) {
  try {
    // Define o período (desde 2010 ou a data mais antiga disponível)
    const fromDate = new Date('2010-01-01')
    const toDate = new Date()

    let historicalData: any[] = []
    let source = ''

    // Tenta BRAPI primeiro para ativos brasileiros
    if (asset.currency === 'BRL') {
      const brapiData = await getBrapiHistoricalData(asset.ticker, fromDate, toDate)
      if (brapiData.length > 0) {
        historicalData = brapiData
        source = 'BRAPI'
      }
    }

    // Se não encontrou na BRAPI ou é ativo americano, tenta Yahoo
    if (historicalData.length === 0) {
      const yahooData = await getYahooHistoricalData(asset.ticker, fromDate, toDate)
      if (yahooData.length > 0) {
        historicalData = yahooData
        source = 'YAHOO'
      }
    }

    if (historicalData.length > 0) {
      // Limpa dados históricos existentes
      await prisma.price.deleteMany({
        where: { assetId: asset.id }
      })

      // Insere novos dados
      const priceData = historicalData.map(d => ({
        assetId: asset.id,
        date: new Date(d.date),
        price: d.close || d.regularMarketPrice,
        volume: d.volume || 0,
        dividendYield: d.dividendYield || null
      }))

      // Insere em lotes para evitar problemas com muitos registros
      const batchSize = 1000
      for (let i = 0; i < priceData.length; i += batchSize) {
        const batch = priceData.slice(i, i + batchSize)
        await prisma.price.createMany({
          data: batch,
          skipDuplicates: true
        })
      }

      return {
        success: true,
        count: historicalData.length,
        source
      }
    }

    return {
      success: false,
      error: 'No historical data found'
    }
  } catch (error) {
    console.error('Error importing historical data:', error)
    return {
      success: false,
      error: error.message
    }
  }
}

export async function getLatestPrice(assetId: string) {
  return prisma.price.findFirst({
    where: { assetId },
    orderBy: { date: 'desc' }
  })
}

export async function getPriceHistory(assetId: string, fromDate: Date, toDate: Date) {
  return prisma.price.findMany({
    where: {
      assetId,
      date: {
        gte: fromDate,
        lte: toDate
      }
    },
    orderBy: { date: 'asc' }
  })
}