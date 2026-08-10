import type { EconomicObservation, EconomicSeries } from '../economic-series/models/economicSeries'
import {
  calculateHistoricalPercentile,
  latestValidObservation,
  selectMonthlyLookback,
  type DashboardThresholdState,
  type HistoricalPercentile,
} from './cpiTileModel'

interface HistoricalRateTileModel {
  headline: EconomicObservation & { value: number }
  secondary: (EconomicObservation & { value: number }) | null
  state: DashboardThresholdState
  stateLabel: string
  sparkline: readonly EconomicObservation[]
  historical: HistoricalPercentile
}

function requireLatest(series: EconomicSeries, label: string) {
  const latest = latestValidObservation(series.observations)
  if (!latest) throw new Error(`${label} has no valid observations`)
  return latest
}

export function describeExpectedInflation(value: number): string {
  if (value < 1) return 'Very low'
  if (value < 1.8) return 'Low'
  if (value <= 2.5) return 'Near price-stability range'
  if (value <= 3) return 'Elevated'
  return 'High'
}

export function classifyExpectedInflation(value: number): DashboardThresholdState {
  if (value < 1 || value > 3) return 'notable-bad'
  if (value >= 1.8 && value <= 2.5) return 'notable-good'
  return 'normal'
}

export function createExpectedInflationTileModel(series: EconomicSeries): HistoricalRateTileModel {
  const headline = requireLatest(series, 'Expected inflation')
  return {
    headline,
    secondary: null,
    state: classifyExpectedInflation(headline.value),
    stateLabel: describeExpectedInflation(headline.value),
    sparkline: selectMonthlyLookback(series.observations, headline.date, 1),
    historical: calculateHistoricalPercentile(series.observations, headline),
  }
}

export function describeFedFunds(effective: number, upper: number | null): string {
  if (upper === null) return 'Target unavailable'
  if (effective > upper) return 'Above target range'
  if (upper - effective <= 0.25) return 'Within target range'
  return 'Below target upper'
}

export function createFedFundsTileModel(
  effectiveSeries: EconomicSeries,
  upperSeries: EconomicSeries | null,
): HistoricalRateTileModel {
  const headline = requireLatest(effectiveSeries, 'Effective federal funds rate')
  const secondary = upperSeries ? latestValidObservation(upperSeries.observations) : null
  return {
    headline,
    secondary,
    state: 'normal',
    stateLabel: describeFedFunds(headline.value, secondary?.value ?? null),
    sparkline: selectMonthlyLookback(effectiveSeries.observations, headline.date, 1),
    historical: calculateHistoricalPercentile(effectiveSeries.observations, headline),
  }
}

export function formatBasisPoints(value: number): string {
  const basisPoints = Math.round(value * 100)
  const sign = basisPoints > 0 ? '+' : basisPoints < 0 ? '−' : ''
  return `${sign}${Math.abs(basisPoints)} bps`
}

export function createYieldCurveTileModel(
  twoYearSeries: EconomicSeries,
  threeMonthSeries: EconomicSeries | null,
): HistoricalRateTileModel {
  const headline = requireLatest(twoYearSeries, '10-year minus 2-year spread')
  const secondary = threeMonthSeries ? latestValidObservation(threeMonthSeries.observations) : null
  return {
    headline,
    secondary,
    state: headline.value < 0 ? 'notable-bad' : 'normal',
    stateLabel: headline.value < 0 ? 'Inverted' : 'Positive slope',
    sparkline: selectMonthlyLookback(twoYearSeries.observations, headline.date, 1),
    historical: calculateHistoricalPercentile(twoYearSeries.observations, headline),
  }
}
