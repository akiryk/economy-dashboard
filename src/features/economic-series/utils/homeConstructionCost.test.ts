import { describe, expect, it } from 'vitest'
import { deriveHomeConstructionCostContext } from './homeConstructionCost'

describe('home-construction cost context', () => {
  it('derives level and exact-period changes from controlled observations', () => {
    const context = deriveHomeConstructionCostContext([
      { date: '2011-01-01', value: 100 },
      { date: '2021-01-01', value: 130 },
      { date: '2030-01-01', value: 180 },
      { date: '2030-12-01', value: 190 },
      { date: '2031-01-01', value: 200 },
    ])

    expect(context).toEqual({
      latestDate: '2031-01-01',
      latestIndex: 200,
      cumulativeSinceBase: 100,
      monthChange: expect.closeTo(5.2632, 4),
      yearChange: expect.closeTo(11.1111, 4),
      tenYearChange: expect.closeTo(53.8462, 4),
      twentyYearChange: 100,
    })
  })

  it('keeps missing comparison periods explicit instead of filling gaps', () => {
    expect(deriveHomeConstructionCostContext([
      { date: '2030-11-01', value: 175 },
      { date: '2031-01-01', value: 180 },
    ])).toEqual({
      latestDate: '2031-01-01',
      latestIndex: 180,
      cumulativeSinceBase: 80,
      monthChange: null,
      yearChange: null,
      tenYearChange: null,
      twentyYearChange: null,
    })
  })
})
