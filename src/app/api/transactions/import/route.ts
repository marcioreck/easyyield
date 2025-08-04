import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

interface ImportTransaction {
  date: string
  type: 'COMPRA' | 'VENDA'
  ticker: string
  quantity: number
  price: number
  fees?: number
  notes?: string
}

export async function POST(request: Request) {
  try {
    const { transactions } = await request.json() as { transactions: ImportTransaction[] }

    // Valida todas as transações antes de importar
    for (const transaction of transactions) {
      const asset = await prisma.asset.findFirst({
        where: { ticker: transaction.ticker }
      })

      if (!asset) {
        return NextResponse.json(
          { error: `Ativo não encontrado: ${transaction.ticker}` },
          { status: 400 }
        )
      }

      // Se for venda, verifica se tem quantidade suficiente
      if (transaction.type === 'VENDA') {
        const previousTransactions = await prisma.transaction.findMany({
          where: {
            assetId: asset.id,
            date: {
              lt: new Date(transaction.date)
            }
          }
        })

        let quantity = 0
        for (const prev of previousTransactions) {
          if (prev.type === 'COMPRA') {
            quantity += prev.quantity
          } else {
            quantity -= prev.quantity
          }
        }

        if (transaction.quantity > quantity) {
          return NextResponse.json(
            { error: `Quantidade insuficiente para venda de ${transaction.ticker}` },
            { status: 400 }
          )
        }
      }
    }

    // Importa as transações
    const imported = await Promise.all(
      transactions.map(async transaction => {
        const asset = await prisma.asset.findFirst({
          where: { ticker: transaction.ticker }
        })

        return prisma.transaction.create({
          data: {
            assetId: asset!.id,
            type: transaction.type,
            date: new Date(transaction.date),
            quantity: transaction.quantity,
            price: transaction.price,
            fees: transaction.fees,
            notes: transaction.notes
          }
        })
      })
    )

    return NextResponse.json({
      success: true,
      count: imported.length
    })
  } catch (error) {
    console.error('Error importing transactions:', error)
    return NextResponse.json(
      { error: 'Failed to import transactions' },
      { status: 500 }
    )
  }
}