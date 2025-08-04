import { getBrapiQuote, getBrapiHistoricalData, searchBrapiAssets } from './brapi'
import { getYahooQuote, getYahooHistoricalData, searchYahooAssets } from './yahoo'
import { Asset } from '@prisma/client'

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

export async function getQuote(asset: Asset): Promise<MarketQuote | null> {
  // Tenta primeiro a BRAPI para ativos brasileiros
  if (asset.currency === 'BRL') {
    const brapiQuote = await getBrapiQuote(asset.ticker)
    if (brapiQuote) {
      return {
        symbol: brapiQuote.symbol,
        price: brapiQuote.regularMarketPrice,
        change: brapiQuote.regularMarketChange,
        changePercent: brapiQuote.regularMarketChangePercent,
        dayHigh: brapiQuote.regularMarketDayHigh,
        dayLow: brapiQuote.regularMarketDayLow,
        volume: brapiQuote.regularMarketVolume,
        timestamp: new Date(brapiQuote.regularMarketTime),
        source: 'BRAPI'
      }
    }
  }

  // Fallback para Yahoo Finance
  const yahooQuote = await getYahooQuote(asset.ticker)
  if (yahooQuote) {
    return {
      symbol: yahooQuote.symbol,
      price: yahooQuote.regularMarketPrice,
      change: yahooQuote.regularMarketChange,
      changePercent: yahooQuote.regularMarketChangePercent,
      dayHigh: yahooQuote.regularMarketDayHigh,
      dayLow: yahooQuote.regularMarketDayLow,
      volume: yahooQuote.regularMarketVolume,
      timestamp: yahooQuote.regularMarketTime,
      source: 'YAHOO'
    }
  }

  return null
}

export async function getHistoricalData(asset: Asset, from: Date, to: Date) {
  // Tenta primeiro a BRAPI para ativos brasileiros
  if (asset.currency === 'BRL') {
    const brapiData = await getBrapiHistoricalData(asset.ticker, from, to)
    if (brapiData.length > 0) {
      return {
        data: brapiData,
        source: 'BRAPI'
      }
    }
  }

  // Fallback para Yahoo Finance
  const yahooData = await getYahooHistoricalData(asset.ticker, from, to)
  if (yahooData.length > 0) {
    return {
      data: yahooData,
      source: 'YAHOO'
    }
  }

  return {
    data: [],
    source: null
  }
}

export async function searchAssets(query: string, currency: 'BRL' | 'USD' = 'BRL') {
  const results = []

  if (currency === 'BRL') {
    const brapiResults = await searchBrapiAssets(query)
    results.push(...brapiResults.map(r => ({
      ...r,
      source: 'BRAPI'
    })))
  }

  const yahooResults = await searchYahooAssets(query)
  results.push(...yahooResults.map(r => ({
    ...r,
    source: 'YAHOO'
  })))

  return results
}