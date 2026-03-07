/**
 * Cache persistente em arquivo para respostas de APIs externas (BRAPI, Yahoo).
 * Reduz chamadas repetidas e evita estourar rate limits de planos gratuitos.
 * TTL por tipo: quote 15min, historical 24h, search 1h.
 */

import { promises as fs } from 'fs'
import path from 'path'

const DATA_DIR = path.join(process.cwd(), '.data')
const CACHE_FILE = path.join(DATA_DIR, 'api-cache.json')

const TTL_MS: Record<string, number> = {
  quote: 15 * 60 * 1000,       // 15 min
  historical: 24 * 60 * 60 * 1000, // 24h
  search: 60 * 60 * 1000,      // 1h
  'brapi-dividends': 24 * 60 * 60 * 1000, // 24h
}

interface CacheEntry {
  data: unknown
  fetchedAt: string // ISO
}

let cache: Record<string, CacheEntry> = {}
let loaded = false

async function ensureDataDir(): Promise<void> {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true })
  } catch {
    // ignore
  }
}

async function load(): Promise<void> {
  if (loaded) return
  try {
    const raw = await fs.readFile(CACHE_FILE, 'utf-8')
    cache = JSON.parse(raw) as Record<string, CacheEntry>
  } catch {
    cache = {}
  }
  loaded = true
}

async function save(): Promise<void> {
  await ensureDataDir()
  await fs.writeFile(CACHE_FILE, JSON.stringify(cache, null, 0), 'utf-8')
}

function getTtlForKey(key: string): number {
  const prefix = key.split(':')[0] ?? 'quote'
  return TTL_MS[prefix] ?? TTL_MS.quote
}

/**
 * Retorna o valor em cache se existir e não estiver expirado.
 */
export async function getCached<T>(key: string): Promise<T | null> {
  await load()
  const entry = cache[key]
  if (!entry) return null
  const ttl = getTtlForKey(key)
  const age = Date.now() - new Date(entry.fetchedAt).getTime()
  if (age > ttl) {
    delete cache[key]
    await save()
    return null
  }
  return entry.data as T
}

/**
 * Grava resposta no cache.
 */
export async function setCached(key: string, data: unknown): Promise<void> {
  await load()
  cache[key] = {
    data,
    fetchedAt: new Date().toISOString(),
  }
  await save()
}

/**
 * Chave para cotação: quote:BRL:PETR4 ou quote:USD:AAPL
 */
export function cacheKeyQuote(currency: string, ticker: string): string {
  return `quote:${currency}:${ticker.toUpperCase()}`
}

/**
 * Chave para histórico: historical:BRL:PETR4:2024-01-01:2024-12-31
 */
export function cacheKeyHistorical(currency: string, ticker: string, from: Date, to: Date): string {
  const f = from.toISOString().slice(0, 10)
  const t = to.toISOString().slice(0, 10)
  return `historical:${currency}:${ticker.toUpperCase()}:${f}:${t}`
}

/**
 * Chave para busca: search:BRL:petr
 */
export function cacheKeySearch(currency: string, query: string): string {
  return `search:${currency}:${query.trim().toLowerCase()}`
}

/**
 * Chave para dividendos BRAPI: brapi-dividends:PETR4
 */
export function cacheKeyBrapiDividends(ticker: string): string {
  return `brapi-dividends:${ticker.toUpperCase()}`
}
