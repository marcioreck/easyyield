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