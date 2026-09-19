import { describe, expect, it } from 'vitest'
import { dashboardPageTestPolicyViolations } from './checkTestPolicy'

describe('test policy check', () => {
  it('rejects a literal production-style dashboard date', () => {
    expect(dashboardPageTestPolicyViolations(
      "name: 'U.S. Economy, September 5, 2026'",
    )).toEqual([
      'DashboardPage.test.tsx contains a mutable production-style heading assertion: "U.S. Economy, September 5, 2026"',
    ])
  })

  it('allows a stable structural heading assertion', () => {
    expect(dashboardPageTestPolicyViolations(
      "name: /^U\\.S\\. Economy(?:,|$)/",
    )).toEqual([])
  })

  it('rejects uniqueness assumptions about mutable formatted percentages', () => {
    expect(dashboardPageTestPolicyViolations(`
      expect(within(momentum).getByText(
        formatPercentage(momentumModel.twelveMonthRate),
      )).toBeVisible()
    `)).toEqual([
      'DashboardPage.test.tsx requires a mutable formatted percentage to be unique within a page or card.',
    ])
  })

  it('rejects fixed grammar after a mutable formatted point value', () => {
    expect(dashboardPageTestPolicyViolations(`
      expect(summary).toHaveTextContent(
        \`The gap was \${formatSignedPercentagePoints(latest.value - latestCore.value)} percentage points.\`,
      )
    `)).toEqual([
      'DashboardPage.test.tsx hard-codes singular or plural prose after a mutable formatted value.',
    ])
  })

  it('allows structural grammar and assertions scoped to a semantic element', () => {
    expect(dashboardPageTestPolicyViolations(`
      expect(summary).toHaveTextContent(/percentage points?\\./)
      expect(momentum.querySelector('.hero')).toHaveTextContent(
        formatPercentage(momentumModel.twelveMonthRate),
      )
    `)).toEqual([])
  })

  it.each([
    "date === '2025-10-01' && value === null",
    '/official October 2025 CPI index was unavailable/',
  ])('rejects a fixed production-data gap: %s', (assertion) => {
    expect(dashboardPageTestPolicyViolations(assertion)).toEqual([
      'DashboardPage.test.tsx hard-codes a mutable production-data gap.',
    ])
  })
})
