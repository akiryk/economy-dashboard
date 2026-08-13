import { describe, expect, it } from 'vitest'
import {
  deriveMortgageRateComparison,
  formatMortgageRateAnswer,
  formatPointDifference,
} from './mortgageRateContext'

describe('mortgage rate context', () => {
  it.each([
    [6.7, 6.2, 'higher', 'up from a year ago'],
    [6.1, 6.4, 'lower', 'down from a year ago'],
    [6.24, 6.2, 'little-changed', 'little changed from a year ago'],
  ] as const)('classifies %s against %s neutrally', (latest, prior, state, wording) => {
    const model = deriveMortgageRateComparison([
      { date: '2025-08-07', value: prior },
      { date: '2026-08-06', value: latest },
    ])
    expect(model?.direction).toBe(state)
    expect(model && formatMortgageRateAnswer(model)).toContain(wording)
  })

  it('uses the closest prior valid comparable week and preserves null gaps', () => {
    const model = deriveMortgageRateComparison([
      { date: '2021-08-05', value: 2.77 },
      { date: '2025-07-31', value: 6.72 },
      { date: '2025-08-07', value: null },
      { date: '2026-08-06', value: 6.69 },
    ])
    expect(model?.oneYearEarlier?.date).toBe('2025-07-31')
    expect(model?.fiveYearsEarlier?.date).toBe('2021-08-05')
    expect(model?.oneYearDifference).toBeCloseTo(-0.03)
    expect(formatPointDifference(model?.fiveYearDifference ?? null)).toBe(
      '3.92 percentage points higher',
    )
  })
})
