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
    seasonalAdjustment: string
  },
  retrievedAt: string,
  observations: EconomicObservation[],
): EconomicSeries {
  return validateEconomicSeries({
    ...config,
    slug: config.id,
    provider: 'Federal Reserve Bank of St. Louis',
    frequency: 'monthly',
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
  headlineYearOverYearResponse: FredObservationsResponse,
  headlineMomentumResponse: FredObservationsResponse,
  coreResponse: FredObservationsResponse,
  retrievedAt: string,
  config: CpiSeriesConfig,
) {
  const headlineYearOverYearLevels = parseCpiLevels(
    headlineYearOverYearResponse,
    retrievedAt,
    'CPIAUCNS',
  )
  const headlineMomentumLevels = parseCpiLevels(
    headlineMomentumResponse,
    retrievedAt,
    'CPIAUCSL',
  )
  const coreLevels = parseCpiLevels(coreResponse, retrievedAt, 'CPILFESL')
  for (const [id, levels] of [
    ['CPIAUCNS', headlineYearOverYearLevels],
    ['CPIAUCSL', headlineMomentumLevels],
    ['CPILFESL', coreLevels],
  ] as const) {
    const usableCount = levels.filter((item) => item.value !== null).length
    if (usableCount < config.minimumUsableObservations) {
      throw new Error(
        `Expected at least ${config.minimumUsableObservations} usable ${id} observations, received ${usableCount}`,
      )
    }
  }

  const headlineYearOverYear = deriveMonthlyYearOverYearGrowth(headlineYearOverYearLevels)
  const headlineSeasonallyAdjustedYearOverYear = deriveMonthlyYearOverYearGrowth(headlineMomentumLevels)
  const coreYearOverYear = deriveMonthlyYearOverYearGrowth(coreLevels)
  const headlineMomentum = deriveThreeMonthAnnualizedInflation(headlineMomentumLevels)
  const coreMomentum = deriveThreeMonthAnnualizedInflation(coreLevels)

  return {
    headlineNotSeasonallyAdjustedLevel: buildSeries(
      {
        id: 'headline-cpi-index-not-seasonally-adjusted',
        providerSeriesId: 'CPIAUCNS',
        title: 'Consumer Price Index for All Urban Consumers: All Items in U.S. City Average',
        shortTitle: 'Headline CPI index',
        description: 'The official not-seasonally-adjusted CPI-U All Items index used for ordinary 12-month headline inflation.',
        question: 'What is the headline CPI index?',
        transformation: 'Official source index level; no transformation',
        sourceUrl: 'https://fred.stlouisfed.org/series/CPIAUCNS',
        units: 'Index 1982–1984=100',
        seasonalAdjustment: 'Not seasonally adjusted',
      },
      retrievedAt,
      headlineYearOverYearLevels,
    ),
    headlineSeasonallyAdjustedLevel: buildSeries(
      {
        id: 'headline-cpi-index-seasonally-adjusted',
        providerSeriesId: 'CPIAUCSL',
        title: 'Consumer Price Index for All Urban Consumers: All Items in U.S. City Average',
        shortTitle: 'Seasonally adjusted headline CPI index',
        description: 'The official seasonally adjusted CPI-U All Items index used for short-window inflation momentum.',
        question: 'What is the seasonally adjusted headline CPI index?',
        transformation: 'Official source index level; no transformation',
        sourceUrl: 'https://fred.stlouisfed.org/series/CPIAUCSL',
        units: 'Index 1982–1984=100',
        seasonalAdjustment: 'Seasonally adjusted',
      },
      retrievedAt,
      headlineMomentumLevels,
    ),
    headlineInflation: buildSeries(
      {
        id: 'headline-cpi-inflation',
        providerSeriesId: 'CPIAUCNS',
        title: 'Consumer Price Index: Percent Change from Year Ago',
        shortTitle: 'CPI inflation',
        description:
          'The year-over-year percentage change in the Consumer Price Index for All Urban Consumers: All Items in U.S. City Average.',
        question: 'What’s the inflation rate?',
        transformation:
          'Percent change from year ago, calculated by the application',
        sourceUrl: 'https://fred.stlouisfed.org/series/CPIAUCNS',
        units: 'Percent change from year ago',
        seasonalAdjustment: 'Not seasonally adjusted (underlying CPI index)',
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
        seasonalAdjustment: 'Seasonally adjusted (underlying CPI index)',
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
        seasonalAdjustment: 'Seasonally adjusted (underlying CPI index)',
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
        seasonalAdjustment: 'Seasonally adjusted (underlying CPI index)',
      },
      retrievedAt,
      coreMomentum,
    ),
    headlineSeasonallyAdjustedInflation: buildSeries(
      {
        id: 'headline-cpi-inflation-seasonally-adjusted',
        providerSeriesId: 'CPIAUCSL',
        title: 'Seasonally Adjusted CPI: Percent Change from Year Ago',
        shortTitle: 'Seasonally adjusted CPI inflation',
        description: 'The year-over-year change in the seasonally adjusted all-items CPI, used to deflate seasonally adjusted wage growth.',
        question: 'How quickly are seasonally adjusted consumer prices rising?',
        transformation: 'Percent change from year ago, calculated by the application',
        sourceUrl: 'https://fred.stlouisfed.org/series/CPIAUCSL',
        units: 'Percent change from year ago',
        seasonalAdjustment: 'Seasonally adjusted (underlying CPI index)',
      },
      retrievedAt,
      headlineSeasonallyAdjustedYearOverYear,
    ),
  }
}
