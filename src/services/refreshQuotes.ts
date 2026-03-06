import { prisma } from '@/lib/prisma'
import { getQuote } from './marketData'

const APP_SETTING_LAST_REFRESH = 'marketDataLastRefreshAt'
const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000

export async function getLastRefreshAt(): Promise<Date | null> {
  const row = await prisma.appSetting.findUnique({
    where: { key: APP_SETTING_LAST_REFRESH }
  })
  if (!row?.value) return null
  const date = new Date(row.value)
  return isNaN(date.getTime()) ? null : date
}

export async function setLastRefreshAt(date: Date): Promise<void> {
  await prisma.appSetting.upsert({
    where: { key: APP_SETTING_LAST_REFRESH },
    create: { key: APP_SETTING_LAST_REFRESH, value: date.toISOString() },
    update: { value: date.toISOString() }
  })
}

export async function shouldRunDailyRefresh(): Promise<boolean> {
  const last = await getLastRefreshAt()
  if (!last) return true
  return Date.now() - last.getTime() >= TWENTY_FOUR_HOURS_MS
}

export interface RefreshAllResult {
  updated: number
  failed: number
  errors: { ticker: string; error: string }[]
}

/**
 * Atualiza cotações de todos os ativos cadastrados e persiste em Price.
 * Usado ao abrir a aplicação e/ou uma vez por dia.
 */
export async function refreshAllQuotes(): Promise<RefreshAllResult> {
  const assets = await prisma.asset.findMany()
  const result: RefreshAllResult = { updated: 0, failed: 0, errors: [] }
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  for (const asset of assets) {
    try {
      const quote = await getQuote(asset)
      if (!quote) {
        result.failed += 1
        result.errors.push({ ticker: asset.ticker, error: 'Cotação não encontrada' })
        continue
      }
      const quoteDate = new Date(quote.timestamp)
      quoteDate.setHours(0, 0, 0, 0)

      await prisma.price.upsert({
        where: {
          assetId_date: {
            assetId: asset.id,
            date: quoteDate
          }
        },
        create: {
          assetId: asset.id,
          date: quoteDate,
          price: quote.price,
          volume: quote.volume,
          dividendYield: (quote as { dividendYield?: number | null }).dividendYield ?? null
        },
        update: {
          price: quote.price,
          volume: quote.volume,
          dividendYield: (quote as { dividendYield?: number | null }).dividendYield ?? null
        }
      })
      result.updated += 1
    } catch (err) {
      result.failed += 1
      result.errors.push({
        ticker: asset.ticker,
        error: err instanceof Error ? err.message : String(err)
      })
    }
  }

  await setLastRefreshAt(new Date())
  return result
}
