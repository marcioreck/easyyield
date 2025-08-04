'use client'

import { useState } from 'react'
import { formatDate } from '@/utils/format'

export default function SettingsPage() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleExport = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/backup/export')
      if (!response.ok) {
        throw new Error('Erro ao gerar arquivos de backup')
      }

      const data = await response.json()
      if (!data.success) {
        throw new Error(data.error || 'Erro ao gerar arquivos de backup')
      }

      // Gera nome dos arquivos com data atual
      const now = new Date()
      const timestamp = formatDate(now, 'dd-MM-yyyy_HH-mm')
      const baseFilename = `easyyield_backup_${timestamp}`

      // Download do arquivo JSON
      const jsonBlob = new Blob([data.files.json], { type: 'application/json' })
      downloadFile(jsonBlob, `${baseFilename}.json`)

      // Download dos arquivos CSV
      Object.entries(data.files.csv).forEach(([type, content]) => {
        const csvBlob = new Blob([content as string], { type: 'text/csv' })
        downloadFile(csvBlob, `${baseFilename}_${type}.csv`)
      })
    } catch (error) {
      console.error('Error exporting data:', error)
      setError(error instanceof Error ? error.message : 'Erro ao exportar dados')
    } finally {
      setLoading(false)
    }
  }

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      setLoading(true)
      setError(null)

      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/backup/restore', {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Erro ao restaurar backup')
      }

      window.location.reload()
    } catch (error) {
      console.error('Error importing data:', error)
      setError(error instanceof Error ? error.message : 'Erro ao importar dados')
    } finally {
      setLoading(false)
    }
  }

  const downloadFile = (blob: Blob, filename: string) => {
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    window.URL.revokeObjectURL(url)
    document.body.removeChild(a)
  }

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Configurações</h1>

      <div className="bg-white rounded-lg shadow p-6 space-y-6">
        <div>
          <h2 className="text-xl font-semibold mb-4">Backup e Restauração</h2>
          
          <div className="space-y-4">
            <div>
              <button
                onClick={handleExport}
                disabled={loading}
                className={`bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:bg-blue-300 ${
                  loading ? 'cursor-not-allowed' : ''
                }`}
              >
                {loading ? 'Exportando...' : 'Exportar Dados'}
              </button>
              <p className="mt-1 text-sm text-gray-500">
                Baixa um arquivo JSON para backup completo e arquivos CSV para análise
              </p>
            </div>

            <div>
              <label className="block">
                <span className="sr-only">Escolher arquivo de backup</span>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImport}
                  disabled={loading}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </label>
              <p className="mt-1 text-sm text-gray-500">
                Selecione um arquivo JSON de backup para restaurar
              </p>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded">
                {error}
              </div>
            )}
          </div>
        </div>

        <div className="border-t pt-6">
          <h2 className="text-xl font-semibold mb-4">Sobre</h2>
          <p className="text-gray-600">
            EasyYield - Versão 1.0.0
          </p>
          <p className="text-sm text-gray-500 mt-2">
            © 2024 EasyYield. Todos os direitos reservados.
          </p>
        </div>
      </div>
    </div>
  )
}