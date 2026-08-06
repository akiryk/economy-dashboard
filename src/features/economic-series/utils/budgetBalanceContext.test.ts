import { describe, expect, it } from 'vitest'
import {
  classifyBudgetBalance,
  deriveBudgetBalanceCompactContext,
  formatBudgetBalanceQuestion,
  formatBudgetBalanceAnswer,
  formatBudgetBalancePerHundred,
  formatBudgetBalanceStateLabel,
} from './budgetBalanceContext'

const bands = {
  recentObservationCount: 5,
  comparisonWindow: { kind: 'all-available' as const },
  innerPercentiles: [25, 75] as const,
  outerPercentiles: [10, 90] as const,
  minimumFiniteObservations: 2,
  latestObservationPolicy: 'latest-finite' as const,
}

describe('budget balance context', () => {
  it.each([
    [-5.8, 'deficit'], [-0.2, 'balanced'], [0, 'balanced'], [0.2, 'balanced'],
    [1.2, 'surplus'], [null, 'unavailable'],
  ])('classifies %s as %s', (value, state) => {
    expect(classifyBudgetBalance(value)).toBe(state)
  })

  it('formats deterministic deficit, surplus, and balanced explanations', () => {
    expect(formatBudgetBalanceAnswer(-5.8)).toBe('The federal government ran a deficit equal to 5.8% of GDP.')
    expect(formatBudgetBalancePerHundred(-5.8)).toContain('$5.80 of borrowing')
    expect(formatBudgetBalancePerHundred(-5.76906)).toContain('$5.80 of borrowing')
    expect(formatBudgetBalanceAnswer(1.2)).toContain('surplus equal to 1.2%')
    expect(formatBudgetBalancePerHundred(1.2)).toContain('$1.20 more in revenue')
    expect(formatBudgetBalanceAnswer(0.2)).toContain('approximately balanced')
    expect(formatBudgetBalancePerHundred(0.2)).toContain('within about 20 cents')
  })

  it.each([
    [-3, 'How large is the federal budget deficit relative to the economy?', 'Deficit'],
    [1, 'How large is the federal budget surplus relative to the economy?', 'Surplus'],
    [0, 'Is the federal budget approximately balanced?', 'Approximately balanced'],
  ] as const)('uses state-dependent question and label for %s', (value, question, label) => {
    const state = classifyBudgetBalance(value)
    expect(formatBudgetBalanceQuestion(state)).toBe(question)
    expect(formatBudgetBalanceStateLabel(state)).toBe(label)
  })

  it.each([
    ['deficit', [8, 0, 4, 0, 3], 3],
    ['surplus', [0, 2, 0, 1, 3], 3],
    ['balanced', [8, 2, 4, 1, 0.1], 5],
  ] as const)('transforms %s mode and uses only comparable history', (mode, expected, comparableCount) => {
    const latest = mode === 'deficit' ? -3 : mode === 'surplus' ? 3 : 0.1
    const context = deriveBudgetBalanceCompactContext([
      { date: '2021-01-01', value: -8 },
      { date: '2022-01-01', value: 2 },
      { date: '2023-01-01', value: -4 },
      { date: '2024-01-01', value: 1 },
      { date: '2025-01-01', value: latest },
    ], bands)
    expect(context.state).toBe(mode)
    expect(context.observations.map(({ value }) => value)).toEqual(expected)
    expect(context.model.status).toBe('ready')
    if (context.model.status === 'ready') {
      expect(context.model.validObservationCount).toBe(comparableCount)
      expect(context.model.recentObservations.map(({ value }) => value)).toEqual(expected)
    }
  })
})
