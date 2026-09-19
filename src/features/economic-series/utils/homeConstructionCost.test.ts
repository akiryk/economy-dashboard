import { describe, expect, it } from 'vitest'
import {
  deriveHomeConstructionCostContext,
  deriveYearOverYearChanges,
} from './homeConstructionCost'

const observation = (date: string, value: number) => ({ date, value })

describe('home construction cost context', () => {
  it('derives month, year, and real changes from controlled observations', () => {
    const nominal = [
      observation('2030-01-01', 100),
      observation('2030-12-01', 108),
      observation('2031-01-01', 110),
    ]
    const real = [observation('2030-01-01', 100), observation('2031-01-01', 105)]

    const context = deriveHomeConstructionCostContext(nominal, real)
    expect(context).toMatchObject({
      latestDate: '2031-01-01',
      latestIndex: 110,
      monthChange: (110 / 108 - 1) * 100,
    })
    expect(context?.yearChange).toBeCloseTo(10)
    expect(context?.realYearChange).toBeCloseTo(5)
  })

  it('advances when a future month is appended without assuming its value', () => {
    const observations = Array.from({ length: 14 }, (_, index) => observation(
      `${2030 + Math.floor(index / 12)}-${String((index % 12) + 1).padStart(2, '0')}-01`,
      100 + index,
    ))
    const changes = deriveYearOverYearChanges(observations)

    expect(changes.at(-1)?.date).toBe('2031-02-01')
    expect(changes.at(-1)?.value).toBeCloseTo((113 / 101 - 1) * 100)
  })
})
