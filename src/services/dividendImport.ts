import { prisma } from '@/lib/prisma'
import { Asset } from '@prisma/client'
import { getBrapiQuoteWithDividends, BrapiDividend } from './brapi'
import { getCached, setCached, cacheKeyBrapiDividends } from '@/lib/apiCache'
import { logApiSuccess, logApiError } from '@/lib/apiDebug'

/**
 * Importa dividendos de um ativo a partir da BRAPI (Brasil).
 * Para ativos USD/REIT, pode ser estendido com Yahoo ou outra fonte.
 * Usa cache para não repetir chamadas e respeitar rate limits.
 */
export async function importDividendsForAsset(asset: Asset): Promise<{
  success: boolean
  count: number
  source: string
  error?: string
}> {
  if (asset.currency !== 'BRL') {
    return { success: false, count: 0, source: 'BRAPI', error: 'Moeda não suportada para importação de dividendos' }
  }

  const cacheKey = cacheKeyBrapiDividends(asset.ticker)

  try {
    let dividends: BrapiDividend[] | undefined
    const cached = await getCached<{ dividends?: BrapiDividend[] }>(cacheKey)
    if (cached?.dividends) {
      await logApiSuccess('BRAPI', 'dividends', cacheKey, true, `${cached.dividends.length} items`)
      dividends = cached.dividends
    } else {
      const result = await getBrapiQuoteWithDividends(asset.ticker)
      dividends = result.dividends
      await setCached(cacheKey, { dividends: dividends ?? [] })
      await logApiSuccess('BRAPI', 'dividends', cacheKey, false, `${dividends?.length ?? 0} items`)
    }
    if (!dividends || !Array.isArray(dividends) || dividends.length === 0) {
      return { success: true, count: 0, source: 'BRAPI' }
    }

    let inserted = 0
    for (const d of dividends) {
      const date = d.date ? new Date(d.date) : null
      const value = typeof d.amount === 'number' ? d.amount : parseFloat(String(d.amount))
      if (!date || isNaN(date.getTime()) || isNaN(value)) continue
      const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate())

      await prisma.dividend.upsert({
        where: {
          assetId_date: {
            assetId: asset.id,
            date: dateOnly
          }
        },
        create: {
          assetId: asset.id,
          date: dateOnly,
          value,
          type: d.type ?? 'DIVIDENDO'
        },
        update: { value, type: d.type ?? 'DIVIDENDO' }
      })
      inserted++
    }

    return { success: true, count: inserted, source: 'BRAPI' }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    await logApiError('BRAPI', 'dividends', cacheKey, msg)
    return {
      success: false,
      count: 0,
      source: 'BRAPI',
      error: msg
    }
  }
}
