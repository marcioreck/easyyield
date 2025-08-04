import { NextResponse } from 'next/server'
import { restoreBackup } from '@/services/backup'

export async function POST(request: Request) {
  try {
    const backupData = await request.json()
    const result = await restoreBackup(backupData)
    return NextResponse.json(result)
  } catch (error) {
    console.error('Error restoring backup:', error)
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to restore backup' 
      },
      { status: 500 }
    )
  }
}