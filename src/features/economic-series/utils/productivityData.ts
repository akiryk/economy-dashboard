import type { EconomicObservation } from '../models/economicSeries'

export type ProductivityAnswerState =
  | 'yes'
  | 'about-the-same'
  | 'no'
  | 'unavailable'

export function classifyProductivityAnswer(
  value: number | null,
): ProductivityAnswerState {
  if (value === null || !Number.isFinite(value)) return 'unavailable'
  if (value >= 0.5) return 'yes'
  if (value <= -0.5) return 'no'
  return 'about-the-same'
}

export function formatProductivityAnswer(
  state: ProductivityAnswerState,
): string {
  switch (state) {
    case 'yes':
      return 'Yes, productivity is higher than a year ago.'
    case 'about-the-same':
      return 'Not really—productivity is about the same as a year ago.'
    case 'no':
      return 'No, productivity is lower than a year ago.'
    case 'unavailable':
      return 'Productivity change from a year ago is unavailable.'
  }
}

export function formatProductivityAccessibleAnswer(
  state: ProductivityAnswerState,
): string {
  switch (state) {
    case 'yes':
      return 'Yes, the economy is producing more per hour worked.'
    case 'about-the-same':
      return 'Not really, the economy is producing about the same per hour worked.'
    case 'no':
      return 'No, the economy is producing less per hour worked.'
    case 'unavailable':
      return 'Whether the economy is producing more per hour worked is unavailable.'
  }
}

interface ProductivityAccessibleSummaryInput {
  value: number | null
  formattedValue: string
  period: string
  state: ProductivityAnswerState
  momentum: string | null
}

export function formatProductivityAccessibleSummary({
  value,
  formattedValue,
  period,
  state,
  momentum,
}: ProductivityAccessibleSummaryInput): string {
  const comparison = value === null || !Number.isFinite(value)
    ? 'Productivity growth is unavailable.'
    : value === 0
      ? `Productivity was unchanged from a year ago in ${period}.`
      : `Productivity was ${formattedValue} ${value < 0 ? 'lower' : 'higher'} than a year ago in ${period}.`
  return `${comparison} ${formatProductivityAccessibleAnswer(state)}${momentum ? ` ${momentum}` : ''}`
}

function formatPercentagePointMagnitude(value: number): string {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 1,
  }).format(Math.abs(value))
}

export function formatProductivityMomentum(
  change: number | null,
): string | null {
  if (change === null || !Number.isFinite(change)) return null
  const roundedMagnitude = Number(Math.abs(change).toFixed(1))
  if (roundedMagnitude === 0) {
    return 'The pace of productivity growth is about the same as a year earlier.'
  }
  const unit = roundedMagnitude === 1 ? 'percentage point' : 'percentage points'
  return `The pace of productivity growth has ${change > 0 ? 'accelerated' : 'slowed'} by ${formatPercentagePointMagnitude(change)} ${unit} from a year earlier.`
}

export interface NormalizedProductivityObservation extends EconomicObservation {
  changeFromBaseline: number | null
}

export function normalizeProductivityRange(
  observations: readonly EconomicObservation[],
): NormalizedProductivityObservation[] {
  const sorted = [...observations].sort((a, b) => a.date.localeCompare(b.date))
  const baseline = sorted.find(
    (item) => item.value !== null && Number.isFinite(item.value) && item.value !== 0,
  )?.value
  if (baseline === null || baseline === undefined) {
    return sorted.map((item) => ({ ...item, value: null, changeFromBaseline: null }))
  }
  return sorted.map((item) => {
    const value = item.value === null ? null : (item.value / baseline) * 100
    return { date: item.date, value, changeFromBaseline: value === null ? null : value - 100 }
  })
}

export function cumulativeProductivityChange(
  observations: readonly EconomicObservation[],
): number | null {
  const normalized = normalizeProductivityRange(observations)
  return normalized.at(-1)?.changeFromBaseline ?? null
}

function shiftQuarterYear(date: string): string {
  return `${Number(date.slice(0, 4)) - 1}${date.slice(4)}`
}

export interface ProductivityMomentumObservation extends EconomicObservation {
  momentumChange: number | null
}

export function calculateProductivityMomentum(
  observations: readonly EconomicObservation[],
): ProductivityMomentumObservation[] {
  const valuesByDate = new Map(observations.map((item) => [item.date, item.value]))
  return observations.map((item) => {
    const prior = valuesByDate.get(shiftQuarterYear(item.date))
    return {
      ...item,
      momentumChange:
        item.value !== null && prior !== null && prior !== undefined
          ? item.value - prior
          : null,
    }
  })
}
