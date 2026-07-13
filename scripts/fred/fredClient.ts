const FRED_OBSERVATIONS_ENDPOINT =
  'https://api.stlouisfed.org/fred/series/observations'

export interface FredObservation {
  date: string
  value: string
}

export interface FredObservationsResponse {
  observations: FredObservation[]
}

type FetchImplementation = typeof fetch

export interface FredRequestConfig {
  providerSeriesId: string
  fredFrequency: 'm' | 'q'
  historyPolicy: { type: 'full' } | { type: 'from'; date: string }
  fredUnits?: 'pc1'
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isIsoDate(value: unknown): value is string {
  if (typeof value !== 'string') return false

  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)
  if (!match) return false

  const date = new Date(
    Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])),
  )

  return date.toISOString().slice(0, 10) === value
}

function isFredValue(value: unknown): value is string {
  return (
    typeof value === 'string' &&
    (value === '.' || /^-?\d+(?:\.\d+)?$/.test(value))
  )
}

export function validateFredObservationsResponse(
  value: unknown,
): FredObservationsResponse {
  if (!isRecord(value)) {
    throw new Error('FRED response must be an object')
  }

  if ('error_code' in value || 'error_message' in value) {
    const message =
      typeof value.error_message === 'string'
        ? value.error_message
        : 'FRED returned an error response'
    throw new Error(message)
  }

  if (!Array.isArray(value.observations) || value.observations.length === 0) {
    throw new Error('FRED response does not contain observations')
  }

  const observations = value.observations.map((observation, index) => {
    if (!isRecord(observation)) {
      throw new Error(`FRED observation ${index} must be an object`)
    }
    if (!isIsoDate(observation.date)) {
      throw new Error(`FRED observation ${index} has an invalid date`)
    }
    if (!isFredValue(observation.value)) {
      throw new Error(`FRED observation ${index} has an invalid value`)
    }

    return { date: observation.date, value: observation.value }
  })

  return { observations }
}

export async function fetchFredObservations(
  apiKey: string,
  config: FredRequestConfig,
  fetchImplementation: FetchImplementation = fetch,
): Promise<FredObservationsResponse> {
  const url = new URL(FRED_OBSERVATIONS_ENDPOINT)
  const parameters: Record<string, string> = {
    series_id: config.providerSeriesId,
    api_key: apiKey,
    file_type: 'json',
    frequency: config.fredFrequency,
    sort_order: 'asc',
  }
  if (config.historyPolicy.type === 'from') {
    parameters.observation_start = config.historyPolicy.date
  }
  if (config.fredUnits) parameters.units = config.fredUnits
  url.search = new URLSearchParams(parameters).toString()

  const response = await fetchImplementation(url)
  let body: unknown

  try {
    body = await response.json()
  } catch {
    throw new Error(`FRED returned invalid JSON (HTTP ${response.status})`)
  }

  if (!response.ok) {
    if (isRecord(body) && typeof body.error_message === 'string') {
      throw new Error(`FRED request failed: ${body.error_message}`)
    }
    throw new Error(`FRED request failed with HTTP ${response.status}`)
  }

  return validateFredObservationsResponse(body)
}
