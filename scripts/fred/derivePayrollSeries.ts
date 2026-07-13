import type {
  EconomicObservation,
  EconomicSeries,
} from '../../src/features/economic-series/models/economicSeries'
import { validateEconomicSeries } from '../../src/features/economic-series/models/validateEconomicSeries'
import type { FredObservationsResponse } from './fredClient'
import type { PayrollSeriesConfig } from './seriesConfigurations'

interface ParsedObservation extends EconomicObservation {
  value: number | null
}

function trimLeadingNulls(
  observations: readonly EconomicObservation[],
): EconomicObservation[] {
  const firstUsableIndex = observations.findIndex(
    (observation) => observation.value !== null,
  )
  return firstUsableIndex < 0 ? [] : observations.slice(firstUsableIndex)
}

function previousMonth(date: string): string {
  const parsed = new Date(`${date}T00:00:00Z`)
  parsed.setUTCMonth(parsed.getUTCMonth() - 1)
  return parsed.toISOString().slice(0, 10)
}

function parseSourceObservations(
  response: FredObservationsResponse,
  retrievedAt: string,
): ParsedObservation[] {
  const observations = response.observations
    .filter((observation) => observation.date <= retrievedAt)
    .map((observation) => ({
      date: observation.date,
      value: observation.value === '.' ? null : Number(observation.value),
    }))
    .sort((a, b) => a.date.localeCompare(b.date))

  for (let index = 1; index < observations.length; index += 1) {
    if (observations[index - 1]!.date === observations[index]!.date) {
      throw new Error(
        `PAYEMS response contains duplicate date: ${observations[index]!.date}`,
      )
    }
  }

  return observations
}

export function deriveMonthlyPayrollChanges(
  sourceObservations: readonly EconomicObservation[],
): EconomicObservation[] {
  const sorted = [...sourceObservations].sort((a, b) =>
    a.date.localeCompare(b.date),
  )

  return sorted.map((current, index) => {
    const previous = sorted[index - 1]
    const isConsecutive = previous?.date === previousMonth(current.date)
    const value =
      isConsecutive && previous.value !== null && current.value !== null
        ? current.value - previous.value
        : null
    return { date: current.date, value }
  })
}

export function deriveThreeMonthAverageChanges(
  monthlyChanges: readonly EconomicObservation[],
): EconomicObservation[] {
  const sorted = [...monthlyChanges].sort((a, b) =>
    a.date.localeCompare(b.date),
  )

  return sorted.map((current, index) => {
    const previous = sorted[index - 1]
    const twoMonthsPrior = sorted[index - 2]
    const isConsecutive =
      previous?.date === previousMonth(current.date) &&
      twoMonthsPrior?.date === previousMonth(previous.date)
    const values = [twoMonthsPrior?.value, previous?.value, current.value]
    const value =
      isConsecutive &&
      values.every((item): item is number => item !== null && item !== undefined)
        ? values.reduce((sum, item) => sum + item, 0) / 3
        : null
    return { date: current.date, value }
  })
}

function buildSeries(
  config: PayrollSeriesConfig,
  retrievedAt: string,
  observations: EconomicObservation[],
  kind: 'monthly-change' | 'three-month-average',
): EconomicSeries {
  const isAverage = kind === 'three-month-average'
  return validateEconomicSeries({
    id: isAverage ? 'payroll-growth' : 'monthly-payroll-change',
    slug: isAverage ? 'payroll-growth' : 'monthly-payroll-change',
    provider: 'Federal Reserve Bank of St. Louis',
    providerSeriesId: config.providerSeriesId,
    title: isAverage ? 'Payroll Growth' : 'Monthly Payroll Change',
    shortTitle: isAverage ? 'Payroll growth' : 'Monthly payroll change',
    description: isAverage
      ? 'The rolling three-month average of monthly changes in seasonally adjusted total nonfarm payroll employment.'
      : 'The monthly change in seasonally adjusted total nonfarm payroll employment.',
    question: isAverage
      ? 'Are employers adding jobs?'
      : 'How much did total nonfarm payroll employment change?',
    units: 'Thousands of jobs',
    frequency: 'monthly',
    seasonalAdjustment: config.seasonalAdjustment,
    transformation: isAverage
      ? 'Three-month average of monthly change calculated by the application'
      : 'Monthly change calculated by the application',
    sourceName: config.sourceName,
    sourceUrl: config.sourceUrl,
    retrievedAt,
    observations,
  })
}

export function derivePayrollSeries(
  response: FredObservationsResponse,
  retrievedAt: string,
  config: PayrollSeriesConfig,
): { monthlyChange: EconomicSeries; payrollGrowth: EconomicSeries } {
  const source = parseSourceObservations(response, retrievedAt)
  const usableCount = source.filter((observation) => observation.value !== null).length
  if (usableCount < config.minimumUsableObservations) {
    throw new Error(
      `Expected at least ${config.minimumUsableObservations} usable PAYEMS observations, received ${usableCount}`,
    )
  }

  const allMonthlyChanges = deriveMonthlyPayrollChanges(source)
  const monthlyChanges = trimLeadingNulls(allMonthlyChanges)
  const averages = trimLeadingNulls(
    deriveThreeMonthAverageChanges(allMonthlyChanges),
  )

  return {
    monthlyChange: buildSeries(
      config,
      retrievedAt,
      monthlyChanges,
      'monthly-change',
    ),
    payrollGrowth: buildSeries(
      config,
      retrievedAt,
      averages,
      'three-month-average',
    ),
  }
}
