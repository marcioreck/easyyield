export function formatCurrency(value: number, currency: 'BRL' | 'USD' = 'BRL'): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: currency
  }).format(value)
}

export function formatPercent(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'percent',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value / 100)
}

export function formatDate(date: Date, format: string = 'dd/MM/yyyy'): string {
  const pad = (n: number) => n.toString().padStart(2, '0')
  
  const dd = pad(date.getDate())
  const MM = pad(date.getMonth() + 1)
  const yyyy = date.getFullYear()
  const HH = pad(date.getHours())
  const mm = pad(date.getMinutes())
  
  return format
    .replace('dd', dd)
    .replace('MM', MM)
    .replace('yyyy', yyyy.toString())
    .replace('HH', HH)
    .replace('mm', mm)
}

export function parseDate(dateStr: string): Date {
  // Remove espaços extras
  dateStr = dateStr.trim()

  // Tenta primeiro o formato DD/MM/YYYY
  const parts = dateStr.split('/')
  if (parts.length === 3) {
    const day = parseInt(parts[0], 10)
    const month = parseInt(parts[1], 10)
    const year = parseInt(parts[2], 10)

    // Cria a data usando UTC para evitar problemas de timezone
    const date = new Date(Date.UTC(year, month - 1, day))

    // Verifica se a data é válida
    if (
      date.getUTCFullYear() === year &&
      date.getUTCMonth() === month - 1 &&
      date.getUTCDate() === day
    ) {
      // Converte para data local mantendo o mesmo dia
      const localDate = new Date(year, month - 1, day, 12, 0, 0)
      return localDate
    }
  }

  // Se não for DD/MM/YYYY, tenta YYYY-MM-DD (formato ISO)
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    const [year, month, day] = dateStr.split('-').map(n => parseInt(n, 10))
    const date = new Date(year, month - 1, day, 12, 0, 0)
    
    // Verifica se a data é válida
    if (
      date.getFullYear() === year &&
      date.getMonth() === month - 1 &&
      date.getDate() === day
    ) {
      return date
    }
  }

  throw new Error('Data inválida. Use o formato DD/MM/YYYY')
}

export function formatQuantity(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 6
  }).format(value)
}

export function formatNumber(value: number, decimals: number = 2): string {
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(value)
}

// Funções específicas para CSV (usando ponto como decimal)
export function parseCsvQuantity(value: string): number {
  // No CSV, o ponto é o separador decimal
  const cleanValue = value.trim()
  const number = parseFloat(cleanValue)
  
  if (isNaN(number)) {
    throw new Error('Quantidade inválida')
  }
  
  return number
}

export function parseCsvCurrency(value: string): number {
  // No CSV, o ponto é o separador decimal
  const cleanValue = value.trim()
  const number = parseFloat(cleanValue)
  
  if (isNaN(number)) {
    throw new Error('Valor monetário inválido')
  }
  
  return number
}

// Funções específicas para interface do usuário (usando vírgula como decimal)
export function parseUserCurrency(value: string): number {
  // Remove símbolo da moeda, pontos de milhar e substitui vírgula por ponto
  const cleanValue = value
    .replace(/[R$\s]/g, '')
    .replace(/\./g, '')
    .replace(',', '.')
  
  const number = parseFloat(cleanValue)
  
  if (isNaN(number)) {
    throw new Error('Valor monetário inválido')
  }
  
  return number
}

export function parseUserQuantity(value: string): number {
  // Remove pontos de milhar e substitui vírgula por ponto
  const cleanValue = value.replace(/\./g, '').replace(',', '.')
  const number = parseFloat(cleanValue)
  
  if (isNaN(number)) {
    throw new Error('Quantidade inválida')
  }
  
  return number
}