import { prisma } from '@/lib/prisma'
import { formatDate } from '@/utils/format'

interface BackupData {
  date: Date
  assets: any[]
  transactions: any[]
  prices: any[]
}

export async function generateBackup(): Promise<BackupData> {
  // Busca todos os dados do banco
  const backup = {
    date: new Date(),
    assets: await prisma.asset.findMany(),
    transactions: await prisma.transaction.findMany(),
    prices: await prisma.price.findMany()
  }

  return backup
}

export async function restoreBackup(backupData: BackupData) {
  const { assets, transactions, prices } = backupData

  try {
    // Limpa o banco atual
    await prisma.price.deleteMany()
    await prisma.transaction.deleteMany()
    await prisma.asset.deleteMany()

    // Restaura os dados
    for (const asset of assets) {
      await prisma.asset.create({ data: asset })
    }

    for (const transaction of transactions) {
      await prisma.transaction.create({ data: transaction })
    }

    for (const price of prices) {
      await prisma.price.create({ data: price })
    }

    return { success: true }
  } catch (error) {
    console.error('Error restoring backup:', error)
    return {
      success: false,
      error: error.message
    }
  }
}

export function generateCSV(data: any[], fields: string[]): string {
  const header = fields.join(',') + '\n'
  const rows = data.map(item => 
    fields.map(field => {
      const value = item[field]
      if (value instanceof Date) {
        return formatDate(value)
      }
      if (typeof value === 'string' && value.includes(',')) {
        return `"${value}"`
      }
      return value
    }).join(',')
  ).join('\n')

  return header + rows
}

export async function generateExportFiles() {
  const backup = await generateBackup()
  
  // Campos para cada tipo de dado
  const assetFields = ['ticker', 'name', 'type', 'currency', 'description']
  const transactionFields = ['date', 'type', 'quantity', 'price', 'fees', 'notes', 'assetId']
  const priceFields = ['date', 'price', 'volume', 'assetId']

  return {
    json: JSON.stringify(backup, null, 2),
    csv: {
      assets: generateCSV(backup.assets, assetFields),
      transactions: generateCSV(backup.transactions, transactionFields),
      prices: generateCSV(backup.prices, priceFields)
    }
  }
}