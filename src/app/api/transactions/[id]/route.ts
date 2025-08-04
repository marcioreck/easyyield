import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { parseDate } from '@/utils/format'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const resolvedParams = await params
  try {
    const transaction = await prisma.transaction.findUnique({
      where: { id: resolvedParams.id },
      include: {
        asset: {
          select: {
            ticker: true,
            name: true,
            currency: true
          }
        }
      }
    })

    if (!transaction) {
      return NextResponse.json(
        { error: 'Operação não encontrada' },
        { status: 404 }
      )
    }

    return NextResponse.json(transaction)
  } catch (error) {
    console.error('Error fetching transaction:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar operação' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const resolvedParams = await params
  try {
    const data = await request.json()

    // Converte a data do formato DD/MM/YYYY para Date
    const date = parseDate(data.date)

    const transaction = await prisma.transaction.update({
      where: { id: resolvedParams.id },
      data: {
        date,
        type: data.type,
        quantity: data.quantity,
        price: data.price,
        fees: data.fees || null,
        notes: data.notes || null,
        assetId: data.assetId
      },
      include: {
        asset: {
          select: {
            ticker: true,
            name: true,
            currency: true
          }
        }
      }
    })

    return NextResponse.json(transaction)
  } catch (error) {
    console.error('Error updating transaction:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erro ao atualizar operação' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const resolvedParams = await params
  try {
    // Primeiro, verifica se é uma compra e se tem vendas dependentes
    const transaction = await prisma.transaction.findUnique({
      where: { id: resolvedParams.id },
      include: {
        asset: true
      }
    })

    if (!transaction) {
      return NextResponse.json(
        { error: 'Operação não encontrada' },
        { status: 404 }
      )
    }

    if (transaction.type === 'COMPRA') {
      // Calcula a quantidade disponível após esta compra
      const allTransactions = await prisma.transaction.findMany({
        where: {
          assetId: transaction.assetId,
          date: {
            gte: transaction.date
          }
        },
        orderBy: {
          date: 'asc'
        }
      })

      let balance = 0
      for (const tx of allTransactions) {
        if (tx.id === resolvedParams.id) continue // Ignora a transação que será excluída
        balance += tx.type === 'COMPRA' ? tx.quantity : -tx.quantity
        if (balance < 0) {
          return NextResponse.json(
            { error: 'Não é possível excluir esta compra pois existem vendas que dependem dela' },
            { status: 400 }
          )
        }
      }
    }

    // Se chegou aqui, pode excluir
    await prisma.transaction.delete({
      where: { id: resolvedParams.id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting transaction:', error)
    return NextResponse.json(
      { error: 'Erro ao excluir operação' },
      { status: 500 }
    )
  }
}