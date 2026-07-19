import { cleanup, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it } from 'vitest'
import { buildLaborBriefing } from './laborBriefing'
import { LaborBriefingTile } from './LaborBriefingTile'
import type { EconomicSeries } from '../economic-series/models/economicSeries'

function series(slug: string, base: number): EconomicSeries {
  return { id: slug, slug, provider: 'Fixture', providerSeriesId: slug, title: slug, shortTitle: slug, description: '', question: '', units: 'Percent', frequency: 'monthly', seasonalAdjustment: null, transformation: '', sourceName: 'Fixture', sourceUrl: 'https://example.com', retrievedAt: '2024-01-01', observations: Array.from({ length: 60 }, (_, index) => ({ date: new Date(Date.UTC(2019, index, 1)).toISOString().slice(0, 10), value: base + (index % 3) * 0.1 })) }
}

function model() {
  const result = buildLaborBriefing({ unemployment: series('unemployment-rate', 4), payrolls: series('payroll-growth', 100), primeAgeEmployment: series('prime-age-employment-ratio', 75), claims: null }, '2024-01-15')
  if (result.status !== 'ready') throw new Error('Expected ready fixture')
  return result
}

afterEach(cleanup)

describe('LaborBriefingTile', () => {
  it('renders readings, synthesis, freshness, accessible chart context, and research links', () => {
    render(<LaborBriefingTile model={model()} />)
    expect(screen.getByRole('heading', { name: 'Can people find and keep work?' })).toBeVisible()
    const header = screen.getByRole('heading', { name: 'Can people find and keep work?' }).closest('header')!
    expect(within(header).getByText('Condition')).toBeVisible()
    expect(within(header).getByText('Direction')).toBeVisible()
    expect(screen.getByText(/unemployment is/)).toBeVisible()
    expect(screen.getByText(/Based on unemployment, payrolls, and prime-age employment/)).toBeVisible()
    expect(screen.getByRole('img', { name: /interquartile band/i })).toBeVisible()
    expect(screen.queryByText('10-year minimum')).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'View Labor research cards' })).toHaveAttribute('href', '/#employment-and-income')
  })

  it('uses keyboard-operable native disclosures with trace and supporting links', async () => {
    const user = userEvent.setup()
    render(<LaborBriefingTile model={model()} />)
    const why = screen.getByText('Why this label')
    const supporting = screen.getByText('Supporting evidence')
    await user.click(why)
    expect(within(why.closest('details')!).getByText('Dimension result')).toBeVisible()
    expect(within(why.closest('details')!).getAllByRole('link', { name: 'View research card' })).toHaveLength(3)
    await user.click(supporting)
    expect(within(supporting.closest('details')!).getByText(/Initial claims data is unavailable/)).toBeVisible()
  })
})
