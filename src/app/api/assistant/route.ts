import { NextResponse } from 'next/server'
import OpenAI from 'openai'
import { buildPortfolioContextForAssistant } from '@/services/assistantContext'

const SYSTEM_PROMPT = `Você é um assistente do EasyYield, um aplicativo de gestão de investimentos (Brasil e EUA).
Responda de forma objetiva e curta, em português, com base apenas no contexto do portfólio fornecido.
Se a pergunta não puder ser respondida com o contexto, diga isso. Não invente dados.`

export async function POST(request: Request) {
  try {
    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) {
      return NextResponse.json(
        { error: 'OPENAI_API_KEY não configurada. Configure em .env para usar o assistente.' },
        { status: 503 }
      )
    }

    const body = await request.json()
    const message = typeof body.message === 'string' ? body.message.trim() : ''
    if (!message) {
      return NextResponse.json(
        { error: 'message é obrigatório' },
        { status: 400 }
      )
    }

    const context = await buildPortfolioContextForAssistant()
    const openai = new OpenAI({ apiKey })
    const model = process.env.OPENAI_MODEL || 'gpt-4o-mini'

    const completion = await openai.chat.completions.create({
      model,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        {
          role: 'user',
          content: `Contexto do portfólio (dados agregados):\n\n${context}\n\n---\nPergunta do usuário: ${message}`
        }
      ],
      temperature: 0.3,
      max_tokens: 500
    })

    const reply = completion.choices[0]?.message?.content ?? 'Sem resposta.'
    return NextResponse.json({ reply })
  } catch (error) {
    console.error('Assistant error:', error)
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : 'Erro ao processar pergunta'
      },
      { status: 500 }
    )
  }
}
