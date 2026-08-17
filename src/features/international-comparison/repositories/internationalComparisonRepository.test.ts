import { describe, expect, it } from 'vitest'
import { internationalComparisonRepository } from './internationalComparisonRepository'

describe('international comparison repository', () => {
  it('loads the validated committed OECD snapshot', () => {
    const data = internationalComparisonRepository.getAll()
    expect(data.metrics).toHaveLength(5)
    expect(internationalComparisonRepository.getMetric('prime-age-employment').observations.length)
      .toBeGreaterThanOrEqual(10)
  })
})
