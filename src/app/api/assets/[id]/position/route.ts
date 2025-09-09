import { NextResponse } from 'next/server'
import { calculateAssetPosition } from '@/services/calculations'

interface RouteParams {
  params: {
    id: string
  }
}

export async function GET(request: Request, { params }: RouteParams) {
  try {
    const resolvedParams = await params
    const position = await calculateAssetPosition(resolvedParams.id)
    if (!position) {
      return NextResponse.json(
        { error: 'Asset position not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(position)
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}