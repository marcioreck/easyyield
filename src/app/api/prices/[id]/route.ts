import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

interface RouteParams {
  params: {
    id: string
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const resolvedParams = await params
    await prisma.price.delete({
      where: {
        id: resolvedParams.id
      }
    })

    return new NextResponse(null, { status: 204 })
  } catch (error) {
    console.error('Error deleting price:', error)
    return NextResponse.json(
      { error: 'Failed to delete price' },
      { status: 500 }
    )
  }
}
