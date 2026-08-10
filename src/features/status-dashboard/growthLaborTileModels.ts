import type {
  EconomicObservation,
  EconomicSeries,
} from '../economic-series/models/economicSeries'
import {
  calculateHistoricalPercentile,
  latestValidObservation,
  selectMonthlyLookback,
  type DashboardThresholdState,
  type HistoricalPercentile,
} from './cpiTileModel'

interface HistoricalStatusTileModel {
  headline: EconomicObservation & { value: number }
  secondary: (EconomicObservation & { value: number }) | null
  state: DashboardThresholdState
  stateLabel: string
  sparkline: readonly EconomicObservation[]
  historical: HistoricalPercentile
}

export interface SahmTileModel {
  headline: EconomicObservation & { value: number }
  state: DashboardThresholdState
  stateLabel: 'Below trigger' | 'Triggered'
  sparkline: readonly EconomicObservation[]
}

function requireLatest(series: EconomicSeries, label: string) {
  const latest = latestValidObservation(series.observations)
  if (!latest) throw new Error(`${label} has no valid observations`)
  return latest
}

export function describeGdpGrowth(value: number): string {
  if (value < 0) return 'Contracting'
  if (value <= 1) return 'Slow growth'
  if (value <= 2.5) return 'Growing'
  return 'Strong growth'
}

export function classifyGdpGrowth(value: number): DashboardThresholdState {
  if (value < 0) return 'notable-bad'
  if (value > 2.5) return 'notable-good'
  return 'normal'
}

export function createGdpTileModel(
  growthSeries: EconomicSeries,
  nominalSeries: EconomicSeries | null,
): HistoricalStatusTileModel {
  const headline = requireLatest(growthSeries, 'Real GDP growth')
  return {
    headline,
    secondary: nominalSeries ? latestValidObservation(nominalSeries.observations) : null,
    state: classifyGdpGrowth(headline.value),
    stateLabel: describeGdpGrowth(headline.value),
    sparkline: selectMonthlyLookback(growthSeries.observations, headline.date, 10),
    historical: calculateHistoricalPercentile(growthSeries.observations, headline),
  }
}

export function describeUnemployment(value: number): string {
  if (value < 4) return 'Low'
  if (value < 5) return 'Moderate'
  if (value < 7) return 'High'
  return 'Very high'
}

export function classifyUnemployment(value: number): DashboardThresholdState {
  if (value <= 4) return 'notable-good'
  if (value >= 5) return 'notable-bad'
  return 'normal'
}

export function createUnemploymentTileModel(
  unemploymentSeries: EconomicSeries,
  payrollSeries: EconomicSeries | null,
): HistoricalStatusTileModel {
  const headline = requireLatest(unemploymentSeries, 'Unemployment')
  return {
    headline,
    secondary: payrollSeries ? latestValidObservation(payrollSeries.observations) : null,
    state: classifyUnemployment(headline.value),
    stateLabel: describeUnemployment(headline.value),
    sparkline: selectMonthlyLookback(unemploymentSeries.observations, headline.date, 5),
    historical: calculateHistoricalPercentile(unemploymentSeries.observations, headline),
  }
}

export function describeInitialClaims(value: number): string {
  if (value < 220_000) return 'Low'
  if (value <= 300_000) return 'Typical range'
  return 'Elevated'
}

export function classifyInitialClaims(value: number): DashboardThresholdState {
  if (value < 220_000) return 'notable-good'
  if (value > 300_000) return 'notable-bad'
  return 'normal'
}

export function createInitialClaimsTileModel(
  averageSeries: EconomicSeries,
  latestClaimsSeries: EconomicSeries | null,
): HistoricalStatusTileModel {
  const headline = requireLatest(averageSeries, 'Initial claims four-week average')
  return {
    headline,
    secondary: latestClaimsSeries
      ? latestValidObservation(latestClaimsSeries.observations)
      : null,
    state: classifyInitialClaims(headline.value),
    stateLabel: describeInitialClaims(headline.value),
    sparkline: selectMonthlyLookback(averageSeries.observations, headline.date, 2),
    historical: calculateHistoricalPercentile(averageSeries.observations, headline),
  }
}

export function createSahmTileModel(series: EconomicSeries): SahmTileModel {
  const headline = requireLatest(series, 'Sahm Rule gap')
  const triggered = headline.value >= 0.5
  return {
    headline,
    state: triggered ? 'notable-bad' : 'normal',
    stateLabel: triggered ? 'Triggered' : 'Below trigger',
    sparkline: selectMonthlyLookback(series.observations, headline.date, 5),
  }
}
