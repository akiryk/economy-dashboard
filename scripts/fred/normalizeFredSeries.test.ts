import { describe, expect, it } from 'vitest'
import { validateEconomicSeries } from '../../src/features/economic-series/models/validateEconomicSeries'
import {
  validateFredObservationsResponse,
  type FredObservationsResponse,
} from './fredClient'
import { normalizeFredSeries } from './normalizeFredSeries'
import { fredSeriesConfigurations } from './seriesConfigurations'

const gdpConfig = fredSeriesConfigurations[0]!
const cpiConfig = fredSeriesConfigurations[1]!
const unemploymentConfig = fredSeriesConfigurations[2]!
const primeAgeEmploymentConfig = fredSeriesConfigurations[3]!

function createQuarterlyResponse(count = 81): FredObservationsResponse {
  return {
    observations: Array.from({ length: count }, (_, index) => {
      const year = 2000 + Math.floor(index / 4)
      const month = (index % 4) * 3 + 1
      return {
        date: `${year}-${String(month).padStart(2, '0')}-01`,
        value: String(1 + index / 100),
      }
    }),
  }
}

describe('validateFredObservationsResponse', () => {
  it('rejects invalid dates and numeric values', () => {
    expect(() =>
      validateFredObservationsResponse({
        observations: [{ date: '2024-02-30', value: '2.5' }],
      }),
    ).toThrow('invalid date')
    expect(() =>
      validateFredObservationsResponse({
        observations: [{ date: '2024-01-01', value: 'not-a-number' }],
      }),
    ).toThrow('invalid value')
  })

  it('rejects provider error responses without trusting their shape', () => {
    expect(() =>
      validateFredObservationsResponse({
        error_code: 400,
        error_message: 'Bad request',
      }),
    ).toThrow('Bad request')
  })
})

describe('normalizeFredSeries', () => {
  it('normalizes, sorts, and produces domain-valid GDPC1 metadata', () => {
    const response = createQuarterlyResponse()
    response.observations.reverse()

    const series = normalizeFredSeries(response, '2025-01-01', gdpConfig)

    expect(series.providerSeriesId).toBe('GDPC1')
    expect(series.observations[0]?.date).toBe('2000-01-01')
    expect(series.observations.at(-1)?.date).toBe('2020-01-01')
    expect(validateEconomicSeries(series)).toEqual(series)
  })

  it('preserves the missing marker as null rather than zero', () => {
    const response = createQuarterlyResponse()
    response.observations[10] = {
      date: response.observations[10]!.date,
      value: '.',
    }

    const series = normalizeFredSeries(response, '2025-01-01', gdpConfig)

    expect(series.observations[10]?.value).toBeNull()
  })

  it('does not mutate provider observations', () => {
    const response = createQuarterlyResponse()
    const original = structuredClone(response)

    normalizeFredSeries(response, '2025-01-01', gdpConfig)

    expect(response).toEqual(original)
  })

  it('normalizes CPI metadata and excludes future observations', () => {
    const response: FredObservationsResponse = {
      observations: Array.from({ length: 241 }, (_, index) => {
        const date = new Date(Date.UTC(2000, index, 1))
        return {
          date: date.toISOString().slice(0, 10),
          value: String(2 + index / 100),
        }
      }),
    }
    response.observations.push({ date: '2026-01-01', value: '3.5' })
    const original = structuredClone(response)

    const series = normalizeFredSeries(response, '2020-01-01', cpiConfig)

    expect(cpiConfig.providerSeriesId).toBe('CPIAUCSL')
    expect(cpiConfig.fredFrequency).toBe('m')
    expect(cpiConfig.fredUnits).toBe('pc1')
    expect(series.providerSeriesId).toBe('CPIAUCSL')
    expect(series.frequency).toBe('monthly')
    expect(series.observations.at(-1)?.date).toBe('2020-01-01')
    expect(validateEconomicSeries(series)).toEqual(series)
    expect(response).toEqual(original)
  })

  it.each([
    [unemploymentConfig, 'UNRATE'],
    [primeAgeEmploymentConfig, 'LNS12300060'],
  ])('normalizes level metadata for %s', (config, providerSeriesId) => {
    const response: FredObservationsResponse = {
      observations: Array.from({ length: 241 }, (_, index) => ({
        date: new Date(Date.UTC(2000, index, 1)).toISOString().slice(0, 10),
        value: String(4 + index / 100),
      })),
    }

    const series = normalizeFredSeries(response, '2020-01-01', config)

    expect(config.fredFrequency).toBe('m')
    expect(config.fredUnits).toBeUndefined()
    expect(series.providerSeriesId).toBe(providerSeriesId)
    expect(series.frequency).toBe('monthly')
    expect(series.units).toBe('Percent')
    expect(series.transformation).toBe('Level')
    expect(validateEconomicSeries(series)).toEqual(series)
  })
})
