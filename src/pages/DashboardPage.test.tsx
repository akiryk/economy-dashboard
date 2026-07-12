import { cleanup, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type {
  EconomicFrequency,
  EconomicObservation,
} from '../features/economic-series/models/economicSeries'
import { localEconomicSeriesRepository } from '../features/economic-series/repositories/localEconomicSeriesRepository'
import { DashboardPage } from './DashboardPage'

const chartPropsSpy = vi.hoisted(() => vi.fn())

vi.mock('../features/economic-series/charts/EconomicTimeSeriesChart', () => ({
  default: (props: {
    observations: readonly EconomicObservation[]
    seriesName: string
    frequency: EconomicFrequency
    includeZero: boolean
  }) => {
    chartPropsSpy(props)
    return <div data-testid={`chart-${props.seriesName}`} />
  },
}))

afterEach(() => {
  cleanup()
  chartPropsSpy.mockClear()
  vi.restoreAllMocks()
})

describe('DashboardPage economic series', () => {
  it('renders independent GDP and CPI cards with frequency-aware content', async () => {
    const user = userEvent.setup()
    render(<DashboardPage />)

    const gdpCard = await screen.findByRole('article', {
      name: 'Is the U.S. economy growing?',
    })
    const cpiCard = await screen.findByRole('article', {
      name: 'How quickly are consumer prices rising?',
    })

    await user.click(within(gdpCard).getByText('Series details'))
    await user.click(within(cpiCard).getByText('Series details'))
    expect(within(gdpCard).getByText('Quarterly')).toBeVisible()
    expect(within(gdpCard).getAllByText('2026 Q1')).not.toHaveLength(0)
    expect(within(cpiCard).getByText('Monthly')).toBeVisible()
    expect(within(cpiCard).getAllByText('May 2026')).not.toHaveLength(0)
    expect(
      within(cpiCard).getByText('U.S. Bureau of Labor Statistics via FRED'),
    ).toBeVisible()
    await user.click(within(gdpCard).getByText('Recent observations'))
    await user.click(within(cpiCard).getByText('Recent observations'))
    expect(
      within(gdpCard).getByRole('table', {
        name: 'Eight most recent real GDP growth observations',
      }),
    ).toBeVisible()
    expect(
      within(cpiCard).getByRole('table', {
        name: 'Twelve most recent headline CPI inflation observations',
      }),
    ).toBeVisible()
  })

  it('organizes all indicators into visible semantic sections', async () => {
    render(<DashboardPage />)

    const growth = screen.getByRole('region', { name: 'Growth' })
    const prices = screen.getByRole('region', { name: 'Prices' })
    const employment = screen.getByRole('region', {
      name: 'Employment and income',
    })
    expect(
      within(growth).getByText(
        /Growth measures how much the economy is producing/,
      ),
    ).toBeVisible()
    expect(
      within(prices).getByText(
        /Price measures describe how quickly the cost of goods and services is changing/,
      ),
    ).toBeVisible()
    expect(
      await within(growth).findByRole('heading', {
        level: 3,
        name: 'Is the U.S. economy growing?',
      }),
    ).toBeVisible()
    expect(
      await within(prices).findByRole('heading', {
        level: 3,
        name: 'How quickly are consumer prices rising?',
      }),
    ).toBeVisible()
    expect(
      within(employment).getByText(
        'Labor-market indicators show how readily people can find work and how broadly employment is distributed. No single measure fully captures labor-market strength.',
      ),
    ).toBeVisible()
    const laborQuestions = await within(employment).findAllByRole('heading', {
      level: 3,
    })
    expect(laborQuestions.map((heading) => heading.textContent)).toEqual([
      'How difficult is it for people who want work to find it?',
      'What share of prime-age adults are employed?',
    ])
    expect(
      within(employment).queryByRole('article', { name: /payroll/i }),
    ).not.toBeInTheDocument()
    expect(
      within(employment).queryByRole('article', { name: /wage/i }),
    ).not.toBeInTheDocument()
    expect(
      await screen.findByText(
        'Latest observations range from 2026 Q1 to June 2026',
      ),
    ).toBeVisible()
  })

  it('renders labor levels with monthly context and accessible tables', async () => {
    const user = userEvent.setup()
    render(<DashboardPage />)

    const unemployment = await screen.findByRole('article', {
      name: 'How difficult is it for people who want work to find it?',
    })
    const primeAge = await screen.findByRole('article', {
      name: 'What share of prime-age adults are employed?',
    })

    expect(within(unemployment).getByLabelText('Latest unemployment rate'))
      .toHaveTextContent('4.2%')
    expect(within(primeAge).getByLabelText('Latest prime-age employment ratio'))
      .toHaveTextContent('80.2%')
    expect(within(unemployment).getAllByText('June 2026')).not.toHaveLength(0)
    expect(within(primeAge).getAllByText('June 2026')).not.toHaveLength(0)
    expect(within(unemployment).getByText(/ranged from/)).not.toHaveTextContent(
      'below zero',
    )
    expect(within(primeAge).getByText(/ranged from/)).not.toHaveTextContent(
      'below zero',
    )
    await waitFor(() => {
      const zeroPolicies = Object.fromEntries(
        chartPropsSpy.mock.calls.map((call) => {
          const props = call[0] as { seriesName: string; includeZero: boolean }
          return [props.seriesName, props.includeZero]
        }),
      )
      expect(zeroPolicies).toMatchObject({
        'Real GDP growth': true,
        'CPI inflation': true,
        Unemployment: false,
        'Prime-age employment': false,
      })
    })

    await user.click(within(unemployment).getByText('Recent observations'))
    await user.click(within(primeAge).getByText('Recent observations'))
    expect(
      within(unemployment).getByRole('table', {
        name: 'Twelve most recent unemployment rate observations',
      }),
    ).toBeVisible()
    expect(
      within(primeAge).getByRole('table', {
        name: 'Twelve most recent prime-age employment ratio observations',
      }),
    ).toBeVisible()
    expect(
      within(unemployment).getByRole('button', { name: '5 years' }),
    ).toBeVisible()
    expect(
      within(primeAge).getByRole('button', { name: '5 years' }),
    ).toBeVisible()
  })

  it('shows one current callout and plain related indicators per card', async () => {
    render(<DashboardPage />)
    const gdpCard = await screen.findByRole('article', {
      name: 'Is the U.S. economy growing?',
    })
    const cpiCard = await screen.findByRole('article', {
      name: 'How quickly are consumer prices rising?',
    })

    expect(within(gdpCard).getByLabelText('Latest real GDP growth')).toBeVisible()
    expect(within(cpiCard).getByLabelText('Latest CPI inflation')).toBeVisible()
    for (const label of ['Productivity', 'Employment', 'Real income']) {
      const indicator = within(gdpCard).getByText(label)
      expect(indicator).toBeVisible()
      expect(indicator.closest('a')).toBeNull()
    }
    for (const label of ['Wage growth', 'Core inflation', 'Consumer spending']) {
      const indicator = within(cpiCard).getByText(label)
      expect(indicator).toBeVisible()
      expect(indicator.closest('a')).toBeNull()
    }
  })

  it('updates the CPI range without changing the GDP selection', async () => {
    const user = userEvent.setup()
    render(<DashboardPage />)
    const gdpCard = await screen.findByRole('article', {
      name: 'Is the U.S. economy growing?',
    })
    const cpiCard = await screen.findByRole('article', {
      name: 'How quickly are consumer prices rising?',
    })

    await user.click(within(cpiCard).getByRole('button', { name: '5 years' }))

    expect(
      within(cpiCard).getByRole('button', { name: '5 years' }),
    ).toHaveAttribute('aria-pressed', 'true')
    expect(
      within(gdpCard).getByRole('button', { name: '20 years' }),
    ).toHaveAttribute('aria-pressed', 'true')
    await waitFor(() => {
      const cpiCall = chartPropsSpy.mock.calls
        .map(
          (call) =>
            call[0] as {
              seriesName: string
              observations: EconomicObservation[]
            },
        )
        .filter((props) => props.seriesName === 'CPI inflation')
        .at(-1)
      expect(cpiCall?.observations[0]?.date).toBe('2021-05-01')
    })
  })

  it('keeps GDP visible when CPI loading fails', async () => {
    const originalGetBySlug =
      localEconomicSeriesRepository.getBySlug.bind(localEconomicSeriesRepository)
    vi.spyOn(localEconomicSeriesRepository, 'getBySlug').mockImplementation(
      async (slug) => {
        if (slug === 'headline-cpi-inflation') {
          throw new Error('Invalid CPI fixture')
        }
        return originalGetBySlug(slug)
      },
    )
    vi.spyOn(console, 'error').mockImplementation(() => undefined)

    render(<DashboardPage />)

    expect(
      await screen.findByRole('article', {
        name: 'Is the U.S. economy growing?',
      }),
    ).toBeVisible()
    expect(
      await screen.findByText(
        'The headline CPI inflation data could not be loaded.',
      ),
    ).toBeVisible()
    expect(
      within(screen.getByRole('region', { name: 'Prices' })).getByRole('alert'),
    ).toBeVisible()
  })

  it('keeps CPI visible when GDP loading fails', async () => {
    const originalGetBySlug =
      localEconomicSeriesRepository.getBySlug.bind(localEconomicSeriesRepository)
    vi.spyOn(localEconomicSeriesRepository, 'getBySlug').mockImplementation(
      async (slug) => {
        if (slug === 'real-gdp-growth') throw new Error('Invalid GDP fixture')
        return originalGetBySlug(slug)
      },
    )
    vi.spyOn(console, 'error').mockImplementation(() => undefined)

    render(<DashboardPage />)

    expect(
      await screen.findByRole('article', {
        name: 'How quickly are consumer prices rising?',
      }),
    ).toBeVisible()
    expect(
      within(screen.getByRole('region', { name: 'Growth' })).getByRole('alert'),
    ).toHaveTextContent('The real GDP data could not be loaded.')
  })

  it.each([
    [
      'unemployment-rate',
      'What share of prime-age adults are employed?',
      'The unemployment rate data could not be loaded.',
    ],
    [
      'prime-age-employment-ratio',
      'How difficult is it for people who want work to find it?',
      'The prime-age employment-to-population ratio data could not be loaded.',
    ],
  ])(
    'keeps every other section and labor card visible when %s fails',
    async (failedSlug, survivingQuestion, failureMessage) => {
      const originalGetBySlug =
        localEconomicSeriesRepository.getBySlug.bind(localEconomicSeriesRepository)
      vi.spyOn(localEconomicSeriesRepository, 'getBySlug').mockImplementation(
        async (slug) => {
          if (slug === failedSlug) throw new Error('Invalid labor fixture')
          return originalGetBySlug(slug)
        },
      )
      vi.spyOn(console, 'error').mockImplementation(() => undefined)

      render(<DashboardPage />)

      expect(await screen.findByRole('article', { name: survivingQuestion }))
        .toBeVisible()
      expect(await screen.findByRole('article', {
        name: 'Is the U.S. economy growing?',
      })).toBeVisible()
      expect(await screen.findByRole('article', {
        name: 'How quickly are consumer prices rising?',
      })).toBeVisible()
      expect(screen.getByText(failureMessage)).toBeVisible()
    },
  )
})
