import { describe, expect, it } from 'vitest'
import { alignTargetRange, buildPolicyHistory, classifyPolicyMove, formatPolicyMove, policyChangePoints } from './policyRateData'

describe('policy rate data', () => {
  it('requires exact dates, preserves null ranges, and rejects inverted bounds', () => {
    expect(alignTargetRange(
      [{ date: '2026-01-01', value: 3.5 }, { date: '2026-01-02', value: null }],
      [{ date: '2026-01-01', value: 3.75 }, { date: '2026-01-02', value: 3.75 }, { date: '2026-01-03', value: 4 }],
    )).toEqual([
      { date: '2026-01-01', lower: 3.5, upper: 3.75, midpoint: 3.625, regime: 'target-range' },
      { date: '2026-01-02', lower: null, upper: 3.75, midpoint: null, regime: 'target-range' },
    ])
    expect(() => alignTargetRange([{ date: '2026-01-01', value: 4 }], [{ date: '2026-01-01', value: 3.75 }])).toThrow('lower bound exceeds upper bound')
  })

  it.each([
    [4, 4.25, 3.75, 4, 'raised'], [3.5, 3.75, 3.75, 4, 'lowered'],
    [3.5, 3.75, 3.5, 3.75, 'unchanged'], [3.5, 4, 3.5, 3.75, 'asymmetric'],
  ] as const)('classifies policy moves without hard-coded current values', (lower, upper, priorLower, priorUpper, direction) => {
    expect(classifyPolicyMove({ lower, upper }, { lower: priorLower, upper: priorUpper })?.direction).toBe(direction)
  })

  it('keeps the single-target regime explicit and accepts a future appended change', () => {
    const base = alignTargetRange(
      [{ date: '2026-01-01', value: 3.5 }, { date: '2026-01-02', value: 3.5 }],
      [{ date: '2026-01-01', value: 3.75 }, { date: '2026-01-02', value: 3.75 }],
    )
    const appended = [...base, { date: '2026-02-01', lower: 3.25, upper: 3.5, midpoint: 3.375, regime: 'target-range' as const }]
    expect(buildPolicyHistory([{ date: '2008-12-15', value: 1 }], appended)[0]).toMatchObject({ lower: 1, upper: 1, regime: 'single-target' })
    expect(policyChangePoints(appended)).toHaveLength(policyChangePoints(base).length + 1)
    expect(formatPolicyMove(classifyPolicyMove(appended.at(-1)!, base.at(-1)!))).toContain('lowered')
  })
})
