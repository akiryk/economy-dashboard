import { describe, expect, it } from 'vitest'
import { compactChartTestPolicyViolations, dashboardPageTestPolicyViolations } from './checkTestPolicy'

describe('test policy check', () => {
  it.each([
    "expect(chart).toHaveTextContent('Change from 12 months earlier: −1.9 percentage points')",
    "expect(chart).toHaveTextContent('Personal saving rateJune 20262.7%')",
    "expect(chart).toHaveTextContent('2025Deficit 5.8% of GDP')",
    "expect(chart).toHaveTextContent('Modeled ownership-cost shareMarch 202642.0%')",
    "expect(chart).toHaveTextContent('Difference: 12.0 percentage points above threshold')",
    "expect(chart).toHaveAttribute('data-latest-value', '+111K')",
  ])('rejects a literal compact-chart production expectation: %s', (source) => {
    expect(compactChartTestPolicyViolations(`
      import data from '../data/personal-saving-rate.json'
      it('production rendering', () => {
        const series = validateEconomicSeries(data)
        ${source}
      })
    `)).toHaveLength(1)
  })

  it('allows derived point details and fixed reference-line configuration', () => {
    expect(compactChartTestPolicyViolations(`
      import data from '../data/personal-saving-rate.json'
      it('production rendering', () => {
      const series = validateEconomicSeries(data)
      expect(chart).toHaveTextContent(\`Difference: \${formatHomeOwnershipPointDifference(latest.value)}\`)
      expect(chart).toHaveAttribute('data-latest-value', formatSignedThousands(latest.value))
      expect(chart).toHaveTextContent('30% = Atlanta Fed affordability threshold')
      })
    `)).toEqual([])
  })

  it('allows exact point details owned by a controlled fixture in the same file', () => {
    expect(compactChartTestPolicyViolations(`
      import data from '../data/personal-saving-rate.json'
      it('controlled comparison', () => {
        const series = validateEconomicSeries({ observations: [{ date: '2030-01-01', value: 4 }] })
        expect(chart).toHaveTextContent('Change from 12 months earlier: −1.9 percentage points')
      })
    `)).toEqual([])
  })

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
