import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { parseDate } from '@/utils/format'

export async function POST(request: Request) {
  try {
    const data = await request.json()

    // Valida os campos obrigatórios
    if (!data.assetId || !data.type || !data.date || !data.quantity || !data.price) {
      return NextResponse.json(
        { error: 'Todos os campos obrigatórios devem ser preenchidos' },
        { status: 400 }
      )
    }

    // Valida o tipo da operação
    if (!['COMPRA', 'VENDA'].includes(data.type)) {
      return NextResponse.json(
        { error: 'Tipo de operação inválido' },
        { status: 400 }
      )
    }

    // Verifica se o ativo existe
    const asset = await prisma.asset.findUnique({
      where: { id: data.assetId }
    })

    if (!asset) {
      return NextResponse.json(
        { error: 'Ativo não encontrado' },
        { status: 404 }
      )
    }

    // Se for venda, verifica se tem quantidade suficiente
    if (data.type === 'VENDA') {
      const transactions = await prisma.transaction.findMany({
        where: {
          assetId: data.assetId,
          date: {
            lte: data.date
          }
        }
      })

      let quantity = 0
      for (const transaction of transactions) {
        if (transaction.type === 'COMPRA') {
          quantity += transaction.quantity
        } else {
          quantity -= transaction.quantity
        }
      }

      if (data.quantity > quantity) {
        return NextResponse.json(
          { error: `Quantidade insuficiente. Disponível: ${quantity}` },
          { status: 400 }
        )
      }
    }

    // Cria a transação
    const transaction = await prisma.transaction.create({
      data: {
        assetId: data.assetId,
        type: data.type,
        date: new Date(data.date),
        quantity: data.quantity,
        price: data.price,
        fees: data.fees,
        notes: data.notes
      }
    })

    return NextResponse.json({
      success: true,
      transaction
    })
  } catch (error) {
    console.error('Error creating transaction:', error)
    return NextResponse.json(
      { error: 'Erro ao criar transação' },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    const transactions = await prisma.transaction.findMany({
      include: {
        asset: true
      },
      orderBy: {
        date: 'desc'
      }
    })

    return NextResponse.json(transactions)
  } catch (error) {
    console.error('Error fetching transactions:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar transações' },
      { status: 500 }
    )
  }
}