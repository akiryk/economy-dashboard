import type { EconomicFrequency } from '../../src/features/economic-series/models/economicSeries'

export interface FredSeriesConfig {
  dataHandling: 'locally-derived' | 'provider-level' | 'provider-transformed'
  id: string
  slug: string
  outputFile: string
  providerSeriesId: string
  frequency: Extract<EconomicFrequency, 'weekly' | 'monthly' | 'quarterly'>
  fredFrequency: 'w' | 'm' | 'q'
  historyPolicy: HistoryPolicy
  fredUnits?: 'pc1'
  localDerivation?: LocalDerivation
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

export type LocalDerivation =
  | 'year-over-year-monthly-growth'
  | 'year-over-year-quarterly-growth'

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
    dataHandling: 'locally-derived',
    id: 'headline-cpi-inflation',
    slug: 'headline-cpi-inflation',
    outputFile:
      'src/features/economic-series/data/headline-cpi-inflation.json',
    providerSeriesId: 'CPIAUCSL',
    frequency: 'monthly',
    fredFrequency: 'm',
    historyPolicy: { type: 'full' },
    localDerivation: 'year-over-year-monthly-growth',
    minimumUsableObservations: 240,
    title: 'Consumer Price Inflation',
    shortTitle: 'CPI inflation',
    description:
      'The year-over-year percentage change in the Consumer Price Index for All Urban Consumers: All Items in U.S. City Average.',
    question: 'How quickly are consumer prices rising?',
    units: 'Percent change from year ago',
    seasonalAdjustment: 'Seasonally adjusted (underlying CPI index)',
    transformation:
      'Percent change from year ago, calculated by the application',
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
  {
    dataHandling: 'locally-derived',
    id: 'real-gdp-per-capita-growth',
    slug: 'real-gdp-per-capita-growth',
    outputFile:
      'src/features/economic-series/data/real-gdp-per-capita-growth.json',
    providerSeriesId: 'A939RX0Q048SBEA',
    frequency: 'quarterly',
    fredFrequency: 'q',
    historyPolicy: { type: 'full' },
    localDerivation: 'year-over-year-quarterly-growth',
    minimumUsableObservations: 80,
    title: 'Real GDP Per Capita Growth',
    shortTitle: 'Real GDP per capita',
    description:
      'Year-over-year growth in inflation-adjusted U.S. gross domestic product per person, calculated from the published level series.',
    question: 'Is economic output growing faster than the population?',
    units: 'Percent',
    seasonalAdjustment:
      'Seasonally adjusted annual rate (underlying real GDP per capita level)',
    transformation:
      'Percent change from year ago, calculated by the application',
    sourceName:
      'U.S. Bureau of Economic Analysis via FRED; growth calculated by the application',
    sourceUrl: 'https://fred.stlouisfed.org/series/A939RX0Q048SBEA',
  },
  {
    dataHandling: 'locally-derived',
    id: 'labor-productivity-growth',
    slug: 'labor-productivity-growth',
    outputFile:
      'src/features/economic-series/data/labor-productivity-growth.json',
    providerSeriesId: 'OPHNFB',
    frequency: 'quarterly',
    fredFrequency: 'q',
    historyPolicy: { type: 'full' },
    localDerivation: 'year-over-year-quarterly-growth',
    minimumUsableObservations: 80,
    title: 'Productivity Growth Momentum',
    shortTitle: 'Productivity momentum',
    description:
      'Year-over-year growth in nonfarm business sector output per hour for all workers, calculated from the published productivity index.',
    question: 'Are productivity gains revving up or slowing down?',
    units: 'Percent',
    seasonalAdjustment:
      'Seasonally adjusted (underlying labor productivity index)',
    transformation:
      'Percent change from year ago, calculated by the application',
    sourceName:
      'U.S. Bureau of Labor Statistics via FRED; growth calculated by the application',
    sourceUrl: 'https://fred.stlouisfed.org/series/OPHNFB',
  },
  {
    dataHandling: 'provider-level',
    id: 'household-debt-service-ratio',
    slug: 'household-debt-service-ratio',
    outputFile:
      'src/features/economic-series/data/household-debt-service-ratio.json',
    providerSeriesId: 'TDSP',
    frequency: 'quarterly',
    fredFrequency: 'q',
    historyPolicy: { type: 'full' },
    minimumUsableObservations: 20,
    title: 'Household Debt-Service Ratio',
    shortTitle: 'Household debt-service ratio',
    description:
      'Estimated required mortgage and consumer-debt payments as a percentage of aggregate disposable personal income.',
    question: 'How much of household income is going toward required debt payments?',
    units: 'Percent',
    seasonalAdjustment: 'Seasonally adjusted',
    transformation: 'Level',
    sourceName: 'Board of Governors of the Federal Reserve System via FRED',
    sourceUrl: 'https://fred.stlouisfed.org/series/TDSP',
  },
  {
    dataHandling: 'provider-level',
    id: 'housing-starts',
    slug: 'housing-starts',
    outputFile: 'src/features/economic-series/data/housing-starts.json',
    providerSeriesId: 'HOUST',
    frequency: 'monthly',
    fredFrequency: 'm',
    historyPolicy: { type: 'full' },
    minimumUsableObservations: 240,
    title: 'New Privately-Owned Housing Units Started: Total Units',
    shortTitle: 'Housing starts',
    description: 'The annualized pace of privately owned housing units beginning construction.',
    question: 'How much new housing is being started?',
    units: 'Thousands of units, seasonally adjusted annual rate',
    seasonalAdjustment: 'Seasonally adjusted annual rate',
    transformation: 'Level',
    sourceName: 'U.S. Census Bureau and U.S. Department of Housing and Urban Development via FRED',
    sourceUrl: 'https://fred.stlouisfed.org/series/HOUST',
  },
  {
    dataHandling: 'provider-level',
    id: 'manufacturing-output',
    slug: 'manufacturing-output',
    outputFile: 'src/features/economic-series/data/manufacturing-output.json',
    providerSeriesId: 'IPMAN',
    frequency: 'monthly',
    fredFrequency: 'm',
    historyPolicy: { type: 'full' },
    minimumUsableObservations: 240,
    title: 'Industrial Production: Manufacturing (NAICS)',
    shortTitle: 'Manufacturing output',
    description: 'The Federal Reserve index of inflation-adjusted output produced by U.S. manufacturing establishments.',
    question: 'Are manufacturing output and jobs moving together?',
    units: 'Index',
    seasonalAdjustment: 'Seasonally adjusted',
    transformation: 'Provider-published real-output index',
    sourceName: 'Board of Governors of the Federal Reserve System via FRED',
    sourceUrl: 'https://fred.stlouisfed.org/series/IPMAN',
  },
  {
    dataHandling: 'provider-level',
    id: 'manufacturing-employment',
    slug: 'manufacturing-employment',
    outputFile: 'src/features/economic-series/data/manufacturing-employment.json',
    providerSeriesId: 'MANEMP',
    frequency: 'monthly',
    fredFrequency: 'm',
    historyPolicy: { type: 'full' },
    minimumUsableObservations: 240,
    title: 'All Employees, Manufacturing',
    shortTitle: 'Manufacturing employment',
    description: 'Employees on payrolls at U.S. manufacturing establishments in the Current Employment Statistics program.',
    question: 'Are manufacturing output and jobs moving together?',
    units: 'Thousands of persons',
    seasonalAdjustment: 'Seasonally adjusted',
    transformation: 'Provider-published payroll-employment level',
    sourceName: 'U.S. Bureau of Labor Statistics via FRED',
    sourceUrl: 'https://fred.stlouisfed.org/series/MANEMP',
  },
  {
    dataHandling: 'locally-derived',
    id: 'real-business-investment-growth',
    slug: 'real-business-investment-growth',
    outputFile:
      'src/features/economic-series/data/real-business-investment-growth.json',
    providerSeriesId: 'PNFIC1',
    frequency: 'quarterly',
    fredFrequency: 'q',
    historyPolicy: { type: 'full' },
    localDerivation: 'year-over-year-quarterly-growth',
    minimumUsableObservations: 70,
    title: 'Real Private Nonresidential Fixed Investment Growth',
    shortTitle: 'Real business investment growth',
    description:
      'Year-over-year growth in inflation-adjusted private nonresidential fixed investment in structures, equipment, and intellectual-property products.',
    question: 'Are businesses increasing investment in productive capacity?',
    units: 'Percent change from year ago',
    seasonalAdjustment:
      'Seasonally adjusted annual rate (underlying real investment level)',
    transformation:
      'Exact-quarter percent change from year ago, calculated by the application',
    sourceName:
      'U.S. Bureau of Economic Analysis via FRED; growth calculated by the application',
    sourceUrl: 'https://fred.stlouisfed.org/series/PNFIC1',
  },
  {
    dataHandling: 'provider-level',
    id: 'industrial-capacity-utilization',
    slug: 'industrial-capacity-utilization',
    outputFile:
      'src/features/economic-series/data/industrial-capacity-utilization.json',
    providerSeriesId: 'TCU',
    frequency: 'monthly',
    fredFrequency: 'm',
    historyPolicy: { type: 'full' },
    minimumUsableObservations: 240,
    title: 'Capacity Utilization: Total Index',
    shortTitle: 'Industrial capacity utilization',
    description:
      'Industrial output as a percentage of the Federal Reserve estimate of sustainable maximum output for manufacturing, mining, and utilities.',
    question: 'How fully is industrial capacity being used?',
    units: 'Percent',
    seasonalAdjustment: 'Seasonally adjusted',
    transformation: 'Provider-published level',
    sourceName: 'Board of Governors of the Federal Reserve System via FRED',
    sourceUrl: 'https://fred.stlouisfed.org/series/TCU',
  },
  {
    dataHandling: 'provider-level',
    id: 'effective-federal-funds-rate',
    slug: 'effective-federal-funds-rate',
    outputFile: 'src/features/economic-series/data/effective-federal-funds-rate.json',
    providerSeriesId: 'FEDFUNDS',
    frequency: 'monthly',
    fredFrequency: 'm',
    historyPolicy: { type: 'full' },
    minimumUsableObservations: 600,
    title: 'Federal Funds Effective Rate',
    shortTitle: 'Effective federal funds rate',
    description: 'The monthly average of the effective overnight federal funds rate.',
    question: 'How do short-term and long-term interest rates compare?',
    units: 'Percent',
    seasonalAdjustment: 'Not seasonally adjusted',
    transformation: 'Provider-published monthly average of daily figures',
    sourceName: 'Board of Governors of the Federal Reserve System via FRED',
    sourceUrl: 'https://fred.stlouisfed.org/series/FEDFUNDS',
  },
  {
    dataHandling: 'provider-level',
    id: 'ten-year-treasury-yield',
    slug: 'ten-year-treasury-yield',
    outputFile: 'src/features/economic-series/data/ten-year-treasury-yield.json',
    providerSeriesId: 'GS10',
    frequency: 'monthly',
    fredFrequency: 'm',
    historyPolicy: { type: 'full' },
    minimumUsableObservations: 600,
    title: 'Market Yield on U.S. Treasury Securities at 10-Year Constant Maturity',
    shortTitle: '10-year Treasury yield',
    description: 'The monthly average market yield on 10-year constant-maturity Treasury securities.',
    question: 'How do short-term and long-term interest rates compare?',
    units: 'Percent',
    seasonalAdjustment: 'Not seasonally adjusted',
    transformation: 'Provider-published monthly average of business-day yields',
    sourceName: 'Board of Governors of the Federal Reserve System using U.S. Treasury market data via FRED',
    sourceUrl: 'https://fred.stlouisfed.org/series/GS10',
  },
  {
    dataHandling: 'provider-level',
    id: 'broad-credit-conditions',
    slug: 'broad-credit-conditions',
    outputFile: 'src/features/economic-series/data/broad-credit-conditions.json',
    providerSeriesId: 'NFCICREDIT',
    frequency: 'weekly',
    fredFrequency: 'w',
    historyPolicy: { type: 'full' },
    minimumUsableObservations: 1000,
    title: 'Chicago Fed National Financial Conditions Credit Subindex',
    shortTitle: 'Broad credit conditions',
    description: 'A standardized weekly index of broad U.S. credit conditions relative to historical averages.',
    question: 'Are credit conditions tighter or looser than usual?',
    units: 'Index',
    seasonalAdjustment: 'Not seasonally adjusted',
    transformation: 'Provider-published standardized credit subindex',
    sourceName: 'Federal Reserve Bank of Chicago via FRED',
    sourceUrl: 'https://fred.stlouisfed.org/series/NFCICREDIT',
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

export interface CpiSeriesConfig {
  dataHandling: 'cpi-derived'
  headlineSource: FredSeriesConfig
  coreSource: {
    providerSeriesId: 'CPILFESL'
    fredFrequency: 'm'
    historyPolicy: HistoryPolicy
  }
  minimumUsableObservations: number
  headlineInflationOutputFile: string
  coreInflationOutputFile: string
  headlineMomentumOutputFile: string
  coreMomentumOutputFile: string
}

export const cpiSeriesConfiguration: CpiSeriesConfig = {
  dataHandling: 'cpi-derived',
  headlineSource: fredSeriesConfigurations.find(
    (config) => config.providerSeriesId === 'CPIAUCSL',
  )!,
  coreSource: {
    providerSeriesId: 'CPILFESL',
    fredFrequency: 'm',
    historyPolicy: { type: 'full' },
  },
  minimumUsableObservations: 13,
  headlineInflationOutputFile:
    'src/features/economic-series/data/headline-cpi-inflation.json',
  coreInflationOutputFile:
    'src/features/economic-series/data/core-cpi-inflation.json',
  headlineMomentumOutputFile:
    'src/features/economic-series/data/headline-cpi-three-month-annualized.json',
  coreMomentumOutputFile:
    'src/features/economic-series/data/core-cpi-three-month-annualized.json',
}

export interface HouseholdComparisonConfig {
  dataHandling: 'household-comparison-derived'
  incomeSource: FredSeriesConfig
  spendingSource: FredSeriesConfig
  incomeOutputFile: string
  spendingOutputFile: string
}

export const householdIncomeSourceConfiguration: FredSeriesConfig = {
  dataHandling: 'locally-derived',
  id: 'quarterly-real-disposable-income-per-capita-growth',
  slug: 'quarterly-real-disposable-income-per-capita-growth',
  outputFile:
    'src/features/economic-series/data/quarterly-real-disposable-income-per-capita-growth.json',
  providerSeriesId: 'A229RX0Q048SBEA',
  frequency: 'quarterly',
  fredFrequency: 'q',
  historyPolicy: { type: 'full' },
  localDerivation: 'year-over-year-quarterly-growth',
  minimumUsableObservations: 80,
  title: 'Real Disposable Personal Income Per Capita Growth',
  shortTitle: 'Real income per capita growth',
  description:
    'Year-over-year growth in inflation-adjusted after-tax personal income per person.',
  question: 'Are real household incomes and spending growing per person?',
  units: 'Percent',
  seasonalAdjustment: 'Seasonally adjusted annual rate (underlying level)',
  transformation: 'Percent change from year ago, calculated by the application',
  sourceName:
    'U.S. Bureau of Economic Analysis via FRED; growth calculated by the application',
  sourceUrl: 'https://fred.stlouisfed.org/series/A229RX0Q048SBEA',
}

export const householdSpendingSourceConfiguration: FredSeriesConfig = {
  dataHandling: 'locally-derived',
  id: 'quarterly-real-consumer-spending-per-capita-growth',
  slug: 'quarterly-real-consumer-spending-per-capita-growth',
  outputFile:
    'src/features/economic-series/data/quarterly-real-consumer-spending-per-capita-growth.json',
  providerSeriesId: 'A794RX0Q048SBEA',
  frequency: 'quarterly',
  fredFrequency: 'q',
  historyPolicy: { type: 'full' },
  localDerivation: 'year-over-year-quarterly-growth',
  minimumUsableObservations: 80,
  title: 'Real Personal Consumption Expenditures Per Capita Growth',
  shortTitle: 'Real consumer spending per capita growth',
  description:
    'Year-over-year growth in inflation-adjusted personal consumption expenditures per person.',
  question: 'Are real household incomes and spending growing per person?',
  units: 'Percent',
  seasonalAdjustment: 'Seasonally adjusted annual rate (underlying level)',
  transformation: 'Percent change from year ago, calculated by the application',
  sourceName:
    'U.S. Bureau of Economic Analysis via FRED; growth calculated by the application',
  sourceUrl: 'https://fred.stlouisfed.org/series/A794RX0Q048SBEA',
}

export const householdComparisonConfiguration: HouseholdComparisonConfig = {
  dataHandling: 'household-comparison-derived',
  incomeSource: householdIncomeSourceConfiguration,
  spendingSource: householdSpendingSourceConfiguration,
  incomeOutputFile: householdIncomeSourceConfiguration.outputFile,
  spendingOutputFile: householdSpendingSourceConfiguration.outputFile,
}

export const personalSavingRateConfiguration: FredSeriesConfig = {
  dataHandling: 'provider-level',
  id: 'personal-saving-rate',
  slug: 'personal-saving-rate',
  outputFile: 'src/features/economic-series/data/personal-saving-rate.json',
  providerSeriesId: 'PSAVERT',
  frequency: 'monthly',
  fredFrequency: 'm',
  historyPolicy: { type: 'full' },
  minimumUsableObservations: 13,
  title: 'Personal Saving Rate',
  shortTitle: 'Saving rate',
  description:
    'Personal saving as a percentage of disposable personal income.',
  question: 'Are households saving or drawing down more of their income?',
  units: 'Percent',
  seasonalAdjustment: 'Seasonally adjusted annual rate',
  transformation: 'Level',
  sourceName: 'U.S. Bureau of Economic Analysis via FRED',
  sourceUrl: 'https://fred.stlouisfed.org/series/PSAVERT',
}

export interface ProductivitySeriesConfig {
  dataHandling: 'productivity-derived'
  levelSource: FredSeriesConfig
  growthSource: FredSeriesConfig
  levelOutputFile: string
  growthOutputFile: string
}

const productivityGrowthSource = fredSeriesConfigurations.find(
  (config) => config.providerSeriesId === 'OPHNFB',
)!

export const laborProductivityLevelConfiguration: FredSeriesConfig = {
  dataHandling: 'provider-level',
  id: 'labor-productivity-level',
  slug: 'labor-productivity-level',
  outputFile:
    'src/features/economic-series/data/labor-productivity-level.json',
  providerSeriesId: 'OPHNFB',
  frequency: 'quarterly',
  fredFrequency: 'q',
  historyPolicy: { type: 'full' },
  minimumUsableObservations: 80,
  title: 'Productivity Over Time',
  shortTitle: 'Productivity level',
  description:
    'Published nonfarm business-sector output per hour, normalized to 100 at the selected-range start for display.',
  question: 'How much more productive is the economy than in the past?',
  units: 'Index',
  seasonalAdjustment: 'Seasonally adjusted',
  transformation:
    'Published level, normalized to 100 at the selected-range start for display',
  sourceName: 'U.S. Bureau of Labor Statistics via FRED',
  sourceUrl: 'https://fred.stlouisfed.org/series/OPHNFB',
}

export const productivitySeriesConfiguration: ProductivitySeriesConfig = {
  dataHandling: 'productivity-derived',
  levelSource: laborProductivityLevelConfiguration,
  growthSource: productivityGrowthSource,
  levelOutputFile: laborProductivityLevelConfiguration.outputFile,
  growthOutputFile: productivityGrowthSource.outputFile,
}
