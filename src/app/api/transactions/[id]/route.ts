import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Verifica se a transação existe
    const transaction = await prisma.transaction.findUnique({
      where: { id: params.id },
      include: { asset: true }
    })

    if (!transaction) {
      return NextResponse.json(
        { error: 'Transação não encontrada' },
        { status: 404 }
      )
    }

    // Se for uma venda, não precisa verificar nada
    // Se for uma compra, precisa verificar se tem vendas posteriores que dependem dela
    if (transaction.type === 'COMPRA') {
      // Busca todas as transações posteriores do mesmo ativo
      const laterTransactions = await prisma.transaction.findMany({
        where: {
          assetId: transaction.assetId,
          date: {
            gt: transaction.date
          }
        },
        orderBy: {
          date: 'asc'
        }
      })

      // Calcula o saldo disponível após cada transação
      let balance = -transaction.quantity // Remove a quantidade da transação que será deletada
      for (const t of laterTransactions) {
        if (t.type === 'COMPRA') {
          balance += t.quantity
        } else {
          balance -= t.quantity
          if (balance < 0) {
            return NextResponse.json(
              {
                error: 'Não é possível excluir esta compra pois existem vendas posteriores que dependem dela'
              },
              { status: 400 }
            )
          }
        }
      }
    }

    // Deleta a transação
    await prisma.transaction.delete({
      where: { id: params.id }
    })

    return NextResponse.json({
      success: true,
      message: 'Transação excluída com sucesso'
    })
  } catch (error) {
    console.error('Error deleting transaction:', error)
    return NextResponse.json(
      { error: 'Erro ao excluir transação' },
      { status: 500 }
    )
  }
}