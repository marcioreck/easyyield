import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { importDividendsForAsset } from '@/services/dividendImport'

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const asset = await prisma.asset.findUnique({ where: { id } })
    if (!asset) {
      return NextResponse.json({ error: 'Ativo não encontrado' }, { status: 404 })
    }
    const result = await importDividendsForAsset(asset)
    return NextResponse.json(result)
  } catch (error) {
    console.error('Error importing dividends:', error)
    return NextResponse.json(
      { success: false, count: 0, source: '', error: (error as Error).message },
      { status: 500 }
    )
  }
}
