import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { calculateAssetValue } from '@/services/calculations'

export async function GET(request: NextRequest) {
  try {
    // Buscar todos os ativos
    const assets = await prisma.asset.findMany({
      include: {
        transactions: {
          orderBy: {
            date: 'asc'
          }
        }
      }
    })

    // Calcular valores para cada ativo
    const assetsWithValues = await Promise.all(
      assets.map(async (asset) => {
        try {
          const assetValue = await calculateAssetValue(asset, asset.transactions)
          return {
            ...asset,
            ...assetValue
          }
        } catch (error) {
          console.warn(`Erro ao calcular ativo ${asset.name}:`, error)
          return {
            ...asset,
            totalInvested: 0,
            currentValue: 0,
            totalReturn: 0,
            totalReturnPercent: 0,
            quantity: 0,
            averagePrice: 0
          }
        }
      })
    )

    // Calcular totais
    const totalInvested = assetsWithValues.reduce((sum, asset) => sum + (asset.totalInvested || 0), 0)
    const currentValue = assetsWithValues.reduce((sum, asset) => sum + (asset.currentValue || 0), 0)
    const totalReturn = currentValue - totalInvested
    const totalReturnPercent = totalInvested > 0 ? (totalReturn / totalInvested) * 100 : 0

    // Distribuição por tipo
    const assetDistribution = assetsWithValues.reduce((acc, asset) => {
      const type = asset.type || 'Outros'
      acc[type] = (acc[type] || 0) + (asset.currentValue || 0)
      return acc
    }, {} as Record<string, number>)

    return NextResponse.json({
      success: true,
      assets: assetsWithValues,
      summary: {
        totalInvested,
        currentValue,
        totalReturn,
        totalReturnPercent,
        assetDistribution,
        assetCount: assetsWithValues.length
      }
    })

  } catch (error) {
    console.error('Error fetching portfolio:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch portfolio data',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
