import axios from 'axios'

const api = axios.create({
  baseURL: 'https://brapi.dev/api'
})

export interface BrapiQuote {
  symbol: string
  regularMarketPrice: number
  regularMarketChange: number
  regularMarketChangePercent: number
  regularMarketDayHigh: number
  regularMarketDayLow: number
  regularMarketVolume: number
  regularMarketTime: string
}

export async function getBrapiQuote(symbol: string): Promise<BrapiQuote | null> {
  try {
    const response = await api.get(`/quote/${symbol}`)
    return response.data.results[0]
  } catch (error) {
    console.error('Erro ao buscar cotação na BRAPI:', error)
    return null
  }
}

export async function searchBrapiAssets(query: string) {
  try {
    const response = await api.get(`/available`, {
      params: { search: query }
    })
    return response.data.stocks || []
  } catch (error) {
    console.error('Erro ao buscar ativos na BRAPI:', error)
    return []
  }
}

export async function getBrapiHistoricalData(symbol: string, from: Date, to: Date) {
  try {
    const response = await api.get(`/quote/${symbol}/range`, {
      params: {
        interval: '1d',
        fromDate: from.toISOString().split('T')[0],
        toDate: to.toISOString().split('T')[0]
      }
    })
    return response.data.results || []
  } catch (error) {
    console.error('Erro ao buscar dados históricos na BRAPI:', error)
    return []
  }
}