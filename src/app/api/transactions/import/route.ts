import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { parseDate } from '@/utils/format'

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
    const results = []
    const errors = []

    // Processa cada transação
    for (let i = 0; i < transactions.length; i++) {
      try {
        const transaction = transactions[i]
        console.log('Processing transaction:', transaction) // Debug log

        // Busca o ativo pelo ticker
        const asset = await prisma.asset.findFirst({
          where: { ticker: transaction.ticker }
        })

        if (!asset) {
          throw new Error(`Ativo não encontrado: ${transaction.ticker}`)
        }

        // Converte a data
        let transactionDate: Date
        try {
          transactionDate = parseDate(transaction.date)
        } catch (error) {
          throw new Error(`Data inválida: ${transaction.date}. Use o formato DD/MM/YYYY`)
        }

        // Se for venda, verifica quantidade disponível
        if (transaction.type === 'VENDA') {
          const previousTransactions = await prisma.transaction.findMany({
            where: {
              assetId: asset.id,
              date: {
                lt: transactionDate
              }
            }
          })

          let availableQuantity = 0
          for (const prev of previousTransactions) {
            if (prev.type === 'COMPRA') {
              availableQuantity += prev.quantity
            } else {
              availableQuantity -= prev.quantity
            }
          }

          if (transaction.quantity > availableQuantity) {
            throw new Error(`Quantidade insuficiente para venda de ${transaction.ticker}. Disponível: ${availableQuantity}`)
          }
        }

        // Cria a transação
        const result = await prisma.transaction.create({
          data: {
            assetId: asset.id,
            type: transaction.type,
            date: transactionDate,
            quantity: transaction.quantity,
            price: transaction.price,
            fees: transaction.fees,
            notes: transaction.notes
          }
        })

        results.push(result)
      } catch (error) {
        console.error('Error processing transaction:', error) // Debug log
        errors.push({
          line: i + 1,
          error: error instanceof Error ? error.message : 'Erro desconhecido'
        })
      }
    }

    // Se houver erros, retorna erro com detalhes
    if (errors.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Erro ao importar algumas transações',
          details: errors
        },
        { status: 400 }
      )
    }

    // Retorna sucesso com as transações criadas
    return NextResponse.json({
      success: true,
      count: results.length,
      transactions: results
    })
  } catch (error) {
    console.error('Error importing transactions:', error) // Debug log
    return NextResponse.json(
      {
        success: false,
        error: 'Erro ao processar arquivo de importação',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    )
  }
}