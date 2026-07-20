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

function model() {
  const result = buildLaborBriefing({
    activity: series('labor-market-activity-index', -2), momentum: series('labor-market-momentum-index', -3),
    unemployment: series('unemployment-rate', 4), payrolls: series('payroll-growth', 100),
    monthlyPayrollChange: series('monthly-payroll-change', 100), primeAgeEmployment: series('prime-age-employment-ratio', 75),
    claims: series('initial-unemployment-claims-four-week-average', 200_000),
  }, '2025-01-15')
  if (result.status !== 'ready') throw new Error('Expected ready fixture')
  return result
}

afterEach(cleanup)

describe('LaborBriefingTile', () => {
  it('keeps the collapsed tile limited to the two visual headline metrics', () => {
    render(<LaborBriefingTile model={model()} />)
    expect(screen.getByRole('heading', { name: 'Can people find and keep work?' })).toBeVisible()
    expect(screen.getByText('Labor Market Activity')).toBeVisible()
    expect(screen.getByText('Labor Market Momentum')).toBeVisible()
    expect(screen.getByRole('img', { name: /midpoint marks the historical median/i })).toBeVisible()
    expect(screen.getByRole('img', { name: /arrow points upward/i })).toBeVisible()
    expect(screen.getByRole('button', { name: /More/ })).toHaveAttribute('aria-expanded', 'false')
    expect(screen.queryByText(/standardized indexes centered/)).not.toBeInTheDocument()
    expect(screen.queryByText('Unemployment rate')).not.toBeInTheDocument()
    expect(screen.queryByText(/0\.\d{5}/)).not.toBeInTheDocument()
  })

  it('reveals traceable LMCI and supporting evidence, then collapses it', async () => {
    const user = userEvent.setup()
    render(<LaborBriefingTile model={model()} />)
    await user.click(screen.getByRole('button', { name: /More/ }))
    expect(screen.getByRole('button', { name: /Less/ })).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByText(/standardized indexes centered/)).toBeVisible()
    expect(screen.getByText('LMCI Activity')).toBeVisible()
    const why = screen.getByText('Why this label')
    const supporting = screen.getByText('Supporting evidence')
    expect(why.closest('details')).not.toHaveAttribute('open')
    expect(supporting.closest('details')).not.toHaveAttribute('open')
    await user.click(why)
    expect(within(why.closest('details')!).getByText(/maps 0–100 percentiles/)).toBeVisible()
    await user.click(supporting)
    expect(within(supporting.closest('details')!).getByText(/Hakkio, Craig S/)).toBeVisible()
    expect(screen.getByText('Unemployment rate')).toBeVisible()
    await user.click(screen.getByRole('button', { name: /Less/ }))
    expect(screen.queryByText('LMCI Activity')).not.toBeInTheDocument()
  })
})
