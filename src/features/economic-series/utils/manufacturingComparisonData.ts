import type { EconomicObservation, EconomicSeries } from '../models/economicSeries'
import type { TimeRange } from './chartData'

export interface ManufacturingComparisonObservation {
  date: string
  output: number | null
  employment: number | null
}

export interface NormalizedManufacturingObservation extends ManufacturingComparisonObservation {
  normalizedOutput: number | null
  normalizedEmployment: number | null
}

const rangeYears = { '5y': 5, '10y': 10, '20y': 20 } as const

export function alignManufacturingObservations(
  output: EconomicSeries,
  employment: EconomicSeries,
): ManufacturingComparisonObservation[] {
  const employmentByDate = new Map(employment.observations.map((item) => [item.date, item.value]))
  return [...output.observations]
    .sort((a, b) => a.date.localeCompare(b.date))
    .filter((item) => employmentByDate.has(item.date))
    .map((item) => ({
      date: item.date,
      output: item.value,
      employment: employmentByDate.get(item.date) ?? null,
    }))
}

export function filterManufacturingByTimeRange(
  observations: readonly ManufacturingComparisonObservation[],
  range: TimeRange,
): ManufacturingComparisonObservation[] {
  const sorted = [...observations].sort((a, b) => a.date.localeCompare(b.date))
  const latest = [...sorted].reverse().find((item) => item.output !== null && item.employment !== null)
  if (!latest || range === 'max') return sorted
  const boundary = new Date(`${latest.date}T00:00:00Z`)
  boundary.setUTCFullYear(boundary.getUTCFullYear() - rangeYears[range])
  const boundaryDate = boundary.toISOString().slice(0, 10)
  return sorted.filter((item) => item.date >= boundaryDate && item.date <= latest.date)
}

export function normalizeManufacturingComparison(
  observations: readonly ManufacturingComparisonObservation[],
): NormalizedManufacturingObservation[] {
  const sorted = [...observations].sort((a, b) => a.date.localeCompare(b.date))
  const baseline = sorted.find((item) => item.output !== null && item.employment !== null)
  if (!baseline || baseline.output === null || baseline.employment === null ||
      !Number.isFinite(baseline.output) || !Number.isFinite(baseline.employment) ||
      baseline.output <= 0 || baseline.employment <= 0) {
    throw new Error('Manufacturing comparison has no valid positive shared baseline')
  }
  return sorted.map((item) => ({
    ...item,
    normalizedOutput:
      item.date < baseline.date || item.output === null
        ? null
        : (item.output / baseline.output!) * 100,
    normalizedEmployment:
      item.date < baseline.date || item.employment === null
        ? null
        : (item.employment / baseline.employment!) * 100,
  }))
}

export function toNormalizedObservations(
  observations: readonly NormalizedManufacturingObservation[],
  key: 'normalizedEmployment' | 'normalizedOutput',
): EconomicObservation[] {
  return observations.map((item) => ({ date: item.date, value: item[key] }))
}
