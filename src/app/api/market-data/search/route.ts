import { NextResponse } from 'next/server'
import { MarketDataService } from '@/config/api'

const marketDataService = new MarketDataService()

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const query = searchParams.get('q')
  
  if (!query) {
    return NextResponse.json(
      { error: 'Search query is required' },
      { status: 400 }
    )
  }

  try {
    const results = await marketDataService.searchAssets(query)
    return NextResponse.json(results)
  } catch (error) {
    console.error('Error searching assets:', error)
    return NextResponse.json(
      { error: 'Failed to search assets' },
      { status: 500 }
    )
  }
}