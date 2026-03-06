'use client'

import { useState } from 'react'

const SUGGESTIONS = [
  'Qual o resumo do meu portfólio este mês?',
  'Quais ativos têm maior Dividend Yield?',
  'Compare o desempenho por tipo de ativo.'
]

export default function AssistantPage() {
  const [message, setMessage] = useState('')
  const [reply, setReply] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setReply(null)
    setLoading(true)
    try {
      const res = await fetch('/api/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message })
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Erro ao enviar pergunta')
        return
      }
      setReply(data.reply)
    } catch {
      setError('Erro de conexão')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-2">Assistente</h1>
      <p className="text-gray-600 mb-4">
        Faça perguntas sobre seu portfólio. As respostas usam um resumo dos seus
        dados e uma API de IA (ex.: OpenAI). Configure OPENAI_API_KEY no .env.
      </p>

      <form onSubmit={handleSubmit} className="space-y-3">
        <label className="block">
          <span className="text-sm font-medium text-gray-700">Sua pergunta</span>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Ex: Qual o total investido?"
            className="mt-1 block w-full border border-gray-300 rounded-md p-2"
            rows={2}
            disabled={loading}
          />
        </label>
        <div className="flex gap-2">
          <button
            type="submit"
            disabled={loading || !message.trim()}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Enviando...' : 'Enviar'}
          </button>
        </div>
      </form>

      <div className="mt-4">
        <p className="text-sm text-gray-500 mb-2">Sugestões:</p>
        <ul className="space-y-1">
          {SUGGESTIONS.map((s) => (
            <li key={s}>
              <button
                type="button"
                onClick={() => setMessage(s)}
                className="text-sm text-blue-600 hover:underline text-left"
              >
                {s}
              </button>
            </li>
          ))}
        </ul>
      </div>

      {error && (
        <div className="mt-4 p-3 bg-red-50 text-red-700 rounded-md text-sm">
          {error}
        </div>
      )}

      {reply && (
        <div className="mt-4 p-4 bg-gray-50 rounded-md border border-gray-200">
          <p className="text-sm font-medium text-gray-700 mb-2">Resposta:</p>
          <p className="whitespace-pre-wrap text-gray-900">{reply}</p>
        </div>
      )}
    </div>
  )
}
