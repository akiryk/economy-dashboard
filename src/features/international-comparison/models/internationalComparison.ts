export const peerCountries = [
  { code: 'AUS', name: 'Australia' },
  { code: 'CAN', name: 'Canada' },
  { code: 'FRA', name: 'France' },
  { code: 'DEU', name: 'Germany' },
  { code: 'ITA', name: 'Italy' },
  { code: 'JPN', name: 'Japan' },
  { code: 'KOR', name: 'South Korea' },
  { code: 'ESP', name: 'Spain' },
  { code: 'GBR', name: 'United Kingdom' },
  { code: 'USA', name: 'United States' },
] as const

export type PeerCountryCode = (typeof peerCountries)[number]['code']

export const internationalMetricIds = [
  'prime-age-employment',
  'unemployment',
  'headline-inflation',
  'real-gdp-growth',
  'ten-year-government-yield',
] as const

export type InternationalMetricId = (typeof internationalMetricIds)[number]
export type InternationalFrequency = 'monthly' | 'quarterly'
export type MetricDirection = 'higher-favorable' | 'lower-favorable' | 'neutral'

export interface InternationalObservation {
  countryCode: PeerCountryCode
  period: string
  value: number
}

export interface InternationalMetric {
  id: InternationalMetricId
  title: string
  question: string
  unit: 'percent'
  frequency: InternationalFrequency
  direction: MetricDirection
  stalenessLimit: number
  source: {
    organization: 'OECD'
    dataflow: string
    version: string
    url: string
    methodology: string
  }
  observations: InternationalObservation[]
}

export interface InternationalComparisonData {
  schemaVersion: 1
  retrievedAt: string
  metrics: InternationalMetric[]
}

export type InternationalCountryReading =
  | { countryCode: PeerCountryCode; status: 'available'; observation: InternationalObservation }
  | { countryCode: PeerCountryCode; status: 'stale'; observation: InternationalObservation }
  | { countryCode: PeerCountryCode; status: 'unavailable' }

const countryCodes = new Set<string>(peerCountries.map(({ code }) => code))
const metricIds = new Set<string>(internationalMetricIds)

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function assertPeriod(period: string, frequency: InternationalFrequency): void {
  const pattern = frequency === 'monthly' ? /^\d{4}-(0[1-9]|1[0-2])$/ : /^\d{4}-Q[1-4]$/
  if (!pattern.test(period)) throw new Error(`Invalid ${frequency} period: ${period}`)
}

export function periodIndex(period: string, frequency: InternationalFrequency): number {
  const [yearText, subperiodText] = period.split('-')
  const year = Number(yearText)
  const subperiod = frequency === 'monthly'
    ? Number(subperiodText)
    : Number(subperiodText?.slice(1))
  const periodsPerYear = frequency === 'monthly' ? 12 : 4
  return year * periodsPerYear + subperiod
}

export function validateInternationalComparisonData(
  input: unknown,
): InternationalComparisonData {
  if (!isRecord(input) || input.schemaVersion !== 1 || !Array.isArray(input.metrics)) {
    throw new Error('International comparison data must use schema version 1')
  }
  if (typeof input.retrievedAt !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(input.retrievedAt)) {
    throw new Error('International comparison data has an invalid retrieval date')
  }
  if (input.metrics.length !== internationalMetricIds.length) {
    throw new Error('International comparison data must contain every configured metric')
  }

  const seenMetrics = new Set<string>()
  for (const value of input.metrics) {
    if (!isRecord(value) || typeof value.id !== 'string' || !metricIds.has(value.id)) {
      throw new Error('International comparison data contains an unknown metric')
    }
    if (seenMetrics.has(value.id)) throw new Error(`Duplicate metric: ${value.id}`)
    seenMetrics.add(value.id)
    if (value.unit !== 'percent' || (value.frequency !== 'monthly' && value.frequency !== 'quarterly')) {
      throw new Error(`Unexpected unit or frequency for ${value.id}`)
    }
    if (!Array.isArray(value.observations)) throw new Error(`Missing observations for ${value.id}`)

    const seenObservations = new Set<string>()
    const latestByCountry = new Map<string, number>()
    for (const observation of value.observations) {
      if (!isRecord(observation) || typeof observation.countryCode !== 'string' || !countryCodes.has(observation.countryCode)) {
        throw new Error(`${value.id} contains an unknown country`)
      }
      if (typeof observation.period !== 'string') throw new Error(`${value.id} has a malformed period`)
      assertPeriod(observation.period, value.frequency)
      if (typeof observation.value !== 'number' || !Number.isFinite(observation.value)) {
        throw new Error(`${value.id} has a non-finite observation`)
      }
      if (Math.abs(observation.value) > 1000) throw new Error(`${value.id} has an implausible percentage`)
      const key = `${observation.countryCode}:${observation.period}`
      if (seenObservations.has(key)) throw new Error(`Duplicate observation: ${value.id} ${key}`)
      seenObservations.add(key)
      const index = periodIndex(observation.period, value.frequency)
      latestByCountry.set(observation.countryCode, Math.max(index, latestByCountry.get(observation.countryCode) ?? -Infinity))
    }
    const newest = Math.max(...latestByCountry.values())
    const stalenessLimit = typeof value.stalenessLimit === 'number' ? value.stalenessLimit : -1
    const validCountries = [...latestByCountry.entries()].filter(([, period]) => newest - period <= stalenessLimit).map(([country]) => country)
    if (!validCountries.includes('USA')) throw new Error(`${value.id} is missing current United States data`)
    if (validCountries.length < 8) throw new Error(`${value.id} has only ${validCountries.length} current peer observations`)
  }

  return input as unknown as InternationalComparisonData
}

export function latestMetricObservations(metric: InternationalMetric): Map<PeerCountryCode, InternationalObservation> {
  const latest = new Map<PeerCountryCode, InternationalObservation>()
  for (const observation of metric.observations) {
    const prior = latest.get(observation.countryCode)
    if (!prior || observation.period > prior.period) latest.set(observation.countryCode, observation)
  }
  return latest
}

export function metricCountryReadings(metric: InternationalMetric): InternationalCountryReading[] {
  const latest = latestMetricObservations(metric)
  const newest = Math.max(...[...latest.values()].map(({ period }) => periodIndex(period, metric.frequency)))
  return peerCountries.map(({ code }) => {
    const observation = latest.get(code)
    if (!observation) return { countryCode: code, status: 'unavailable' }
    if (newest - periodIndex(observation.period, metric.frequency) > metric.stalenessLimit) {
      return { countryCode: code, status: 'stale', observation }
    }
    return { countryCode: code, status: 'available', observation }
  })
}
