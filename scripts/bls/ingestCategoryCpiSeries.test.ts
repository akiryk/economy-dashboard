import { describe, expect, it } from 'vitest'
import {
  buildCategoryCpiSeries,
  deriveCategoryCpiObservations,
} from './ingestCategoryCpiSeries'

describe('deriveCategoryCpiObservations', () => {
  it('calculates chronological year-over-year rates without mutating input', () => {
    const data = [
      { year: '2021', period: 'M01', value: '90' },
      { year: '2020', period: 'M01', value: '100' },
    ]
    expect(deriveCategoryCpiObservations(data, '2021-01-01', '2021-01-01'))
      .toEqual([{ date: '2021-01-01', value: -9.999999999999998 }])
    expect(data[0]?.year).toBe('2021')
  })

  it('preserves a missing prior-year observation as null', () => {
    expect(deriveCategoryCpiObservations(
      [{ year: '2021', period: 'M01', value: '100' }],
      '2021-01-01',
      '2021-01-01',
    )).toEqual([{ date: '2021-01-01', value: null }])
  })
})

describe('buildCategoryCpiSeries', () => {
  it('rejects a response missing an explicitly required series ID', () => {
    expect(() => buildCategoryCpiSeries({
      status: 'REQUEST_SUCCEEDED',
      Results: { series: [] },
    }, '2026-07-24')).toThrow('Missing BLS series CUUR0000SAH1')
  })
})
