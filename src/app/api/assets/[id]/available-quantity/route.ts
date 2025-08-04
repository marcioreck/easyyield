import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Verifica se o ativo existe
    const asset = await prisma.asset.findUnique({
      where: { id: params.id }
    })

    if (!asset) {
      return NextResponse.json(
        { error: 'Ativo não encontrado' },
        { status: 404 }
      )
    }

    // Busca todas as transações do ativo
    const transactions = await prisma.transaction.findMany({
      where: {
        assetId: params.id
      },
      orderBy: {
        date: 'asc'
      }
    })

    // Calcula a quantidade disponível
    let quantity = 0
    for (const transaction of transactions) {
      if (transaction.type === 'COMPRA') {
        quantity += transaction.quantity
      } else {
        quantity -= transaction.quantity
      }
    }

    return NextResponse.json({
      success: true,
      quantity
    })
  } catch (error) {
    console.error('Error calculating available quantity:', error)
    return NextResponse.json(
      { error: 'Erro ao calcular quantidade disponível' },
      { status: 500 }
    )
  }
}