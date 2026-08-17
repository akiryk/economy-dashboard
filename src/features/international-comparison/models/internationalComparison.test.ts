import { describe, expect, it } from 'vitest'
import { latestMetricObservations, metricCountryReadings, peerCountries, type InternationalMetric } from './internationalComparison'

describe('international comparison model', () => {
  it('uses the fixed ten-country peer set and finds latest observations by period', () => {
    expect(peerCountries.map(({ code }) => code)).toEqual([
      'AUS', 'CAN', 'FRA', 'DEU', 'ITA', 'JPN', 'KOR', 'ESP', 'GBR', 'USA',
    ])
    const metric = {
      observations: [
        { countryCode: 'USA', period: '2026-Q1', value: 80 },
        { countryCode: 'USA', period: '2026-Q2', value: 81 },
      ],
    } as InternationalMetric
    expect(latestMetricObservations(metric).get('USA')).toEqual({
      countryCode: 'USA', period: '2026-Q2', value: 81,
    })
  })

  it('distinguishes unavailable and stale peers without converting them to zero', () => {
    const metric = {
      frequency: 'monthly',
      stalenessLimit: 3,
      observations: [
        { countryCode: 'USA', period: '2026-07', value: 3.4 },
        { countryCode: 'CAN', period: '2026-06', value: 2.8 },
        { countryCode: 'FRA', period: '2025-12', value: 0.8 },
      ],
    } as InternationalMetric
    expect(metricCountryReadings(metric).find(({ countryCode }) => countryCode === 'CAN'))
      .toMatchObject({ status: 'available', observation: { value: 2.8 } })
    expect(metricCountryReadings(metric).find(({ countryCode }) => countryCode === 'FRA'))
      .toMatchObject({ status: 'stale', observation: { value: 0.8 } })
    expect(metricCountryReadings(metric).find(({ countryCode }) => countryCode === 'ESP'))
      .toEqual({ countryCode: 'ESP', status: 'unavailable' })
  })
})
