import type { EconomicFrequency } from '../../src/features/economic-series/models/economicSeries'

export interface FredSeriesConfig {
  id: string
  slug: string
  outputFile: string
  providerSeriesId: string
  frequency: Extract<EconomicFrequency, 'monthly' | 'quarterly'>
  fredFrequency: 'm' | 'q'
  observationStart: string
  unitsParameter: 'pc1'
  minimumUsableObservations: number
  title: string
  shortTitle: string
  description: string
  question: string
  units: string
  seasonalAdjustment: string | null
  transformation: string
  sourceName: string
  sourceUrl: string
}

export const fredSeriesConfigurations: readonly FredSeriesConfig[] = [
  {
    id: 'real-gdp-growth',
    slug: 'real-gdp-growth',
    outputFile:
      'src/features/economic-series/data/real-gdp-growth.json',
    providerSeriesId: 'GDPC1',
    frequency: 'quarterly',
    fredFrequency: 'q',
    observationStart: '2000-01-01',
    unitsParameter: 'pc1',
    minimumUsableObservations: 80,
    title: 'Real Gross Domestic Product: Percent Change from Year Ago',
    shortTitle: 'Real GDP growth',
    description:
      'Inflation-adjusted U.S. gross domestic product, expressed as the percentage change from the same quarter one year earlier.',
    question: 'Is the U.S. economy growing?',
    units: 'Percent change from year ago',
    seasonalAdjustment:
      'Seasonally adjusted annual rate (underlying GDP level)',
    transformation: 'Percent change from year ago',
    sourceName: 'U.S. Bureau of Economic Analysis via FRED',
    sourceUrl: 'https://fred.stlouisfed.org/series/GDPC1',
  },
  {
    id: 'headline-cpi-inflation',
    slug: 'headline-cpi-inflation',
    outputFile:
      'src/features/economic-series/data/headline-cpi-inflation.json',
    providerSeriesId: 'CPIAUCSL',
    frequency: 'monthly',
    fredFrequency: 'm',
    observationStart: '2000-01-01',
    unitsParameter: 'pc1',
    minimumUsableObservations: 240,
    title: 'Consumer Price Inflation',
    shortTitle: 'CPI inflation',
    description:
      'The year-over-year percentage change in the Consumer Price Index for All Urban Consumers: All Items in U.S. City Average.',
    question: 'How quickly are consumer prices rising?',
    units: 'Percent change from year ago',
    seasonalAdjustment: 'Seasonally adjusted (underlying CPI index)',
    transformation: 'Percent change from year ago',
    sourceName: 'U.S. Bureau of Labor Statistics via FRED',
    sourceUrl: 'https://fred.stlouisfed.org/series/CPIAUCSL',
  },
]
