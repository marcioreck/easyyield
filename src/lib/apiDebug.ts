/**
 * Debug de respostas das APIs externas.
 * Ative com DEBUG_API_RESPONSES=true no .env.
 * Grava em .data/api-debug.log (uma linha JSON por resposta).
 */

import { promises as fs } from 'fs'
import path from 'path'

const DATA_DIR = path.join(process.cwd(), '.data')
const DEBUG_LOG = path.join(DATA_DIR, 'api-debug.log')

function isEnabled(): boolean {
  return process.env.DEBUG_API_RESPONSES === 'true' || process.env.DEBUG_API_RESPONSES === '1'
}

export interface ApiLogEntry {
  at: string
  provider: string
  operation: string
  key: string
  fromCache: boolean
  status: 'ok' | 'error'
  summary?: string
  error?: string
}

/**
 * Registra uma resposta de API (ou uso de cache) para inspeção.
 */
export async function logApiResponse(entry: ApiLogEntry): Promise<void> {
  if (!isEnabled()) return
  try {
    await fs.mkdir(DATA_DIR, { recursive: true })
    const line = JSON.stringify({
      ...entry,
      at: new Date().toISOString(),
    }) + '\n'
    await fs.appendFile(DEBUG_LOG, line, 'utf-8')
  } catch {
    // não falhar a app se o log der erro
  }
}

/**
 * Atalho: log de sucesso (dado vindo da API ou do cache).
 */
export async function logApiSuccess(
  provider: string,
  operation: string,
  key: string,
  fromCache: boolean,
  summary?: string
): Promise<void> {
  await logApiResponse({
    at: new Date().toISOString(),
    provider,
    operation,
    key,
    fromCache,
    status: 'ok',
    summary: summary ?? (fromCache ? 'cache hit' : 'api response'),
  })
}

/**
 * Atalho: log de erro na chamada da API.
 */
export async function logApiError(
  provider: string,
  operation: string,
  key: string,
  error: string
): Promise<void> {
  await logApiResponse({
    at: new Date().toISOString(),
    provider,
    operation,
    key,
    fromCache: false,
    status: 'error',
    error,
  })
}
