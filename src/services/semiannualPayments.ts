import { Asset, Transaction } from '@prisma/client'

export interface SemiannualPayment {
  date: Date
  expectedAmount: number
  period: string
  status: 'expected' | 'estimated'
}

/**
 * Calcula todos os pagamentos semestrais que deveriam ter ocorrido
 * para um título do Tesouro IPCA+ com juros semestrais
 */
export function calculateHistoricalSemiannualPayments(
  asset: Asset & { pagaJurosSemestrais?: boolean | null },
  transactions: Transaction[],
  currentDate: Date = new Date()
): SemiannualPayment[] {
  if (!asset.pagaJurosSemestrais || asset.type !== 'TESOURO_DIRETO') {
    return []
  }

  const payments: SemiannualPayment[] = []
  
  // Encontra a primeira transação de compra
  const firstPurchase = transactions
    .filter(t => t.type === 'COMPRA')
    .sort((a, b) => a.date.getTime() - b.date.getTime())[0]
    
  if (!firstPurchase) return payments

  // Calcula quantidade total investida
  const totalQuantity = transactions.reduce((sum, t) => {
    return t.type === 'COMPRA' ? sum + t.quantity : sum - t.quantity
  }, 0)

  if (totalQuantity <= 0) return payments

  // Data de início: primeira compra
  const startDate = new Date(firstPurchase.date)
  const startYear = startDate.getFullYear()
  const startMonth = startDate.getMonth() + 1

  // Se comprou depois de Janeiro, o primeiro pagamento será Julho
  // Se comprou depois de Julho, o primeiro pagamento será Janeiro do próximo ano
  let currentYear = startYear
  let nextPaymentMonth = startMonth <= 1 ? 1 : startMonth <= 7 ? 7 : 13

  if (nextPaymentMonth === 13) {
    nextPaymentMonth = 1
    currentYear++
  }

  // Gera todos os pagamentos semestrais até a data atual
  while (currentYear < currentDate.getFullYear() || 
         (currentYear === currentDate.getFullYear() && nextPaymentMonth <= currentDate.getMonth() + 1)) {
    
    const paymentDate = new Date(currentYear, nextPaymentMonth - 1, 15) // Dia 15 do mês
    
    // Calcula valor esperado do pagamento (simplificado)
    // Em teoria, seria (taxa_real + IPCA_período) / 2 * valor_na_data
    // Aqui usamos uma estimativa baseada na taxa contratada
    const semiannualRate = (asset.taxa || 0) / 2 / 100
    const estimatedValue = totalQuantity * firstPurchase.price * semiannualRate
    
    payments.push({
      date: paymentDate,
      expectedAmount: estimatedValue,
      period: `${paymentDate.getMonth() === 0 ? 'Janeiro' : 'Julho'} ${currentYear}`,
      status: 'estimated'
    })

    // Próximo pagamento
    if (nextPaymentMonth === 1) {
      nextPaymentMonth = 7
    } else {
      nextPaymentMonth = 1
      currentYear++
    }
  }

  return payments.sort((a, b) => a.date.getTime() - b.date.getTime())
}

/**
 * Calcula o total de pagamentos semestrais recebidos até agora
 */
export function getTotalSemiannualPayments(payments: SemiannualPayment[]): number {
  return payments.reduce((sum, p) => sum + p.expectedAmount, 0)
}

/**
 * Retorna os próximos pagamentos esperados
 */
export function getUpcomingSemiannualPayments(
  asset: Asset & { pagaJurosSemestrais?: boolean | null },
  currentDate: Date = new Date()
): { date: Date; period: string }[] {
  if (!asset.pagaJurosSemestrais) return []

  const currentYear = currentDate.getFullYear()
  const currentMonth = currentDate.getMonth() + 1
  const upcoming = []

  // Janeiro
  const january = new Date(currentYear, 0, 15)
  if (currentMonth <= 1) {
    upcoming.push({ date: january, period: `Janeiro ${currentYear}` })
  }

  // Julho
  const july = new Date(currentYear, 6, 15)
  if (currentMonth <= 7) {
    upcoming.push({ date: july, period: `Julho ${currentYear}` })
  }

  // Se não há mais pagamentos neste ano, inclui os do próximo ano
  if (upcoming.length === 0) {
    upcoming.push(
      { date: new Date(currentYear + 1, 0, 15), period: `Janeiro ${currentYear + 1}` },
      { date: new Date(currentYear + 1, 6, 15), period: `Julho ${currentYear + 1}` }
    )
  } else if (upcoming.length === 1) {
    // Se só tem um pagamento restante, adiciona o primeiro do próximo ano
    const isJanuary = upcoming[0].period.includes('Janeiro')
    if (isJanuary) {
      upcoming.push({ date: new Date(currentYear, 6, 15), period: `Julho ${currentYear}` })
    } else {
      upcoming.push({ date: new Date(currentYear + 1, 0, 15), period: `Janeiro ${currentYear + 1}` })
    }
  }

  return upcoming.slice(0, 2) // Retorna apenas os próximos 2
}
