import { describe, expect, it } from 'vitest'
import { createTradeBalanceCompactDefinition } from './compactHistoricalMetrics'
import { classifyTradeBalance, deriveTradeBalanceCompactContext, formatTradeBalanceDirection, formatTradeBalancePerHundred, formatTradeBalanceQuestion, tradeBalanceMagnitude } from './tradeBalanceContext'

describe('trade balance compact context', () => {
  it.each([[-2, 'deficit'], [-0.1, 'balanced'], [0, 'balanced'], [0.1, 'balanced'], [1, 'surplus']] as const)('classifies %s', (value, state) => expect(classifyTradeBalance(value)).toBe(state))
  it('formats state questions and dollars per $100', () => {
    expect(formatTradeBalanceQuestion('deficit')).toContain('trade deficit')
    expect(formatTradeBalanceQuestion('surplus')).toContain('trade surplus')
    expect(formatTradeBalanceQuestion('balanced')).toContain('approximately balanced')
    expect(formatTradeBalancePerHundred(-2.74)).toContain('$2.70 more in imports')
    expect(formatTradeBalancePerHundred(1.06)).toContain('$1.10 more in exports')
  })
  it('transforms active-state magnitudes', () => {
    expect(tradeBalanceMagnitude(-2.7, 'deficit')).toBe(2.7)
    expect(tradeBalanceMagnitude(1.1, 'surplus')).toBe(1.1)
    expect(tradeBalanceMagnitude(-1, 'surplus')).toBe(0)
  })
  it('uses only comparable states for bands while retaining the display path', () => {
    const definition = { ...createTradeBalanceCompactDefinition('deficit').historicalBands, minimumFiniteObservations: 2, recentObservationCount: 5 }
    const result = deriveTradeBalanceCompactContext([{ date: '2022-01-01', value: -4 }, { date: '2023-01-01', value: 2 }, { date: '2024-01-01', value: -2 }, { date: '2025-01-01', value: 1 }, { date: '2026-01-01', value: -3 }], definition)
    expect(result.observations.map(({ value }) => value)).toEqual([4, 0, 2, 0, 3])
    expect(result.model.status).toBe('ready')
    if (result.model.status === 'ready') expect(result.model.validObservationCount).toBe(3)
  })
  it('formats widening, narrowing, unchanged, and state transitions', () => {
    const direction = (prior: number, latest: number) => formatTradeBalanceDirection([{ date: '2021-04-01', value: prior }, { date: '2026-04-01', value: latest }])
    expect(direction(-2, -3)).toContain('widened by 1.0')
    expect(direction(-3, -2)).toContain('narrowed by 1.0')
    expect(direction(-2, -2.1)).toContain('little changed')
    expect(direction(1, -2)).toBe('The balance moved from surplus to deficit over the past five years.')
  })
})
