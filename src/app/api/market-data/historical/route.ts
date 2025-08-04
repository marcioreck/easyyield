import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getHistoricalData } from '@/services/marketData'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const assetId = searchParams.get('assetId')
  const fromDate = searchParams.get('from')
  const toDate = searchParams.get('to')
  
  if (!assetId || !fromDate || !toDate) {
    return NextResponse.json(
      { error: 'Asset ID, from and to dates are required' },
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

    // Primeiro busca dados do banco local
    const localPrices = await prisma.price.findMany({
      where: {
        assetId: asset.id,
        date: {
          gte: new Date(fromDate),
          lte: new Date(toDate)
        }
      },
      orderBy: {
        date: 'asc'
      }
    })

    // Se não tiver dados suficientes, busca da API
    if (localPrices.length === 0) {
      const historicalData = await getHistoricalData(
        asset,
        new Date(fromDate),
        new Date(toDate)
      )

      if (historicalData.data.length > 0) {
        // Salva os dados no banco
        await prisma.price.createMany({
          data: historicalData.data.map(d => ({
            assetId: asset.id,
            date: new Date(d.date),
            price: d.close,
            volume: d.volume
          }))
        })

        return NextResponse.json({
          data: historicalData.data,
          source: historicalData.source
        })
      }
    }

    return NextResponse.json({
      data: localPrices,
      source: 'LOCAL'
    })
  } catch (error) {
    console.error('Error fetching historical data:', error)
    return NextResponse.json(
      { error: 'Failed to fetch historical data' },
      { status: 500 }
    )
  }
}