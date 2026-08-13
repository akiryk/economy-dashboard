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
    'real-wage-growth': -0.14576,
    'dashboard-mortgage-rate-30-year': 6.69,
    'dashboard-sp500': 105,
    'dashboard-high-yield-credit-spread': 2.7,
  }
  if (slug === 'dashboard-sp500') {
    const result = series(slug, [100, 110, 105])
    result.observations[0]!.date = '2025-12-31'
    result.observations[1]!.date = '2026-01-02'
    result.observations[2]!.date = '2026-08-07'
    return result
  }
  if (slug === 'dashboard-mortgage-rate-30-year') {
    const result = series(slug, [6.5, 6.69])
    result.observations[0]!.date = '2025-08-07'
    result.observations[1]!.date = '2026-08-06'
    return result
  }
  if (slug === 'real-wage-growth') {
    const result = series(slug, [0.4, null, -0.14576])
    result.observations[0]!.date = '2021-08-01'
    result.observations[1]!.date = '2024-08-01'
    result.observations[2]!.date = '2026-07-01'
    return result
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
  it('renders ten single-purpose status tiles from local series', async () => {
    render(<StatusDashboardPage />)

    const tile = await screen.findByRole('article', { name: 'Inflation' })
    expect(tile).toHaveTextContent('3.5%')
    expect(tile).toHaveTextContent('12-month CPI-U, all items')
    expect(tile).toHaveTextContent('As of Jan 2026')
    expect(tile).toHaveTextContent('Elevated')
    expect(tile).toHaveAttribute('data-state', 'normal')
    await waitFor(() => expect(screen.getAllByRole('article')).toHaveLength(10))
    expect(screen.getAllByRole('article').map((article) => article.textContent)).toEqual([
      expect.stringContaining('GDP growth'),
      expect.stringContaining('Unemployment'),
      expect.stringContaining('Payroll growth'),
      expect.stringContaining('Initial claims'),
      expect.stringContaining('Inflation'),
      expect.stringContaining('Real wage growth'),
      expect.stringContaining('Sahm Rule'),
      expect.stringContaining('30-year mortgage rate'),
      expect.stringContaining('S&P 500'),
      expect.stringContaining('High-yield spread'),
    ])
    expect(screen.getByRole('article', { name: 'GDP growth' })).toHaveTextContent('GDP $32.5T')
    expect(screen.getByRole('article', { name: 'Unemployment' })).not.toHaveTextContent(/jobs/i)
    const payroll = screen.getByRole('article', { name: 'Payroll growth' })
    expect(payroll).toHaveTextContent('+12k/mo')
    expect(payroll).toHaveTextContent('Latest −23k')
    expect(screen.getByRole('article', { name: 'Initial claims' })).toHaveTextContent('Latest 228k')
    const realWages = screen.getByRole('article', { name: 'Real wage growth' })
    expect(realWages).toHaveTextContent('−0.1%')
    expect(realWages).toHaveTextContent('Wages are slightly trailing inflation')
    expect(within(realWages).getByText(
      /real wage growth for all private employees over five years, ending at −0.1% in Jul 2026.*Zero means wage growth matched inflation.*missing months remain gaps/i,
    )).toHaveClass('visually-hidden')
    expect(chart.setOption.mock.calls.some(([options]) => {
      const option = options as {
        series?: Array<{ data?: Array<number | null>; markLine?: { data?: Array<{ yAxis: number }> } }>
      }
      return option.series?.[0]?.data?.at(-1) === -0.14576 &&
        option.series[0].markLine?.data?.[0]?.yAxis === 0
    })).toBe(true)
    const sahm = screen.getByRole('article', { name: 'Sahm Rule' })
    expect(sahm).toHaveTextContent('Trigger 0.50')
    expect(within(sahm).queryByRole('button', { name: /Historical/ }))
      .not.toBeInTheDocument()
    expect(within(sahm).getByText(/recession indicator, not a forecast/))
      .toHaveClass('visually-hidden')
    expect(screen.queryByRole('article', { name: 'Expected inflation' })).not.toBeInTheDocument()
    expect(screen.queryByRole('article', { name: 'Fed funds' })).not.toBeInTheDocument()
    expect(screen.queryByRole('article', { name: 'Yield curve' })).not.toBeInTheDocument()
    const mortgage = screen.getByRole('article', { name: '30-year mortgage rate' })
    expect(mortgage).toHaveTextContent('6.69%')
    expect(mortgage).toHaveTextContent('up 0.2 pp from a year ago')
    expect(mortgage).not.toHaveTextContent(/Treasury|spread|bps/)
    const sp500 = screen.getByRole('article', { name: 'S&P 500' })
    expect(sp500).toHaveTextContent('105')
    expect(sp500).toHaveTextContent('YTD +5.0%')
    expect(sp500).toHaveClass('status-tile--wide')
    expect(within(sp500).queryByRole('button', { name: /Historical/ }))
      .not.toBeInTheDocument()
    const highYield = screen.getByRole('article', { name: 'High-yield spread' })
    expect(highYield).toHaveTextContent('270 bps')
    expect(highYield).toHaveTextContent('Calm')
    expect(highYield).toHaveAttribute('data-state', 'notable-good')
    expect(dashboardEconomicSeriesRepository.getBySlug).toHaveBeenCalledTimes(12)
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

  it('keeps market tile failures isolated from the final row', async () => {
    vi.mocked(dashboardEconomicSeriesRepository.getBySlug)
      .mockImplementation(async (slug) => {
        if (slug === 'dashboard-sp500') throw new Error('Unavailable')
        return seriesForSlug(slug)
      })
    render(<StatusDashboardPage />)
    expect(await screen.findByRole('article', { name: 'S&P 500' }))
      .toHaveTextContent('Data temporarily unavailable.')
    expect(screen.getByRole('article', { name: '30-year mortgage rate' }))
      .toHaveTextContent('6.69%')
    expect(screen.getByRole('article', { name: 'High-yield spread' }))
      .toHaveTextContent('270 bps')
  })

  it('reports mortgage benchmark and honest available-history context on card backs', async () => {
    const user = userEvent.setup()
    render(<StatusDashboardPage />)
    const mortgage = (await screen.findByText('6.69%')).closest('article')!
    await user.click(mortgage)
    expect(mortgage).toHaveTextContent('Aug 6, 2026')
    expect(mortgage).toHaveTextContent('individual offer varies')

    const sp500 = screen.getByRole('article', { name: 'S&P 500' })
    await user.click(sp500)
    expect(sp500).toHaveTextContent('available FRED history')
    expect(sp500).toHaveTextContent('not necessarily an all-time drawdown')

    const highYield = screen.getByRole('article', { name: 'High-yield spread' })
    await user.click(highYield)
    expect(highYield).toHaveTextContent('after option adjustment')
    expect(highYield).toHaveTextContent('do not guarantee recession')
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
    const strip = within(inflation).getByRole('button', { name: /Historical headline CPI-U inflation details/ })
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
