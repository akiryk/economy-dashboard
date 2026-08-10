import type { EconomicObservation, EconomicSeries } from '../economic-series/models/economicSeries'
import {
  calculateHistoricalPercentile,
  latestValidObservation,
  selectMonthlyLookback,
  type DashboardThresholdState,
  type HistoricalPercentile,
} from './cpiTileModel'

type FiniteObservation = EconomicObservation & { value: number }

export interface LongRatesTileModel {
  headline: FiniteObservation
  mortgage: FiniteObservation
  mortgageSpreadBasisPoints: number
  spreadState: 'narrow' | 'typical' | 'wide'
  sparkline: readonly EconomicObservation[]
  historical: HistoricalPercentile
}

export interface Sp500TileModel {
  headline: FiniteObservation
  drawdown: number
  yearToDateChange: number | null
  state: DashboardThresholdState
  stateLabel: 'At high' | 'Near high' | 'Modest pullback' | 'Meaningful pullback' | 'Correction or worse'
  sparkline: readonly EconomicObservation[]
}

export interface HighYieldSpreadTileModel {
  headline: FiniteObservation
  basisPoints: number
  state: DashboardThresholdState
  stateLabel: 'Calm' | 'Normal risk premium' | 'Stressed'
  sparkline: readonly EconomicObservation[]
  historical: HistoricalPercentile
}

function requireLatest(series: EconomicSeries, label: string): FiniteObservation {
  const latest = latestValidObservation(series.observations)
  if (!latest) throw new Error(`${label} has no valid observations`)
  return latest
}

function validObservations(observations: readonly EconomicObservation[]): FiniteObservation[] {
  return observations.filter(
    (observation): observation is FiniteObservation => observation.value !== null,
  )
}

export function mortgageTreasurySpreadBasisPoints(mortgage: number, treasury: number): number {
  return (mortgage - treasury) * 100
}

export function createLongRatesTileModel(
  treasurySeries: EconomicSeries,
  mortgageSeries: EconomicSeries,
): LongRatesTileModel {
  const headline = requireLatest(treasurySeries, '10-year Treasury yield')
  const mortgage = requireLatest(mortgageSeries, '30-year mortgage rate')
  const treasuryByDate = new Map(validObservations(treasurySeries.observations)
    .map(({ date, value }) => [date, value]))
  const historicalSpreads = validObservations(mortgageSeries.observations)
    .flatMap(({ date, value }) => {
      const treasury = treasuryByDate.get(date)
      return treasury === undefined ? [] : [{ date, value: value - treasury }]
    })
  const currentSpread = mortgage.value - headline.value
  const below = historicalSpreads.filter(({ value }) => value < currentSpread).length
  const percentile = historicalSpreads.length ? below / historicalSpreads.length * 100 : 50
  return {
    headline,
    mortgage,
    mortgageSpreadBasisPoints: mortgageTreasurySpreadBasisPoints(mortgage.value, headline.value),
    spreadState: percentile < 25 ? 'narrow' : percentile > 75 ? 'wide' : 'typical',
    sparkline: selectMonthlyLookback(treasurySeries.observations, headline.date, 1),
    historical: calculateHistoricalPercentile(treasurySeries.observations, headline),
  }
}

export function calculateAvailableHistoryDrawdown(
  observations: readonly EconomicObservation[],
  current: FiniteObservation,
): number {
  const maximum = Math.max(...validObservations(observations)
    .filter(({ date }) => date <= current.date)
    .map(({ value }) => value))
  return (current.value / maximum - 1) * 100
}

export function calculateYearToDateChange(
  observations: readonly EconomicObservation[],
  current: FiniteObservation,
): number | null {
  const priorYear = Number(current.date.slice(0, 4)) - 1
  const priorYearEnd = validObservations(observations)
    .filter(({ date }) => Number(date.slice(0, 4)) === priorYear)
    .at(-1)
  return priorYearEnd ? (current.value / priorYearEnd.value - 1) * 100 : null
}

export function describeSp500Drawdown(value: number): Sp500TileModel['stateLabel'] {
  if (value === 0) return 'At high'
  if (value > -1) return 'Near high'
  if (value > -5) return 'Modest pullback'
  if (value > -10) return 'Meaningful pullback'
  return 'Correction or worse'
}

export function classifySp500Drawdown(value: number): DashboardThresholdState {
  if (value > -1) return 'notable-good'
  if (value < -10) return 'notable-bad'
  return 'normal'
}

export function createSp500TileModel(series: EconomicSeries): Sp500TileModel {
  const headline = requireLatest(series, 'S&P 500')
  const drawdown = calculateAvailableHistoryDrawdown(series.observations, headline)
  const drawdownObservations = validObservations(series.observations).map((observation, index, valid) => ({
    date: observation.date,
    value: calculateAvailableHistoryDrawdown(valid.slice(0, index + 1), observation),
  }))
  return {
    headline,
    drawdown,
    yearToDateChange: calculateYearToDateChange(series.observations, headline),
    state: classifySp500Drawdown(drawdown),
    stateLabel: describeSp500Drawdown(drawdown),
    sparkline: selectMonthlyLookback(drawdownObservations, headline.date, 1),
  }
}

export function describeHighYieldSpread(basisPoints: number): HighYieldSpreadTileModel['stateLabel'] {
  if (basisPoints < 350) return 'Calm'
  if (basisPoints <= 500) return 'Normal risk premium'
  return 'Stressed'
}

export function classifyHighYieldSpread(basisPoints: number): DashboardThresholdState {
  if (basisPoints < 350) return 'notable-good'
  if (basisPoints > 500) return 'notable-bad'
  return 'normal'
}

export function createHighYieldSpreadTileModel(series: EconomicSeries): HighYieldSpreadTileModel {
  const headline = requireLatest(series, 'High-yield credit spread')
  const basisPoints = headline.value * 100
  return {
    headline,
    basisPoints,
    state: classifyHighYieldSpread(basisPoints),
    stateLabel: describeHighYieldSpread(basisPoints),
    sparkline: selectMonthlyLookback(series.observations, headline.date, 1),
    historical: calculateHistoricalPercentile(series.observations, headline),
  }
}
