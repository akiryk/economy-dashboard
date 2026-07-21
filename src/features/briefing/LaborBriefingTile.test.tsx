import { cleanup, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it } from 'vitest'
import type { EconomicSeries } from '../economic-series/models/economicSeries'
import { buildLaborBriefing } from './laborBriefing'
import { LaborBriefingTile } from './LaborBriefingTile'

function series(slug: string, base: number): EconomicSeries {
  return {
    id: slug, slug, provider: 'Fixture', providerSeriesId: slug, title: slug, shortTitle: slug,
    description: '', question: '', units: 'Index', frequency: 'monthly', seasonalAdjustment: null,
    transformation: 'Level', sourceName: 'Fixture source', sourceUrl: 'https://example.com', retrievedAt: '2024-12-01',
    observations: Array.from({ length: 60 }, (_, index) => ({
      date: new Date(Date.UTC(2020, index, 1)).toISOString().slice(0, 10), value: base + index / 10,
    })),
  }
}

function model({ claims = true } = {}) {
  const result = buildLaborBriefing({
    activity: series('labor-market-activity-index', -2), momentum: series('labor-market-momentum-index', -3),
    unemployment: series('unemployment-rate', 4), payrolls: series('payroll-growth', 200),
    monthlyPayrollChange: series('monthly-payroll-change', 100), primeAgeEmployment: series('prime-age-employment-ratio', 75),
    claims: claims ? series('initial-unemployment-claims-four-week-average', 200_000) : null,
  }, '2025-01-15')
  if (result.status !== 'ready') throw new Error('Expected ready fixture')
  return result
}

afterEach(cleanup)

describe('LaborBriefingTile', () => {
  it('places the deterministic answer before the two collapsed visual headline metrics', () => {
    const { container } = render(<LaborBriefingTile model={model()} />)
    const answer = screen.getByText('People are finding and keeping work much more readily than usual, and conditions are strengthening sharply.')
    expect(screen.getByRole('heading', { name: 'Can people find and keep work?' })).toBeVisible()
    expect(answer).toBeVisible()
    expect(screen.getByText('Labor Market Activity')).toBeVisible()
    expect(screen.getByText('Labor Market Momentum')).toBeVisible()
    expect(screen.getByRole('img', { name: /midpoint marks the historical median/i })).toBeVisible()
    expect(screen.getByRole('img', { name: /arrow points upward/i })).toBeVisible()
    expect(screen.getByRole('button', { name: /More/ })).toHaveAttribute('aria-expanded', 'false')
    expect(screen.queryByText(/standardized indexes centered/)).not.toBeInTheDocument()
    expect(screen.queryByText('Unemployment rate')).not.toBeInTheDocument()
    expect(screen.queryByText(/0\.\d{5}/)).not.toBeInTheDocument()
    const tileChildren = [...container.querySelector('.labor-briefing')!.children]
    expect(tileChildren.map((element) => element.className)).toEqual([
      'labor-briefing__header', 'labor-briefing__answer', 'labor-metrics', 'labor-briefing__toggle',
    ])
  })

  it('shows supporting evidence first and keeps methodology one closed disclosure deeper', async () => {
    const user = userEvent.setup()
    const { container } = render(<LaborBriefingTile model={model()} />)
    const answer = screen.getByText('People are finding and keeping work much more readily than usual, and conditions are strengthening sharply.')
    await user.click(screen.getByRole('button', { name: /More/ }))
    expect(screen.getByRole('button', { name: /Less/ })).toHaveAttribute('aria-expanded', 'true')
    const expanded = container.querySelector('#labor-briefing-expanded')!
    expect([...expanded.children].map((element) => element.tagName)).toEqual(['SECTION', 'DETAILS'])
    expect(screen.getByRole('heading', { name: 'Supporting evidence' })).toBeVisible()
    const methodology = screen.getByText('How this assessment is calculated')
    expect(methodology.closest('details')).not.toHaveAttribute('open')

    for (const label of ['Unemployment rate', 'Latest monthly payroll change', 'Three-month average payroll change', 'Prime-age employment-to-population ratio', 'Initial claims, four-week average']) {
      expect(screen.getByRole('heading', { name: label })).toBeVisible()
    }
    expect(screen.getByText('+106K')).toBeVisible()
    expect(screen.getByText('+206K')).toBeVisible()
    expect(screen.getAllByText(/December 2024/).length).toBeGreaterThanOrEqual(4)
    expect(screen.getByText('Latest month; commonly revised.')).toBeVisible()
    expect(screen.getByText('Average monthly change across the latest three months; commonly revised.')).toBeVisible()
    expect(screen.getAllByText('Fixture source.', { exact: false })).toHaveLength(5)
    expect(screen.getByRole('link', { name: 'View unemployment rate research card' })).toHaveAttribute('href', '/#unemployment-rate-card')
    expect(screen.getByRole('link', { name: 'View latest monthly payroll change research card' })).toHaveAttribute('href', '/#payroll-growth-card')
    expect(screen.getByRole('link', { name: 'View initial claims, four-week average research card' })).toHaveAttribute('href', '/#initial-unemployment-claims-card')
    expect(screen.queryByText('Why this label')).not.toBeInTheDocument()
    expect(screen.queryByText(/not bounded between/)).not.toBeInTheDocument()
    expect(screen.queryByText(/0\.\d{5}/)).not.toBeInTheDocument()

    await user.click(methodology)
    const methodologyDetails = methodology.closest('details')!
    expect(methodologyDetails).toHaveAttribute('open')
    expect(within(methodologyDetails).getByText(/summarizes the overall level/)).toBeVisible()
    expect(within(methodologyDetails).getByText(/summarizes whether those broad conditions/)).toBeVisible()
    expect(within(methodologyDetails).getByText(/January 2020 through December 2024/)).toBeVisible()
    expect(within(methodologyDetails).getByText(/Hakkio, Craig S/)).toBeVisible()
    expect(within(methodologyDetails).getByText(/Well Above Avg/)).toBeVisible()
    expect(screen.getAllByText(answer.textContent!)).toHaveLength(1)

    await user.click(screen.getByRole('button', { name: /Less/ }))
    expect(screen.queryByRole('heading', { name: 'Supporting evidence' })).not.toBeInTheDocument()
    expect(answer).toBeVisible()
    await user.click(screen.getByRole('button', { name: /More/ }))
    expect(screen.getByText('How this assessment is calculated').closest('details')).not.toHaveAttribute('open')
  })

  it('keeps available supporting evidence visible when one series is missing', async () => {
    const user = userEvent.setup()
    render(<LaborBriefingTile model={model({ claims: false })} />)
    await user.click(screen.getByRole('button', { name: /More/ }))
    expect(screen.getAllByRole('heading', { level: 4 })).toHaveLength(4)
    expect(screen.getByRole('heading', { name: 'Unemployment rate' })).toBeVisible()
    expect(screen.queryByRole('heading', { name: 'Initial claims, four-week average' })).not.toBeInTheDocument()
    expect(screen.getByText('Initial claims data is unavailable.')).toBeVisible()
  })
})
