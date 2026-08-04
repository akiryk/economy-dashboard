import { describe, expect, it } from 'vitest'
import {
  createRegionalHousingAccessibleSummary,
  deriveRegionalHousingStarts,
  housingRegions,
  latestSharedRegionalPeriod,
  validateHousingConstructionDetails,
} from './housingConstructionDetails'

const fixture = validateHousingConstructionDetails({
  retrievedAt: '2026-08-04',
  regions: [
    { date: '2025-01-01', northeast: 100, midwest: 200, south: 300, west: 400 },
    { date: '2026-01-01', northeast: 110, midwest: 210, south: 310, west: 410 },
  ],
  populations: [{ year: 2025, northeast: 50_000, midwest: 80_000, south: 120_000, west: 100_000 }],
  pipeline: Object.fromEntries(['permits', 'starts', 'underConstruction', 'completions'].map((stage) => [stage, [
    { date: '2025-01-01', total: 10, singleFamily: 5, twoToFour: 1, fiveOrMore: 4 },
  ]])) as unknown,
})

describe('housing construction details', () => {
  it('normalizes every region in canonical order and preserves absent annual population as null', () => {
    const regional = deriveRegionalHousingStarts(fixture)
    expect(Object.keys(regional)).toEqual(housingRegions)
    expect(regional.northeast).toEqual([
      { date: '2025-01-01', rawAnnualizedThousands: 100, value: 2 },
      { date: '2026-01-01', rawAnnualizedThousands: 110, value: null },
    ])
    expect(regional.west[0]?.value).toBe(4)
  })

  it('uses the latest period shared by all normalized regions and summarizes raw and normalized values', () => {
    const regional = deriveRegionalHousingStarts(fixture)
    expect(latestSharedRegionalPeriod(regional)).toBe('2025-01-01')
    expect(createRegionalHousingAccessibleSummary(regional)).toContain(
      'Northeast 2.00 starts per 1,000 residents (100 thousand units at an annualized rate)',
    )
  })

  it('rejects duplicate dates before replacing committed data', () => {
    expect(() => validateHousingConstructionDetails({
      ...fixture,
      regions: [fixture.regions[0], fixture.regions[0]],
    })).toThrow(/unique monthly dates/)
  })
})
