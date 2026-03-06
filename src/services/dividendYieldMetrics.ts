import { prisma } from '@/lib/prisma'
import { getLatestPrice } from './priceHistory'
import { calculateAssetPosition } from './calculations'

/**
 * DY mensal: soma dos dividendos do mês / valor do ativo no fim do mês (ou valor atual).
 * DY acumulado: soma dos dividendos no período / valor médio ou inicial no período.
 * DY anual: soma dos dividendos nos últimos 12 meses / valor atual.
 */

export interface DyMetricRow {
  assetId: string
  ticker: string
  type: string
  currency: string
  dyMonthly: number | null
  dyAccumulated: number | null
  dyAnnual: number | null
  dividendsInPeriod: number
  currentValue: number | null
}

function getPeriodDates(period: string): { from: Date; to: Date } {
  const to = new Date()
  const from = new Date()
  switch (period) {
    case '1m':
      from.setMonth(from.getMonth() - 1)
      break
    case '3m':
      from.setMonth(from.getMonth() - 3)
      break
    case '6m':
      from.setMonth(from.getMonth() - 6)
      break
    case '1y':
    case 'ytd':
      from.setFullYear(from.getFullYear() - 1)
      break
    case 'all':
      from.setFullYear(2010, 0, 1)
      break
    default:
      from.setFullYear(from.getFullYear() - 1)
  }
  if (period === 'ytd') {
    from.setMonth(0, 1)
    from.setHours(0, 0, 0, 0)
  }
  return { from, to }
}

function startOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1)
}

function endOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999)
}

export async function getDyMetrics(period: string = '1y'): Promise<{
  period: string
  metrics: DyMetricRow[]
}> {
  const { from, to } = getPeriodDates(period)
  const twelveMonthsAgoStart = new Date()
  twelveMonthsAgoStart.setFullYear(twelveMonthsAgoStart.getFullYear() - 1)
  twelveMonthsAgoStart.setMonth(twelveMonthsAgoStart.getMonth() - 1, 1)

  const assets = await prisma.asset.findMany({
    include: {
      dividends: {
        where: { date: { gte: twelveMonthsAgoStart } },
        orderBy: { date: 'asc' }
      }
    }
  })

  const metrics: DyMetricRow[] = []

  for (const asset of assets) {
    const position = await calculateAssetPosition(asset.id)
    const currentValue = position?.currentTotal ?? null
    const latestPrice = await getLatestPrice(asset.id)

    const now = new Date()
    const lastMonthStart = startOfMonth(new Date(now.getFullYear(), now.getMonth() - 1))
    const lastMonthEnd = endOfMonth(lastMonthStart)
    const twelveMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 11, 1)

    const dividendsLastMonth = asset.dividends.filter(
      (d) => d.date >= lastMonthStart && d.date <= lastMonthEnd
    )
    const dividendsInPeriod = asset.dividends.filter(
      (d) => d.date >= from && d.date <= to
    )
    const dividendsLast12M = asset.dividends.filter((d) => d.date >= twelveMonthsAgo)

    const sumDiv = (list: { value: number }[]) => list.reduce((s, d) => s + d.value, 0)
    const sumLastMonth = sumDiv(dividendsLastMonth)
    const sumInPeriod = sumDiv(dividendsInPeriod)
    const sumLast12M = sumDiv(dividendsLast12M)

    let dyMonthly: number | null = null
    if (currentValue != null && currentValue > 0 && sumLastMonth > 0) {
      dyMonthly = (sumLastMonth / currentValue) * 100
    }

    let dyAccumulated: number | null = null
    if (currentValue != null && currentValue > 0 && sumInPeriod > 0) {
      dyAccumulated = (sumInPeriod / currentValue) * 100
    }

    let dyAnnual: number | null = null
    if (currentValue != null && currentValue > 0 && sumLast12M > 0) {
      dyAnnual = (sumLast12M / currentValue) * 100
    }

    if (dyMonthly == null && dyAnnual == null && position?.lastDividendYield != null) {
      dyAnnual = position.lastDividendYield
    }
    if (dyMonthly == null && latestPrice?.dividendYield != null) {
      dyMonthly = (latestPrice.dividendYield / 12)
    }

    metrics.push({
      assetId: asset.id,
      ticker: asset.ticker,
      type: asset.type,
      currency: asset.currency,
      dyMonthly,
      dyAccumulated,
      dyAnnual,
      dividendsInPeriod: sumInPeriod,
      currentValue
    })
  }

  return { period, metrics }
}
