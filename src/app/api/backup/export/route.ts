import { NextResponse } from 'next/server'
import { generateExportFiles } from '@/services/backup'

export async function GET() {
  try {
    const files = await generateExportFiles()
    return NextResponse.json({
      success: true,
      files
    })
  } catch (error) {
    console.error('Error generating export files:', error)
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to generate export files' 
      },
      { status: 500 }
    )
  }
}