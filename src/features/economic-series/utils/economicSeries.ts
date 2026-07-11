import type { EconomicObservation } from '../models/economicSeries'

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

export function formatQuarterlyObservationDate(date: string): string {
  const [year, month] = date.split('-').map(Number)
  const quarter = Math.floor((month - 1) / 3) + 1

  return `Q${quarter} ${year}`
}

export function formatPercentage(value: number | null): string {
  if (value === null) return 'Not available'

  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(value) + '%'
}

export function formatDate(date: string): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(`${date}T00:00:00Z`))
}
