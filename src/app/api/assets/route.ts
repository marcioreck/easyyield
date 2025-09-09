import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { AssetType, Currency } from '@prisma/client'

export async function GET() {
  try {
    const assets = await prisma.asset.findMany({
      include: {
        _count: {
          select: { transactions: true }
        }
      }
    })
    return NextResponse.json(assets)
  } catch (error) {
    console.error('Error fetching assets:', error)
    return NextResponse.json(
      { error: 'Failed to fetch assets' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    
    // Validar tipo do ativo
    if (!Object.values(AssetType).includes(body.type)) {
      return NextResponse.json(
        { error: 'Invalid asset type' },
        { status: 400 }
      )
    }

    // Validar moeda
    if (!Object.values(Currency).includes(body.currency)) {
      return NextResponse.json(
        { error: 'Invalid currency' },
        { status: 400 }
      )
    }

    const asset = await prisma.asset.create({
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
    console.error('Error creating asset:', error)
    return NextResponse.json(
      { error: 'Failed to create asset' },
      { status: 500 }
    )
  }
}