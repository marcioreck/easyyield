import { NextResponse } from 'next/server'
import {
  refreshAllQuotes,
  getLastRefreshAt,
  shouldRunDailyRefresh
} from '@/services/refreshQuotes'

/**
 * GET: Atualiza cotações de todos os ativos (uma vez por dia ou com ?force=true).
 * Usado ao abrir a aplicação e por job diário.
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const force = searchParams.get('force') === 'true'

    if (!force) {
      const shouldRun = await shouldRunDailyRefresh()
      if (!shouldRun) {
        const lastRefreshAt = await getLastRefreshAt()
        return NextResponse.json({
          skipped: true,
          reason: 'Última atualização há menos de 24h',
          lastRefreshAt: lastRefreshAt?.toISOString() ?? null
        })
      }
    }

    const result = await refreshAllQuotes()
    const lastRefreshAt = await getLastRefreshAt()

    return NextResponse.json({
      ...result,
      lastRefreshAt: lastRefreshAt?.toISOString() ?? null
    })
  } catch (error) {
    console.error('Error in refresh-all:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to refresh quotes' },
      { status: 500 }
    )
  }
}
