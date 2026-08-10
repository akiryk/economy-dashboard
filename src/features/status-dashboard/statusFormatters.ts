import type { EconomicFrequency } from '../economic-series/models/economicSeries'

export function formatDashboardPercent(value: number): string {
  return `${value.toFixed(1)}%`
}

export function formatCompactThousands(value: number): string {
  const rounded = Math.round(Math.abs(value))
  const sign = value > 0 ? '+' : value < 0 ? '−' : ''
  return `${sign}${rounded.toLocaleString('en-US')}k`
}

export function formatClaims(value: number): string {
  return `${Math.round(value / 1_000)}k`
}

export function formatNominalGdp(value: number): string {
  return `$${(value / 1_000).toFixed(1)}T`
}

export function formatDashboardPeriod(
  date: string,
  frequency: EconomicFrequency,
): string {
  const parsed = new Date(`${date}T00:00:00Z`)
  if (frequency === 'quarterly') {
    return `Q${Math.floor(parsed.getUTCMonth() / 3) + 1} ${parsed.getUTCFullYear()}`
  }
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: frequency === 'weekly' || frequency === 'daily' ? 'numeric' : undefined,
    year: 'numeric',
    timeZone: 'UTC',
  }).format(parsed)
}

export function formatHistoryYear(date: string): string {
  return date.slice(0, 4)
}
