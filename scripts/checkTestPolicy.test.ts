import { describe, expect, it } from 'vitest'
import { compactChartTestPolicyViolations, compactMetricTestPolicyViolations, dashboardPageTestPolicyViolations } from './checkTestPolicy'

describe('test policy check', () => {
  it('rejects equal latest-date assumptions for production CPI comparisons', () => {
    expect(dashboardPageTestPolicyViolations(`
      expect(comparison?.headlineObservations?.at(-1)?.date)
        .toBe(comparison?.coreObservations?.at(-1)?.date)
    `)).toEqual([
      'DashboardPage.test.tsx assumes independently refreshed CPI series have equal latest dates.',
    ])
  })

  it('rejects an unconditional available-latest assertion on production CPI', () => {
    expect(compactMetricTestPolicyViolations(`
      import cpi from '../data/headline-cpi-inflation.json'
      it('CPI wording', () => {
        const series = validateEconomicSeries(cpi)
        const model = deriveHistoricalBandContext(series.observations, definition)
        expect(model.status).toBe('ready')
      })
    `)).toEqual([
      'compactHistoricalMetrics.test.ts assumes the latest production CPI observation is always available.',
    ])
  })

  it('allows controlled CPI readiness and dataset-derived availability', () => {
    expect(compactMetricTestPolicyViolations(`
      import cpi from '../data/headline-cpi-inflation.json'
      it('controlled wording', () => {
        const model = deriveHistoricalBandContext(monthlyFixture(), definition)
        expect(model.status).toBe('ready')
      })
      it('production availability', () => {
        const series = validateEconomicSeries(cpi)
        const model = deriveHistoricalBandContext(series.observations, definition)
        expect(model.status).toBe(series.observations.at(-1).value === null ? 'latest-unavailable' : 'ready')
        if (series.observations.at(-1).value !== null) {
          expect(model.status).toBe('ready')
        }
      })
    `)).toEqual([])
  })

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
