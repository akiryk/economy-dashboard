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
  period: string,
  nominalAvailable: boolean,
  context: HistoricalContext,
): DashboardCardBackContent {
  const direction = value < 0 ? 'contracted' : 'grew'
  const whatItShows = `Real GDP ${direction} at a ${Math.abs(value).toFixed(1)}% annualized rate in ${period}.${nominalAvailable ? " The secondary figure shows the economy's nominal dollar size." : ''}`
  let interpretation = 'Output is expanding at a broadly typical pace.'
  if (value < 0) interpretation = 'Real output contracted in the latest quarter.'
  else if (context.stateLabel === 'Slow growth') interpretation = 'Output is still expanding, but the current pace is relatively slow.'
  else if (context.stateLabel === 'Strong growth') interpretation = "Output is expanding quickly relative to the dashboard's growth threshold."
  return {
    whatItShows,
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
  core: number | null,
  stateLabel: string,
): DashboardCardBackContent {
  const coreClause = core === null
    ? 'The current core CPI reading is unavailable.'
    : `Core CPI, excluding food and energy, rose ${core.toFixed(1)}%.`
  const interpretations: Record<string, string> = {
    'Very low': 'Inflation is unusually low. Very low inflation can signal weak price pressure rather than simply being favorable.',
    Low: 'Inflation is low relative to the range generally associated with price stability.',
    'Near price-stability range': 'CPI inflation is near the range associated with price stability.',
    Elevated: 'CPI inflation is elevated relative to a price-stability environment.',
    High: 'CPI inflation is high and well above the range associated with price stability.',
  }
  return {
    whatItShows: `Consumer prices were ${headline.toFixed(1)}% higher than a year earlier. ${coreClause}`,
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

export function getExpectedInflationBackContent(
  value: number,
  stateLabel: string,
): DashboardCardBackContent {
  const interpretations: Record<string, string> = {
    'Very low': 'Very low breakevens can reflect weak inflation expectations, market stress, or liquidity effects.',
    Low: 'Long-run inflation expectations are below a price-stability range.',
    'Near price-stability range': 'Long-run inflation expectations remain near a price-stability range.',
    Elevated: "Long-run inflation expectations are elevated, though not at the dashboard's high-alert threshold.",
    High: "Long-run inflation expectations are high relative to the dashboard's threshold.",
  }
  return {
    whatItShows: `The 10-year breakeven is ${value.toFixed(1)}%, a market-implied average inflation rate for roughly the next decade.`,
    howToReadIt: `${interpretations[stateLabel]} It is a market-implied expectation, not a guaranteed forecast.`,
  }
}

export function getFedFundsBackContent(
  effective: number,
  upper: number | null,
  stateLabel: string,
): DashboardCardBackContent {
  const target = upper === null
    ? 'The current target-range upper bound is unavailable.'
    : `The Federal Reserve's target-range upper bound is ${upper.toFixed(2)}%.`
  const relationship = stateLabel === 'Within target range'
    ? 'The effective rate is within the range implied by the available upper bound.'
    : stateLabel === 'Above target range'
      ? 'The effective rate is above the available target upper bound.'
      : stateLabel === 'Below target upper'
        ? 'The effective rate is materially below the available target upper bound.'
        : 'The relationship to the target range cannot be determined from available data.'
  return {
    whatItShows: `The effective federal funds rate is ${effective.toFixed(2)}%. ${target}`,
    howToReadIt: `${relationship} Higher rates generally raise borrowing costs and restrain demand; lower rates do the reverse.`,
  }
}

export function getYieldCurveBackContent(
  twoYearSpread: number,
  threeMonthSpread: number | null,
): DashboardCardBackContent {
  const basisPoints = Math.abs(Math.round(twoYearSpread * 100))
  const relationship = twoYearSpread < 0
    ? `The 2-year Treasury yield is ${basisPoints} basis points above the 10-year yield.`
    : `The 10-year Treasury yield is ${basisPoints} basis points above the 2-year yield.`
  const secondary = threeMonthSpread === null
    ? 'The 10-year minus 3-month spread is unavailable.'
    : `The secondary figure is the 10-year minus 3-month spread.`
  const interpretation = twoYearSpread < 0
    ? 'The curve is inverted. Inversions have historically preceded many U.S. recessions, but they do not determine whether or when one will occur.'
    : 'The curve is not currently inverted. A positive slope does not rule out recession or guarantee strong growth.'
  return {
    whatItShows: `${relationship} ${secondary}`,
    howToReadIt: interpretation,
  }
}
