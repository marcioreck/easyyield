import { NextResponse } from 'next/server'
import { createBackup, restoreBackup } from '@/services/backup'

export async function POST(request: Request) {
  try {
    const result = await createBackup()
    return NextResponse.json(result)
  } catch (error) {
    console.error('Error creating backup:', error)
    return NextResponse.json(
      { error: 'Failed to create backup' },
      { status: 500 }
    )
  }
}

export async function PUT(request: Request) {
  try {
    const backupData = await request.json()
    const result = await restoreBackup(backupData)
    return NextResponse.json(result)
  } catch (error) {
    console.error('Error restoring backup:', error)
    return NextResponse.json(
      { error: 'Failed to restore backup' },
      { status: 500 }
    )
  }
}