import type { EconomicValueFormat } from '../utils/economicSeries'

interface EconomicSeriesPresentation {
  topicLabel: string
  latestValueLabel: string
  whatThisTellsYou: string
  whatThisLeavesOut: string
  relatedIndicators: readonly string[]
  recentObservationCount: number
  recentObservationsCaption: string
  valueColumnLabel: string
  includeZeroInChart: boolean
  reportBelowZero: boolean
  valueFormat: EconomicValueFormat
  summaryFormat: 'numeric-range' | 'job-change'
  recentTable: 'single-value' | 'payroll-changes'
}

const presentations: Readonly<Record<string, EconomicSeriesPresentation>> = {
  'personal-saving-rate': {
    topicLabel: 'Household saving',
    latestValueLabel: 'Latest personal saving rate',
    whatThisTellsYou:
      'The personal saving rate is the share of aggregate disposable personal income that remains after personal consumption and related outlays. It helps show how much current income households are saving rather than spending.',
    whatThisLeavesOut:
      'The national rate is an aggregate and can differ sharply across households. It does not measure total household wealth, cash balances, or debt, and a higher rate can reflect either improved financial capacity or greater caution.',
    relatedIndicators: ['Real income and spending', 'Household debt service', 'Consumer confidence'],
    recentObservationCount: 12,
    recentObservationsCaption: 'Twelve most recent personal saving rate observations',
    valueColumnLabel: 'Personal saving rate',
    includeZeroInChart: false,
    reportBelowZero: false,
    valueFormat: 'percentage',
    summaryFormat: 'numeric-range',
    recentTable: 'single-value',
  },
  'real-gdp-growth': {
    topicLabel: 'Economic growth',
    latestValueLabel: 'Latest real GDP growth',
    whatThisTellsYou:
      'Real GDP measures the inflation-adjusted value of goods and services produced in the United States. Year-over-year growth compares output with the same period one year earlier.',
    whatThisLeavesOut:
      'Total GDP growth does not show how gains are distributed, whether GDP per person is rising, or whether typical households are financially better off.',
    relatedIndicators: ['Productivity', 'Employment', 'Real income'],
    recentObservationCount: 8,
    recentObservationsCaption:
      'Eight most recent real GDP growth observations',
    valueColumnLabel: 'Year-over-year growth',
    includeZeroInChart: true,
    reportBelowZero: true,
    valueFormat: 'percentage',
    summaryFormat: 'numeric-range',
    recentTable: 'single-value',
  },
  'real-gdp-per-capita-growth': {
    topicLabel: 'Growth per person',
    latestValueLabel: 'Latest real GDP per capita growth',
    whatThisTellsYou:
      'Real GDP per capita measures inflation-adjusted economic output per person. Its year-over-year growth rate shows whether output is increasing faster or slower than the population.',
    whatThisLeavesOut:
      'Per-capita GDP is an average and does not show how income or output is distributed. It also does not directly measure household well-being, unpaid work, environmental costs, or the quality of public services.',
    relatedIndicators: ['Real GDP growth', 'Productivity', 'Real income'],
    recentObservationCount: 8,
    recentObservationsCaption:
      'Eight most recent real GDP per capita growth observations',
    valueColumnLabel: 'Year-over-year growth',
    includeZeroInChart: true,
    reportBelowZero: true,
    valueFormat: 'percentage',
    summaryFormat: 'numeric-range',
    recentTable: 'single-value',
  },
  'labor-productivity-growth': {
    topicLabel: 'Productive capacity',
    latestValueLabel: 'Latest labor productivity growth',
    whatThisTellsYou:
      'Labor productivity measures output per hour worked in the nonfarm business sector. Rising productivity means the economy is producing more output for each hour of labor.',
    whatThisLeavesOut:
      'Productivity growth does not show how its gains are distributed between workers and business owners. It also excludes government, farms, households, and some other activity outside the nonfarm business sector.',
    relatedIndicators: ['Real GDP', 'Real wages', 'Labor share'],
    recentObservationCount: 8,
    recentObservationsCaption:
      'Eight most recent labor productivity growth observations',
    valueColumnLabel: 'Year-over-year growth',
    includeZeroInChart: true,
    reportBelowZero: true,
    valueFormat: 'percentage',
    summaryFormat: 'numeric-range',
    recentTable: 'single-value',
  },
  'headline-cpi-inflation': {
    topicLabel: 'Inflation',
    latestValueLabel: 'Latest CPI inflation',
    whatThisTellsYou:
      'Headline CPI inflation measures how much the prices paid by urban consumers for a broad basket of goods and services have changed compared with the same month one year earlier.',
    whatThisLeavesOut:
      'The national average does not describe every household’s personal inflation rate. It also does not show whether prices are falling; a lower positive inflation rate means prices are generally rising more slowly, not returning to their previous level.',
    relatedIndicators: ['Wage growth', 'Core inflation', 'Consumer spending'],
    recentObservationCount: 12,
    recentObservationsCaption:
      'Twelve most recent headline CPI inflation observations',
    valueColumnLabel: 'Year-over-year inflation',
    includeZeroInChart: true,
    reportBelowZero: true,
    valueFormat: 'percentage',
    summaryFormat: 'numeric-range',
    recentTable: 'single-value',
  },
  'unemployment-rate': {
    topicLabel: 'Labor market',
    latestValueLabel: 'Latest unemployment rate',
    whatThisTellsYou:
      'The unemployment rate measures the share of the labor force that does not have a job and is actively looking for work.',
    whatThisLeavesOut:
      'People who are not working and are not actively searching are not counted as unemployed. The rate also does not show job quality, wage growth, hours worked, or how conditions differ across groups.',
    relatedIndicators: ['Prime-age employment', 'Payroll growth', 'Wage growth'],
    recentObservationCount: 12,
    recentObservationsCaption:
      'Twelve most recent unemployment rate observations',
    valueColumnLabel: 'Unemployment rate',
    includeZeroInChart: false,
    reportBelowZero: false,
    valueFormat: 'percentage',
    summaryFormat: 'numeric-range',
    recentTable: 'single-value',
  },
  'prime-age-employment-ratio': {
    topicLabel: 'Labor market',
    latestValueLabel: 'Latest prime-age employment ratio',
    whatThisTellsYou:
      'The prime-age employment-to-population ratio measures the share of adults ages 25 through 54 who are employed. It is less affected by retirement and schooling than an all-ages employment measure.',
    whatThisLeavesOut:
      'The ratio does not show whether people want more hours, whether jobs are well paid, or why someone is not employed. It also does not describe conditions for younger or older workers.',
    relatedIndicators: ['Unemployment', 'Labor-force participation', 'Payroll growth'],
    recentObservationCount: 12,
    recentObservationsCaption:
      'Twelve most recent prime-age employment ratio observations',
    valueColumnLabel: 'Prime-age employment ratio',
    includeZeroInChart: false,
    reportBelowZero: false,
    valueFormat: 'percentage',
    summaryFormat: 'numeric-range',
    recentTable: 'single-value',
  },
  'payroll-growth': {
    topicLabel: 'Labor market',
    latestValueLabel: 'Latest 3-month average',
    whatThisTellsYou:
      'Payroll growth measures the net change in jobs reported by U.S. employers. The three-month average reduces some of the volatility in any single monthly estimate while remaining responsive to changes in hiring.',
    whatThisLeavesOut:
      'Payroll growth does not show the unemployment rate, how many people are entering or leaving the labor force, whether workers are receiving more hours or higher pay, or how job gains are distributed across industries. Recent estimates are also subject to revision.',
    relatedIndicators: ['Unemployment', 'Prime-age employment', 'Wage growth'],
    recentObservationCount: 12,
    recentObservationsCaption:
      'Twelve most recent monthly payroll changes and three-month averages',
    valueColumnLabel: 'Three-month average',
    includeZeroInChart: true,
    reportBelowZero: true,
    valueFormat: 'signed-thousands',
    summaryFormat: 'job-change',
    recentTable: 'payroll-changes',
  },
}

export function getEconomicSeriesPresentation(
  slug: string,
): EconomicSeriesPresentation {
  const presentation = presentations[slug]
  if (!presentation) {
    throw new Error(`Missing presentation configuration for series: ${slug}`)
  }
  return presentation
}
