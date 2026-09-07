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
})
