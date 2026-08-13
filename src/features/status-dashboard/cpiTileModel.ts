import type {
  EconomicObservation,
  EconomicSeries,
} from '../economic-series/models/economicSeries'

export type DashboardThresholdState = 'notable-good' | 'normal' | 'notable-bad'

export interface HistoricalPercentile {
  percentile: number
  historyStart: string
  historyEnd: string
  minimum: EconomicObservation & { value: number }
  maximum: EconomicObservation & { value: number }
  record: 'low' | 'high' | null
}

export interface CpiTileModel {
  headline: EconomicObservation & { value: number }
  state: DashboardThresholdState
  stateLabel: string
  sparkline: readonly EconomicObservation[]
  historical: HistoricalPercentile
}

export function classifyCpiInflation(value: number): DashboardThresholdState {
  if (value >= 1.5 && value <= 2.5) return 'notable-good'
  if (value > 3.5 || value < 0.5) return 'notable-bad'
  return 'normal'
}

export function describeCpiInflation(value: number): string {
  if (value < 0.5) return 'Very low'
  if (value < 1.5) return 'Low'
  if (value <= 2.5) return 'Near price-stability range'
  if (value <= 3.5) return 'Elevated'
  return 'High'
}

export function latestValidObservation(
  observations: readonly EconomicObservation[],
): (EconomicObservation & { value: number }) | null {
  for (let index = observations.length - 1; index >= 0; index -= 1) {
    const observation = observations[index]
    if (observation.value !== null) {
      return { ...observation, value: observation.value }
    }
  }
  return null
}

export function selectMonthlyLookback(
  observations: readonly EconomicObservation[],
  latestDate: string,
  years: number,
): readonly EconomicObservation[] {
  const start = new Date(`${latestDate}T00:00:00Z`)
  start.setUTCFullYear(start.getUTCFullYear() - years)
  const startDate = start.toISOString().slice(0, 10)
  return observations.filter(({ date }) => date >= startDate && date <= latestDate)
}

/**
 * Uses the midpoint percentile rank: values below plus half of ties, divided by
 * all valid observations. Exact record endpoints are pinned to 0% and 100%.
 */
export function calculateHistoricalPercentile(
  observations: readonly EconomicObservation[],
  current: EconomicObservation & { value: number },
): HistoricalPercentile {
  const valid = observations.filter(
    (observation): observation is EconomicObservation & { value: number } =>
      observation.value !== null,
  )
  if (valid.length === 0) {
    throw new Error('Historical percentile requires at least one valid observation')
  }

  const minimum = valid.reduce((candidate, observation) =>
    observation.value < candidate.value ? observation : candidate)
  const maximum = valid.reduce((candidate, observation) =>
    observation.value > candidate.value ? observation : candidate)
  const isLow = current.value === minimum.value
  const isHigh = current.value === maximum.value
  const below = valid.filter(({ value }) => value < current.value).length
  const equal = valid.filter(({ value }) => value === current.value).length
  const percentile = isLow && !isHigh
    ? 0
    : isHigh
      ? 100
      : (below + equal / 2) / valid.length * 100

  return {
    percentile,
    historyStart: valid[0].date,
    historyEnd: valid[valid.length - 1].date,
    minimum,
    maximum,
    record: isLow && !isHigh ? 'low' : isHigh ? 'high' : null,
  }
}

export function createCpiTileModel(
  headlineSeries: EconomicSeries,
): CpiTileModel {
  const headline = latestValidObservation(headlineSeries.observations)
  if (!headline) throw new Error('Headline CPI has no valid observations')
  const state = classifyCpiInflation(headline.value)

  return {
    headline,
    state,
    stateLabel: describeCpiInflation(headline.value),
    sparkline: selectMonthlyLookback(
      headlineSeries.observations,
      headline.date,
      5,
    ),
    historical: calculateHistoricalPercentile(
      headlineSeries.observations,
      headline,
    ),
  }
}
