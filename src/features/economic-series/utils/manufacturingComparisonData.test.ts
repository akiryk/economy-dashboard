import { describe, expect, it } from 'vitest'
import type { EconomicSeries } from '../models/economicSeries'
import { alignManufacturingObservations, filterManufacturingByTimeRange, normalizeManufacturingComparison } from './manufacturingComparisonData'

function series(slug: string, observations: EconomicSeries['observations']): EconomicSeries {
  return { id: slug, slug, provider: 'FRED', providerSeriesId: slug, title: slug, shortTitle: slug, description: slug, question: slug, units: 'Index', frequency: 'monthly', seasonalAdjustment: 'Seasonally adjusted', transformation: 'Level', sourceName: 'FRED', sourceUrl: 'https://example.com', retrievedAt: '2026-07-16', observations }
}

describe('manufacturing comparison alignment and normalization', () => {
  it('aligns exact months without mutating differently ordered inputs', () => {
    const output = series('IPMAN', [{ date: '2025-03-01', value: 110 }, { date: '2025-01-01', value: 100 }, { date: '2025-02-01', value: 105 }])
    const employment = series('MANEMP', [{ date: '2025-01-01', value: 1000 }, { date: '2025-03-01', value: 900 }, { date: '2025-04-01', value: 950 }])
    const original = structuredClone(output.observations)

    expect(alignManufacturingObservations(output, employment)).toEqual([
      { date: '2025-01-01', output: 100, employment: 1000 },
      { date: '2025-03-01', output: 110, employment: 900 },
    ])
    expect(output.observations).toEqual(original)
  })

  it('normalizes independently with full precision and preserves gaps', () => {
    const result = normalizeManufacturingComparison([
      { date: '2025-01-01', output: 3, employment: 10 },
      { date: '2025-02-01', output: null, employment: 9 },
      { date: '2025-03-01', output: 3.3, employment: null },
      { date: '2025-04-01', output: 2.7, employment: 9 },
    ])
    expect(result[0]).toMatchObject({ normalizedOutput: 100, normalizedEmployment: 100 })
    expect(result[1]).toMatchObject({ normalizedOutput: null, normalizedEmployment: 90 })
    expect(result[2]?.normalizedOutput).toBeCloseTo(110)
    expect(result[2]?.normalizedEmployment).toBeNull()
    expect(result[3]).toMatchObject({ normalizedOutput: 90, normalizedEmployment: 90 })
  })

  it('anchors ranges to the latest shared valid month and changes baselines', () => {
    const aligned = [
      { date: '2015-06-01', output: 80, employment: 80 },
      { date: '2020-06-01', output: 90, employment: 90 },
      { date: '2025-06-01', output: 100, employment: 100 },
      { date: '2026-06-01', output: 110, employment: null },
    ]
    const fiveYear = filterManufacturingByTimeRange(aligned, '5y')
    expect(fiveYear.map((item) => item.date)).toEqual(['2020-06-01', '2025-06-01'])
    expect(normalizeManufacturingComparison(fiveYear).at(-1)?.normalizedOutput).toBeCloseTo(111.111111)
    expect(filterManufacturingByTimeRange(aligned, 'max')[0]?.date).toBe('2015-06-01')
  })

  it.each([
    [{ date: '2025-01-01', output: null, employment: null }],
    [{ date: '2025-01-01', output: 0, employment: 100 }],
    [{ date: '2025-01-01', output: -1, employment: 100 }],
  ])('rejects a missing or nonpositive shared baseline', (observation) => {
    expect(() => normalizeManufacturingComparison([observation])).toThrow('valid positive shared baseline')
  })
})
