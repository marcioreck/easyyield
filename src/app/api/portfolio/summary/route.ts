import { NextResponse } from 'next/server'
import { calculatePortfolioSummary } from '@/services/calculations'

export async function GET() {
  try {
    const summary = await calculatePortfolioSummary()
    if (!summary) {
      return NextResponse.json(
        { error: 'Failed to calculate portfolio summary' },
        { status: 500 }
      )
    }

    return NextResponse.json(summary)
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}