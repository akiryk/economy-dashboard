import type { EconomicFrequency } from '../../src/features/economic-series/models/economicSeries'

export interface FredSeriesConfig {
  dataHandling: 'locally-derived' | 'provider-level' | 'provider-transformed'
  id: string
  slug: string
  outputFile: string
  providerSeriesId: string
  frequency: Extract<EconomicFrequency, 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'annual'>
  fredFrequency: 'd' | 'w' | 'm' | 'q' | 'a'
  historyPolicy: HistoryPolicy
  fredUnits?: 'chg' | 'pc1'
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

export const dashboardFredSeriesConfigurations: readonly FredSeriesConfig[] = [
  {
    dataHandling: 'provider-level', id: 'dashboard-real-gdp-growth', slug: 'dashboard-real-gdp-growth',
    outputFile: 'src/features/economic-series/data/dashboard-real-gdp-growth.json',
    providerSeriesId: 'A191RL1Q225SBEA', frequency: 'quarterly', fredFrequency: 'q', historyPolicy: { type: 'full' }, minimumUsableObservations: 250,
    title: 'Real Gross Domestic Product: Percent Change from Preceding Period', shortTitle: 'Real GDP growth',
    description: 'Quarterly annualized growth in inflation-adjusted U.S. gross domestic product.', question: 'How quickly is the economy growing?',
    units: 'Percent change from preceding period at annual rate', seasonalAdjustment: 'Seasonally adjusted annual rate',
    transformation: 'Provider-published quarterly percent change at a seasonally adjusted annual rate',
    sourceName: 'U.S. Bureau of Economic Analysis via FRED', sourceUrl: 'https://fred.stlouisfed.org/series/A191RL1Q225SBEA',
  },
  {
    dataHandling: 'provider-level', id: 'dashboard-nominal-gdp', slug: 'dashboard-nominal-gdp',
    outputFile: 'src/features/economic-series/data/dashboard-nominal-gdp.json',
    providerSeriesId: 'GDP', frequency: 'quarterly', fredFrequency: 'q', historyPolicy: { type: 'full' }, minimumUsableObservations: 250,
    title: 'Gross Domestic Product', shortTitle: 'Nominal GDP', description: 'Current-dollar U.S. gross domestic product.', question: 'What is the current-dollar size of the economy?',
    units: 'Billions of dollars', seasonalAdjustment: 'Seasonally adjusted annual rate', transformation: 'Provider-published quarterly level',
    sourceName: 'U.S. Bureau of Economic Analysis via FRED', sourceUrl: 'https://fred.stlouisfed.org/series/GDP',
  },
  {
    dataHandling: 'provider-transformed', id: 'dashboard-payroll-change', slug: 'dashboard-payroll-change',
    outputFile: 'src/features/economic-series/data/dashboard-payroll-change.json',
    providerSeriesId: 'PAYEMS', frequency: 'monthly', fredFrequency: 'm', fredUnits: 'chg', historyPolicy: { type: 'full' }, minimumUsableObservations: 1000,
    title: 'All Employees, Total Nonfarm: Change from Previous Period', shortTitle: 'Monthly payroll change',
    description: 'The monthly change in total nonfarm payroll employment, transformed by FRED from the published level.', question: 'How many jobs did employers add or remove?',
    units: 'Thousands of persons, change from previous period', seasonalAdjustment: 'Seasonally adjusted', transformation: 'FRED units=chg transformation of PAYEMS',
    sourceName: 'U.S. Bureau of Labor Statistics via FRED', sourceUrl: 'https://fred.stlouisfed.org/series/PAYEMS',
  },
  {
    dataHandling: 'provider-level', id: 'dashboard-sahm-rule-gap', slug: 'dashboard-sahm-rule-gap',
    outputFile: 'src/features/economic-series/data/dashboard-sahm-rule-gap.json',
    providerSeriesId: 'SAHMREALTIME', frequency: 'monthly', fredFrequency: 'm', historyPolicy: { type: 'full' }, minimumUsableObservations: 750,
    title: 'Real-Time Sahm Rule Recession Indicator', shortTitle: 'Sahm Rule gap', description: 'The real-time Sahm Rule indicator based on unemployment data available for each release.', question: 'Has labor-market deterioration crossed the Sahm Rule threshold?',
    units: 'Percentage points', seasonalAdjustment: 'Derived from seasonally adjusted unemployment rates', transformation: 'Provider-published real-time indicator',
    sourceName: 'Sahm Consulting via FRED', sourceUrl: 'https://fred.stlouisfed.org/series/SAHMREALTIME',
  },
  {
    dataHandling: 'provider-transformed', id: 'dashboard-headline-cpi-inflation', slug: 'dashboard-headline-cpi-inflation',
    outputFile: 'src/features/economic-series/data/dashboard-headline-cpi-inflation.json',
    providerSeriesId: 'CPIAUCNS', frequency: 'monthly', fredFrequency: 'm', fredUnits: 'pc1', historyPolicy: { type: 'full' }, minimumUsableObservations: 900,
    title: 'Consumer Price Index for All Urban Consumers: Percent Change from Year Ago', shortTitle: 'Headline CPI inflation', description: 'Year-over-year change in the all-items CPI using FRED\'s pc1 transformation.', question: 'How quickly are consumer prices rising?',
    units: 'Percent change from year ago', seasonalAdjustment: 'Not seasonally adjusted underlying index', transformation: 'FRED units=pc1 transformation of CPIAUCNS',
    sourceName: 'U.S. Bureau of Labor Statistics via FRED', sourceUrl: 'https://fred.stlouisfed.org/series/CPIAUCNS',
  },
  {
    dataHandling: 'provider-transformed', id: 'dashboard-core-cpi-inflation', slug: 'dashboard-core-cpi-inflation',
    outputFile: 'src/features/economic-series/data/dashboard-core-cpi-inflation.json',
    providerSeriesId: 'CPILFESL', frequency: 'monthly', fredFrequency: 'm', fredUnits: 'pc1', historyPolicy: { type: 'full' }, minimumUsableObservations: 750,
    title: 'Consumer Price Index Less Food and Energy: Percent Change from Year Ago', shortTitle: 'Core CPI inflation', description: 'Year-over-year change in CPI excluding food and energy using FRED\'s pc1 transformation.', question: 'How quickly are core consumer prices rising?',
    units: 'Percent change from year ago', seasonalAdjustment: 'Seasonally adjusted underlying index', transformation: 'FRED units=pc1 transformation of CPILFESL',
    sourceName: 'U.S. Bureau of Labor Statistics via FRED', sourceUrl: 'https://fred.stlouisfed.org/series/CPILFESL',
  },
  ...([
    ['dashboard-expected-inflation-10-year', 'T10YIE', '10-Year Breakeven Inflation Rate', '10-year expected inflation', 'Percent', 'Market-based expected average inflation over ten years.', 'Federal Reserve Bank of St. Louis via FRED'],
    ['dashboard-effective-federal-funds-rate', 'DFF', 'Federal Funds Effective Rate', 'Effective federal funds rate', 'Percent', 'Daily effective federal funds rate.', 'Board of Governors of the Federal Reserve System via FRED'],
    ['dashboard-fed-target-upper-bound', 'DFEDTARU', 'Federal Funds Target Range - Upper Limit', 'Fed target upper bound', 'Percent', 'Upper bound of the Federal Reserve target range.', 'Board of Governors of the Federal Reserve System via FRED'],
    ['dashboard-yield-spread-10y-2y', 'T10Y2Y', '10-Year Treasury Constant Maturity Minus 2-Year Treasury Constant Maturity', '10-year minus 2-year spread', 'Percentage points', 'Provider-published 10-year minus 2-year Treasury spread.', 'Federal Reserve Bank of St. Louis via FRED'],
    ['dashboard-yield-spread-10y-3m', 'T10Y3M', '10-Year Treasury Constant Maturity Minus 3-Month Treasury Constant Maturity', '10-year minus 3-month spread', 'Percentage points', 'Provider-published 10-year minus 3-month Treasury spread.', 'Federal Reserve Bank of St. Louis via FRED'],
    ['dashboard-ten-year-treasury-yield', 'DGS10', 'Market Yield on U.S. Treasury Securities at 10-Year Constant Maturity', '10-year Treasury yield', 'Percent', 'Daily 10-year constant-maturity Treasury yield.', 'Board of Governors of the Federal Reserve System via FRED'],
    ['dashboard-sp500', 'SP500', 'S&P 500', 'S&P 500', 'Index', 'Daily closing level of the S&P 500 index retained by FRED.', 'S&P Dow Jones Indices via FRED'],
    ['dashboard-high-yield-credit-spread', 'BAMLH0A0HYM2', 'ICE BofA US High Yield Index Option-Adjusted Spread', 'High-yield credit spread', 'Percentage points', 'Daily option-adjusted spread for the ICE BofA U.S. high-yield index.', 'ICE Data Indices, LLC via FRED'],
  ] as const).map(([slug, providerSeriesId, title, shortTitle, units, description, sourceName]) => ({
    dataHandling: 'provider-level' as const, id: slug, slug,
    outputFile: `src/features/economic-series/data/${slug}.json`, providerSeriesId,
    frequency: 'daily' as const, fredFrequency: 'd' as const, historyPolicy: { type: 'full' as const },
    minimumUsableObservations: providerSeriesId === 'SP500'
      ? 2500
      : providerSeriesId === 'BAMLH0A0HYM2'
        ? 500
        : 3000,
    title, shortTitle, description, question: `What is the latest ${shortTitle.toLowerCase()}?`, units,
    seasonalAdjustment: null, transformation: 'Provider-published daily value',
    sourceName, sourceUrl: `https://fred.stlouisfed.org/series/${providerSeriesId}`,
  })),
  {
    dataHandling: 'provider-level', id: 'dashboard-mortgage-rate-30-year', slug: 'dashboard-mortgage-rate-30-year',
    outputFile: 'src/features/economic-series/data/dashboard-mortgage-rate-30-year.json',
    providerSeriesId: 'MORTGAGE30US', frequency: 'weekly', fredFrequency: 'w', historyPolicy: { type: 'full' }, minimumUsableObservations: 2500,
    title: '30-year fixed mortgage rate', shortTitle: '30-year fixed mortgage rate', description: 'Weekly national average for a 30-year fixed mortgage; individual borrower offers vary.', question: 'How high are mortgage rates?',
    units: 'Percent', seasonalAdjustment: null, transformation: 'Provider-published weekly value', sourceName: 'Freddie Mac via FRED', sourceUrl: 'https://fred.stlouisfed.org/series/MORTGAGE30US',
  },
]

export const dashboardSeriesSources = [
  ...dashboardFredSeriesConfigurations.map(({ providerSeriesId, slug }) => ({ providerSeriesId, slug, reused: false as const })),
  { providerSeriesId: 'UNRATE', slug: 'unemployment-rate', reused: true as const },
  { providerSeriesId: 'IC4WSA', slug: 'initial-unemployment-claims-four-week-average', reused: true as const },
  { providerSeriesId: 'ICSA', slug: 'initial-unemployment-claims', reused: true as const },
] as const

const policyRateSeriesConfigurations: readonly FredSeriesConfig[] = ([
    ['federal-funds-target-lower-bound', 'DFEDTARL', 'Federal Funds Target Range - Lower Limit', 'Fed target lower bound', 'Lower limit of the FOMC federal funds target range.', 6000],
    ['federal-funds-target-rate-historical', 'DFEDTAR', 'Federal Funds Target Rate (DISCONTINUED)', 'Historical federal funds target', 'Single federal funds target used before the FOMC adopted a target range.', 6000],
    ['bank-prime-loan-rate', 'DPRIME', 'Bank Prime Loan Rate', 'Bank prime rate', 'Rate posted by a majority of the 25 largest insured U.S.-chartered commercial banks.', 15000],
  ] as const).map(([slug, providerSeriesId, title, shortTitle, description, minimumUsableObservations]) => ({
    dataHandling: 'provider-level' as const,
    id: slug,
    slug,
    outputFile: `src/features/economic-series/data/${slug}.json`,
    providerSeriesId,
    frequency: 'daily' as const,
    fredFrequency: 'd' as const,
    historyPolicy: { type: 'full' as const },
    minimumUsableObservations,
    title,
    shortTitle,
    description,
    question: 'Where has the Fed set short-term interest rates?',
    units: 'Percent',
    seasonalAdjustment: 'Not seasonally adjusted',
    transformation: 'Provider-published daily effective value',
    sourceName: 'Board of Governors of the Federal Reserve System via FRED',
    sourceUrl: `https://fred.stlouisfed.org/series/${providerSeriesId}`,
  }))

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
    providerSeriesId: 'CPIAUCNS',
    frequency: 'monthly',
    fredFrequency: 'm',
    historyPolicy: { type: 'full' },
    localDerivation: 'year-over-year-monthly-growth',
    minimumUsableObservations: 240,
    title: 'Consumer Price Index: Percent Change from Year Ago',
    shortTitle: 'CPI inflation',
    description:
      'The year-over-year percentage change in the Consumer Price Index for All Urban Consumers: All Items in U.S. City Average.',
    question: 'How quickly are consumer prices rising?',
    units: 'Percent change from year ago',
    seasonalAdjustment: 'Not seasonally adjusted (underlying CPI index)',
    transformation:
      'Percent change from year ago, calculated by the application',
    sourceName: 'U.S. Bureau of Labor Statistics via FRED',
    sourceUrl: 'https://fred.stlouisfed.org/series/CPIAUCNS',
  },
  {
    dataHandling: 'locally-derived',
    id: 'headline-pce-inflation',
    slug: 'headline-pce-inflation',
    outputFile:
      'src/features/economic-series/data/headline-pce-inflation.json',
    providerSeriesId: 'PCEPI',
    frequency: 'monthly',
    fredFrequency: 'm',
    historyPolicy: { type: 'full' },
    localDerivation: 'year-over-year-monthly-growth',
    minimumUsableObservations: 600,
    title: 'Personal Consumption Expenditures Price Index: Percent Change from Year Ago',
    shortTitle: 'PCE inflation',
    description:
      'The year-over-year percentage change in the headline Personal Consumption Expenditures price index.',
    question: 'How does PCE inflation compare with the Federal Reserve’s 2% target?',
    units: 'Percent change from year ago',
    seasonalAdjustment: 'Seasonally adjusted (underlying PCE price index)',
    transformation:
      'Percent change from year ago, calculated by the application using exact 12-month matching',
    sourceName: 'U.S. Bureau of Economic Analysis via FRED',
    sourceUrl: 'https://fred.stlouisfed.org/series/PCEPI',
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
    dataHandling: 'provider-level',
    id: 'jolts-layoffs-and-discharges-rate',
    slug: 'jolts-layoffs-and-discharges-rate',
    outputFile:
      'src/features/economic-series/data/jolts-layoffs-and-discharges-rate.json',
    providerSeriesId: 'JTSLDR',
    frequency: 'monthly',
    fredFrequency: 'm',
    historyPolicy: { type: 'full' },
    minimumUsableObservations: 240,
    title: 'JOLTS Total Nonfarm Layoffs and Discharges Rate',
    shortTitle: 'Layoffs and discharges rate',
    description:
      'Employer-initiated layoffs and discharges during the month as a share of total nonfarm employment.',
    question: 'Are layoffs beginning to rise?',
    units: 'Percent',
    seasonalAdjustment: 'Seasonally adjusted',
    transformation: 'Provider-published monthly rate',
    sourceName: 'U.S. Bureau of Labor Statistics via FRED',
    sourceUrl: 'https://fred.stlouisfed.org/series/JTSLDR',
  },
  {
    dataHandling: 'provider-level',
    id: 'initial-unemployment-claims',
    slug: 'initial-unemployment-claims',
    outputFile:
      'src/features/economic-series/data/initial-unemployment-claims.json',
    providerSeriesId: 'ICSA',
    frequency: 'weekly',
    fredFrequency: 'w',
    historyPolicy: { type: 'full' },
    minimumUsableObservations: 2500,
    title: 'Initial Claims',
    shortTitle: 'Weekly initial claims',
    description:
      'New applications for unemployment-insurance eligibility following separation from an employer.',
    question: 'Are layoffs beginning to rise?',
    units: 'Number of claims',
    seasonalAdjustment: 'Seasonally adjusted',
    transformation: 'Provider-published weekly level',
    sourceName:
      'U.S. Employment and Training Administration via FRED',
    sourceUrl: 'https://fred.stlouisfed.org/series/ICSA',
  },
  {
    dataHandling: 'provider-level',
    id: 'initial-unemployment-claims-four-week-average',
    slug: 'initial-unemployment-claims-four-week-average',
    outputFile:
      'src/features/economic-series/data/initial-unemployment-claims-four-week-average.json',
    providerSeriesId: 'IC4WSA',
    frequency: 'weekly',
    fredFrequency: 'w',
    historyPolicy: { type: 'full' },
    minimumUsableObservations: 2500,
    title: '4-Week Moving Average of Initial Claims',
    shortTitle: 'Four-week average of initial claims',
    description:
      'The official four-week moving average of new unemployment-insurance claims.',
    question: 'Are layoffs beginning to rise?',
    units: 'Number of claims',
    seasonalAdjustment: 'Seasonally adjusted',
    transformation: 'Provider-published four-week moving average',
    sourceName:
      'U.S. Employment and Training Administration via FRED',
    sourceUrl: 'https://fred.stlouisfed.org/series/IC4WSA',
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
    title: 'Real labor productivity: percent change from year ago',
    shortTitle: 'Productivity momentum',
    description:
      'Year-over-year growth in nonfarm business sector output per hour for all workers, calculated from the published productivity index.',
    question: 'Is the economy producing more per hour worked?',
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
    id: 'us-population-monthly',
    slug: 'us-population-monthly',
    outputFile: 'src/features/economic-series/data/us-population-monthly.json',
    providerSeriesId: 'POPTHM',
    frequency: 'monthly',
    fredFrequency: 'm',
    historyPolicy: { type: 'full' },
    minimumUsableObservations: 240,
    title: 'U.S. Population',
    shortTitle: 'U.S. population',
    description: 'Monthly U.S. population used to normalize housing construction.',
    question: 'What population denominator is used for housing starts?',
    units: 'Thousands of people',
    seasonalAdjustment: 'Not seasonally adjusted',
    transformation: 'Level',
    sourceName: 'U.S. Bureau of Economic Analysis via FRED',
    sourceUrl: 'https://fred.stlouisfed.org/series/POPTHM',
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
    question: 'Are businesses investing more in productive assets?',
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
    id: 'real-business-investment-level',
    slug: 'real-business-investment-level',
    outputFile: 'src/features/economic-series/data/real-business-investment-level.json',
    providerSeriesId: 'PNFIC1',
    frequency: 'quarterly',
    fredFrequency: 'q',
    historyPolicy: { type: 'full' },
    minimumUsableObservations: 70,
    title: 'Real Private Nonresidential Fixed Investment',
    shortTitle: 'Real business investment level',
    description: 'Inflation-adjusted private nonresidential fixed investment in structures, equipment, and intellectual-property products.',
    question: 'Are businesses investing more in productive assets?',
    units: 'Billions of chained 2017 dollars',
    seasonalAdjustment: 'Seasonally adjusted annual rate',
    transformation: 'Provider-published level',
    sourceName: 'U.S. Bureau of Economic Analysis via FRED',
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
    question: 'How much spare industrial capacity is there?',
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
    question: 'Is the yield curve inverted?',
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
    question: 'Is the yield curve inverted?',
    units: 'Percent',
    seasonalAdjustment: 'Not seasonally adjusted',
    transformation: 'Provider-published monthly average of business-day yields',
    sourceName: 'Board of Governors of the Federal Reserve System using U.S. Treasury market data via FRED',
    sourceUrl: 'https://fred.stlouisfed.org/series/GS10',
  },
  {
    dataHandling: 'provider-level',
    id: 'three-month-treasury-bill-rate',
    slug: 'three-month-treasury-bill-rate',
    outputFile: 'src/features/economic-series/data/three-month-treasury-bill-rate.json',
    providerSeriesId: 'TB3MS',
    frequency: 'monthly',
    fredFrequency: 'm',
    historyPolicy: { type: 'full' },
    minimumUsableObservations: 600,
    title: '3-Month Treasury Bill Secondary Market Rate',
    shortTitle: '3-month Treasury bill rate',
    description: 'Monthly average secondary-market rate on 3-month Treasury bills, quoted on a discount basis.',
    question: 'Is the yield curve inverted?',
    units: 'Percent',
    seasonalAdjustment: 'Not seasonally adjusted',
    transformation: 'Provider-published monthly average of business-day discount rates',
    sourceName: 'Board of Governors of the Federal Reserve System via FRED',
    sourceUrl: 'https://fred.stlouisfed.org/series/TB3MS',
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
  {
    dataHandling: 'provider-level',
    id: 'bank-lending-standards',
    slug: 'bank-lending-standards',
    outputFile: 'src/features/economic-series/data/bank-lending-standards.json',
    providerSeriesId: 'DRTSCILM',
    frequency: 'quarterly',
    fredFrequency: 'q',
    historyPolicy: { type: 'full' },
    minimumUsableObservations: 120,
    title: 'Bank Lending Standards for Large and Middle-Market Firms',
    shortTitle: 'Bank lending standards',
    description:
      'Net percentage of surveyed domestic banks reporting tighter standards for commercial and industrial loans to large and middle-market firms.',
    question: 'Are banks making it harder to borrow?',
    units: 'Net percent reporting tighter standards',
    seasonalAdjustment: 'Not seasonally adjusted',
    transformation: 'Provider-published net percentage',
    sourceName: 'Federal Reserve Board Senior Loan Officer Opinion Survey via FRED',
    sourceUrl: 'https://fred.stlouisfed.org/series/DRTSCILM',
  },
  {
    dataHandling: 'provider-level',
    id: 'federal-budget-balance',
    slug: 'federal-budget-balance',
    outputFile: 'src/features/economic-series/data/federal-budget-balance.json',
    providerSeriesId: 'FYFSGDA188S',
    frequency: 'annual',
    fredFrequency: 'a',
    historyPolicy: { type: 'full' },
    minimumUsableObservations: 80,
    title: 'Federal Surplus or Deficit as Percent of Gross Domestic Product',
    shortTitle: 'Federal budget balance',
    description: 'The annual federal surplus or deficit as a share of annual gross domestic product.',
    question: 'How large is the federal budget deficit or surplus relative to the economy?',
    units: 'Percent of GDP',
    seasonalAdjustment: 'Not seasonally adjusted',
    transformation: 'Provider-published ratio constructed from OMB fiscal data and annual GDP',
    sourceName: 'U.S. Office of Management and Budget and Federal Reserve Bank of St. Louis via FRED',
    sourceUrl: 'https://fred.stlouisfed.org/series/FYFSGDA188S',
  },
  {
    dataHandling: 'provider-level',
    id: 'federal-debt-held-by-public',
    slug: 'federal-debt-held-by-public',
    outputFile: 'src/features/economic-series/data/federal-debt-held-by-public.json',
    providerSeriesId: 'FYGFGDQ188S',
    frequency: 'quarterly',
    fredFrequency: 'q',
    historyPolicy: { type: 'full' },
    minimumUsableObservations: 200,
    title: 'Federal Debt Held by the Public as Percent of Gross Domestic Product',
    shortTitle: 'Federal debt held by the public',
    description: 'Federal debt held outside federal government accounts as a share of gross domestic product.',
    question: 'How large is federal debt held by the public relative to the economy?',
    units: 'Percent of GDP',
    seasonalAdjustment: 'Seasonally adjusted',
    transformation: 'Provider-published ratio constructed from debt held by the public and GDP',
    sourceName: 'U.S. Office of Management and Budget, U.S. Department of the Treasury, and Federal Reserve Bank of St. Louis via FRED',
    sourceUrl: 'https://fred.stlouisfed.org/series/FYGFGDQ188S',
  },
  {
    dataHandling: 'provider-level',
    id: 'trade-balance-share-of-gdp',
    slug: 'trade-balance-share-of-gdp',
    outputFile: 'src/features/economic-series/data/trade-balance-share-of-gdp.json',
    providerSeriesId: 'A019RE1Q156NBEA',
    frequency: 'quarterly', fredFrequency: 'q', historyPolicy: { type: 'full' },
    minimumUsableObservations: 200,
    title: 'Shares of Gross Domestic Product: Net Exports of Goods and Services',
    shortTitle: 'Net exports of goods and services',
    description: 'Exports minus imports of goods and services as a share of GDP.',
    question: 'How large is the U.S. trade balance relative to the economy?',
    units: 'Percent of GDP', seasonalAdjustment: 'Seasonally adjusted annual rate',
    transformation: 'Provider-published ratio',
    sourceName: 'U.S. Bureau of Economic Analysis via FRED',
    sourceUrl: 'https://fred.stlouisfed.org/series/A019RE1Q156NBEA',
  },
  ...([
    ['trade-goods-exports', 'A253RC1Q027SBEA', 'Exports of goods'],
    ['trade-goods-imports', 'A255RC1Q027SBEA', 'Imports of goods'],
    ['trade-services-exports', 'A646RC1Q027SBEA', 'Exports of services'],
    ['trade-services-imports', 'B656RC1Q027SBEA', 'Imports of services'],
  ] as const).map(([slug, providerSeriesId, title]) => ({
    dataHandling: 'provider-level' as const,
    id: slug, slug,
    outputFile: `src/features/economic-series/data/${slug}.json`,
    providerSeriesId, frequency: 'quarterly' as const, fredFrequency: 'q' as const,
    historyPolicy: { type: 'full' as const }, minimumUsableObservations: 200,
    title, shortTitle: title, description: `${title}, including goods and services trade context.`,
    question: 'What drives the U.S. trade balance?',
    units: 'Billions of dollars, seasonally adjusted annual rate',
    seasonalAdjustment: 'Seasonally adjusted annual rate', transformation: 'Provider-published level',
    sourceName: 'U.S. Bureau of Economic Analysis via FRED',
    sourceUrl: `https://fred.stlouisfed.org/series/${providerSeriesId}`,
  })),
  {
    dataHandling: 'provider-level',
    id: 'labor-market-activity-index',
    slug: 'labor-market-activity-index',
    outputFile: 'src/features/economic-series/data/labor-market-activity-index.json',
    providerSeriesId: 'FRBKCLMCILA',
    frequency: 'monthly', fredFrequency: 'm', historyPolicy: { type: 'full' },
    minimumUsableObservations: 300,
    title: 'KC Fed Labor Market Conditions Index: Level of Activity',
    shortTitle: 'Labor market activity',
    description: 'A standardized summary of the current level of U.S. labor-market activity based on 24 labor-market variables.',
    question: 'Can people find and keep work?',
    units: 'Index', seasonalAdjustment: 'Seasonally adjusted',
    transformation: 'Provider-published standardized index; displayed as a full-history percentile in the briefing',
    sourceName: 'Federal Reserve Bank of Kansas City via FRED',
    sourceUrl: 'https://fred.stlouisfed.org/series/FRBKCLMCILA',
  },
  {
    dataHandling: 'provider-level',
    id: 'labor-market-momentum-index',
    slug: 'labor-market-momentum-index',
    outputFile: 'src/features/economic-series/data/labor-market-momentum-index.json',
    providerSeriesId: 'FRBKCLMCIM',
    frequency: 'monthly', fredFrequency: 'm', historyPolicy: { type: 'full' },
    minimumUsableObservations: 300,
    title: 'KC Fed Labor Market Conditions Index: Momentum',
    shortTitle: 'Labor market momentum',
    description: 'A standardized summary of U.S. labor-market momentum based on 24 labor-market variables.',
    question: 'Is the broad labor market strengthening or weakening?',
    units: 'Index', seasonalAdjustment: 'Seasonally adjusted',
    transformation: 'Provider-published standardized index; displayed as a full-history percentile in the briefing',
    sourceName: 'Federal Reserve Bank of Kansas City via FRED',
    sourceUrl: 'https://fred.stlouisfed.org/series/FRBKCLMCIM',
  },
  ...policyRateSeriesConfigurations,
  ...dashboardFredSeriesConfigurations,
]

export interface TariffBurdenConfig {
  customsSource: FredSeriesConfig
  importsSource: FredSeriesConfig
  outputFile: string
}

export interface CorporateProfitShareConfig {
  profitsSource: FredSeriesConfig
  gdpSource: FredSeriesConfig
  outputFile: string
}

export const corporateProfitShareConfiguration: CorporateProfitShareConfig = {
  profitsSource: {
    dataHandling: 'provider-level', id: 'corporate-profits-after-tax-source', slug: 'corporate-profits-after-tax-source', outputFile: '',
    providerSeriesId: 'CPATAX', frequency: 'quarterly', fredFrequency: 'q', historyPolicy: { type: 'full' }, minimumUsableObservations: 250,
    title: 'Corporate Profits After Tax with IVA and CCAdj', shortTitle: 'Adjusted after-tax corporate profits', description: 'After-tax corporate profits with inventory valuation and capital consumption adjustments.', question: 'How large are corporate profits relative to the economy?', units: 'Billions of dollars, seasonally adjusted annual rate', seasonalAdjustment: 'Seasonally adjusted annual rate', transformation: 'Provider-published level', sourceName: 'U.S. Bureau of Economic Analysis via FRED', sourceUrl: 'https://fred.stlouisfed.org/series/CPATAX',
  },
  gdpSource: {
    dataHandling: 'provider-level', id: 'nominal-gdp-source', slug: 'nominal-gdp-source', outputFile: '',
    providerSeriesId: 'GDP', frequency: 'quarterly', fredFrequency: 'q', historyPolicy: { type: 'full' }, minimumUsableObservations: 250,
    title: 'Gross Domestic Product', shortTitle: 'Nominal GDP', description: 'Current-dollar gross domestic product.', question: 'How large are corporate profits relative to the economy?', units: 'Billions of dollars, seasonally adjusted annual rate', seasonalAdjustment: 'Seasonally adjusted annual rate', transformation: 'Provider-published level', sourceName: 'U.S. Bureau of Economic Analysis via FRED', sourceUrl: 'https://fred.stlouisfed.org/series/GDP',
  },
  outputFile: 'src/features/economic-series/data/corporate-profit-share.json',
}

export const tariffBurdenConfiguration: TariffBurdenConfig = {
  customsSource: {
    dataHandling: 'provider-level', id: 'customs-duties-source', slug: 'customs-duties-source', outputFile: '',
    providerSeriesId: 'B235RC1Q027SBEA', frequency: 'quarterly', fredFrequency: 'q', historyPolicy: { type: 'full' }, minimumUsableObservations: 200,
    title: 'Federal Government Current Receipts: Customs Duties', shortTitle: 'Customs duties', description: 'Federal customs-duty receipts.', question: 'How heavily are imported goods being taxed?', units: 'Billions of dollars, seasonally adjusted annual rate', seasonalAdjustment: 'Seasonally adjusted annual rate', transformation: 'Provider-published level', sourceName: 'U.S. Bureau of Economic Analysis via FRED', sourceUrl: 'https://fred.stlouisfed.org/series/B235RC1Q027SBEA',
  },
  importsSource: {
    dataHandling: 'provider-level', id: 'goods-imports-source', slug: 'goods-imports-source', outputFile: '',
    providerSeriesId: 'A255RC1Q027SBEA', frequency: 'quarterly', fredFrequency: 'q', historyPolicy: { type: 'full' }, minimumUsableObservations: 200,
    title: 'Imports of Goods', shortTitle: 'Goods imports', description: 'Imports of goods.', question: 'How heavily are imported goods being taxed?', units: 'Billions of dollars, seasonally adjusted annual rate', seasonalAdjustment: 'Seasonally adjusted annual rate', transformation: 'Provider-published level', sourceName: 'U.S. Bureau of Economic Analysis via FRED', sourceUrl: 'https://fred.stlouisfed.org/series/A255RC1Q027SBEA',
  },
  outputFile: 'src/features/economic-series/data/effective-tariff-burden.json',
}

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
  providerSeriesId: 'CES0500000003'
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
  providerSeriesId: 'CES0500000003',
  fredFrequency: 'm',
  historyPolicy: { type: 'full' },
  minimumUsableObservations: 120,
  nominalOutputFile:
    'src/features/economic-series/data/nominal-wage-growth.json',
  realOutputFile: 'src/features/economic-series/data/real-wage-growth.json',
  seasonalAdjustment: 'Seasonally adjusted',
  sourceName: 'U.S. Bureau of Labor Statistics via FRED',
  sourceUrl: 'https://fred.stlouisfed.org/series/CES0500000003',
}

export interface CpiSeriesConfig {
  dataHandling: 'cpi-derived'
  headlineSource: FredSeriesConfig
  headlineMomentumSource: {
    providerSeriesId: 'CPIAUCSL'
    fredFrequency: 'm'
    historyPolicy: HistoryPolicy
  }
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
  headlineSeasonallyAdjustedInflationOutputFile: string
}

export const cpiSeriesConfiguration: CpiSeriesConfig = {
  dataHandling: 'cpi-derived',
  headlineSource: fredSeriesConfigurations.find(
    (config) => config.providerSeriesId === 'CPIAUCNS',
  )!,
  headlineMomentumSource: {
    providerSeriesId: 'CPIAUCSL',
    fredFrequency: 'm',
    historyPolicy: { type: 'full' },
  },
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
  headlineSeasonallyAdjustedInflationOutputFile:
    'src/features/economic-series/data/headline-cpi-inflation-seasonally-adjusted.json',
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
  question: 'Are households saving less of their income?',
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
