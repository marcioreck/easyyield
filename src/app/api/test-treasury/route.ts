import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { calculateTreasuryIPCADividendYield, calculateTreasuryIPCAAccumulatedReturn } from '@/services/treasuryCalculations'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Criar ativo de teste do Tesouro IPCA+
    const testAsset = await prisma.asset.create({
      data: {
        ticker: 'TESOURO-IPCA-2029',
        name: 'Tesouro IPCA+ 2029 (Teste)',
        type: 'TESOURO_DIRETO',
        currency: 'BRL',
        indexador: 'IPCA',
        taxa: 5.83,
        vencimento: new Date('2029-08-15'),
        description: 'Título de teste para validar cálculos de DY para Tesouro IPCA+'
      }
    })

    // Criar preço inicial
    const currentPrice = 2800.50
    await prisma.price.create({
      data: {
        assetId: testAsset.id,
        date: new Date(),
        price: currentPrice,
        volume: 100,
        dividendYield: null // Será calculado dinamicamente
      }
    })

    // Criar transação de teste
    await prisma.transaction.create({
      data: {
        assetId: testAsset.id,
        date: new Date('2024-01-01'),
        type: 'COMPRA',
        quantity: 1,
        price: 2500.00,
        notes: 'Transação de teste para Tesouro IPCA+'
      }
    })

    // Calcular DY
    const dividendYield = calculateTreasuryIPCADividendYield(
      testAsset,
      currentPrice,
      new Date()
    )

    // Calcular retorno acumulado
    const accumulatedReturn = calculateTreasuryIPCAAccumulatedReturn(
      testAsset,
      2500.00,
      new Date('2024-01-01'),
      currentPrice,
      new Date()
    )

    return NextResponse.json({
      success: true,
      asset: testAsset,
      currentPrice,
      dividendYield,
      accumulatedReturn,
      message: 'Ativo de teste do Tesouro IPCA+ criado com sucesso!'
    })

  } catch (error) {
    console.error('Erro ao criar teste do Tesouro IPCA+:', error)
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
    // Buscar todos os ativos do Tesouro IPCA+
    const treasuryAssets = await prisma.asset.findMany({
      where: {
        type: 'TESOURO_DIRETO',
        indexador: 'IPCA'
      },
      include: {
        prices: {
          orderBy: { date: 'desc' },
          take: 1
        },
        transactions: {
          orderBy: { date: 'asc' }
        }
      }
    })

    const results = await Promise.all(
      treasuryAssets.map(async (asset) => {
        const latestPrice = asset.prices[0]
        
        if (!latestPrice) {
          return {
            asset: asset,
            error: 'Sem preço disponível'
          }
        }

        const dividendYield = calculateTreasuryIPCADividendYield(
          asset,
          latestPrice.price,
          latestPrice.date
        )

        let accumulatedReturn = null
        if (asset.transactions.length > 0) {
          const firstTransaction = asset.transactions[0]
          accumulatedReturn = calculateTreasuryIPCAAccumulatedReturn(
            asset,
            firstTransaction.price,
            firstTransaction.date,
            latestPrice.price,
            latestPrice.date
          )
        }

        return {
          asset: {
            id: asset.id,
            ticker: asset.ticker,
            name: asset.name,
            taxa: asset.taxa,
            vencimento: asset.vencimento,
            indexador: asset.indexador
          },
          currentPrice: latestPrice.price,
          priceDate: latestPrice.date,
          dividendYield,
          accumulatedReturn,
          transactionCount: asset.transactions.length
        }
      })
    )

    return NextResponse.json({
      success: true,
      count: results.length,
      data: results
    })

  } catch (error) {
    console.error('Erro ao buscar dados do Tesouro IPCA+:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Erro interno do servidor'
      },
      { status: 500 }
    )
  }
}
