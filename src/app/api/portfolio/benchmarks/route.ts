// API para buscar dados do IPCA, CDI, SELIC de fontes públicas

import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || '1y'

    // Calcular datas
    const endDate = new Date()
    let startDate = new Date()
    
    switch (period) {
      case '1m':
        startDate.setMonth(startDate.getMonth() - 1)
        break
      case '3m':
        startDate.setMonth(startDate.getMonth() - 3)
        break
      case '6m':
        startDate.setMonth(startDate.getMonth() - 6)
        break
      case '1y':
        startDate.setFullYear(startDate.getFullYear() - 1)
        break
      case 'all':
        startDate = new Date('2019-01-01') // Início dos dados
        break
    }

    const formatDateForAPI = (date: Date) => {
      const day = String(date.getDate()).padStart(2, '0')
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const year = date.getFullYear()
      return `${day}/${month}/${year}`
    }

    console.log(`Buscando dados de ${formatDateForAPI(startDate)} até ${formatDateForAPI(endDate)}`)

    // Função para buscar dados do Banco Central
    const fetchBCBData = async (seriesCode: string, name: string) => {
      try {
        const url = `https://api.bcb.gov.br/dados/serie/bcdata.sgs.${seriesCode}/dados?formato=json&dataInicial=${formatDateForAPI(startDate)}&dataFinal=${formatDateForAPI(endDate)}`
        console.log(`Buscando ${name} de: ${url}`)
        
        const response = await fetch(url, {
          headers: {
            'User-Agent': 'EasyYield/1.0',
            'Accept': 'application/json'
          }
        })
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status} para ${name}`)
        }
        
        const data = await response.json()
        console.log(`${name}: ${data.length} registros recebidos`)
        
        return data
      } catch (error) {
        console.warn(`Erro ao buscar ${name}:`, error)
        return null
      }
    }

    // Buscar dados paralelos com fallback
    const [ipcaRaw, cdiRaw, selicRaw] = await Promise.all([
      fetchBCBData('433', 'IPCA'),    // IPCA mensal
      fetchBCBData('12', 'CDI'),      // CDI diário
      fetchBCBData('11', 'SELIC'),    // SELIC diária
    ])

    // Processar dados para calcular valores acumulados
    const processData = (data: any[], name: string, initialValue = 10000) => {
      if (!data || !Array.isArray(data)) {
        console.warn(`Dados inválidos para ${name}, usando fallback`)
        return generateFallbackData(startDate, endDate, name, initialValue)
      }

      let accumulated = initialValue
      return data.map(item => {
        const rate = parseFloat(item.valor) || 0
        accumulated *= (1 + rate / 100)
        return {
          date: item.data,
          value: accumulated,
          rate: rate
        }
      })
    }

    // Função de fallback com dados simulados realistas
    const generateFallbackData = (start: Date, end: Date, type: string, initialValue = 10000) => {
      const data = []
      const current = new Date(start)
      let accumulated = initialValue
      
      // Taxas anuais médias aproximadas
      const annualRates = {
        'IPCA': 0.045,   // 4.5% a.a.
        'CDI': 0.068,    // 6.8% a.a.
        'SELIC': 0.065   // 6.5% a.a.
      }
      
      const annualRate = annualRates[type as keyof typeof annualRates] || 0.05
      const monthlyRate = Math.pow(1 + annualRate, 1/12) - 1 // Taxa mensal equivalente
      
      while (current <= end) {
        accumulated *= (1 + monthlyRate)
        
        data.push({
          date: formatDateForAPI(current),
          value: accumulated,
          rate: monthlyRate * 100
        })
        
        current.setMonth(current.getMonth() + 1)
      }
      
      return data
    }

    // Processar dados com fallback inteligente
    const ipcaData = processData(ipcaRaw, 'IPCA')
    const cdiData = processData(cdiRaw, 'CDI')
    const selicData = processData(selicRaw, 'SELIC')

    return NextResponse.json({
      success: true,
      period,
      ipca: ipcaData,
      cdi: cdiData,
      selic: selicData,
      metadata: {
        source: ipcaRaw && cdiRaw && selicRaw ? 'Banco Central do Brasil (oficial)' : 'Dados simulados + API BC',
        description: 'IPCA, CDI e SELIC com valores acumulados',
        startDate: formatDateForAPI(startDate),
        endDate: formatDateForAPI(endDate),
        apiStatus: {
          ipca: ipcaRaw ? 'sucesso' : 'fallback',
          cdi: cdiRaw ? 'sucesso' : 'fallback',
          selic: selicRaw ? 'sucesso' : 'fallback'
        },
        note: 'APIs gratuitas do Banco Central podem ter limitações de acesso'
      }
    })

  } catch (error) {
    console.error('Error fetching benchmark data:', error)
    
    // Fallback completo em caso de erro
    const generateEmergencyData = (start: Date, end: Date) => {
      const data = []
      const current = new Date(start)
      let ipcaAcc = 10000, cdiAcc = 10000, selicAcc = 10000
      
      while (current <= end) {
        ipcaAcc *= 1.0037  // ~4.5% a.a.
        cdiAcc *= 1.0055   // ~6.8% a.a.
        selicAcc *= 1.0053 // ~6.5% a.a.
        
        const dateStr = current.toISOString().split('T')[0]
        data.push({
          date: dateStr,
          value: ipcaAcc,
          rate: 0.37
        })
        
        current.setMonth(current.getMonth() + 1)
      }
      
      return data
    }

    const { searchParams } = new URL(request.url)
    const fallbackPeriod = searchParams.get('period') || '1y'
    
    const startDate = new Date()
    startDate.setFullYear(startDate.getFullYear() - 1)
    const emergencyData = generateEmergencyData(startDate, new Date())

    return NextResponse.json({
      success: true,
      period: fallbackPeriod,
      ipca: emergencyData,
      cdi: emergencyData.map(d => ({ ...d, value: d.value * 1.02 })),
      selic: emergencyData.map(d => ({ ...d, value: d.value * 1.015 })),
      metadata: {
        source: 'Dados de emergência (simulados)',
        description: 'Fallback devido a erro na API',
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      }
    })
  }
}
