const currencyFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
})

const dateFormatter = new Intl.DateTimeFormat('pt-BR')

const dateTimeFormatter = new Intl.DateTimeFormat('pt-BR', {
  dateStyle: 'short',
  timeStyle: 'short',
})

export function formatCurrency(value: number) {
  return currencyFormatter.format(value)
}

export function formatEmissionDate(value?: string) {
  if (!value) {
    return '—'
  }

  const [year, month, day] = value.slice(0, 10).split('-').map(Number)
  const date = new Date(year, month - 1, day)

  return Number.isNaN(date.getTime()) ? '—' : dateFormatter.format(date)
}

export function formatCreatedAt(value: string) {
  const date = new Date(value)

  return Number.isNaN(date.getTime()) ? '—' : dateTimeFormatter.format(date)
}
