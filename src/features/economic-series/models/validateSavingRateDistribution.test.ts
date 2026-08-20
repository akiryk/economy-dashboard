import { describe, expect, it } from 'vitest'
import rawData from '../data/saving-rate-by-income-decile.json'
import { savingRateDeciles, type SavingRateDistributionDataset } from './savingRateDistribution'
import { validateSavingRateDistribution } from './validateSavingRateDistribution'

describe('validateSavingRateDistribution', () => {
  it('accepts the committed chronological ten-decile dataset', () => {
    const data = validateSavingRateDistribution(rawData)
    const years = new Set(data.observations.map(({ year }) => year))
    expect(data.observations).toHaveLength(years.size * savingRateDeciles.length)
    expect(data.observations.slice(0, 10).map(({ decile }) => decile))
      .toEqual(savingRateDeciles.map(({ id }) => id))
    expect(data.observations.at(-1)).toMatchObject({
      year: Math.max(...years),
      decile: savingRateDeciles.at(-1)?.id,
      rate: expect.any(Number),
    })
  })

  it('rejects duplicate year-and-decile observations', () => {
    const duplicate = structuredClone(rawData)
    duplicate.observations.push(duplicate.observations[0]!)
    expect(() => validateSavingRateDistribution(duplicate)).toThrow(/Duplicate|ordered/)
  })

  it('preserves zero, negative, null, and estimate status values', () => {
    const changed = structuredClone(rawData) as unknown as SavingRateDistributionDataset
    changed.observations[0]!.rate = null
    changed.observations[1]!.rate = 0
    changed.observations[2]!.rate = -1
    changed.observations[2]!.status = 'provisional'
    const result = validateSavingRateDistribution(changed)
    expect(result.observations.slice(0, 3).map(({ rate, status }) => [rate, status])).toEqual([
      [null, 'final'], [0, 'final'], [-1, 'provisional'],
    ])
  })
})
