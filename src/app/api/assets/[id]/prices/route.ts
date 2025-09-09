import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

interface RouteParams {
  params: {
    id: string
  }
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const prices = await prisma.price.findMany({
      where: {
        assetId: params.id
      },
      include: {
        asset: true
      },
      orderBy: {
        date: 'desc'
      }
    })

    return NextResponse.json(prices)
  } catch (error) {
    console.error('Error fetching prices:', error)
    return NextResponse.json(
      { error: 'Failed to fetch prices' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const body = await request.json()
    
    const price = await prisma.price.create({
      data: {
        assetId: params.id,
        price: parseFloat(body.price),
        date: new Date(body.date),
        volume: body.volume ? parseFloat(body.volume) : 0
      }
    })

    return NextResponse.json(price)
  } catch (error) {
    console.error('Error creating price:', error)
    return NextResponse.json(
      { error: 'Failed to create price' },
      { status: 500 }
    )
  }
}
