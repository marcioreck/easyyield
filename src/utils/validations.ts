import { z } from 'zod'
import { AssetType, Currency } from '@prisma/client'
import { prisma } from '@/lib/prisma'

// Esquema base para ativos
export const assetSchema = z.object({
  ticker: z
    .string()
    .min(1, 'Ticker é obrigatório')
    .max(10, 'Ticker deve ter no máximo 10 caracteres')
    .regex(/^[A-Z0-9.]+$/, 'Ticker deve conter apenas letras maiúsculas, números e pontos'),
  type: z.nativeEnum(AssetType, {
    errorMap: () => ({ message: 'Tipo de ativo inválido' })
  }),
  currency: z.nativeEnum(Currency, {
    errorMap: () => ({ message: 'Moeda inválida' })
  }),
  description: z.string().optional(),
  sector: z.string().optional(),
  subsector: z.string().optional()
})

// Esquema base para transações
export const transactionSchema = z.object({
  assetId: z.string().min(1, 'Ativo é obrigatório'),
  type: z.enum(['COMPRA', 'VENDA'], {
    errorMap: () => ({ message: 'Tipo de operação inválido' })
  }),
  date: z.date({
    required_error: 'Data é obrigatória',
    invalid_type_error: 'Data inválida'
  }).refine(date => date <= new Date(), {
    message: 'Data não pode ser futura'
  }),
  quantity: z.number({
    required_error: 'Quantidade é obrigatória',
    invalid_type_error: 'Quantidade deve ser um número'
  }).positive('Quantidade deve ser maior que zero'),
  price: z.number({
    required_error: 'Preço é obrigatório',
    invalid_type_error: 'Preço deve ser um número'
  }).positive('Preço deve ser maior que zero'),
  fees: z.number().min(0, 'Taxas não podem ser negativas').optional(),
  notes: z.string().optional()
})

// Função para calcular quantidade disponível para venda
async function calculateAvailableQuantity(assetId: string, date: Date): Promise<number> {
  const transactions = await prisma.transaction.findMany({
    where: {
      assetId,
      date: {
        lt: date
      }
    },
    orderBy: {
      date: 'asc'
    }
  })

  let quantity = 0
  for (const transaction of transactions) {
    if (transaction.type === 'COMPRA') {
      quantity += transaction.quantity
    } else {
      quantity -= transaction.quantity
    }
  }

  return quantity
}

// Interface para erros de validação
interface ValidationError {
  field: string
  message: string
}

// Função de validação customizada para ativos
export async function validateAsset(data: any): Promise<ValidationError[]> {
  const errors: ValidationError[] = []

  try {
    await assetSchema.parseAsync(data)
  } catch (error) {
    if (error instanceof z.ZodError) {
      error.errors.forEach(err => {
        errors.push({
          field: err.path.join('.'),
          message: err.message
        })
      })
    }
  }

  // Validações adicionais
  if (!errors.length) {
    // Verifica se o ticker já existe
    const existingAsset = await prisma.asset.findFirst({
      where: {
        ticker: data.ticker
      }
    })

    if (existingAsset) {
      errors.push({
        field: 'ticker',
        message: 'Ticker já cadastrado'
      })
    }
  }

  return errors
}

// Função de validação customizada para transações
export async function validateTransaction(data: any): Promise<ValidationError[]> {
  const errors: ValidationError[] = []

  try {
    await transactionSchema.parseAsync(data)
  } catch (error) {
    if (error instanceof z.ZodError) {
      error.errors.forEach(err => {
        errors.push({
          field: err.path.join('.'),
          message: err.message
        })
      })
    }
  }

  // Validações adicionais
  if (!errors.length) {
    // Verifica se o ativo existe
    const asset = await prisma.asset.findUnique({
      where: { id: data.assetId }
    })

    if (!asset) {
      errors.push({
        field: 'assetId',
        message: 'Ativo não encontrado'
      })
    }

    // Validações específicas para venda
    if (data.type === 'VENDA' && asset) {
      // Verificar se tem quantidade suficiente para vender
      const totalQuantity = await calculateAvailableQuantity(asset.id, data.date as Date)
      if (data.quantity > totalQuantity) {
        errors.push({ 
          field: 'quantity', 
          message: `Quantidade insuficiente. Disponível: ${totalQuantity}`
        })
      }
    }
  }

  return errors
}

// Função para validar importação de transações
export async function validateImportedTransactions(transactions: any[]): Promise<ValidationError[]> {
  const errors: ValidationError[] = []

  // Mapeia os tickers para IDs de ativos
  const tickers = [...new Set(transactions.map(t => t.ticker))]
  const assets = await prisma.asset.findMany({
    where: {
      ticker: {
        in: tickers
      }
    }
  })
  const tickerToId = Object.fromEntries(assets.map(a => [a.ticker, a.id]))

  // Valida cada transação
  for (let i = 0; i < transactions.length; i++) {
    const transaction = transactions[i]
    const assetId = tickerToId[transaction.ticker]

    if (!assetId) {
      errors.push({
        field: `transactions[${i}].ticker`,
        message: `Ativo não encontrado: ${transaction.ticker}`
      })
      continue
    }

    const validationData = {
      ...transaction,
      assetId,
      date: new Date(transaction.date)
    }

    const transactionErrors = await validateTransaction(validationData)
    transactionErrors.forEach(error => {
      errors.push({
        field: `transactions[${i}].${error.field}`,
        message: error.message
      })
    })
  }

  return errors
}