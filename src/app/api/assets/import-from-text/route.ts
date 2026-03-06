import { NextResponse } from 'next/server'
import { z } from 'zod'
import OpenAI from 'openai'
import { prisma } from '@/lib/prisma'
import { AssetType, Currency } from '@prisma/client'
import { MAX_IMPORT_RAW_TEXT_BYTES } from '@/lib/llmSafety'

const importedAssetSchema = z.object({
  ticker: z.string().min(1).max(10).regex(/^[A-Z0-9.]+$/),
  name: z.string().min(1).max(200),
  type: z.nativeEnum(AssetType),
  currency: z.nativeEnum(Currency),
  description: z.string().max(500).optional().nullable(),
  indexador: z.string().max(10).optional().nullable(),
  taxa: z.union([z.number(), z.string()]).optional().nullable(),
  vencimento: z.string().optional().nullable(),
  pagaJurosSemestrais: z.boolean().optional().nullable()
})

const responseSchema = z.object({
  assets: z.array(importedAssetSchema)
})

const SYSTEM_PROMPT = `Você é um assistente que extrai dados de ativos financeiros de texto.
Extraia uma lista de ativos do texto fornecido pelo usuário.
Retorne APENAS um JSON válido, sem markdown ou texto extra, no formato:
{"assets": [{"ticker": "CODIGO", "name": "Nome do ativo", "type": "TIPO", "currency": "BRL ou USD", "description": "opcional", "indexador": "opcional PRE/CDI/IPCA/SELIC", "taxa": número ou null, "vencimento": "YYYY-MM-DD ou null", "pagaJurosSemestrais": true/false ou null}]}

Tipos válidos: TESOURO_DIRETO, POUPANCA, CDB, FII, REIT, ACAO_BR, ACAO_US, DEBENTURE, RENDA_FIXA_DIGITAL, STAKING_CRYPTO, CRI, FI_INFRA, OUTROS.
Moedas: BRL, USD.
Ticker: apenas letras maiúsculas, números e ponto. Se o texto tiver ticker em minúsculo, converta para maiúsculo.`

export async function POST(request: Request) {
  try {
    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) {
      return NextResponse.json(
        { error: 'OPENAI_API_KEY não configurada. Configure em .env para usar importação por texto.' },
        { status: 503 }
      )
    }

    const body = await request.json()
    const rawText = typeof body.rawText === 'string' ? body.rawText.trim() : ''
    if (!rawText) {
      return NextResponse.json(
        { error: 'rawText é obrigatório' },
        { status: 400 }
      )
    }

    const sizeBytes = new TextEncoder().encode(rawText).length
    if (sizeBytes > MAX_IMPORT_RAW_TEXT_BYTES) {
      return NextResponse.json(
        { error: `Texto muito longo. Máximo ${MAX_IMPORT_RAW_TEXT_BYTES / 1024} KB.` },
        { status: 400 }
      )
    }

    const openai = new OpenAI({ apiKey })
    const model = process.env.OPENAI_MODEL || 'gpt-4o-mini'
    const completion = await openai.chat.completions.create({
      model,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: `Extraia os ativos abaixo:\n\n${rawText}` }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.1
    })

    const content = completion.choices[0]?.message?.content
    if (!content) {
      return NextResponse.json(
        { error: 'Resposta vazia da API de IA' },
        { status: 502 }
      )
    }

    let parsed: z.infer<typeof responseSchema>
    try {
      const json = JSON.parse(content) as unknown
      parsed = responseSchema.parse(json)
    } catch {
      return NextResponse.json(
        { error: 'Resposta da IA em formato inválido. Tente reformatar o texto e enviar novamente.' },
        { status: 422 }
      )
    }

    const created: string[] = []
    const errors: { ticker: string; message: string }[] = []

    for (const item of parsed.assets) {
      const ticker = item.ticker.toUpperCase()
      const taxa = item.taxa != null ? (typeof item.taxa === 'string' ? parseFloat(item.taxa) : item.taxa) : null
      const vencimento = item.vencimento ? new Date(item.vencimento) : null
      if (isNaN(vencimento?.getTime() ?? 0) && item.vencimento) {
        errors.push({ ticker, message: 'Data de vencimento inválida' })
        continue
      }

      const existing = await prisma.asset.findFirst({
        where: { ticker, currency: item.currency as Currency }
      })
      if (existing) {
        errors.push({ ticker, message: 'Ticker já cadastrado para esta moeda' })
        continue
      }

      try {
        await prisma.asset.create({
          data: {
            ticker,
            name: item.name,
            type: item.type as AssetType,
            currency: item.currency as Currency,
            description: item.description ?? null,
            indexador: item.indexador ?? null,
            taxa,
            vencimento: vencimento && !isNaN(vencimento.getTime()) ? vencimento : null,
            pagaJurosSemestrais: item.pagaJurosSemestrais ?? false
          }
        })
        created.push(ticker)
      } catch (err) {
        errors.push({
          ticker,
          message: err instanceof Error ? err.message : 'Erro ao criar ativo'
        })
      }
    }

    return NextResponse.json({
      created: created.length,
      ignored: errors.length,
      createdTickers: created,
      errors
    })
  } catch (error) {
    console.error('Import from text error:', error)
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : 'Erro ao processar importação por texto'
      },
      { status: 500 }
    )
  }
}
