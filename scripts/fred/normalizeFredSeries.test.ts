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
const unemploymentConfig = fredSeriesConfigurations.find(({ providerSeriesId }) => providerSeriesId === 'UNRATE')!
const primeAgeEmploymentConfig = fredSeriesConfigurations.find(({ providerSeriesId }) => providerSeriesId === 'LNS12300060')!
const lmciActivityConfig = fredSeriesConfigurations.find(({ providerSeriesId }) => providerSeriesId === 'FRBKCLMCILA')!
const lmciMomentumConfig = fredSeriesConfigurations.find(({ providerSeriesId }) => providerSeriesId === 'FRBKCLMCIM')!

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
  it('removes only leading unavailable transformed observations', () => {
    const response = createQuarterlyResponse()
    response.observations[0] = { date: '1947-01-01', value: '.' }
    response.observations[1] = { date: '1947-04-01', value: '.' }
    response.observations[2] = { date: '1947-07-01', value: '1.5' }
    response.observations[3] = { date: '1947-10-01', value: '.' }

    const series = normalizeFredSeries(response, '2025-01-01', {
      ...gdpConfig,
      minimumUsableObservations: 1,
    })

    expect(series.observations[0]).toEqual({
      date: '1947-07-01',
      value: 1.5,
    })
    expect(series.observations[1]).toEqual({
      date: '1947-10-01',
      value: null,
    })
  })

  it('removes leading unavailable monthly values', () => {
    const response: FredObservationsResponse = {
      observations: Array.from({ length: 14 }, (_, index) => ({
        date: new Date(Date.UTC(1947, index, 1)).toISOString().slice(0, 10),
        value: index < 12 ? '.' : String(index),
      })),
    }

    const series = normalizeFredSeries(response, '1950-01-01', {
      ...cpiConfig,
      minimumUsableObservations: 1,
    })

    expect(series.observations).toEqual([
      { date: '1948-01-01', value: 12 },
      { date: '1948-02-01', value: 13 },
    ])
  })

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

  it.each([lmciActivityConfig, lmciMomentumConfig])('normalizes LMCI history and preserves internal missing values for $providerSeriesId', (config) => {
    const response: FredObservationsResponse = {
      observations: Array.from({ length: 301 }, (_, index) => ({
        date: new Date(Date.UTC(1992, index, 1)).toISOString().slice(0, 10),
        value: index === 150 ? '.' : String(index / 100 - 1),
      })),
    }
    const series = normalizeFredSeries(response, '2020-01-01', { ...config, minimumUsableObservations: 300 })
    expect(series.observations[150]?.value).toBeNull()
    expect(series).toMatchObject({ providerSeriesId: config.providerSeriesId, frequency: 'monthly', units: 'Index' })
    expect(validateEconomicSeries(series)).toEqual(series)
  })

  it('configures CPI for local year-over-year derivation from full-history levels', () => {
    expect(cpiConfig.providerSeriesId).toBe('CPIAUCSL')
    expect(cpiConfig.fredFrequency).toBe('m')
    expect(cpiConfig.fredUnits).toBeUndefined()
    expect(cpiConfig.dataHandling).toBe('locally-derived')
    expect(cpiConfig.localDerivation).toBe('year-over-year-monthly-growth')
    expect(cpiConfig.historyPolicy).toEqual({ type: 'full' })
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
