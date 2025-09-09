import { Asset } from '@prisma/client'

// Interface para configuração do IPCA+ Tesouro Direto
interface TreasuryIPCAConfig {
  indexador: string // 'IPCA'
  taxa: number // Taxa real em % a.a.
  vencimento: Date
}

// Dados históricos aproximados do IPCA (deve ser obtido de uma API externa)
const IPCA_HISTORICO_ANUAL = [
  { ano: 2023, ipca: 4.62 },
  { ano: 2022, ipca: 5.79 },
  { ano: 2021, ipca: 10.06 },
  { ano: 2020, ipca: 4.52 },
  { ano: 2019, ipca: 4.31 }
]

/**
 * Calcula o Dividend Yield para títulos do Tesouro IPCA+
 * 
 * Para títulos atrelados ao IPCA, o rendimento é composto por:
 * 1. Taxa real (fixa do papel)  
 * 2. IPCA acumulado do período
 * 
 * Para títulos com pagamento semestral, considera:
 * - Pagamentos de juros em Janeiro e Julho
 * - Desconto dos juros já pagos no ano para evitar dupla contagem
 * 
 * O DY é calculado como: (Taxa Real + IPCA) sobre o preço atual
 */
export function calculateTreasuryIPCADividendYield(
  asset: Asset,
  currentPrice: number,
  referenceDate: Date = new Date()
): number | null {
  // Verifica se é realmente um título do Tesouro IPCA+
  if (asset.type !== 'TESOURO_DIRETO' || asset.indexador !== 'IPCA') {
    return null
  }

  if (!asset.taxa || !asset.vencimento) {
    return null
  }

  const config: TreasuryIPCAConfig = {
    indexador: asset.indexador,
    taxa: asset.taxa,
    vencimento: asset.vencimento
  }

  // Obtém IPCA dos últimos 12 meses (simulado - deveria vir de API)
  const ipcaAnual = getIPCAAnual(referenceDate)
  
  // Taxa total = Taxa real + IPCA
  const taxaTotal = config.taxa + ipcaAnual
  
  // Para títulos com pagamento semestral, ajusta o cálculo
  if (asset.pagaJurosSemestrais) {
    return calculateSemiannualDividendYield(asset, currentPrice, taxaTotal, referenceDate)
  }
  
  // Calcula o rendimento anual esperado sobre o preço atual
  const rendimentoAnual = (currentPrice * taxaTotal) / 100
  
  // DY = Rendimento anual / Preço atual * 100
  const dividendYield = (rendimentoAnual / currentPrice) * 100
  
  return dividendYield
}

/**
 * Calcula o DY para títulos com pagamentos semestrais
 * Considera os pagamentos de juros em Janeiro e Julho
 */
function calculateSemiannualDividendYield(
  asset: Asset,
  currentPrice: number,
  taxaTotal: number,
  referenceDate: Date
): number {
  const currentMonth = referenceDate.getMonth() + 1 // Janeiro = 1, Dezembro = 12
  
  // Calcula quantos pagamentos restam no ano
  let paymentsRemaining = 0
  
  // Pagamentos em Janeiro (mês 1) e Julho (mês 7)
  if (currentMonth <= 1) {
    paymentsRemaining = 2 // Janeiro e Julho ainda vão ocorrer
  } else if (currentMonth <= 7) {
    paymentsRemaining = 1 // Apenas Julho ainda vai ocorrer
  } else {
    paymentsRemaining = 0 // Já passaram os dois pagamentos do ano
  }
  
  // Se não há pagamentos restantes no ano, considera pagamentos do próximo ano
  if (paymentsRemaining === 0) {
    paymentsRemaining = 2 // Janeiro e Julho do próximo ano
  }
  
  // Cada pagamento semestral é metade da taxa anual
  const semiannualRate = taxaTotal / 2
  
  // Calcula o rendimento esperado baseado nos pagamentos restantes
  const expectedReturn = (currentPrice * semiannualRate * paymentsRemaining) / 100
  
  // DY = Rendimento esperado / Preço atual * 100
  const dividendYield = (expectedReturn / currentPrice) * 100
  
  return dividendYield
}

/**
 * Calcula o rendimento acumulado de um título IPCA+ desde a compra
 */
export function calculateTreasuryIPCAAccumulatedReturn(
  asset: Asset,
  purchasePrice: number,
  purchaseDate: Date,
  currentPrice: number,
  currentDate: Date = new Date()
): {
  realReturn: number // Retorno real (taxa fixa)
  inflationReturn: number // Retorno por IPCA
  totalReturn: number // Retorno total
} | null {
  if (asset.type !== 'TESOURO_DIRETO' || asset.indexador !== 'IPCA' || !asset.taxa) {
    return null
  }

  const yearsHeld = (currentDate.getTime() - purchaseDate.getTime()) / (1000 * 60 * 60 * 24 * 365.25)
  
  // Calcula retorno real (taxa fixa do papel)
  const realReturn = Math.pow(1 + asset.taxa / 100, yearsHeld) - 1
  
  // Calcula IPCA acumulado no período (simplificado)
  const ipcaAccumulated = getIPCAAccumulated(purchaseDate, currentDate)
  const inflationReturn = ipcaAccumulated / 100
  
  // Retorno total = (1 + real) * (1 + inflação) - 1
  const totalReturn = (1 + realReturn) * (1 + inflationReturn) - 1
  
  return {
    realReturn: realReturn * 100,
    inflationReturn: inflationReturn * 100,
    totalReturn: totalReturn * 100
  }
}

/**
 * Obtém o IPCA anual (últimos 12 meses)
 * Em produção, deveria consultar API do IBGE ou BACEN
 */
function getIPCAAnual(referenceDate: Date): number {
  const year = referenceDate.getFullYear()
  const ipcaData = IPCA_HISTORICO_ANUAL.find(d => d.ano === year)
  
  // Se não encontrar o ano atual, usa uma estimativa baseada no ano anterior
  return ipcaData?.ipca || 4.5 // Estimativa padrão
}

/**
 * Obtém o IPCA acumulado entre duas datas
 * Implementação simplificada - em produção usar dados reais
 */
function getIPCAAccumulated(fromDate: Date, toDate: Date): number {
  const fromYear = fromDate.getFullYear()
  const toYear = toDate.getFullYear()
  
  let accumulated = 0
  
  // Soma o IPCA dos anos entre as datas (simplificado)
  for (let year = fromYear; year <= toYear; year++) {
    const ipcaData = IPCA_HISTORICO_ANUAL.find(d => d.ano === year)
    if (ipcaData) {
      // Se é o primeiro ou último ano, calcula proporcional
      if (year === fromYear || year === toYear) {
        accumulated += ipcaData.ipca * 0.5 // Simplificação
      } else {
        accumulated += ipcaData.ipca
      }
    }
  }
  
  return accumulated
}

/**
 * Calcula o preço teórico de um título IPCA+ baseado na curva de juros
 * Implementação simplificada
 */
export function calculateTreasuryIPCATheoreticalPrice(
  asset: Asset,
  currentDate: Date = new Date()
): number | null {
  if (asset.type !== 'TESOURO_DIRETO' || asset.indexador !== 'IPCA') {
    return null
  }

  if (!asset.taxa || !asset.vencimento) {
    return null
  }

  // Tempo até o vencimento em anos
  const timeToMaturity = (asset.vencimento.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24 * 365.25)
  
  if (timeToMaturity <= 0) {
    return 1000 // Valor de face na maturidade
  }

  // Taxa de mercado estimada (deveria vir de API)
  const marketRate = 0.06 // 6% a.a. (estimativa)
  const ipcaRate = getIPCAAnual(currentDate) / 100
  
  // Preço teórico usando fórmula de valor presente
  // PV = FV / (1 + taxa_real + ipca)^t
  const totalRate = (asset.taxa / 100) + ipcaRate
  const theoreticalPrice = 1000 / Math.pow(1 + totalRate, timeToMaturity)
  
  return theoreticalPrice
}

/**
 * Função auxiliar para validar se um ativo é Tesouro IPCA+
 */
export function isTreasuryIPCA(asset: Asset): boolean {
  return asset.type === 'TESOURO_DIRETO' && asset.indexador === 'IPCA'
}
