import yahooFinance from 'yahoo-finance2'

export interface YahooQuote {
  symbol: string
  regularMarketPrice: number
  regularMarketChange: number
  regularMarketChangePercent: number
  regularMarketDayHigh: number
  regularMarketDayLow: number
  regularMarketVolume: number
  regularMarketTime: Date
}

export async function getYahooQuote(symbol: string): Promise<YahooQuote | null> {
  try {
    // Para ações brasileiras, adiciona .SA ao símbolo
    const yahooSymbol = symbol.includes('.') ? symbol : `${symbol}.SA`
    const quote = await yahooFinance.quote(yahooSymbol)
    return quote
  } catch (error) {
    console.error('Erro ao buscar cotação no Yahoo Finance:', error)
    return null
  }
}

export async function getYahooHistoricalData(symbol: string, from: Date, to: Date) {
  try {
    const yahooSymbol = symbol.includes('.') ? symbol : `${symbol}.SA`
    const queryOptions = {
      period1: from,
      period2: to,
      interval: '1d'
    }
    const result = await yahooFinance.historical(yahooSymbol, queryOptions)
    return result
  } catch (error) {
    console.error('Erro ao buscar dados históricos no Yahoo Finance:', error)
    return []
  }
}

export async function searchYahooAssets(query: string) {
  try {
    const results = await yahooFinance.search(query)
    return results.quotes || []
  } catch (error) {
    console.error('Erro ao buscar ativos no Yahoo Finance:', error)
    return []
  }
}