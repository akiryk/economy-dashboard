import type { EconomicFrequency } from '../../src/features/economic-series/models/economicSeries'

export interface FredSeriesConfig {
  dataHandling: 'provider-level' | 'provider-transformed'
  id: string
  slug: string
  outputFile: string
  providerSeriesId: string
  frequency: Extract<EconomicFrequency, 'monthly' | 'quarterly'>
  fredFrequency: 'm' | 'q'
  historyPolicy: HistoryPolicy
  fredUnits?: 'pc1'
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

export type HistoryPolicy =
  | { type: 'full' }
  | { type: 'from'; date: string }

export const fredSeriesConfigurations: readonly FredSeriesConfig[] = [
  {
    dataHandling: 'provider-transformed',
    id: 'real-gdp-growth',
    slug: 'real-gdp-growth',
    outputFile:
      'src/features/economic-series/data/real-gdp-growth.json',
    providerSeriesId: 'GDPC1',
    frequency: 'quarterly',
    fredFrequency: 'q',
    historyPolicy: { type: 'full' },
    fredUnits: 'pc1',
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
    dataHandling: 'provider-transformed',
    id: 'headline-cpi-inflation',
    slug: 'headline-cpi-inflation',
    outputFile:
      'src/features/economic-series/data/headline-cpi-inflation.json',
    providerSeriesId: 'CPIAUCSL',
    frequency: 'monthly',
    fredFrequency: 'm',
    historyPolicy: { type: 'full' },
    fredUnits: 'pc1',
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
  {
    dataHandling: 'provider-level',
    id: 'unemployment-rate',
    slug: 'unemployment-rate',
    outputFile: 'src/features/economic-series/data/unemployment-rate.json',
    providerSeriesId: 'UNRATE',
    frequency: 'monthly',
    fredFrequency: 'm',
    historyPolicy: { type: 'full' },
    minimumUsableObservations: 240,
    title: 'Unemployment Rate',
    shortTitle: 'Unemployment',
    description:
      'The share of the U.S. civilian labor force age 16 and older that does not have a job and is actively looking for work.',
    question: 'How difficult is it for people who want work to find it?',
    units: 'Percent',
    seasonalAdjustment: 'Seasonally adjusted',
    transformation: 'Level',
    sourceName: 'U.S. Bureau of Labor Statistics via FRED',
    sourceUrl: 'https://fred.stlouisfed.org/series/UNRATE',
  },
  {
    dataHandling: 'provider-level',
    id: 'prime-age-employment-ratio',
    slug: 'prime-age-employment-ratio',
    outputFile:
      'src/features/economic-series/data/prime-age-employment-ratio.json',
    providerSeriesId: 'LNS12300060',
    frequency: 'monthly',
    fredFrequency: 'm',
    historyPolicy: { type: 'full' },
    minimumUsableObservations: 240,
    title: 'Prime-Age Employment-to-Population Ratio',
    shortTitle: 'Prime-age employment',
    description:
      'The share of the U.S. civilian noninstitutional population ages 25 through 54 that is employed.',
    question: 'What share of prime-age adults are employed?',
    units: 'Percent',
    seasonalAdjustment: 'Seasonally adjusted',
    transformation: 'Level',
    sourceName: 'U.S. Bureau of Labor Statistics via FRED',
    sourceUrl: 'https://fred.stlouisfed.org/series/LNS12300060',
  },
]

export interface PayrollSeriesConfig {
  dataHandling: 'locally-derived'
  providerSeriesId: 'PAYEMS'
  fredFrequency: 'm'
  historyPolicy: HistoryPolicy
  minimumUsableObservations: number
  sourceUnits: string
  seasonalAdjustment: string
  sourceName: string
  sourceUrl: string
  monthlyChangeOutputFile: string
  payrollGrowthOutputFile: string
}

export const payrollSeriesConfiguration: PayrollSeriesConfig = {
  dataHandling: 'locally-derived',
  providerSeriesId: 'PAYEMS',
  fredFrequency: 'm',
  historyPolicy: { type: 'full' },
  minimumUsableObservations: 3,
  sourceUnits: 'Thousands of persons',
  seasonalAdjustment: 'Seasonally adjusted',
  sourceName:
    'U.S. Bureau of Labor Statistics via FRED; changes calculated by the application',
  sourceUrl: 'https://fred.stlouisfed.org/series/PAYEMS',
  monthlyChangeOutputFile:
    'src/features/economic-series/data/monthly-payroll-change.json',
  payrollGrowthOutputFile:
    'src/features/economic-series/data/payroll-growth.json',
}

export interface WageSeriesConfig {
  dataHandling: 'multi-source-derived'
  providerSeriesId: 'AHETPI'
  fredFrequency: 'm'
  historyPolicy: HistoryPolicy
  minimumUsableObservations: number
  nominalOutputFile: string
  realOutputFile: string
  seasonalAdjustment: string
  sourceName: string
  sourceUrl: string
}

export const wageSeriesConfiguration: WageSeriesConfig = {
  dataHandling: 'multi-source-derived',
  providerSeriesId: 'AHETPI',
  fredFrequency: 'm',
  historyPolicy: { type: 'full' },
  minimumUsableObservations: 13,
  nominalOutputFile:
    'src/features/economic-series/data/nominal-wage-growth.json',
  realOutputFile: 'src/features/economic-series/data/real-wage-growth.json',
  seasonalAdjustment: 'Seasonally adjusted',
  sourceName: 'U.S. Bureau of Labor Statistics via FRED',
  sourceUrl: 'https://fred.stlouisfed.org/series/AHETPI',
}
