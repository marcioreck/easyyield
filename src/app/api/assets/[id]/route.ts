import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { AssetType, Currency } from '@prisma/client'

interface RouteParams {
  params: {
    id: string
  }
}

export async function GET(request: Request, { params }: RouteParams) {
  try {
    const resolvedParams = await params
    const asset = await prisma.asset.findUnique({
      where: { id: resolvedParams.id },
      include: {
        transactions: true,
        prices: {
          orderBy: { date: 'desc' },
          take: 1
        }
      }
    })

    if (!asset) {
      return NextResponse.json(
        { error: 'Asset not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(asset)
  } catch (error) {
    console.error('Error fetching asset:', error)
    return NextResponse.json(
      { error: 'Failed to fetch asset' },
      { status: 500 }
    )
  }
}

export async function PUT(request: Request, { params }: RouteParams) {
  try {
    const resolvedParams = await params
    const body = await request.json()
    
    // Validar tipo do ativo
    if (body.type && !Object.values(AssetType).includes(body.type)) {
      return NextResponse.json(
        { error: 'Invalid asset type' },
        { status: 400 }
      )
    }

    // Validar moeda
    if (body.currency && !Object.values(Currency).includes(body.currency)) {
      return NextResponse.json(
        { error: 'Invalid currency' },
        { status: 400 }
      )
    }

    const asset = await prisma.asset.update({
      where: { id: resolvedParams.id },
      data: {
        ticker: body.ticker,
        name: body.name,
        type: body.type,
        currency: body.currency,
        description: body.description,
        sector: body.sector,
        dividendYield: body.dividendYield,
        priceToEarnings: body.priceToEarnings,
        priceToBook: body.priceToBook,
        netMargin: body.netMargin,
        roic: body.roic,
        // Campos específicos para renda fixa
        indexador: body.indexador || null,
        taxa: body.taxa ? parseFloat(body.taxa) : null,
        vencimento: body.vencimento ? new Date(body.vencimento) : null,
        pagaJurosSemestrais: body.pagaJurosSemestrais || false,
      }
    })

    return NextResponse.json(asset)
  } catch (error) {
    console.error('Error updating asset:', error)
    return NextResponse.json(
      { error: 'Failed to update asset' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const resolvedParams = await params
    await prisma.asset.delete({
      where: { id: resolvedParams.id }
    })

    return new NextResponse(null, { status: 204 })
  } catch (error) {
    console.error('Error deleting asset:', error)
    return NextResponse.json(
      { error: 'Failed to delete asset' },
      { status: 500 }
    )
  }
}