export type BreakevenEstimateStatus =
  | 'historical-estimate'
  | 'projection'

export interface BreakevenEmploymentObservation {
  date: string
  estimatedMonthlyJobGrowth: number
  estimateStatus: BreakevenEstimateStatus
}

export interface BreakevenEmploymentDataset {
  id: 'estimated-breakeven-employment-growth'
  provider: 'Board of Governors of the Federal Reserve System'
  title: string
  description: string
  units: 'Thousands of jobs per month'
  frequency: 'quarterly'
  periodConvention: string
  methodology: string
  sourceName: string
  sourceUrl: string
  publicationDate: string
  retrievedAt: string
  observations: BreakevenEmploymentObservation[]
}

export interface AvailableJobGrowthBreakevenObservation {
  status: 'available'
  date: string
  actualAverageMonthlyJobGrowth: number
  estimatedBreakevenMonthlyJobGrowth: number
  monthlyJobGrowthDifference: number
  startingPayrollEmployment: number
  endingPayrollEmployment: number
  actualAnnualizedPayrollGrowthRate: number
  estimatedAnnualizedBreakevenGrowthRate: number
  gapPercentagePoints: number
  estimateStatus: BreakevenEstimateStatus
}

export interface UnavailableJobGrowthBreakevenObservation {
  status: 'unavailable'
  date: string
  estimatedBreakevenMonthlyJobGrowth: number
  estimateStatus: BreakevenEstimateStatus
  reason: 'missing-payroll-period' | 'incomplete-payroll-window'
}

export type JobGrowthBreakevenObservation =
  | AvailableJobGrowthBreakevenObservation
  | UnavailableJobGrowthBreakevenObservation

export interface JobGrowthBreakevenDataset {
  id: 'job-growth-breakeven-comparison'
  title: string
  description: string
  question: 'Is job growth keeping up with the labor force?'
  frequency: 'quarterly'
  units: 'Percentage points'
  transformation: string
  sourceName: string
  sourceUrl: string
  retrievedAt: string
  sources: readonly [
    {
      provider: 'Board of Governors of the Federal Reserve System'
      role: 'Estimated breakeven employment growth'
      sourceUrl: string
    },
    {
      provider: 'Federal Reserve Bank of St. Louis'
      providerSeriesId: 'PAYEMS'
      role: 'Total nonfarm payroll employment'
      sourceUrl: string
    },
  ]
  observations: JobGrowthBreakevenObservation[]
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function requireString(
  record: Record<string, unknown>,
  field: string,
): string {
  const value = record[field]
  if (typeof value !== 'string' || value.trim() === '') {
    throw new Error(`Job-growth breakeven data has invalid ${field}`)
  }
  return value
}

function requireFinite(
  record: Record<string, unknown>,
  field: string,
): number {
  const value = record[field]
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new Error(`Job-growth breakeven data has nonfinite ${field}`)
  }
  return value
}

function isIsoDate(value: unknown): value is string {
  if (typeof value !== 'string') return false
  const match = /^(\d{4})-(\d{2})-01$/.exec(value)
  if (!match) return false
  const month = Number(match[2])
  return month >= 1 && month <= 12
}

function validateDates(
  observations: readonly { date: string }[],
): void {
  let previous: string | null = null
  for (const observation of observations) {
    if (!isIsoDate(observation.date)) {
      throw new Error(`Job-growth breakeven data has invalid date: ${observation.date}`)
    }
    if (previous !== null && observation.date <= previous) {
      const kind = observation.date === previous ? 'duplicate' : 'out-of-order'
      throw new Error(`Job-growth breakeven data has ${kind} date: ${observation.date}`)
    }
    previous = observation.date
  }
}

function validateEstimateStatus(value: unknown): BreakevenEstimateStatus {
  if (value !== 'historical-estimate' && value !== 'projection') {
    throw new Error('Job-growth breakeven data has invalid estimateStatus')
  }
  return value
}

export function validateBreakevenEmploymentDataset(
  value: unknown,
): BreakevenEmploymentDataset {
  if (!isRecord(value) || !Array.isArray(value.observations) ||
      value.observations.length === 0) {
    throw new Error('Breakeven employment dataset must include observations')
  }
  const observations = value.observations.map((item) => {
    if (!isRecord(item)) {
      throw new Error('Breakeven employment observation must be an object')
    }
    return {
      date: requireString(item, 'date'),
      estimatedMonthlyJobGrowth: requireFinite(
        item,
        'estimatedMonthlyJobGrowth',
      ),
      estimateStatus: validateEstimateStatus(item.estimateStatus),
    }
  })
  validateDates(observations)
  if (value.id !== 'estimated-breakeven-employment-growth' ||
      value.provider !== 'Board of Governors of the Federal Reserve System' ||
      value.units !== 'Thousands of jobs per month' ||
      value.frequency !== 'quarterly') {
    throw new Error('Breakeven employment dataset has invalid identity metadata')
  }
  return {
    id: value.id,
    provider: value.provider,
    title: requireString(value, 'title'),
    description: requireString(value, 'description'),
    units: value.units,
    frequency: value.frequency,
    periodConvention: requireString(value, 'periodConvention'),
    methodology: requireString(value, 'methodology'),
    sourceName: requireString(value, 'sourceName'),
    sourceUrl: requireString(value, 'sourceUrl'),
    publicationDate: requireString(value, 'publicationDate'),
    retrievedAt: requireString(value, 'retrievedAt'),
    observations,
  }
}

export function validateJobGrowthBreakevenDataset(
  value: unknown,
): JobGrowthBreakevenDataset {
  if (!isRecord(value) || !Array.isArray(value.observations) ||
      value.observations.length === 0 || !Array.isArray(value.sources) ||
      value.sources.length !== 2) {
    throw new Error('Job-growth breakeven comparison has invalid structure')
  }
  const observations: JobGrowthBreakevenObservation[] =
    value.observations.map((item) => {
      if (!isRecord(item)) {
        throw new Error('Job-growth breakeven observation must be an object')
      }
      const shared = {
        date: requireString(item, 'date'),
        estimatedBreakevenMonthlyJobGrowth: requireFinite(
          item,
          'estimatedBreakevenMonthlyJobGrowth',
        ),
        estimateStatus: validateEstimateStatus(item.estimateStatus),
      }
      if (item.status === 'unavailable') {
        if (item.reason !== 'missing-payroll-period' &&
            item.reason !== 'incomplete-payroll-window') {
          throw new Error('Job-growth breakeven observation has invalid reason')
        }
        return { status: item.status, ...shared, reason: item.reason }
      }
      if (item.status !== 'available') {
        throw new Error('Job-growth breakeven observation has invalid status')
      }
      return {
        status: item.status,
        ...shared,
        actualAverageMonthlyJobGrowth: requireFinite(
          item,
          'actualAverageMonthlyJobGrowth',
        ),
        monthlyJobGrowthDifference: requireFinite(
          item,
          'monthlyJobGrowthDifference',
        ),
        startingPayrollEmployment: requireFinite(
          item,
          'startingPayrollEmployment',
        ),
        endingPayrollEmployment: requireFinite(
          item,
          'endingPayrollEmployment',
        ),
        actualAnnualizedPayrollGrowthRate: requireFinite(
          item,
          'actualAnnualizedPayrollGrowthRate',
        ),
        estimatedAnnualizedBreakevenGrowthRate: requireFinite(
          item,
          'estimatedAnnualizedBreakevenGrowthRate',
        ),
        gapPercentagePoints: requireFinite(item, 'gapPercentagePoints'),
      }
    })
  validateDates(observations)
  if (value.id !== 'job-growth-breakeven-comparison' ||
      value.question !== 'Is job growth keeping up with the labor force?' ||
      value.frequency !== 'quarterly' ||
      value.units !== 'Percentage points') {
    throw new Error('Job-growth breakeven comparison has invalid identity metadata')
  }
  const firstSource = value.sources[0]
  const secondSource = value.sources[1]
  if (!isRecord(firstSource) || !isRecord(secondSource) ||
      firstSource.provider !== 'Board of Governors of the Federal Reserve System' ||
      secondSource.provider !== 'Federal Reserve Bank of St. Louis' ||
      secondSource.providerSeriesId !== 'PAYEMS') {
    throw new Error('Job-growth breakeven comparison has invalid sources')
  }
  return {
    id: value.id,
    title: requireString(value, 'title'),
    description: requireString(value, 'description'),
    question: value.question,
    frequency: value.frequency,
    units: value.units,
    transformation: requireString(value, 'transformation'),
    sourceName: requireString(value, 'sourceName'),
    sourceUrl: requireString(value, 'sourceUrl'),
    retrievedAt: requireString(value, 'retrievedAt'),
    sources: [
      {
        provider: firstSource.provider,
        role: 'Estimated breakeven employment growth',
        sourceUrl: requireString(firstSource, 'sourceUrl'),
      },
      {
        provider: secondSource.provider,
        providerSeriesId: secondSource.providerSeriesId,
        role: 'Total nonfarm payroll employment',
        sourceUrl: requireString(secondSource, 'sourceUrl'),
      },
    ],
    observations,
  }
}
