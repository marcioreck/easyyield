import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { importHistoricalData } from '@/services/priceHistory'

interface RouteParams {
  params: {
    id: string
  }
}

export async function POST(request: Request, { params }: RouteParams) {
  try {
    const asset = await prisma.asset.findUnique({
      where: { id: params.id }
    })

    if (!asset) {
      return NextResponse.json(
        { error: 'Asset not found' },
        { status: 404 }
      )
    }

    const result = await importHistoricalData(asset)
    return NextResponse.json(result)
  } catch (error) {
    console.error('Error importing historical data:', error)
    return NextResponse.json(
      { error: 'Failed to import historical data' },
      { status: 500 }
    )
  }
}