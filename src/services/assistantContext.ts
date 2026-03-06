import { calculatePortfolioSummary } from './calculations'

/**
 * Monta um contexto enxuto do portfólio para o assistente LLM (economia de tokens).
 * Apenas totais e resumo por ativo, sem histórico bruto.
 */
export async function buildPortfolioContextForAssistant(): Promise<string> {
  const summary = await calculatePortfolioSummary()
  if (!summary) return 'Portfólio sem dados.'

  const lines: string[] = [
    `Total investido: ${summary.totalInvested.toFixed(2)}`,
    `Valor atual: ${summary.currentTotal.toFixed(2)}`,
    `Retorno total: ${summary.percentReturn.toFixed(2)}%`,
    `Número de posições: ${summary.positions.length}`,
    '',
    'Posições (ticker, tipo, quantidade, total atual, DY%):'
  ]

  for (const p of summary.positions.slice(0, 50)) {
    const totalStr = p.currentTotal != null ? p.currentTotal.toFixed(2) : '-'
    const dyStr = p.lastDividendYield != null ? p.lastDividendYield.toFixed(2) : '-'
    lines.push(
      `- ${p.asset.ticker} | ${p.asset.type} | ${p.quantity} | ${totalStr} | DY ${dyStr}%`
    )
  }
  if (summary.positions.length > 50) {
    lines.push(`... e mais ${summary.positions.length - 50} posições.`)
  }

  return lines.join('\n')
}
