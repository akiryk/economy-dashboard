import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import type { EconomicSeries } from '../features/economic-series/models/economicSeries'
import { buildLaborBriefing } from '../features/briefing/laborBriefing'
import type { LaborBriefingLoadState } from '../features/briefing/useLaborBriefing'
import { BriefingPage } from './BriefingPage'

const loadState = vi.hoisted(() => ({ current: { status: 'loading' } as LaborBriefingLoadState }))

vi.mock('../features/briefing/useLaborBriefing', () => ({
  useLaborBriefing: () => loadState.current,
}))

describe('BriefingPage', () => {
  it('renders the Labor-only preview loading state and dashboard navigation', () => {
    loadState.current = { status: 'loading' }
    render(<MemoryRouter><BriefingPage /></MemoryRouter>)
    expect(screen.getByRole('heading', { name: 'U.S. Economic Briefing' })).toBeVisible()
    expect(screen.getByText(/Labor is the only implemented analytical tile/)).toBeVisible()
    expect(screen.getByRole('status')).toHaveTextContent('Loading Labor briefing')
    expect(screen.getByRole('link', { name: 'Return to the full research dashboard' })).toHaveAttribute('href', '/')
  })

  it('renders one real Labor cell and exactly five inert hidden placeholders', () => {
    const makeSeries = (slug: string, base: number): EconomicSeries => ({ id: slug, slug, provider: 'Fixture', providerSeriesId: slug, title: slug, shortTitle: slug, description: '', question: '', units: '', frequency: 'monthly', seasonalAdjustment: null, transformation: '', sourceName: 'Fixture', sourceUrl: 'https://example.com', retrievedAt: '2025-01-01', observations: Array.from({ length: 60 }, (_, index) => ({ date: new Date(Date.UTC(2020, index, 1)).toISOString().slice(0, 10), value: base + index % 3 })) })
    const result = buildLaborBriefing({ activity: makeSeries('labor-market-activity-index', 0), momentum: makeSeries('labor-market-momentum-index', 0), unemployment: makeSeries('unemployment-rate', 4), payrolls: makeSeries('payroll-growth', 100), monthlyPayrollChange: makeSeries('monthly-payroll-change', 100), primeAgeEmployment: makeSeries('prime-age-employment-ratio', 75), claims: null }, '2025-01-15')
    loadState.current = { status: 'loaded', result }
    const { container } = render(<MemoryRouter><BriefingPage /></MemoryRouter>)
    expect(screen.getByRole('article', { name: 'Can people find and keep work?' })).toBeVisible()
    const placeholders = [...container.querySelectorAll('.briefing-placeholder')]
    expect(placeholders).toHaveLength(5)
    for (const placeholder of placeholders) {
      expect(placeholder.closest('[aria-hidden="true"]')).not.toBeNull()
      expect(placeholder.querySelector('a, button, input, select, details')).toBeNull()
      expect(placeholder.textContent).toContain('Layout placeholder')
      expect(placeholder.textContent).not.toMatch(/\d+%|Condition|Direction/)
    }
  })

  it('renders a useful primary loading failure', () => {
    loadState.current = { status: 'error', message: 'The primary Labor data could not be loaded.' }
    render(<MemoryRouter><BriefingPage /></MemoryRouter>)
    expect(screen.getByRole('alert')).toHaveTextContent('primary Labor data could not be loaded')
  })
})
