import { describe, expect, it } from 'vitest'
import {
  calculateProductivityMomentum,
  classifyProductivityAnswer,
  cumulativeProductivityChange,
  formatProductivityAccessibleAnswer,
  formatProductivityAccessibleSummary,
  formatProductivityAnswer,
  formatProductivityMomentum,
  normalizeProductivityRange,
} from './productivityData'

describe('productivity presentation data', () => {
  it.each([
    [2.8, 'yes'],
    [0.5, 'yes'],
    [0.499999, 'about-the-same'],
    [0.1, 'about-the-same'],
    [0, 'about-the-same'],
    [-0.499999, 'about-the-same'],
    [-0.5, 'no'],
    [-1.2, 'no'],
    [null, 'unavailable'],
  ] as const)('classifies %s without display rounding', (value, expected) => {
    expect(classifyProductivityAnswer(value)).toBe(expected)
  })

  it('keeps answer state separate from visible and accessible wording', () => {
    expect(formatProductivityAnswer('yes')).toBe(
      'Yes, productivity is higher than a year ago.',
    )
    expect(formatProductivityAnswer('about-the-same')).toBe(
      'Not really—productivity is about the same as a year ago.',
    )
    expect(formatProductivityAnswer('no')).toBe(
      'No, productivity is lower than a year ago.',
    )
    expect(formatProductivityAnswer('unavailable')).not.toMatch(/Yes|No|Not really/)
    expect(formatProductivityAccessibleAnswer('yes')).toBe(
      'Yes, the economy is producing more per hour worked.',
    )
    expect(formatProductivityAccessibleSummary({
      value: 2.8,
      formattedValue: '2.8%',
      period: '2026 Q1',
      state: 'yes',
      momentum: 'Momentum sentence.',
    })).toBe(
      'Productivity was 2.8% higher than a year ago in 2026 Q1. Yes, the economy is producing more per hour worked. Momentum sentence.',
    )
    expect(formatProductivityAccessibleSummary({
      value: 0,
      formattedValue: '0.0%',
      period: '2026 Q1',
      state: 'about-the-same',
      momentum: null,
    })).toContain('Productivity was unchanged from a year ago in 2026 Q1.')
    expect(formatProductivityAccessibleSummary({
      value: null,
      formattedValue: 'Not available',
      period: 'Observation period unavailable',
      state: 'unavailable',
      momentum: null,
    })).not.toMatch(/\bYes\b|\bNo\b|Not really/)
  })

  it.each([
    [0.8, 'The pace of productivity growth has accelerated by 0.8 percentage point from a year earlier.'],
    [1, 'The pace of productivity growth has accelerated by 1 percentage point from a year earlier.'],
    [1.4, 'The pace of productivity growth has accelerated by 1.4 percentage points from a year earlier.'],
    [-0.6, 'The pace of productivity growth has slowed by 0.6 percentage point from a year earlier.'],
    [0.04, 'The pace of productivity growth is about the same as a year earlier.'],
    [null, null],
  ] as const)('formats momentum %s with percentage-point grammar', (change, expected) => {
    const result = formatProductivityMomentum(change)
    expect(result).toBe(expected)
    if (result) expect(result).not.toMatch(/% percentage point/)
  })

  it('normalizes from the first valid selected-range value and preserves gaps', () => {
    const input = [
      { date: '2020-01-01', value: null },
      { date: '2020-04-01', value: 50 },
      { date: '2020-07-01', value: null },
      { date: '2020-10-01', value: 60 },
    ]
    const original = structuredClone(input)
    expect(normalizeProductivityRange(input)).toEqual([
      { date: '2020-01-01', value: null, changeFromBaseline: null },
      { date: '2020-04-01', value: 100, changeFromBaseline: 0 },
      { date: '2020-07-01', value: null, changeFromBaseline: null },
      { date: '2020-10-01', value: 120, changeFromBaseline: 20 },
    ])
    expect(cumulativeProductivityChange(input)).toBe(20)
    expect(input).toEqual(original)
  })

  it('returns unavailable normalized output for a missing or zero baseline', () => {
    expect(normalizeProductivityRange([{ date: '2020-01-01', value: 0 }])[0]?.value).toBeNull()
    expect(cumulativeProductivityChange([{ date: '2020-01-01', value: null }])).toBeNull()
  })

  it('calculates positive, negative, zero, and missing-latest cumulative changes', () => {
    expect(cumulativeProductivityChange([
      { date: '2020-01-01', value: 100 },
      { date: '2020-04-01', value: 90 },
    ])).toBe(-10)
    expect(cumulativeProductivityChange([
      { date: '2020-01-01', value: 100 },
      { date: '2020-04-01', value: 100 },
    ])).toBe(0)
    expect(cumulativeProductivityChange([
      { date: '2020-01-01', value: 100 },
      { date: '2020-04-01', value: null },
    ])).toBeNull()
  })

  it('compares momentum with the exact quarter one year earlier', () => {
    const input = [
      { date: '2020-01-01', value: 1 },
      { date: '2020-04-01', value: 9 },
      { date: '2021-01-01', value: 2.5 },
      { date: '2021-07-01', value: 4 },
    ]
    expect(calculateProductivityMomentum(input).map((item) => item.momentumChange)).toEqual([
      null, null, 1.5, null,
    ])
  })

  it('preserves acceleration, slowing, and unchanged momentum', () => {
    const result = calculateProductivityMomentum([
      { date: '2020-01-01', value: 2 },
      { date: '2020-04-01', value: 2 },
      { date: '2020-07-01', value: 2 },
      { date: '2021-01-01', value: 3 },
      { date: '2021-04-01', value: 1 },
      { date: '2021-07-01', value: 2 },
    ])
    expect(result.slice(-3).map((item) => item.momentumChange)).toEqual([1, -1, 0])
  })
})
