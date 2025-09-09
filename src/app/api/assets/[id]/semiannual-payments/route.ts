import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { calculateHistoricalSemiannualPayments } from '@/services/semiannualPayments'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Busca o ativo e suas transações
    const asset = await prisma.asset.findUnique({
      where: { id },
      include: {
        transactions: {
          orderBy: { date: 'asc' }
        }
      }
    })

    if (!asset) {
      return NextResponse.json({ error: 'Asset not found' }, { status: 404 })
    }

    // Calcula os pagamentos semestrais históricos
    const payments = calculateHistoricalSemiannualPayments(asset, asset.transactions)
    
    return NextResponse.json({
      payments,
      totalPayments: payments.reduce((sum, p) => sum + p.expectedAmount, 0),
      paymentCount: payments.length
    })
  } catch (error) {
    console.error('Error calculating semiannual payments:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
