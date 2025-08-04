'use client'

import { useState, useEffect } from 'react'
import { Asset } from '@prisma/client'
import { formatCurrency, formatQuantity, parseDate, parseQuantity, parseCurrency } from '@/utils/format'

interface ImportPreview {
  date: string
  type: string
  ticker: string
  quantity: number
  price: number
  fees?: number
  notes?: string
  status: 'valid' | 'error'
  error?: string
}

interface ImportTransactionsProps {
  onComplete: () => void
}

export function ImportTransactions({ onComplete }: ImportTransactionsProps) {
  // ... (resto do código permanece igual)

  const downloadTemplate = () => {
    const template = 'Data,Tipo,Ticker,Quantidade,Preco,Taxas,Observacoes\n' +
                    '30/10/2019,COMPRA,T2050B,1,4956.01,,RENTABILIDADE CONTRATADA IPCA + 3.28%\n' +
                    '# Use ponto como separador decimal (ex: 4956.01 = R$ 4.956,01)\n' +
                    '# Data no formato DD/MM/YYYY\n' +
                    '# Tipo deve ser COMPRA ou VENDA\n' +
                    '# Ticker deve estar cadastrado no sistema\n' +
                    '# Quantidade e Preço são obrigatórios\n' +
                    '# Taxas e Observações são opcionais'
    const blob = new Blob([template], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'modelo_importacao.csv'
    a.click()
    window.URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium mb-2">Como Importar Operações</h3>
        <div className="bg-blue-50 p-4 rounded-lg space-y-3 text-sm">
          <p className="font-medium">Siga os passos abaixo para importar suas operações:</p>
          <ol className="list-decimal list-inside space-y-2">
            <li>Baixe o modelo de arquivo CSV clicando no botão "Baixar Modelo"</li>
            <li>Abra o arquivo em um editor de planilhas (Excel, Google Sheets, etc.)</li>
            <li>Preencha os dados seguindo o formato:
              <ul className="list-disc list-inside ml-4 mt-1 text-gray-600">
                <li>Data: formato DD/MM/YYYY (ex: 30/10/2019)</li>
                <li>Tipo: COMPRA ou VENDA (em maiúsculas)</li>
                <li>Ticker: exatamente como cadastrado no sistema</li>
                <li>Quantidade: número com ponto decimal (ex: 1.5)</li>
                <li>Preco: valor unitário com ponto decimal (ex: 4956.01 = R$ 4.956,01)</li>
                <li>Taxas: opcional, valor com ponto decimal (ex: 2.50 = R$ 2,50)</li>
                <li>Observacoes: opcional, pode incluir vírgulas</li>
              </ul>
            </li>
            <li>Salve o arquivo no formato CSV</li>
            <li>Selecione o arquivo para ver um preview das operações</li>
            <li>Verifique se há erros no preview antes de confirmar a importação</li>
          </ol>
          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
            <p className="font-medium text-yellow-800">⚠️ Importante:</p>
            <ul className="mt-2 list-disc list-inside text-yellow-700">
              <li>Use PONTO como separador decimal (não use vírgula)</li>
              <li>Exemplo: 4956.01 será importado como R$ 4.956,01</li>
              <li>O ativo (ticker) deve estar previamente cadastrado no sistema</li>
            </ul>
          </div>
        </div>
      </div>

      {/* ... (resto do código permanece igual) ... */}
    </div>
  )
}