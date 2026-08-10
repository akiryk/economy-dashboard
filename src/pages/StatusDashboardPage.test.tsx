import { cleanup, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { EconomicSeries } from '../features/economic-series/models/economicSeries'
import { dashboardEconomicSeriesRepository } from '../features/economic-series/repositories/dashboardEconomicSeriesRepository'
import { StatusDashboardPage } from './StatusDashboardPage'

const chart = vi.hoisted(() => ({ setOption: vi.fn(), resize: vi.fn(), dispose: vi.fn() }))
vi.mock('echarts/core', () => ({ init: vi.fn(() => chart), use: vi.fn() }))

function series(slug: string, values: Array<number | null>): EconomicSeries {
  const frequency: EconomicSeries['frequency'] = slug.includes('gdp')
    ? 'quarterly'
    : slug.includes('claims')
      ? 'weekly'
      : 'monthly'
  return {
    id: slug, slug, provider: 'FRED', providerSeriesId: slug,
    title: slug, shortTitle: slug, description: slug, question: slug,
    units: 'Percent change from year ago', frequency,
    seasonalAdjustment: 'Seasonally adjusted', transformation: 'FRED units=pc1',
    sourceName: 'FRED', sourceUrl: 'https://fred.stlouisfed.org',
    retrievedAt: '2026-08-10',
    observations: values.map((value, index) => ({
      date: `2026-${String(index + 1).padStart(2, '0')}-01`, value,
    })),
  }
}

function seriesForSlug(slug: string): EconomicSeries {
  const values: Record<string, number> = {
    'dashboard-real-gdp-growth': 1.5,
    'dashboard-nominal-gdp': 32_475,
    'unemployment-rate': 4.1,
    'dashboard-payroll-change': -23,
    'initial-unemployment-claims-four-week-average': 221_000,
    'initial-unemployment-claims': 228_000,
    'dashboard-sahm-rule-gap': -0.03,
    'dashboard-headline-cpi-inflation': 3.46353,
    'dashboard-core-cpi-inflation': 2.56579,
    'dashboard-expected-inflation-10-year': 2.7,
    'dashboard-effective-federal-funds-rate': 4.33,
    'dashboard-fed-target-upper-bound': 4.5,
    'dashboard-yield-spread-10y-2y': -0.42,
    'dashboard-yield-spread-10y-3m': 0.34,
  }
  return slug === 'dashboard-payroll-change'
    ? series(slug, [40, 20, -23])
    : series(slug, [values[slug]])
}

beforeEach(() => {
  window.localStorage.clear()
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn((query: string) => ({
      matches: query.includes('dark'), media: query,
      addEventListener: vi.fn(), removeEventListener: vi.fn(),
    })),
  })
  vi.spyOn(dashboardEconomicSeriesRepository, 'getBySlug')
    .mockImplementation(async (slug) => seriesForSlug(slug))
})

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

describe('StatusDashboardPage', () => {
  it('renders the growth/labor row before the unchanged CPI tile from local series', async () => {
    render(<StatusDashboardPage />)

    const tile = await screen.findByRole('article', { name: 'Inflation' })
    expect(tile).toHaveTextContent('3.5%')
    expect(tile).toHaveTextContent('Core 2.6%')
    expect(tile).toHaveTextContent('As of Jan 2026')
    expect(tile).toHaveTextContent('Elevated')
    expect(tile).toHaveAttribute('data-state', 'normal')
    await waitFor(() => expect(screen.getAllByRole('article')).toHaveLength(9))
    expect(screen.getAllByRole('article').map((article) => article.textContent)).toEqual([
      expect.stringContaining('GDP growth'),
      expect.stringContaining('Unemployment'),
      expect.stringContaining('Payroll growth'),
      expect.stringContaining('Initial claims'),
      expect.stringContaining('Inflation'),
      expect.stringContaining('Expected inflation'),
      expect.stringContaining('Fed funds'),
      expect.stringContaining('Yield curve'),
      expect.stringContaining('Sahm Rule'),
    ])
    expect(screen.getByRole('article', { name: 'GDP growth' })).toHaveTextContent('GDP $32.5T')
    expect(screen.getByRole('article', { name: 'Unemployment' })).not.toHaveTextContent(/jobs/i)
    const payroll = screen.getByRole('article', { name: 'Payroll growth' })
    expect(payroll).toHaveTextContent('+12k/mo')
    expect(payroll).toHaveTextContent('Latest −23k')
    expect(screen.getByRole('article', { name: 'Initial claims' })).toHaveTextContent('Latest 228k')
    const sahm = screen.getByRole('article', { name: 'Sahm Rule' })
    expect(sahm).toHaveTextContent('Trigger 0.50')
    expect(within(sahm).queryByRole('button', { name: /Historical/ }))
      .not.toBeInTheDocument()
    expect(within(sahm).getByText(/recession indicator, not a forecast/))
      .toHaveClass('visually-hidden')
    const expected = screen.getByRole('article', { name: 'Expected inflation' })
    expect(expected).toHaveTextContent('2.7%')
    expect(expected).toHaveTextContent('Elevated')
    expect(expected).toHaveAttribute('data-state', 'normal')
    const fedFunds = screen.getByRole('article', { name: 'Fed funds' })
    expect(fedFunds).toHaveTextContent('4.33%')
    expect(fedFunds).toHaveTextContent('Target upper 4.50%')
    expect(fedFunds).toHaveAttribute('data-state', 'normal')
    const yieldCurve = screen.getByRole('article', { name: 'Yield curve' })
    expect(yieldCurve).toHaveTextContent('−42 bps')
    expect(yieldCurve).toHaveTextContent('10y−3m +34 bps')
    expect(yieldCurve).toHaveTextContent('Inverted')
    expect(yieldCurve).toHaveAttribute('data-state', 'notable-bad')
    expect(dashboardEconomicSeriesRepository.getBySlug).toHaveBeenCalledTimes(14)
  })

  it('keeps the headline tile when core CPI fails without inventing a value', async () => {
    vi.mocked(dashboardEconomicSeriesRepository.getBySlug)
      .mockImplementation(async (slug) => {
        if (slug.includes('core')) throw new Error('Unavailable')
        if (slug.includes('headline')) return series(slug, [1.6])
        return seriesForSlug(slug)
      })
    render(<StatusDashboardPage />)
    expect(await screen.findByText('1.6%')).toBeVisible()
    expect(screen.getByText('Core unavailable')).toBeVisible()
  })

  it('isolates a headline failure inside the dashboard content', async () => {
    vi.mocked(dashboardEconomicSeriesRepository.getBySlug)
      .mockImplementation(async (slug) => {
        if (slug.includes('headline')) throw new Error('Unavailable')
        return seriesForSlug(slug)
      })
    render(<StatusDashboardPage />)
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Inflation data is temporarily unavailable.',
    )
    expect(screen.getByRole('heading', { name: 'Economy status' })).toBeVisible()
    expect(screen.getByRole('article', { name: 'GDP growth' })).toHaveTextContent('1.5%')
  })

  it('isolates one growth tile failure from the other five tiles', async () => {
    vi.mocked(dashboardEconomicSeriesRepository.getBySlug)
      .mockImplementation(async (slug) => {
        if (slug === 'dashboard-real-gdp-growth') throw new Error('Unavailable')
        return seriesForSlug(slug)
      })
    render(<StatusDashboardPage />)
    expect(await screen.findByRole('article', { name: 'GDP growth' }))
      .toHaveTextContent('Data temporarily unavailable.')
    expect(screen.getByRole('article', { name: 'Unemployment' })).toHaveTextContent('4.1%')
    expect(screen.getByRole('article', { name: 'Inflation' })).toHaveTextContent('3.5%')
  })

  it('isolates a payroll tile failure without restoring payrolls under unemployment', async () => {
    vi.mocked(dashboardEconomicSeriesRepository.getBySlug)
      .mockImplementation(async (slug) => {
        if (slug === 'dashboard-payroll-change') throw new Error('Unavailable')
        return seriesForSlug(slug)
      })
    render(<StatusDashboardPage />)
    expect(await screen.findByRole('article', { name: 'Payroll growth' }))
      .toHaveTextContent('Data temporarily unavailable.')
    expect(screen.getByRole('article', { name: 'Unemployment' })).toHaveTextContent('4.1%')
    expect(screen.getByRole('article', { name: 'Unemployment' }))
      .not.toHaveTextContent(/payroll|jobs/i)
    expect(screen.getByRole('article', { name: 'Inflation' })).toHaveTextContent('3.5%')
  })

  it('isolates a prices-and-rates tile failure from the completed row', async () => {
    vi.mocked(dashboardEconomicSeriesRepository.getBySlug)
      .mockImplementation(async (slug) => {
        if (slug === 'dashboard-effective-federal-funds-rate') throw new Error('Unavailable')
        return seriesForSlug(slug)
      })
    render(<StatusDashboardPage />)
    expect(await screen.findByRole('article', { name: 'Fed funds' }))
      .toHaveTextContent('Data temporarily unavailable.')
    expect(screen.getByRole('article', { name: 'Inflation' })).toHaveTextContent('3.5%')
    expect(screen.getByRole('article', { name: 'Expected inflation' })).toHaveTextContent('2.7%')
    expect(screen.getByRole('article', { name: 'Yield curve' })).toHaveTextContent('−42 bps')
  })

  it('flips cards independently by pointer and keyboard without visible controls', async () => {
    const user = userEvent.setup()
    render(<StatusDashboardPage />)
    const payroll = (await screen.findByText('+12k/mo')).closest('article')!
    const unemployment = screen.getByRole('article', { name: 'Unemployment' })

    expect(payroll).toHaveAttribute('data-flipped', 'false')
    expect(payroll.querySelector('.status-tile__face--back')).toHaveAttribute('aria-hidden', 'true')
    expect(within(payroll).queryByText(/Details ↻|Return ↻/)).not.toBeInTheDocument()
    await user.click(payroll)
    expect(payroll).toHaveAttribute('data-flipped', 'true')
    expect(payroll.querySelector('.status-tile__face--front')).toHaveAttribute('aria-hidden', 'true')
    expect(unemployment).toHaveAttribute('data-flipped', 'false')
    payroll.focus()
    await user.keyboard('{Enter}')
    expect(payroll).toHaveAttribute('data-flipped', 'false')
    await user.keyboard(' ')
    expect(payroll).toHaveAttribute('data-flipped', 'true')
    expect(payroll).toHaveFocus()
  })

  it('keeps historical-strip pointer and keyboard interaction isolated from flipping', async () => {
    const user = userEvent.setup()
    render(<StatusDashboardPage />)
    const inflation = await screen.findByRole('article', { name: 'Inflation' })
    const strip = within(inflation).getByRole('button', { name: /Historical CPI inflation details/ })
    await user.click(strip)
    expect(strip).toHaveAttribute('aria-expanded', 'true')
    expect(inflation).toHaveAttribute('data-flipped', 'false')
    strip.focus()
    await user.keyboard('{Escape}')
    expect(strip).toHaveAttribute('aria-expanded', 'false')
    expect(inflation).toHaveAttribute('data-flipped', 'false')
  })

  it('honors system theme and persists a manual override', async () => {
    const user = userEvent.setup()
    const { container, unmount } = render(<StatusDashboardPage />)
    expect(container.querySelector('.status-dashboard')).toHaveAttribute('data-theme', 'dark')
    await user.selectOptions(screen.getByLabelText('Theme'), 'light')
    expect(container.querySelector('.status-dashboard')).toHaveAttribute('data-theme', 'light')
    expect(window.localStorage.getItem('economy-dashboard-theme')).toBe('light')
    unmount()
    render(<StatusDashboardPage />)
    await waitFor(() => expect(screen.getByLabelText('Theme')).toHaveValue('light'))
  })
})
