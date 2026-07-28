import type {
  BreakevenEmploymentDataset,
  BreakevenEmploymentObservation,
  JobGrowthBreakevenDataset,
  JobGrowthBreakevenObservation,
} from '../../src/features/economic-series/models/jobGrowthBreakeven'
import {
  validateBreakevenEmploymentDataset,
  validateJobGrowthBreakevenDataset,
} from '../../src/features/economic-series/models/jobGrowthBreakeven'

export const federalReserveBreakevenSourceUrl =
  'https://www.federalreserve.gov/econres/notes/feds-notes/labor-force-growth-breakeven-employment-and-potential-gdp-growth-accessible-20260402.htm'
export const payemsCsvUrl =
  'https://fred.stlouisfed.org/graph/fredgraph.csv?id=PAYEMS'

export interface PayrollLevelObservation {
  date: string
  value: number | null
}

function decodeHtml(value: string): string {
  return value
    .replaceAll('&minus;', '−')
    .replaceAll('&ndash;', '–')
    .replaceAll('&amp;', '&')
    .replace(/<[^>]+>/g, '')
    .trim()
}

function quarterEndMonthDate(year: number, quarter: number): string {
  return `${year}-${String(quarter * 3).padStart(2, '0')}-01`
}

function validateConsecutiveQuarters(
  observations: readonly BreakevenEmploymentObservation[],
): void {
  for (let index = 1; index < observations.length; index += 1) {
    const previous = new Date(`${observations[index - 1]!.date}T00:00:00Z`)
    previous.setUTCMonth(previous.getUTCMonth() + 3)
    const expected = previous.toISOString().slice(0, 10)
    if (observations[index]!.date !== expected) {
      throw new Error(
        `Federal Reserve breakeven table has a missing or out-of-order quarter before ${observations[index]!.date}`,
      )
    }
  }
}

export function parseFederalReserveBreakevenHtml(
  html: string,
): BreakevenEmploymentObservation[] {
  const headingIndex = html.indexOf(
    '<h5 id="fig2">Figure 2. Breakeven pace of employment growth</h5>',
  )
  if (headingIndex < 0) {
    throw new Error('Federal Reserve page is missing the Figure 2 breakeven table')
  }
  const tableStart = html.indexOf('<table', headingIndex)
  const tableEnd = html.indexOf('</table>', tableStart)
  if (tableStart < 0 || tableEnd < 0) {
    throw new Error('Federal Reserve Figure 2 table markup is incomplete')
  }
  const table = html.slice(tableStart, tableEnd)
  const headings = [...table.matchAll(/<th class="colhead"[^>]*>([\s\S]*?)<\/th>/g)]
    .map((match) => decodeHtml(match[1]!))
  expectHeadings(headings)

  const observations = [...table.matchAll(/<tr>([\s\S]*?)<\/tr>/g)]
    .map((match) => {
      const cells = [...match[1]!.matchAll(
        /<(?:th class="stub"|td class="data")[^>]*>([\s\S]*?)<\/(?:th|td)>/g,
      )].map((cell) => decodeHtml(cell[1]!))
      if (cells.length === 0) return null
      if (cells.length !== 4) {
        throw new Error('Federal Reserve breakeven table row has an unexpected shape')
      }
      const quarter = /^(\d{4})q([1-4])$/.exec(cells[0]!)
      if (!quarter) {
        throw new Error(`Federal Reserve breakeven table has invalid quarter: ${cells[0]}`)
      }
      const value = Number(cells[1])
      const lowerBound = Number(cells[2])
      const upperBound = Number(cells[3])
      if (!Number.isFinite(value) || !Number.isFinite(lowerBound) ||
          !Number.isFinite(upperBound)) {
        throw new Error(`Federal Reserve breakeven table has nonfinite value for ${cells[0]}`)
      }
      if (lowerBound > value || upperBound < value) {
        throw new Error(
          `Federal Reserve breakeven confidence bounds do not contain the estimate for ${cells[0]}`,
        )
      }
      const year = Number(quarter[1])
      return {
        date: quarterEndMonthDate(year, Number(quarter[2])),
        estimatedMonthlyJobGrowth: value,
        estimateStatus: year >= 2026
          ? 'projection' as const
          : 'historical-estimate' as const,
      }
    })
    .filter((item): item is BreakevenEmploymentObservation => item !== null)

  if (observations.length < 260) {
    throw new Error(
      `Federal Reserve breakeven table has insufficient history: ${observations.length} quarters`,
    )
  }
  const dates = new Set(observations.map(({ date }) => date))
  if (dates.size !== observations.length) {
    throw new Error('Federal Reserve breakeven table contains duplicate quarters')
  }
  validateConsecutiveQuarters(observations)
  return observations
}

function expectHeadings(headings: readonly string[]): void {
  const expected = [
    'QDate',
    'Breakeven employment growth',
    'Lower bound of 90-percent confidence interval',
    'Upper bound of 90-percent confidence interval',
  ]
  if (headings.length !== expected.length ||
      headings.some((heading, index) => heading !== expected[index])) {
    throw new Error('Federal Reserve Figure 2 table headings have changed')
  }
}

export function parsePayemsCsv(csv: string): PayrollLevelObservation[] {
  const lines = csv.trim().split(/\r?\n/)
  if (lines[0] !== 'observation_date,PAYEMS') {
    throw new Error('PAYEMS CSV has unexpected headings')
  }
  const observations = lines.slice(1).map((line) => {
    const [date, rawValue, extra] = line.split(',')
    if (extra !== undefined || !date || rawValue === undefined ||
        !/^\d{4}-\d{2}-01$/.test(date)) {
      throw new Error(`PAYEMS CSV has malformed row: ${line}`)
    }
    const value = rawValue === '.' ? null : Number(rawValue)
    if (value !== null && !Number.isFinite(value)) {
      throw new Error(`PAYEMS CSV has nonfinite value for ${date}`)
    }
    return { date, value }
  })
  const dates = new Set<string>()
  let previous: string | null = null
  for (const observation of observations) {
    if (dates.has(observation.date)) {
      throw new Error(`PAYEMS CSV contains duplicate date: ${observation.date}`)
    }
    if (previous !== null && observation.date <= previous) {
      throw new Error(`PAYEMS CSV is not chronological at ${observation.date}`)
    }
    dates.add(observation.date)
    previous = observation.date
  }
  return observations
}

function subtractMonths(date: string, months: number): string {
  const parsed = new Date(`${date}T00:00:00Z`)
  parsed.setUTCMonth(parsed.getUTCMonth() - months)
  return parsed.toISOString().slice(0, 10)
}

export function annualizeThreeMonthGrowth(
  startingLevel: number,
  endingLevel: number,
): number {
  if (!Number.isFinite(startingLevel) || !Number.isFinite(endingLevel) ||
      startingLevel <= 0 || endingLevel <= 0) {
    throw new Error('Annualized payroll growth requires positive finite levels')
  }
  return (Math.pow(endingLevel / startingLevel, 4) - 1) * 100
}

export function annualizeBreakevenGrowth(
  startingPayrollLevel: number,
  estimatedMonthlyJobGrowth: number,
): number {
  return annualizeThreeMonthGrowth(
    startingPayrollLevel,
    startingPayrollLevel + estimatedMonthlyJobGrowth * 3,
  )
}

export function deriveJobGrowthBreakevenObservations(
  breakeven: readonly BreakevenEmploymentObservation[],
  payrollLevels: readonly PayrollLevelObservation[],
): JobGrowthBreakevenObservation[] {
  const payrollByDate = new Map(
    payrollLevels.map((observation) => [observation.date, observation.value]),
  )
  return breakeven.map((estimate) => {
    const requiredDates = [3, 2, 1, 0].map((months) =>
      subtractMonths(estimate.date, months),
    )
    if (requiredDates.some((date) => !payrollByDate.has(date))) {
      return {
        status: 'unavailable',
        date: estimate.date,
        estimatedBreakevenMonthlyJobGrowth: estimate.estimatedMonthlyJobGrowth,
        estimateStatus: estimate.estimateStatus,
        reason: 'missing-payroll-period',
      }
    }
    const requiredLevels = requiredDates.map((date) => payrollByDate.get(date))
    const startingLevel = requiredLevels[0]
    const endingLevel = payrollByDate.get(estimate.date)
    if (requiredLevels.some((value) => value === null || value === undefined) ||
        startingLevel === null || startingLevel === undefined ||
        endingLevel === null || endingLevel === undefined) {
      return {
        status: 'unavailable',
        date: estimate.date,
        estimatedBreakevenMonthlyJobGrowth: estimate.estimatedMonthlyJobGrowth,
        estimateStatus: estimate.estimateStatus,
        reason: 'incomplete-payroll-window',
      }
    }
    const actualAverageMonthlyJobGrowth = (endingLevel - startingLevel) / 3
    const actualRate = annualizeThreeMonthGrowth(startingLevel, endingLevel)
    const breakevenRate = annualizeBreakevenGrowth(
      startingLevel,
      estimate.estimatedMonthlyJobGrowth,
    )
    return {
      status: 'available',
      date: estimate.date,
      actualAverageMonthlyJobGrowth,
      estimatedBreakevenMonthlyJobGrowth: estimate.estimatedMonthlyJobGrowth,
      monthlyJobGrowthDifference:
        actualAverageMonthlyJobGrowth - estimate.estimatedMonthlyJobGrowth,
      startingPayrollEmployment: startingLevel,
      endingPayrollEmployment: endingLevel,
      actualAnnualizedPayrollGrowthRate: actualRate,
      estimatedAnnualizedBreakevenGrowthRate: breakevenRate,
      gapPercentagePoints: actualRate - breakevenRate,
      estimateStatus: estimate.estimateStatus,
    }
  })
}

export function buildBreakevenEmploymentDataset(
  observations: BreakevenEmploymentObservation[],
  retrievedAt: string,
): BreakevenEmploymentDataset {
  return validateBreakevenEmploymentDataset({
    id: 'estimated-breakeven-employment-growth',
    provider: 'Board of Governors of the Federal Reserve System',
    title: 'Estimated Breakeven Employment Growth',
    description:
      'Federal Reserve Board estimate of the monthly payroll-employment growth needed to absorb potential labor-force growth while keeping unemployment approximately stable.',
    units: 'Thousands of jobs per month',
    frequency: 'quarterly',
    periodConvention:
      'Quarterly observations are stored at the first day of the quarter-ending month; each value is an estimated monthly job-growth pace, not a quarterly total.',
    methodology:
      'Change in potential labor force multiplied by one minus CBO noncyclical unemployment; the published quarterly estimate uses a 13-month centered population average and a 5-quarter centered breakeven average.',
    sourceName:
      'Federal Reserve Board, Labor force growth, breakeven employment, and potential GDP growth',
    sourceUrl: federalReserveBreakevenSourceUrl,
    publicationDate: '2026-04-02',
    retrievedAt,
    observations,
  })
}

export function buildJobGrowthBreakevenDataset(
  observations: JobGrowthBreakevenObservation[],
  retrievedAt: string,
): JobGrowthBreakevenDataset {
  return validateJobGrowthBreakevenDataset({
    id: 'job-growth-breakeven-comparison',
    title: 'Payroll Growth Relative to Estimated Breakeven Growth',
    description:
      'Three-month annualized total nonfarm payroll growth minus a Federal Reserve Board estimate of breakeven payroll growth, aligned at exact quarter-ending months.',
    question: 'Is job growth keeping up with the labor force?',
    frequency: 'quarterly',
    units: 'Percentage points',
    transformation:
      'Actual rate = ((PAYEMS at quarter end / PAYEMS three months earlier)^4 − 1) × 100. Estimated breakeven rate applies three months of the published monthly breakeven pace to the same starting PAYEMS level and annualizes identically. Gap = actual rate − estimated rate.',
    sourceName: 'Federal Reserve Board and U.S. Bureau of Labor Statistics via FRED',
    sourceUrl: federalReserveBreakevenSourceUrl,
    retrievedAt,
    sources: [
      {
        provider: 'Board of Governors of the Federal Reserve System',
        role: 'Estimated breakeven employment growth',
        sourceUrl: federalReserveBreakevenSourceUrl,
      },
      {
        provider: 'Federal Reserve Bank of St. Louis',
        providerSeriesId: 'PAYEMS',
        role: 'Total nonfarm payroll employment',
        sourceUrl: 'https://fred.stlouisfed.org/series/PAYEMS',
      },
    ],
    observations,
  })
}

export async function fetchText(
  url: string,
  fetchImplementation: typeof fetch = fetch,
): Promise<string> {
  const response = await fetchImplementation(url)
  if (!response.ok) {
    throw new Error(`Could not download ${url}: HTTP ${response.status}`)
  }
  return response.text()
}
