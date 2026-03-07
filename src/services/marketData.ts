import { getBrapiQuote, getBrapiHistoricalData, searchBrapiAssets } from './brapi'
import { getYahooQuote, getYahooHistoricalData, searchYahooAssets } from './yahoo'
import { Asset } from '@prisma/client'
import {
  getCached,
  setCached,
  cacheKeyQuote,
  cacheKeyHistorical,
  cacheKeySearch,
} from '@/lib/apiCache'
import { logApiSuccess, logApiError } from '@/lib/apiDebug'

export interface MarketQuote {
  symbol: string
  price: number
  change: number
  changePercent: number
  dayHigh: number
  dayLow: number
  volume: number
  timestamp: Date
  source: 'BRAPI' | 'YAHOO'
}

/** Formato serializável para cache (timestamp como ISO) */
interface MarketQuoteCached {
  symbol: string
  price: number
  change: number
  changePercent: number
  dayHigh: number
  dayLow: number
  volume: number
  timestamp: string
  source: 'BRAPI' | 'YAHOO'
}

function toCached(q: MarketQuote): MarketQuoteCached {
  return {
    ...q,
    timestamp: q.timestamp.toISOString(),
  }
}

function fromCached(c: MarketQuoteCached): MarketQuote {
  return {
    ...c,
    timestamp: new Date(c.timestamp),
  }
}

export async function getQuote(asset: Asset): Promise<MarketQuote | null> {
  const key = cacheKeyQuote(asset.currency, asset.ticker)
  const cached = await getCached<MarketQuoteCached>(key)
  if (cached) {
    await logApiSuccess('market', 'quote', key, true, `price ${cached.price}`)
    return fromCached(cached)
  }

  if (asset.currency === 'BRL') {
    const brapiQuote = await getBrapiQuote(asset.ticker)
    if (brapiQuote) {
      const quote: MarketQuote = {
        symbol: brapiQuote.symbol,
        price: brapiQuote.regularMarketPrice,
        change: brapiQuote.regularMarketChange,
        changePercent: brapiQuote.regularMarketChangePercent,
        dayHigh: brapiQuote.regularMarketDayHigh,
        dayLow: brapiQuote.regularMarketDayLow,
        volume: brapiQuote.regularMarketVolume,
        timestamp: new Date(brapiQuote.regularMarketTime),
        source: 'BRAPI',
      }
      await setCached(key, toCached(quote))
      await logApiSuccess('BRAPI', 'quote', key, false, `price ${quote.price}`)
      return quote
    }
  }

  const yahooQuote = await getYahooQuote(asset.ticker)
  if (yahooQuote) {
    const quote: MarketQuote = {
      symbol: yahooQuote.symbol,
      price: yahooQuote.regularMarketPrice,
      change: yahooQuote.regularMarketChange,
      changePercent: yahooQuote.regularMarketChangePercent,
      dayHigh: yahooQuote.regularMarketDayHigh,
      dayLow: yahooQuote.regularMarketDayLow,
      volume: yahooQuote.regularMarketVolume,
      timestamp: yahooQuote.regularMarketTime,
      source: 'YAHOO',
    }
    await setCached(key, toCached(quote))
    await logApiSuccess('YAHOO', 'quote', key, false, `price ${quote.price}`)
    return quote
  }

  await logApiError('market', 'quote', key, 'no data')
  return null
}

export async function getHistoricalData(asset: Asset, from: Date, to: Date) {
  const key = cacheKeyHistorical(asset.currency, asset.ticker, from, to)
  const cached = await getCached<{ data: unknown[]; source: string | null }>(key)
  if (cached) {
    await logApiSuccess('market', 'historical', key, true, `${cached.data.length} points`)
    return cached
  }

  if (asset.currency === 'BRL') {
    const brapiData = await getBrapiHistoricalData(asset.ticker, from, to)
    if (brapiData.length > 0) {
      const result = { data: brapiData, source: 'BRAPI' as const }
      await setCached(key, result)
      await logApiSuccess('BRAPI', 'historical', key, false, `${brapiData.length} points`)
      return result
    }
  }

  const yahooData = await getYahooHistoricalData(asset.ticker, from, to)
  if (yahooData.length > 0) {
    const result = { data: yahooData, source: 'YAHOO' as const }
    await setCached(key, result)
    await logApiSuccess('YAHOO', 'historical', key, false, `${yahooData.length} points`)
    return result
  }

  await logApiError('market', 'historical', key, 'no data')
  return { data: [], source: null }
}

export async function searchAssets(query: string, currency: 'BRL' | 'USD' = 'BRL') {
  const key = cacheKeySearch(currency, query)
  const cached = await getCached<Array<Record<string, unknown> & { source: string }>>(key)
  if (cached) {
    await logApiSuccess('market', 'search', key, true, `${cached.length} results`)
    return cached
  }

  const results: Array<Record<string, unknown> & { source: string }> = []

  if (currency === 'BRL') {
    const brapiResults = await searchBrapiAssets(query)
    results.push(
      ...brapiResults.map((r) => ({
        ...r,
        source: 'BRAPI',
      }))
    )
  }

  const yahooResults = await searchYahooAssets(query)
  results.push(
    ...yahooResults.map((r) => ({
      ...r,
      source: 'YAHOO',
    }))
  )

  await setCached(key, results)
  await logApiSuccess('market', 'search', key, false, `${results.length} results`)
  return results
}
