import { describe, expect, it } from 'vitest'
import {
  alignCpiPceObservations,
  classifyCpiAssessment,
  formatCpiAssessment,
  formatCpiPolicyReference,
  formatHeadlineCoreComparison,
  formatPceTargetComparison,
} from './cpiData'

describe('CPI compact interpretation', () => {
  it.each([
    [-0.1, 'prices-falling'],
    [0, 'very-low'],
    [0.99, 'very-low'],
    [1, 'near-two-percent'],
    [2.5, 'near-two-percent'],
    [2.5001, 'somewhat-high'],
    [4, 'somewhat-high'],
    [4.0001, 'high'],
    [null, 'unavailable'],
  ] as const)('classifies %s deterministically', (value, expected) => {
    expect(classifyCpiAssessment(value)).toBe(expected)
  })

  it('keeps assessment state separate from wording', () => {
    expect(formatCpiAssessment('prices-falling')).toBe('Consumer prices are falling.')
    expect(formatCpiAssessment('very-low')).toBe('Consumer prices are rising very slowly.')
    expect(formatCpiAssessment('near-two-percent')).toContain('2% policy reference')
    expect(formatCpiAssessment('somewhat-high')).toBe(
      'Consumer prices are rising somewhat quickly.',
    )
    expect(formatCpiAssessment('high')).toBe('Consumer prices are rising quickly.')
    expect(formatCpiAssessment('unavailable')).not.toMatch(/rising|falling/)
  })

  it.each([
    [3.5, 'CPI inflation is 1.5 percentage points above the 2% policy reference.'],
    [3, 'CPI inflation is 1 percentage point above the 2% policy reference.'],
    [2, 'CPI inflation is at the 2% policy reference.'],
    [1.6, 'CPI inflation is 0.4 percentage points below the 2% policy reference.'],
    [null, null],
  ] as const)('formats CPI policy-reference comparison for %s', (value, expected) => {
    const result = formatCpiPolicyReference(value)
    expect(result).toBe(expected)
    if (result) expect(result).not.toMatch(/Fed.*CPI target|% percentage point/i)
  })

  it('uses target language only for PCE', () => {
    expect(formatPceTargetComparison(4.1)).toBe(
      'PCE inflation is 2.1 percentage points above the Federal Reserve’s 2% target.',
    )
    expect(formatPceTargetComparison(2.04)).toBe(
      'PCE inflation is at the Federal Reserve’s 2% target.',
    )
    expect(formatPceTargetComparison(1)).toContain('1 percentage point below')
  })

  it.each([
    [3.5, 2.6, 'adding'],
    [2.4, 2.6, 'reducing'],
    [2.64, 2.6, 'currently close'],
  ])('describes a headline value of %s versus core at %s', (
    headline,
    core,
    expected,
  ) => {
    expect(formatHeadlineCoreComparison(headline, core)).toContain(expected)
  })

  it('treats unavailable headline or core values as unavailable', () => {
    expect(formatHeadlineCoreComparison(null, 2.6)).toBeNull()
    expect(formatHeadlineCoreComparison(3.5, null)).toBeNull()
  })
})

describe('CPI and PCE alignment', () => {
  it('preserves actual dates, gaps, ordering, and inputs without carry-forward', () => {
    const cpi = [
      { date: '2026-03-01', value: 3.1 },
      { date: '2026-01-01', value: 3.3 },
      { date: '2026-02-01', value: null },
    ]
    const pce = [
      { date: '2026-01-01', value: 2.7 },
      { date: '2026-02-01', value: 2.6 },
      { date: '2025-12-01', value: 2.8 },
    ]
    const originalCpi = structuredClone(cpi)
    const originalPce = structuredClone(pce)
    expect(alignCpiPceObservations(cpi, pce)).toEqual([
      { date: '2025-12-01', cpi: null, pce: 2.8 },
      { date: '2026-01-01', cpi: 3.3, pce: 2.7 },
      { date: '2026-02-01', cpi: null, pce: 2.6 },
      { date: '2026-03-01', cpi: 3.1, pce: null },
    ])
    expect(cpi).toEqual(originalCpi)
    expect(pce).toEqual(originalPce)
  })
})
