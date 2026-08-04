import { describe, expect, it } from 'vitest'
import { calculateCompositionShares, priceBuckets, validatePriceDistributions } from './housingSupplyComposition'

describe('housing supply composition', () => {
  it('calculates housing-unit shares without treating categories as structures', () => {
    expect(calculateCompositionShares({ singleFamily: 60, twoToFour: 10, fiveOrMore: 30 }))
      .toEqual({ singleFamily: 60, twoToFour: 10, fiveOrMore: 30 })
    expect(calculateCompositionShares({ singleFamily: 60, twoToFour: null, fiveOrMore: 30 }))
      .toBeNull()
  })

  it('keeps price buckets in ascending nominal-dollar order', () => {
    expect(priceBuckets.map(([key]) => key)).toEqual([
      'under300', 'from300To399', 'from400To499', 'from500To599',
      'from600To799', 'from800To999', 'millionOrMore',
    ])
  })

  it('accepts only the comparable 2020-current period and rejects incompatible breaks', () => {
    expect(validatePriceDistributions([{ year: 2025, under300: 18, from300To399: 28,
      from400To499: 18, from500To599: 12, from600To799: 13,
      from800To999: 4, millionOrMore: 6 }])).toHaveLength(1)
    expect(() => validatePriceDistributions([{ year: 2019, under300: 18 }]))
      .toThrow(/2020-current buckets/)
  })
})
