import { describe, expect, it } from 'vitest'
import {
  classifyBudgetBalance,
  classifyBudgetBalanceHistory,
  formatBudgetBalanceAnswer,
  formatBudgetBalancePerHundred,
} from './budgetBalanceContext'

const model = {
  outerLower: -8,
  innerLower: -4,
  innerUpper: 1,
  outerUpper: 3,
} as const

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
    expect(formatBudgetBalanceAnswer(1.2)).toContain('surplus equal to 1.2%')
    expect(formatBudgetBalancePerHundred(1.2)).toContain('$1.20 more in revenue')
    expect(formatBudgetBalanceAnswer(0.2)).toContain('approximately balanced')
    expect(formatBudgetBalancePerHundred(0.2)).toContain('within about 20 cents')
  })

  it('uses five deterministic historical states', () => {
    expect([-9, -5, 0, 2, 4].map((value) =>
      classifyBudgetBalanceHistory(value, model),
    )).toEqual([
      'very large deficit', 'large deficit', 'typical balance',
      'large surplus', 'very large surplus',
    ])
  })
})
