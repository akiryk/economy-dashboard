import { describe, expect, it } from 'vitest'
import rawData from '../data/saving-rate-by-income-decile.json'
import { validateSavingRateDistribution } from '../models/validateSavingRateDistribution'
import { buildLatestYearSummary, defaultSavingRateComparison, describeDistributionObservation, latestValidDistributionYear } from './savingRateDistribution'

const data = validateSavingRateDistribution(rawData)

describe('saving-rate distribution helpers', () => {
  it('selects the latest valid year and required defaults', () => {
    expect(latestValidDistributionYear(data)).toBe(2023)
    expect(defaultSavingRateComparison).toEqual(['0-10%', '50-60%', '80-90%'])
  })

  it('labels negative and provisional values accessibly', () => {
    expect(describeDistributionObservation('0-10%', 2023, -134.2, 'provisional'))
      .toContain('Estimated outlays exceeded disposable income. Provisional estimate.')
  })

  it('summarizes every latest-year decile and the valid coverage', () => {
    const summary = buildLatestYearSummary(data)
    expect(summary).toContain('2000 through 2023')
    expect(summary).toContain('Bottom 10%: -134.2%')
    expect(summary).toContain('Top 10%: 46.6%')
    expect(summary).toContain('Negative saving rates:')
  })
})
