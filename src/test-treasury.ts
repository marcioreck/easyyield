import { prisma } from './lib/prisma'
import { calculateTreasuryIPCADividendYield, calculateTreasuryIPCAAccumulatedReturn } from './services/treasuryCalculations'

// Função para testar os cálculos do Tesouro IPCA+
async function testTreasuryIPCA() {
  console.log('🧪 Testando cálculos do Tesouro IPCA+...\n')

  // Dados de exemplo de um título real do Tesouro IPCA+ 2029
  const mockAsset = {
    id: 'test-id',
    type: 'TESOURO_DIRETO' as const,
    ticker: 'TESOURO-IPCA-2029',
    name: 'Tesouro IPCA+ 2029',
    currency: 'BRL' as const,
    indexador: 'IPCA',
    taxa: 5.83, // Taxa real típica do Tesouro IPCA+
    vencimento: new Date('2029-08-15'),
    createdAt: new Date(),
    updatedAt: new Date(),
    description: null,
    sector: null,
    dividendYield: null,
    priceToEarnings: null,
    priceToBook: null,
    netMargin: null,
    roic: null,
    pagaJurosSemestrais: false
  }

  // Preço atual simulado
  const currentPrice = 2800.50 // Preço típico em R$
  const referenceDate = new Date('2025-09-07')

  console.log('📊 Dados do título:')
  console.log(`   Nome: ${mockAsset.name}`)
  console.log(`   Taxa Real: ${mockAsset.taxa}% a.a.`)
  console.log(`   Vencimento: ${mockAsset.vencimento.toLocaleDateString('pt-BR')}`)
  console.log(`   Preço Atual: R$ ${currentPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`)
  console.log(`   Data de Referência: ${referenceDate.toLocaleDateString('pt-BR')}\n`)

  // Teste 1: Cálculo do Dividend Yield
  const dividendYield = calculateTreasuryIPCADividendYield(mockAsset, currentPrice, referenceDate)
  
  console.log('📈 Cálculo do Dividend Yield:')
  if (dividendYield !== null) {
    console.log(`   Taxa Real: ${mockAsset.taxa}% a.a.`)
    console.log(`   IPCA Estimado: ~4.5% a.a.`)
    console.log(`   Taxa Total: ~${(mockAsset.taxa + 4.5).toFixed(2)}% a.a.`)
    console.log(`   Dividend Yield: ${dividendYield.toFixed(2)}% a.a.`)
    
    const rendimentoMensal = (dividendYield / 12).toFixed(2)
    console.log(`   Rendimento Mensal: ~${rendimentoMensal}%`)
    
    const rendimentoReais = (currentPrice * dividendYield / 100 / 12).toFixed(2)
    console.log(`   Rendimento Mensal em R$: ~R$ ${rendimentoReais}`)
  } else {
    console.log('   ❌ Erro no cálculo do Dividend Yield')
  }

  console.log('\n' + '='.repeat(60) + '\n')

  // Teste 2: Simulação de investimento
  const purchasePrice = 2500.00
  const purchaseDate = new Date('2024-01-01')
  
  const accumulatedReturn = calculateTreasuryIPCAAccumulatedReturn(
    mockAsset,
    purchasePrice,
    purchaseDate,
    currentPrice,
    referenceDate
  )

  console.log('💰 Simulação de Investimento:')
  console.log(`   Preço de Compra: R$ ${purchasePrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`)
  console.log(`   Data de Compra: ${purchaseDate.toLocaleDateString('pt-BR')}`)
  console.log(`   Preço Atual: R$ ${currentPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`)
  
  if (accumulatedReturn) {
    console.log(`   Retorno Real: ${accumulatedReturn.realReturn.toFixed(2)}%`)
    console.log(`   Retorno por IPCA: ${accumulatedReturn.inflationReturn.toFixed(2)}%`)
    console.log(`   Retorno Total: ${accumulatedReturn.totalReturn.toFixed(2)}%`)
    
    const valorAtual = purchasePrice * (1 + accumulatedReturn.totalReturn / 100)
    console.log(`   Valor Atual: R$ ${valorAtual.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`)
    
    const ganhoAbsoluto = valorAtual - purchasePrice
    console.log(`   Ganho Absoluto: R$ ${ganhoAbsoluto.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`)
  } else {
    console.log('   ❌ Erro no cálculo do retorno acumulado')
  }

  console.log('\n' + '='.repeat(60) + '\n')

  // Teste 3: Comparação com diferentes cenários de IPCA
  console.log('📊 Análise de Sensibilidade (diferentes cenários de IPCA):')
  
  const ipcaScenarios = [3.0, 4.5, 6.0, 8.0]
  
  ipcaScenarios.forEach(ipca => {
    const taxaTotal = mockAsset.taxa + ipca
    const dySimulado = taxaTotal // Simplificação: DY ≈ taxa total
    const rendimentoAnual = currentPrice * dySimulado / 100
    
    console.log(`   IPCA ${ipca}%: Taxa Total ${taxaTotal.toFixed(1)}% → Rendimento anual ~R$ ${rendimentoAnual.toFixed(2)}`)
  })

  console.log('\n✅ Testes concluídos!')
}

// Executar os testes
testTreasuryIPCA().catch(console.error)
