import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { EconomicSeries } from '../features/economic-series/models/economicSeries'
import { dashboardEconomicSeriesRepository } from '../features/economic-series/repositories/dashboardEconomicSeriesRepository'
import { StatusDashboardPage } from './StatusDashboardPage'

const chart = vi.hoisted(() => ({ setOption: vi.fn(), resize: vi.fn(), dispose: vi.fn() }))
vi.mock('echarts/core', () => ({ init: vi.fn(() => chart), use: vi.fn() }))

function series(slug: string, values: Array<number | null>): EconomicSeries {
  return {
    id: slug, slug, provider: 'FRED', providerSeriesId: slug,
    title: slug, shortTitle: slug, description: slug, question: slug,
    units: 'Percent change from year ago', frequency: 'monthly',
    seasonalAdjustment: 'Seasonally adjusted', transformation: 'FRED units=pc1',
    sourceName: 'FRED', sourceUrl: 'https://fred.stlouisfed.org',
    retrievedAt: '2026-08-10',
    observations: values.map((value, index) => ({
      date: `2026-${String(index + 1).padStart(2, '0')}-01`, value,
    })),
  }
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
})

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

describe('StatusDashboardPage', () => {
  it('renders only the real CPI tile from latest valid committed values and periods', async () => {
    vi.spyOn(dashboardEconomicSeriesRepository, 'getBySlug')
      .mockImplementation(async (slug) => slug.includes('headline')
        ? series(slug, [1, 2, 3.46353, null])
        : series(slug, [1, 2, 2.56579, null]))
    render(<StatusDashboardPage />)

    const tile = await screen.findByRole('article', { name: 'Inflation' })
    expect(tile).toHaveTextContent('3.5%')
    expect(tile).toHaveTextContent('Core 2.6%')
    expect(tile).toHaveTextContent('As of Mar 2026')
    expect(tile).toHaveTextContent('Elevated')
    expect(tile).toHaveAttribute('data-state', 'normal')
    expect(screen.getAllByRole('article')).toHaveLength(1)
    expect(dashboardEconomicSeriesRepository.getBySlug).toHaveBeenCalledTimes(2)
  })

  it('keeps the headline tile when core CPI fails without inventing a value', async () => {
    vi.spyOn(dashboardEconomicSeriesRepository, 'getBySlug')
      .mockImplementation(async (slug) => {
        if (slug.includes('core')) throw new Error('Unavailable')
        return series(slug, [1.6])
      })
    render(<StatusDashboardPage />)
    expect(await screen.findByText('1.6%')).toBeVisible()
    expect(screen.getByText('Core unavailable')).toBeVisible()
  })

  it('isolates a headline failure inside the dashboard content', async () => {
    vi.spyOn(dashboardEconomicSeriesRepository, 'getBySlug')
      .mockRejectedValue(new Error('Unavailable'))
    render(<StatusDashboardPage />)
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Inflation data is temporarily unavailable.',
    )
    expect(screen.getByRole('heading', { name: 'Economy status' })).toBeVisible()
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
