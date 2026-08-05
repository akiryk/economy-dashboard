import { describe, expect, it } from 'vitest'
import { classifyYieldCurve, deriveYieldCurveObservations, formatYieldCurveAnswer, formatYieldCurveInterpretation } from './yieldCurveData'

describe('yield curve data', () => {
  it('aligns exact months, calculates spreads, and requires three consecutive values', () => {
    const long = ['2025-01-01','2025-02-01','2025-03-01','2025-04-01'].map((date) => ({ date, value: 4 }))
    const short = [{date:'2025-01-01',value:5},{date:'2025-02-01',value:5},{date:'2025-03-01',value:5},{date:'2025-04-01',value:null}]
    expect(deriveYieldCurveObservations(long, short).map(({ value }) => value)).toEqual([null, null, -1, null])
  })
  it('uses inclusive neutral boundaries', () => {
    expect(classifyYieldCurve(-0.1)).toBe('nearly-flat')
    expect(classifyYieldCurve(0.1)).toBe('nearly-flat')
    expect(classifyYieldCurve(-0.101)).toBe('inverted')
    expect(classifyYieldCurve(0.101)).toBe('upward-sloping')
  })
  it('formats all answers and cautious interpretations', () => {
    expect(formatYieldCurveAnswer(-0.6)).toMatch(/^Yes/)
    expect(formatYieldCurveAnswer(0)).toMatch(/^Nearly flat/)
    expect(formatYieldCurveAnswer(0.8)).toMatch(/^No/)
    expect(formatYieldCurveInterpretation(-1)).toContain('do not guarantee')
    expect(formatYieldCurveInterpretation(0)).toContain('not by itself a recession forecast')
    expect(formatYieldCurveInterpretation(1)).toContain('does not rule out recession')
    expect(formatYieldCurveInterpretation(1)).toContain('rates is typical')
    expect(formatYieldCurveInterpretation(1)).not.toContain('more typical configuration')
  })
})
