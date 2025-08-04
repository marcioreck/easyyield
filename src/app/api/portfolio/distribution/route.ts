import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { calculateAssetPosition } from '@/services/calculations'

export async function GET() {
  try {
    // Busca todos os ativos
    const assets = await prisma.asset.findMany()
    
    // Calcula posição atual de cada ativo
    const positions = await Promise.all(
      assets.map(asset => calculateAssetPosition(asset.id))
    )

    // Agrupa por tipo de ativo
    const distribution = positions.reduce((acc, pos) => {
      if (!pos || !pos.currentTotal) return acc
      
      const type = pos.asset.type
      acc[type] = (acc[type] || 0) + pos.currentTotal
      return acc
    }, {} as Record<string, number>)

    // Converte para array
    const data = Object.entries(distribution)
      .map(([type, total]) => ({ type, total }))
      .sort((a, b) => b.total - a.total) // Ordena por valor total

    return NextResponse.json({
      success: true,
      data
    })
  } catch (error) {
    console.error('Error calculating portfolio distribution:', error)
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to calculate portfolio distribution' 
      },
      { status: 500 }
    )
  }
}