import { NextResponse } from 'next/server'
import { getDyMetrics } from '@/services/dividendYieldMetrics'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || '1y'
    const result = await getDyMetrics(period)
    return NextResponse.json(result)
  } catch (error) {
    console.error('Error fetching DY metrics:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to get DY metrics' },
      { status: 500 }
    )
  }
}
