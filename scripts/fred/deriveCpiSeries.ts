import type {
  EconomicObservation,
  EconomicSeries,
} from '../../src/features/economic-series/models/economicSeries'
import { validateEconomicSeries } from '../../src/features/economic-series/models/validateEconomicSeries'
import type { FredObservationsResponse } from './fredClient'
import type { CpiSeriesConfig, FredSeriesConfig } from './seriesConfigurations'

function shiftMonth(date: string, months: number): string {
  const parsed = new Date(`${date}T00:00:00Z`)
  parsed.setUTCMonth(parsed.getUTCMonth() + months)
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

export function parseCpiLevels(
  response: FredObservationsResponse,
  retrievedAt: string,
  providerSeriesId: string,
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
        `${providerSeriesId} response contains duplicate date: ${observations[index]!.date}`,
      )
    }
  }
  return observations
}

export function deriveMonthlyYearOverYearGrowth(
  levels: readonly EconomicObservation[],
): EconomicObservation[] {
  const sorted = [...levels].sort((a, b) => a.date.localeCompare(b.date))
  const levelsByDate = new Map(
    sorted.map((observation) => [observation.date, observation.value]),
  )
  return sorted.map((current) => {
    const prior = levelsByDate.get(shiftMonth(current.date, -12))
    return {
      date: current.date,
      value:
        current.value !== null && prior !== null && prior !== undefined
          ? (current.value / prior - 1) * 100
          : null,
    }
  })
}

export function deriveThreeMonthAnnualizedInflation(
  levels: readonly EconomicObservation[],
): EconomicObservation[] {
  const sorted = [...levels].sort((a, b) => a.date.localeCompare(b.date))
  const levelsByDate = new Map(
    sorted.map((observation) => [observation.date, observation.value]),
  )
  return sorted.map((current) => {
    const window = [0, -1, -2, -3].map((offset) =>
      levelsByDate.get(shiftMonth(current.date, offset)),
    )
    const prior = window[3]
    const complete = window.every(
      (value): value is number => value !== null && value !== undefined,
    )
    return {
      date: current.date,
      value:
        complete && current.value !== null && prior !== undefined && prior !== null
          ? (Math.pow(current.value / prior, 4) - 1) * 100
          : null,
    }
  })
}

function buildSeries(
  config: {
    id: string
    providerSeriesId: string
    title: string
    shortTitle: string
    description: string
    question: string
    transformation: string
    sourceUrl: string
    units: string
  },
  retrievedAt: string,
  observations: EconomicObservation[],
): EconomicSeries {
  return validateEconomicSeries({
    ...config,
    slug: config.id,
    provider: 'Federal Reserve Bank of St. Louis',
    frequency: 'monthly',
    seasonalAdjustment: 'Seasonally adjusted (underlying CPI index)',
    sourceName: 'U.S. Bureau of Labor Statistics via FRED',
    retrievedAt,
    observations: trimLeadingNulls(observations),
  })
}

export function deriveSingleMonthlyGrowthSeries(
  response: FredObservationsResponse,
  retrievedAt: string,
  config: FredSeriesConfig,
): EconomicSeries {
  const levels = parseCpiLevels(response, retrievedAt, config.providerSeriesId)
  const usableCount = levels.filter((item) => item.value !== null).length
  if (usableCount < config.minimumUsableObservations) {
    throw new Error(
      `Expected at least ${config.minimumUsableObservations} usable monthly source observations, received ${usableCount}`,
    )
  }
  return validateEconomicSeries({
    ...config,
    provider: 'Federal Reserve Bank of St. Louis',
    retrievedAt,
    observations: trimLeadingNulls(deriveMonthlyYearOverYearGrowth(levels)),
  })
}

export function deriveCpiSeries(
  headlineResponse: FredObservationsResponse,
  coreResponse: FredObservationsResponse,
  retrievedAt: string,
  config: CpiSeriesConfig,
) {
  const headlineLevels = parseCpiLevels(
    headlineResponse,
    retrievedAt,
    'CPIAUCSL',
  )
  const coreLevels = parseCpiLevels(coreResponse, retrievedAt, 'CPILFESL')
  for (const [id, levels] of [
    ['CPIAUCSL', headlineLevels],
    ['CPILFESL', coreLevels],
  ] as const) {
    const usableCount = levels.filter((item) => item.value !== null).length
    if (usableCount < config.minimumUsableObservations) {
      throw new Error(
        `Expected at least ${config.minimumUsableObservations} usable ${id} observations, received ${usableCount}`,
      )
    }
  }

  const headlineYearOverYear = deriveMonthlyYearOverYearGrowth(headlineLevels)
  const coreYearOverYear = deriveMonthlyYearOverYearGrowth(coreLevels)
  const headlineMomentum = deriveThreeMonthAnnualizedInflation(headlineLevels)
  const coreMomentum = deriveThreeMonthAnnualizedInflation(coreLevels)

  return {
    headlineInflation: buildSeries(
      {
        id: 'headline-cpi-inflation',
        providerSeriesId: 'CPIAUCSL',
        title: 'Consumer Price Inflation',
        shortTitle: 'CPI inflation',
        description:
          'The year-over-year percentage change in the Consumer Price Index for All Urban Consumers: All Items in U.S. City Average.',
        question: 'How quickly are consumer prices rising?',
        transformation:
          'Percent change from year ago, calculated by the application',
        sourceUrl: 'https://fred.stlouisfed.org/series/CPIAUCSL',
        units: 'Percent change from year ago',
      },
      retrievedAt,
      headlineYearOverYear,
    ),
    coreInflation: buildSeries(
      {
        id: 'core-cpi-inflation',
        providerSeriesId: 'CPILFESL',
        title: 'Core CPI Inflation',
        shortTitle: 'Core CPI inflation',
        description:
          'Year-over-year inflation in the Consumer Price Index excluding food and energy.',
        question: 'Is inflation broad and persistent?',
        transformation:
          'Percent change from year ago, calculated by the application',
        sourceUrl: 'https://fred.stlouisfed.org/series/CPILFESL',
        units: 'Percent',
      },
      retrievedAt,
      coreYearOverYear,
    ),
    headlineMomentum: buildSeries(
      {
        id: 'headline-cpi-three-month-annualized',
        providerSeriesId: 'CPIAUCSL',
        title: 'Headline CPI Three-Month Annualized Inflation',
        shortTitle: 'Headline CPI momentum',
        description:
          'The annualized pace implied by the latest three months of headline CPI index changes.',
        question: 'Is inflation currently accelerating or slowing?',
        transformation:
          'Three-month annualized percent change, calculated by the application',
        sourceUrl: 'https://fred.stlouisfed.org/series/CPIAUCSL',
        units: 'Percent',
      },
      retrievedAt,
      headlineMomentum,
    ),
    coreMomentum: buildSeries(
      {
        id: 'core-cpi-three-month-annualized',
        providerSeriesId: 'CPILFESL',
        title: 'Core CPI Three-Month Annualized Inflation',
        shortTitle: 'Core CPI momentum',
        description:
          'The annualized pace implied by the latest three months of core CPI index changes.',
        question: 'Is inflation currently accelerating or slowing?',
        transformation:
          'Three-month annualized percent change, calculated by the application',
        sourceUrl: 'https://fred.stlouisfed.org/series/CPILFESL',
        units: 'Percent',
      },
      retrievedAt,
      coreMomentum,
    ),
  }
}
