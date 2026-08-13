import type {
  EconomicObservation,
  EconomicSeries,
} from '../../src/features/economic-series/models/economicSeries'
import { validateEconomicSeries } from '../../src/features/economic-series/models/validateEconomicSeries'
import type { FredObservationsResponse } from './fredClient'
import type { WageSeriesConfig } from './seriesConfigurations'

function yearEarlier(date: string): string {
  const parsed = new Date(`${date}T00:00:00Z`)
  parsed.setUTCFullYear(parsed.getUTCFullYear() - 1)
  return parsed.toISOString().slice(0, 10)
}

function trimLeadingNulls(
  observations: readonly EconomicObservation[],
): EconomicObservation[] {
  const firstUsable = observations.findIndex(
    (observation) => observation.value !== null,
  )
  return firstUsable < 0 ? [] : observations.slice(firstUsable)
}

function parseWageLevels(
  response: FredObservationsResponse,
  retrievedAt: string,
  seriesId: string,
): EconomicObservation[] {
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
        `${seriesId} response contains duplicate date: ${observations[index]!.date}`,
      )
    }
  }
  return observations
}

export function deriveNominalWageGrowth(
  wageLevels: readonly EconomicObservation[],
): EconomicObservation[] {
  const sorted = [...wageLevels].sort((a, b) => a.date.localeCompare(b.date))
  const levelsByDate = new Map(
    sorted.map((observation) => [observation.date, observation.value]),
  )

  const observations = sorted.map((current) => {
    const prior = levelsByDate.get(yearEarlier(current.date))
    const value =
      current.value !== null && prior !== null && prior !== undefined
        ? (current.value / prior - 1) * 100
        : null
    return { date: current.date, value }
  })
  return observations
}

export function deriveRealWageGrowth(
  wageLevels: readonly EconomicObservation[],
  cpiInflation: readonly EconomicObservation[],
): EconomicObservation[] {
  const sorted = [...wageLevels].sort((a, b) => a.date.localeCompare(b.date))
  const levelsByDate = new Map(
    sorted.map((observation) => [observation.date, observation.value]),
  )
  const inflationByDate = new Map(
    cpiInflation.map((observation) => [observation.date, observation.value]),
  )

  const observations = sorted
    .filter((current) => inflationByDate.has(current.date))
    .map((current) => {
    const prior = levelsByDate.get(yearEarlier(current.date))
    const inflation = inflationByDate.get(current.date)
    const value =
      current.value !== null &&
      prior !== null &&
      prior !== undefined &&
      inflation !== null &&
      inflation !== undefined
        ? (current.value / prior / (1 + inflation / 100) - 1) * 100
        : null
      return { date: current.date, value }
    })
  return observations
}

export function deriveWageSeries(
  wageResponse: FredObservationsResponse,
  cpiInflation: EconomicSeries,
  retrievedAt: string,
  config: WageSeriesConfig,
): { nominalWageGrowth: EconomicSeries; realWageGrowth: EconomicSeries } {
  const wageLevels = parseWageLevels(
    wageResponse,
    retrievedAt,
    config.providerSeriesId,
  )
  const usableCount = wageLevels.filter(
    (observation) => observation.value !== null,
  ).length
  if (usableCount < config.minimumUsableObservations) {
    throw new Error(
      `Expected at least ${config.minimumUsableObservations} usable ${config.providerSeriesId} observations, received ${usableCount}`,
    )
  }

  const nominalObservations = trimLeadingNulls(
    deriveNominalWageGrowth(wageLevels),
  )
  const realObservations = trimLeadingNulls(
    deriveRealWageGrowth(wageLevels, cpiInflation.observations),
  )
  const common = {
    provider: 'Federal Reserve Bank of St. Louis',
    providerSeriesId: config.providerSeriesId,
    frequency: 'monthly',
    seasonalAdjustment: config.seasonalAdjustment,
    sourceName: config.sourceName,
    sourceUrl: config.sourceUrl,
    retrievedAt,
    units: 'Percent change from year ago',
  } as const

  return {
    nominalWageGrowth: validateEconomicSeries({
      ...common,
      id: 'nominal-wage-growth',
      slug: 'nominal-wage-growth',
      title: 'Nominal Wage Growth',
      shortTitle: 'Nominal wage growth',
      description:
        'Year-over-year growth in average hourly earnings of all private-sector employees.',
      question: 'How quickly are average hourly earnings rising?',
      transformation: 'Year-over-year change calculated by the application',
      observations: nominalObservations,
    }),
    realWageGrowth: validateEconomicSeries({
      ...common,
      id: 'real-wage-growth',
      slug: 'real-wage-growth',
      title: 'Real Wage Growth',
      shortTitle: 'Real wage growth',
      description:
        'Year-over-year growth in average hourly earnings after deflating with headline CPI.',
      question: 'Are workers’ wages keeping up with prices?',
      transformation:
        'Exact year-over-year wage growth deflated by headline CPI, calculated by the application',
      sourceName:
        'U.S. Bureau of Labor Statistics wage and CPI data via FRED; real growth calculated by the application',
      observations: realObservations,
      sources: [
        {
          provider: 'Federal Reserve Bank of St. Louis',
          providerSeriesId: config.providerSeriesId,
          sourceName: config.sourceName,
          sourceUrl: config.sourceUrl,
          role: 'Wage measure',
        },
        {
          provider: 'Federal Reserve Bank of St. Louis',
          providerSeriesId: 'CPIAUCSL',
          sourceName: 'U.S. Bureau of Labor Statistics via FRED',
          sourceUrl: 'https://fred.stlouisfed.org/series/CPIAUCSL',
          role: 'Inflation deflator',
        },
      ],
    }),
  }
}
