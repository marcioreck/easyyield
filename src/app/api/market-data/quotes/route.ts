import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getQuote } from '@/services/marketData'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const assetId = searchParams.get('assetId')
  
  if (!assetId) {
    return NextResponse.json(
      { error: 'Asset ID is required' },
      { status: 400 }
    )
  }

  try {
    const asset = await prisma.asset.findUnique({
      where: { id: assetId }
    })

    if (!asset) {
      return NextResponse.json(
        { error: 'Asset not found' },
        { status: 404 }
      )
    }

    const quote = await getQuote(asset)
    
    if (!quote) {
      return NextResponse.json(
        { error: 'Quote not found' },
        { status: 404 }
      )
    }

    // Salva o preço no histórico
    await prisma.price.create({
      data: {
        assetId: asset.id,
        date: quote.timestamp,
        price: quote.price,
        volume: quote.volume
      }
    })

    return NextResponse.json(quote)
  } catch (error) {
    console.error('Error fetching quote:', error)
    return NextResponse.json(
      { error: 'Failed to fetch quote' },
      { status: 500 }
    )
  }
}