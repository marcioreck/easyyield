import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const { assetId, price, date } = await request.json()
    
    // Adicionar preço
    const newPrice = await prisma.price.create({
      data: {
        assetId,
        price: parseFloat(price),
        date: date ? new Date(date) : new Date(),
        volume: 0
      }
    })

    return NextResponse.json({
      success: true,
      price: newPrice,
      message: 'Preço adicionado com sucesso!'
    })

  } catch (error) {
    console.error('Erro ao adicionar preço:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Erro interno do servidor'
      },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    // Lista todos os ativos para facilitar a adição de preços
    const assets = await prisma.asset.findMany({
      select: {
        id: true,
        ticker: true,
        name: true,
        type: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json({
      success: true,
      assets
    })

  } catch (error) {
    console.error('Erro ao buscar ativos:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Erro interno do servidor'
      },
      { status: 500 }
    )
  }
}
