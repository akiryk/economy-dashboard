import type { EconomicObservation, EconomicSeries } from '../../src/features/economic-series/models/economicSeries'
import { validateEconomicSeries } from '../../src/features/economic-series/models/validateEconomicSeries'
import type { PurchasingPowerSeriesConfig } from './seriesConfigurations'

export const purchasingPowerWindows = [48, 120, 240] as const
export type PurchasingPowerWindow = (typeof purchasingPowerWindows)[number]

function shiftMonth(date: string, months: number): string {
  const [year, month] = date.split('-').map(Number)
  const shifted = new Date(Date.UTC(year!, month! - 1 + months, 1))
  return shifted.toISOString().slice(0, 10)
}

function sortedUnique(observations: readonly EconomicObservation[], label: string) {
  const sorted = observations.map((observation) => ({ ...observation }))
    .sort((a, b) => a.date.localeCompare(b.date))
  for (let index = 1; index < sorted.length; index += 1) {
    if (sorted[index - 1]!.date === sorted[index]!.date) {
      throw new Error(`${label} contains duplicate date: ${sorted[index]!.date}`)
    }
  }
  return sorted
}

export function derivePurchasingPowerObservations(
  wageObservations: readonly EconomicObservation[],
  cpiObservations: readonly EconomicObservation[],
) {
  const wages = sortedUnique(wageObservations, 'Wage observations')
  const prices = new Map(sortedUnique(cpiObservations, 'CPI-W observations')
    .map(({ date, value }) => [date, value]))
  const realLevel = wages.filter(({ date }) => prices.has(date)).map(({ date, value: wage }) => {
    const cpi = prices.get(date)
    const value = wage !== null && Number.isFinite(wage) && cpi !== null && cpi !== undefined && Number.isFinite(cpi) && cpi > 0
      ? wage / cpi
      : null
    return { date, value }
  })
  const levels = new Map(realLevel.map(({ date, value }) => [date, value]))
  const changes = Object.fromEntries(purchasingPowerWindows.map((window) => [window, realLevel.map(({ date, value }) => {
    const base = levels.get(shiftMonth(date, -window))
    return {
      date,
      value: value !== null && base !== null && base !== undefined && Number.isFinite(base) && base > 0
        ? (value / base - 1) * 100
        : null,
    }
  })])) as Record<PurchasingPowerWindow, EconomicObservation[]>
  return { realLevel, changes }
}

function trimLeadingUnavailable(observations: readonly EconomicObservation[]) {
  const first = observations.findIndex(({ value }) => value !== null)
  return first < 0 ? [] : observations.slice(first)
}

function trimUnavailableEdges(observations: readonly EconomicObservation[]) {
  const leadingTrimmed = trimLeadingUnavailable(observations)
  let last = leadingTrimmed.length - 1
  while (last >= 0 && leadingTrimmed[last]!.value === null) last -= 1
  return last < 0 ? [] : leadingTrimmed.slice(0, last + 1)
}

export function buildPurchasingPowerSeries(
  wageSeries: EconomicSeries,
  cpiSeries: EconomicSeries,
  retrievedAt: string,
  config: PurchasingPowerSeriesConfig,
) {
  const { realLevel, changes } = derivePurchasingPowerObservations(
    wageSeries.observations,
    cpiSeries.observations,
  )
  const sources = [
    { provider: wageSeries.provider, providerSeriesId: wageSeries.providerSeriesId, sourceName: wageSeries.sourceName, sourceUrl: wageSeries.sourceUrl, role: 'Nominal hourly earnings' },
    { provider: cpiSeries.provider, providerSeriesId: cpiSeries.providerSeriesId, sourceName: cpiSeries.sourceName, sourceUrl: cpiSeries.sourceUrl, role: 'Inflation deflator' },
  ]
  const common = {
    provider: 'Federal Reserve Bank of St. Louis', frequency: 'monthly' as const,
    seasonalAdjustment: 'Seasonally adjusted inputs', retrievedAt, sources,
    sourceName: 'U.S. Bureau of Labor Statistics wage and CPI-W data via FRED; calculated by the application',
    sourceUrl: wageSeries.sourceUrl,
  }
  const level = validateEconomicSeries({
    ...common, id: 'real-hourly-purchasing-power', slug: 'real-hourly-purchasing-power',
    providerSeriesId: `${config.wageSource.providerSeriesId}/${config.cpiSource.providerSeriesId}`,
    title: 'Real Hourly Purchasing Power of Production and Nonsupervisory Employees', shortTitle: 'Real hourly purchasing power',
    description: 'Average hourly earnings for production and nonsupervisory private-sector employees divided by CPI-W.',
    question: 'How has the purchasing power of an hour of work changed?', units: 'Nominal hourly earnings divided by CPI-W index',
    transformation: 'AHETPI divided by CWSR0000SA0 at the exact calendar month; no interpolation or rounding', observations: trimUnavailableEdges(realLevel),
  })
  const rolling = Object.fromEntries(purchasingPowerWindows.map((window) => {
    const years = window / 12
    return [window, validateEconomicSeries({
      ...common, id: `real-hourly-purchasing-power-change-${years}-year`, slug: `real-hourly-purchasing-power-change-${years}-year`,
      providerSeriesId: `${config.wageSource.providerSeriesId}/${config.cpiSource.providerSeriesId}`,
      title: `${years}-Year Change in Real Hourly Purchasing Power`, shortTitle: `${years}-year purchasing-power change`,
      description: `Change in real hourly purchasing power from the exact month ${years} years earlier.`,
      question: 'How has the purchasing power of an hour of work changed?', units: `Percent change over ${years} years`,
      transformation: `((real level at t / real level at t-${window} months) - 1) × 100; exact-month alignment, no interpolation or intermediate rounding`,
      observations: trimUnavailableEdges(changes[window]),
    })]
  })) as Record<PurchasingPowerWindow, EconomicSeries>
  return { level, rolling }
}
