import { prisma } from '@/lib/prisma'
import { Asset } from '@prisma/client'
import { getBrapiQuoteWithDividends, BrapiDividend } from './brapi'

/**
 * Importa dividendos de um ativo a partir da BRAPI (Brasil).
 * Para ativos USD/REIT, pode ser estendido com Yahoo ou outra fonte.
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

  try {
    const { dividends } = await getBrapiQuoteWithDividends(asset.ticker)
    if (!dividends || !Array.isArray(dividends) || dividends.length === 0) {
      return { success: true, count: 0, source: 'BRAPI' }
    }

    let inserted = 0
    for (const d of dividends as BrapiDividend[]) {
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
    console.error('Error importing dividends:', err)
    return {
      success: false,
      count: 0,
      source: 'BRAPI',
      error: err instanceof Error ? err.message : String(err)
    }
  }
}
