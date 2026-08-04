import { describe, expect, it } from 'vitest'
import {
  classifyHomeOwnershipAffordability,
  formatHomeOwnershipAffordabilityAnswer,
  formatHomeOwnershipHistoricalPosition,
  formatHomeOwnershipPointDifference,
  formatHomeOwnershipThresholdContext,
} from './homeOwnershipAffordability'
import type { HistoricalBandModel } from './historicalBandContext'

describe('home-ownership affordability context', () => {
  it.each([
    [29.9, 'affordable'],
    [30, 'affordable'],
    [30.1, 'not-affordable'],
    [null, 'unavailable'],
  ] as const)('classifies %s at the Atlanta Fed threshold as %s', (value, state) => {
    expect(classifyHomeOwnershipAffordability(value)).toBe(state)
  })

  it('keeps threshold answers distinct from historical context', () => {
    expect(formatHomeOwnershipAffordabilityAnswer(42)).toContain('not affordable')
    expect(formatHomeOwnershipThresholdContext(42)).toContain('well above the 30%')
    expect(formatHomeOwnershipThresholdContext(30)).toContain('near the 30%')
    expect(formatHomeOwnershipThresholdContext(25)).toContain('comfortably below')
  })

  it('formats exact above, below, and at-threshold tooltip differences', () => {
    expect(formatHomeOwnershipPointDifference(42)).toBe('12.0 percentage points above threshold')
    expect(formatHomeOwnershipPointDifference(28)).toBe('2.0 percentage points below threshold')
    expect(formatHomeOwnershipPointDifference(30)).toBe('0.0 percentage points at threshold')
  })

  it.each([
    [5, 'very low'], [15, 'low'], [50, 'typical'], [85, 'high'], [95, 'very high'],
  ] as const)('uses lower-is-better burden orientation at %s', (value, phrase) => {
    const model = {
      latestObservation: { date: '2026-03-01', value },
      outerLower: 10, innerLower: 25, innerUpper: 75, outerUpper: 90,
    } as HistoricalBandModel
    expect(formatHomeOwnershipHistoricalPosition(model)).toContain(phrase)
  })
})
