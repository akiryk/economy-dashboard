import {
  economicFrequencies,
  type EconomicFrequency,
  type EconomicObservation,
  type EconomicSeries,
  type EconomicSeriesSource,
} from './economicSeries'

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function validateSource(value: unknown, index: number): EconomicSeriesSource {
  if (!isRecord(value)) {
    throw new Error(`Economic series source ${index} must be an object`)
  }
  const role = value.role
  if (role !== undefined && !isNonEmptyString(role)) {
    throw new Error(`Economic series source ${index} has an invalid role`)
  }
  return {
    provider: getRequiredString(value, 'provider'),
    providerSeriesId: getRequiredString(value, 'providerSeriesId'),
    sourceName: getRequiredString(value, 'sourceName'),
    sourceUrl: getRequiredString(value, 'sourceUrl'),
    ...(role === undefined ? {} : { role }),
  }
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0
}

function getRequiredString(
  record: Record<string, unknown>,
  field: string,
): string {
  const value = record[field]
  if (!isNonEmptyString(value)) {
    throw new Error(`Economic series is missing required field: ${field}`)
  }

  return value
}

function isIsoDate(value: unknown): value is string {
  if (typeof value !== 'string') return false

  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)
  if (!match) return false

  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])
  const date = new Date(Date.UTC(year, month - 1, day))

  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  )
}

function isFrequency(value: unknown): value is EconomicFrequency {
  return economicFrequencies.some((frequency) => frequency === value)
}

function validateObservation(
  value: unknown,
  index: number,
): EconomicObservation {
  if (!isRecord(value)) {
    throw new Error(`Observation ${index} must be an object`)
  }

  if (!isIsoDate(value.date)) {
    throw new Error(`Observation ${index} has an invalid date`)
  }

  if (value.value !== null && typeof value.value !== 'number') {
    throw new Error(`Observation ${index} must have a number or null value`)
  }

  if (typeof value.value === 'number' && !Number.isFinite(value.value)) {
    throw new Error(`Observation ${index} must have a finite value`)
  }

  return { date: value.date, value: value.value }
}

export function validateEconomicSeries(value: unknown): EconomicSeries {
  if (!isRecord(value)) {
    throw new Error('Economic series must be an object')
  }

  if (!isFrequency(value.frequency)) {
    throw new Error('Economic series has an invalid frequency')
  }

  if (
    value.seasonalAdjustment !== null &&
    !isNonEmptyString(value.seasonalAdjustment)
  ) {
    throw new Error('Economic series has an invalid seasonal adjustment')
  }

  if (!isIsoDate(value.retrievedAt)) {
    throw new Error('Economic series has an invalid retrieval date')
  }

  const retrievedAt = value.retrievedAt

  if (!Array.isArray(value.observations) || value.observations.length === 0) {
    throw new Error('Economic series must include observations')
  }

  const sources = value.sources
  if (sources !== undefined && (!Array.isArray(sources) || sources.length === 0)) {
    throw new Error('Economic series sources must be a non-empty array')
  }

  return {
    id: getRequiredString(value, 'id'),
    slug: getRequiredString(value, 'slug'),
    provider: getRequiredString(value, 'provider'),
    providerSeriesId: getRequiredString(value, 'providerSeriesId'),
    title: getRequiredString(value, 'title'),
    shortTitle: getRequiredString(value, 'shortTitle'),
    description: getRequiredString(value, 'description'),
    question: getRequiredString(value, 'question'),
    units: getRequiredString(value, 'units'),
    frequency: value.frequency,
    seasonalAdjustment: value.seasonalAdjustment,
    transformation: getRequiredString(value, 'transformation'),
    sourceName: getRequiredString(value, 'sourceName'),
    sourceUrl: getRequiredString(value, 'sourceUrl'),
    retrievedAt,
    observations: value.observations.map(validateObservation),
    ...(sources === undefined
      ? {}
      : { sources: sources.map(validateSource) }),
  }
}
