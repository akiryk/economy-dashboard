import { describe, expect, it } from 'vitest'
import { validateEconomicSeries } from '../../src/features/economic-series/models/validateEconomicSeries'
import {
  validateFredObservationsResponse,
  type FredObservationsResponse,
} from './fredClient'
import { normalizeFredSeries } from './normalizeFredSeries'

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

    const series = normalizeFredSeries(response, '2025-01-01')

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

    const series = normalizeFredSeries(response, '2025-01-01')

    expect(series.observations[10]?.value).toBeNull()
  })

  it('does not mutate provider observations', () => {
    const response = createQuarterlyResponse()
    const original = structuredClone(response)

    normalizeFredSeries(response, '2025-01-01')

    expect(response).toEqual(original)
  })
})
