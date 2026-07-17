import type {
  EconomicFrequency,
  EconomicObservation,
} from '../models/economicSeries'

export function sortObservationsChronologically(
  observations: readonly EconomicObservation[],
): EconomicObservation[] {
  return [...observations].sort((a, b) => a.date.localeCompare(b.date))
}

export function findLatestNonNullObservation(
  observations: readonly EconomicObservation[],
): EconomicObservation | null {
  const sorted = sortObservationsChronologically(observations)

  for (let index = sorted.length - 1; index >= 0; index -= 1) {
    const observation = sorted[index]
    if (observation?.value !== null) return observation ?? null
  }

  return null
}

export function selectMostRecentObservations(
  observations: readonly EconomicObservation[],
  count: number,
): EconomicObservation[] {
  if (count <= 0) return []

  return sortObservationsChronologically(observations)
    .filter(
      (observation): observation is EconomicObservation & { value: number } =>
        observation.value !== null,
    )
    .reverse()
    .slice(0, count)
}

function parseIsoDate(date: string): Date {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date)
  if (!match) throw new RangeError(`Invalid observation date: ${date}`)

  const parsed = new Date(
    Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])),
  )
  if (parsed.toISOString().slice(0, 10) !== date) {
    throw new RangeError(`Invalid observation date: ${date}`)
  }
  return parsed
}

export function formatObservationPeriod(
  date: string,
  frequency: EconomicFrequency,
): string {
  const parsed = parseIsoDate(date)
  const year = parsed.getUTCFullYear()
  const month = parsed.getUTCMonth() + 1

  if (frequency === 'monthly') {
    return new Intl.DateTimeFormat('en-US', {
      month: 'long',
      year: 'numeric',
      timeZone: 'UTC',
    }).format(parsed)
  }

  if (frequency === 'quarterly') {
    const quarter = Math.floor((month - 1) / 3) + 1
    return `${year} Q${quarter}`
  }

  if (frequency === 'weekly') {
    return `Week of ${new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      timeZone: 'UTC',
    }).format(parsed)}`
  }

  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC',
  }).format(parsed)
}

export function formatPercentage(value: number | null): string {
  if (value === null) return 'Not available'

  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(value) + '%'
}

export function formatSignedPercentage(value: number | null): string {
  if (value === null) return 'Not available'
  if (value === 0) return '0.0%'
  const formatted = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(Math.abs(value))
  return value > 0 ? `+${formatted}%` : `−${formatted}%`
}

export function formatSignedPercentagePoints(value: number | null): string {
  if (value === null) return 'Not available'
  if (value === 0) return '0.0'
  const formatted = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(Math.abs(value))
  return value > 0 ? `+${formatted}` : `−${formatted}`
}

export type EconomicValueFormat =
  | 'credit-index'
  | 'index'
  | 'percentage'
  | 'signed-thousands'
  | 'thousands-units'

export function formatSignedThousands(value: number | null): string {
  if (value === null) return 'Not available'

  const rounded = Math.round(Math.abs(value))
  if (value > 0) return `+${rounded.toLocaleString('en-US')}K`
  if (value < 0) return `−${rounded.toLocaleString('en-US')}K`
  return '0'
}

export function formatJobChangeProse(value: number | null): string {
  if (value === null) return 'an unavailable number of jobs'
  if (value === 0) return 'no net change in jobs'

  const jobs = Math.abs(value) * 1_000
  const formatted =
    jobs >= 1_000_000
      ? `${new Intl.NumberFormat('en-US', { maximumFractionDigits: 1 }).format(jobs / 1_000_000)} million jobs`
      : `${Math.round(jobs).toLocaleString('en-US')} jobs`
  return value > 0 ? `a gain of ${formatted}` : `a loss of ${formatted}`
}

export function formatEconomicValue(
  value: number | null,
  format: EconomicValueFormat,
): string {
  return format === 'credit-index'
    ? value === null
      ? 'Unavailable'
      : value.toFixed(2)
    : format === 'signed-thousands'
    ? formatSignedThousands(value)
    : format === 'thousands-units'
      ? value === null
        ? 'Not available'
        : `${Math.round(value).toLocaleString('en-US')}K`
    : format === 'index'
      ? value === null
        ? 'Unavailable'
        : value.toFixed(1)
    : formatPercentage(value)
}

export function formatAnnualizedHousingUnits(value: number | null): string {
  if (value === null) return 'Not available'
  const units = value * 1_000
  return units >= 1_000_000
    ? `${new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(units / 1_000_000)} million`
    : Math.round(units).toLocaleString('en-US')
}

export function formatDate(date: string): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(`${date}T00:00:00Z`))
}
