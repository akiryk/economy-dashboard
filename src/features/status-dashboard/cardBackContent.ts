export interface DashboardCardBackContent {
  whatItShows: string
  howToReadIt: string
}

interface HistoricalContext {
  percentile: number
  stateLabel: string
}

function formatJobs(valueInThousands: number): string {
  return Math.round(Math.abs(valueInThousands) * 1_000).toLocaleString('en-US')
}

export function getGdpBackContent(
  value: number,
  date: string,
  stateLabel: string,
): DashboardCardBackContent {
  const parsed = new Date(`${date}T00:00:00Z`)
  const quarter = Math.floor(parsed.getUTCMonth() / 3) + 1
  const year = parsed.getUTCFullYear()
  const direction = value < 0 ? 'lower' : 'higher'
  const interpretation = stateLabel === 'Contracting'
    ? 'Real output is smaller than it was one year earlier; this measure alone does not establish a recession.'
    : stateLabel === 'Little changed'
      ? 'Real output is little changed from one year earlier.'
      : 'Real output is larger than it was one year earlier.'
  return {
    whatItShows: `Real GDP was ${Math.abs(value).toFixed(1)}% ${direction} in Q${quarter} ${year} than in Q${quarter} ${year - 1}. This measures how much inflation-adjusted U.S. economic output has changed from the same quarter one year earlier.`,
    howToReadIt: `${interpretation} GDP growth alone does not measure household welfare.`,
  }
}

export function getUnemploymentBackContent(
  value: number,
  period: string,
  context: HistoricalContext,
): DashboardCardBackContent {
  let interpretation = 'Unemployment is neither especially low nor high by historical standards.'
  if (context.percentile < 25 || context.stateLabel === 'Low') {
    interpretation = 'Unemployment is low relative to most of the available history.'
  } else if (context.percentile > 75 || context.stateLabel === 'High' || context.stateLabel === 'Very high') {
    interpretation = 'Unemployment is elevated relative to its historical distribution.'
  }
  return {
    whatItShows: `${value.toFixed(1)}% of the labor force was unemployed and actively seeking work in ${period}. People not looking for work are not counted as unemployed.`,
    howToReadIt: `${interpretation} This measure does not describe the labor market by itself.`,
  }
}

export function getClaimsBackContent(
  average: number,
  latest: number | null,
  context: HistoricalContext,
): DashboardCardBackContent {
  const latestClause = latest === null
    ? 'Latest week: unavailable.'
    : `Latest week: ${formatJobs(latest / 1_000)}.`
  let interpretation = 'Claims are within a typical historical range.'
  if (context.stateLabel === 'Low') {
    interpretation = 'Claims are historically low, suggesting layoffs remain limited.'
  } else if (context.stateLabel === 'Elevated') {
    interpretation = 'Claims are elevated, indicating more workers are newly filing for unemployment benefits.'
  }
  return {
    whatItShows: `The hero smooths new unemployment claims with a four-week average: about ${formatJobs(average / 1_000)} filings per week. ${latestClause}`,
    howToReadIt: `${interpretation} This signal alone cannot establish labor-market deterioration.`,
  }
}

export function getSahmBackContent(value: number): DashboardCardBackContent {
  const formatted = value.toFixed(2)
  let interpretation: string
  if (value >= 0.5) {
    interpretation = `At ${formatted}, the Sahm Rule has crossed its 0.50 recession-indicator trigger.`
  } else if (value >= 0.3) {
    interpretation = `At ${formatted}, the indicator remains below its 0.50 trigger, but is relatively close to it.`
  } else {
    interpretation = `At ${formatted}, the indicator is well below its 0.50 trigger.`
  }
  return {
    whatItShows: 'The Sahm Rule compares recent unemployment with its low over the prior year. A reading of 0.50 or higher triggers the recession indicator.',
    howToReadIt: `${interpretation} It is an indicator, not a forecast.`,
  }
}

export function getInflationBackContent(
  headline: number,
  stateLabel: string,
): DashboardCardBackContent {
  const interpretations: Record<string, string> = {
    'Very low': 'Inflation is unusually low. Very low inflation can signal weak price pressure rather than simply being favorable.',
    Low: 'Inflation is low relative to the range generally associated with price stability.',
    'Near price-stability range': 'CPI inflation is near the range associated with price stability.',
    Elevated: 'CPI inflation is elevated relative to a price-stability environment.',
    High: 'CPI inflation is high and well above the range associated with price stability.',
  }
  return {
    whatItShows: `The not-seasonally-adjusted CPI-U All Items index was ${headline.toFixed(1)}% higher than a year earlier.`,
    howToReadIt: `${interpretations[stateLabel] ?? interpretations.Elevated} The Fed's formal 2% objective applies to PCE inflation, not CPI.`,
  }
}

export function getPayrollBackContent(
  average: number,
  latest: number,
  stateLabel: string,
): DashboardCardBackContent {
  const averageDirection = average < 0 ? 'lost' : average === 0 ? 'changed by' : 'added'
  const latestDirection = latest < 0 ? 'lost' : latest === 0 ? 'changed by' : 'added'
  const interpretations: Record<string, string> = {
    Shrinking: 'Payroll employment is shrinking on the three-month measure.',
    Flat: 'Payroll employment is essentially unchanged on the three-month measure.',
    'Growing slowly': 'Payrolls are still growing, but the pace is weak relative to the available history.',
    Growing: 'Payrolls are growing at a broadly typical historical pace.',
    'Growing strongly': 'Payrolls are growing quickly relative to the available history.',
  }
  return {
    whatItShows: `Employers ${averageDirection} an average of ${formatJobs(average)} jobs per month over the latest three months. The latest month ${latestDirection} ${formatJobs(latest)}.`,
    howToReadIt: interpretations[stateLabel] ?? interpretations.Growing,
  }
}

export function getMortgageRateBackContent(
  mortgage: number,
  mortgageDate: string,
  direction: string,
): DashboardCardBackContent {
  return {
    whatItShows: `Freddie Mac's national average 30-year fixed mortgage rate was ${mortgage.toFixed(2)}% on ${mortgageDate}; it was ${direction}.`,
    howToReadIt: 'This benchmark summarizes prevailing mortgage borrowing conditions, but an individual offer varies with the borrower, property, lender, points, and fees. Mortgage rates alone do not determine housing affordability.',
  }
}

export function getSp500BackContent(
  drawdown: number,
  level: number,
  yearToDateChange: number | null,
  stateLabel: string,
): DashboardCardBackContent {
  const whatItShows = drawdown === 0
    ? `The S&P 500 is at its highest level in the available FRED history. The index is ${level.toLocaleString('en-US', { maximumFractionDigits: 2 })}${yearToDateChange === null ? '' : `, with a year-to-date change of ${yearToDateChange.toFixed(1)}%`}.`
    : `The S&P 500 is ${Math.abs(drawdown).toFixed(1)}% below its highest level in the available FRED history. The index is ${level.toLocaleString('en-US', { maximumFractionDigits: 2 })}${yearToDateChange === null ? '' : `, with a year-to-date change of ${yearToDateChange.toFixed(1)}%`}.`
  const interpretations: Record<string, string> = {
    'At high': 'The market is trading at its recent-history peak.',
    'Near high': 'The market is trading near its recent-history peak.',
    'Modest pullback': 'The market has pulled back modestly from its recent-history peak.',
    'Meaningful pullback': "The market is meaningfully below its recent-history peak, but not yet past the dashboard's correction threshold.",
    'Correction or worse': 'The market is more than 10% below its recent-history peak.',
  }
  return {
    whatItShows,
    howToReadIt: `${interpretations[stateLabel]} FRED provides only limited S&P history here, so this is not necessarily an all-time drawdown. Equity-market movement does not establish economic causation.`,
  }
}

export function getHighYieldSpreadBackContent(
  basisPoints: number,
  stateLabel: string,
  percentile: number,
): DashboardCardBackContent {
  const interpretations: Record<string, string> = {
    Calm: 'Spreads are relatively tight, so investors demand a small extra risk premium for lower-rated corporate debt.',
    'Normal risk premium': 'Credit spreads are within a broadly typical range.',
    Stressed: 'Spreads are wide, so investors demand substantially more compensation for credit risk.',
  }
  const historical = percentile <= 10
    ? ' The current spread is unusually low relative to the available history.'
    : percentile >= 90
      ? ' The current spread is unusually high relative to the available history.'
      : ''
  return {
    whatItShows: `High-yield corporate bonds offer about ${Math.round(basisPoints)} basis points more yield than comparable Treasury securities after option adjustment.`,
    howToReadIt: `${interpretations[stateLabel]}${historical} Low spreads do not eliminate default risk, and high spreads do not guarantee recession.`,
  }
}
