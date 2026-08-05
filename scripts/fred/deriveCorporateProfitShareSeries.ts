import type { EconomicSeries } from '../../src/features/economic-series/models/economicSeries'
import { validateEconomicSeries } from '../../src/features/economic-series/models/validateEconomicSeries'
import type { CorporateProfitShareConfig } from './seriesConfigurations'

export function deriveCorporateProfitShareSeries(
  profits: EconomicSeries,
  gdp: EconomicSeries,
  retrievedAt: string,
  config: CorporateProfitShareConfig,
): EconomicSeries {
  const profitsStart = profits.observations[0]?.date
  const profitsEnd = profits.observations.at(-1)?.date
  const gdpStart = gdp.observations[0]?.date
  const gdpEnd = gdp.observations.at(-1)?.date
  const gdpByDate = new Map(
    gdp.observations.map((observation) => [observation.date, observation.value]),
  )
  const observations = profits.observations.map((observation) => {
    const denominator = gdpByDate.get(observation.date)
    return {
      date: observation.date,
      value:
        observation.value === null ||
        denominator === null ||
        denominator === undefined ||
        denominator === 0
          ? null
          : (observation.value / denominator) * 100,
    }
  })
  const firstValid = observations.findIndex((observation) => observation.value !== null)

  return validateEconomicSeries({
    id: 'corporate-profit-share',
    slug: 'corporate-profit-share',
    provider: 'Federal Reserve Bank of St. Louis',
    providerSeriesId: 'CPATAX / GDP',
    title: 'After-Tax Corporate Profit Share of GDP',
    shortTitle: 'After-tax corporate profit share',
    description:
      'Adjusted after-tax corporate profits divided by nominal gross domestic product.',
    question: 'How large are corporate profits relative to the economy?',
    units: 'Percent of GDP',
    frequency: 'quarterly',
    seasonalAdjustment: 'Seasonally adjusted annual rate (both source levels)',
    transformation: 'CPATAX divided by GDP multiplied by 100, calculated by the application',
    sourceName: 'U.S. Bureau of Economic Analysis via FRED; ratio calculated by the application',
    sourceUrl: config.profitsSource.sourceUrl,
    retrievedAt,
    observations: firstValid < 0 ? [] : observations.slice(firstValid),
    sources: [
      {
        provider: 'Federal Reserve Bank of St. Louis',
        providerSeriesId: 'CPATAX',
        sourceName: config.profitsSource.sourceName,
        sourceUrl: config.profitsSource.sourceUrl,
        role: 'Adjusted after-tax corporate-profits numerator',
        observationStart: profitsStart,
        observationEnd: profitsEnd,
      },
      {
        provider: 'Federal Reserve Bank of St. Louis',
        providerSeriesId: 'GDP',
        sourceName: config.gdpSource.sourceName,
        sourceUrl: config.gdpSource.sourceUrl,
        role: 'Nominal GDP denominator',
        observationStart: gdpStart,
        observationEnd: gdpEnd,
      },
    ],
  })
}
