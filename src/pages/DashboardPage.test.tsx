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
    kind?: string
    observations?: readonly EconomicObservation[]
    seriesName?: string
    frequency: EconomicFrequency
    includeZero?: boolean
    variant?: string
    headlineObservations?: readonly EconomicObservation[]
    coreObservations?: readonly EconomicObservation[]
  }) => {
    chartPropsSpy(props)
    return <div data-testid={`chart-${props.seriesName ?? props.variant}`} />
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
    const gdpTable = within(gdpCard).getByRole('table', {
        name: 'Eight most recent real GDP growth observations',
      })
    expect(gdpTable).toBeVisible()
    expect(within(gdpTable).getAllByRole('row')).toHaveLength(9)
    expect(
      within(cpiCard).getByRole('table', {
        name: 'Twelve most recent headline CPI inflation observations',
      }),
    ).toBeVisible()
  }, 10_000)

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
    const growthQuestions = await within(growth).findAllByRole('heading', {
      level: 3,
    })
    expect(growthQuestions.map((heading) => heading.textContent)).toEqual([
      'Is the U.S. economy growing?',
      'Is economic output growing faster than the population?',
      'Is the economy producing more per hour worked?',
    ])
    expect(
      await within(prices).findByRole('heading', {
        level: 3,
        name: 'How quickly are consumer prices rising?',
      }),
    ).toBeVisible()
    const priceQuestions = await within(prices).findAllByRole('heading', {
      level: 3,
    })
    expect(priceQuestions.map((heading) => heading.textContent)).toEqual([
      'How quickly are consumer prices rising?',
      'Is inflation broad and persistent?',
      'Is inflation currently accelerating or slowing?',
    ])
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
      'Are employers adding jobs?',
      'Are workers’ wages keeping up with prices?',
    ])
    expect(screen.getAllByRole('article')).toHaveLength(10)
    expect(
      within(employment).queryByRole('article', {
        name: 'How much did total nonfarm payroll employment change?',
      }),
    ).not.toBeInTheDocument()
    expect(
      within(employment).queryByRole('article', {
        name: 'How quickly are average hourly earnings rising?',
      }),
    ).not.toBeInTheDocument()
    expect(
      await screen.findByText(
        'Latest observations range from 2026 Q1 to June 2026',
      ),
    ).toBeVisible()
  })

  it('renders both aligned inflation comparisons with accessible values and tables', async () => {
    const user = userEvent.setup()
    render(<DashboardPage />)

    const yearOverYear = await screen.findByRole('article', {
      name: 'Is inflation broad and persistent?',
    })
    const momentum = await screen.findByRole('article', {
      name: 'Is inflation currently accelerating or slowing?',
    })

    expect(within(yearOverYear).getByLabelText('Latest core CPI inflation'))
      .toHaveTextContent('+2.8%')
    expect(within(yearOverYear).getByText(/Corresponding headline rate/))
      .toHaveTextContent('+4.2%')
    expect(within(momentum).getByLabelText(
      'Latest three-month annualized core inflation',
    )).toHaveTextContent('+3.2%')
    expect(within(momentum).getByText(/Corresponding headline rate/))
      .toHaveTextContent('+8.2%')
    expect(within(yearOverYear).getByRole('group', {
      name: 'Headline Versus Core CPI displayed time range',
    })).toBeVisible()
    expect(within(momentum).getByRole('group', {
      name: 'Recent Inflation Momentum displayed time range',
    })).toBeVisible()

    await user.click(within(yearOverYear).getByText('Recent observations'))
    await user.click(within(momentum).getByText('Recent observations'))
    const yearOverYearTable = within(yearOverYear).getByRole('table', {
      name: 'Twelve most recent aligned headline and core CPI observations',
    })
    const momentumTable = within(momentum).getByRole('table', {
      name: 'Twelve most recent aligned inflation momentum observations',
    })
    expect(within(yearOverYearTable).getAllByRole('row')).toHaveLength(13)
    expect(within(momentumTable).getAllByRole('row')).toHaveLength(13)
    expect(within(yearOverYearTable).getAllByRole('row')[1])
      .toHaveTextContent('May 20264.2%2.8%−1.3% pp')
    expect(within(yearOverYearTable).getByLabelText(
      '−1.3% percentage points',
    )).toBeVisible()

    await waitFor(() => {
      const comparisonCalls = chartPropsSpy.mock.calls
        .map((call) => call[0] as {
          kind?: string
          variant?: string
          headlineObservations?: EconomicObservation[]
          coreObservations?: EconomicObservation[]
        })
        .filter((props) => props.kind === 'inflation-comparison')
      expect([...new Set(comparisonCalls.map((props) => props.variant))].sort())
        .toEqual(['momentum', 'year-over-year'])
      expect(comparisonCalls.every((props) =>
        props.headlineObservations?.length === props.coreObservations?.length,
      )).toBe(true)
    })
    expect(screen.queryByRole('article', { name: /PCE/i })).not.toBeInTheDocument()
  })

  it('renders payroll momentum with signed values and a paired recent table', async () => {
    const user = userEvent.setup()
    render(<DashboardPage />)

    const payroll = await screen.findByRole('article', {
      name: 'Are employers adding jobs?',
    })
    const current = within(payroll).getByLabelText('Latest 3-month average')
    expect(current).toHaveTextContent('+111K')
    expect(within(current).getByLabelText('a gain of 111,333 jobs')).toBeVisible()
    expect(within(payroll).getAllByText('June 2026')).not.toHaveLength(0)
    expect(within(payroll).getByText(/three-month average monthly payroll change/))
      .toHaveTextContent('a gain of 111,333 jobs')

    await user.click(within(payroll).getByText('Recent observations'))
    const table = within(payroll).getByRole('table', {
      name: 'Twelve most recent monthly payroll changes and three-month averages',
    })
    expect(within(table).getByRole('columnheader', {
      name: 'Monthly payroll change',
    })).toBeVisible()
    expect(within(table).getByRole('columnheader', {
      name: 'Three-month average',
    })).toBeVisible()
    expect(within(table).getAllByRole('row')).toHaveLength(13)
    expect(within(table).getAllByRole('row')[1]).toHaveTextContent(
      'June 2026+57K+111K',
    )
    for (const label of ['Unemployment', 'Prime-age employment', 'Wage growth']) {
      expect(within(payroll).getByText(label).closest('a')).toBeNull()
    }
  })

  it('renders both quarterly Growth additions with independent controls and accessible detail', async () => {
    const user = userEvent.setup()
    render(<DashboardPage />)

    const perCapita = await screen.findByRole('article', {
      name: 'Is economic output growing faster than the population?',
    })
    const productivity = await screen.findByRole('article', {
      name: 'Is the economy producing more per hour worked?',
    })

    expect(
      within(perCapita).getByLabelText('Latest real GDP per capita growth'),
    ).toHaveTextContent('2.3%')
    expect(
      within(productivity).getByLabelText('Latest labor productivity growth'),
    ).toHaveTextContent('2.8%')
    expect(within(perCapita).getAllByText('2026 Q1')).not.toHaveLength(0)
    expect(within(productivity).getAllByText('2026 Q1')).not.toHaveLength(0)

    for (const [card, label] of [
      [perCapita, 'Real GDP per capita'],
      [productivity, 'Labor productivity'],
    ] as const) {
      expect(
        within(card).getByRole('group', {
          name: `${label} displayed time range`,
        }),
      ).toBeVisible()
      for (const range of ['5 years', '10 years', '20 years', 'Maximum']) {
        expect(within(card).getByRole('button', { name: range })).toBeVisible()
      }
      expect(within(card).getByText(/At least one observation was below zero/))
        .toBeVisible()
      await user.click(within(card).getByText('Recent observations'))
    }

    const perCapitaTable = within(perCapita).getByRole('table', {
      name: 'Eight most recent real GDP per capita growth observations',
    })
    const productivityTable = within(productivity).getByRole('table', {
      name: 'Eight most recent labor productivity growth observations',
    })
    expect(within(perCapitaTable).getAllByRole('row')).toHaveLength(9)
    expect(within(productivityTable).getAllByRole('row')).toHaveLength(9)
    expect(within(perCapitaTable).getAllByRole('row')[1]).toHaveTextContent(
      '2026 Q12.3%',
    )
    expect(within(productivityTable).getAllByRole('row')[1]).toHaveTextContent(
      '2026 Q12.8%',
    )

    await waitFor(() => {
      const chartProps = Object.fromEntries(
        chartPropsSpy.mock.calls.map((call) => {
          const props = call[0] as {
            seriesName: string
            frequency: EconomicFrequency
            includeZero: boolean
          }
          return [props.seriesName, props]
        }),
      )
      expect(chartProps['Real GDP per capita']).toMatchObject({
        frequency: 'quarterly',
        includeZero: true,
      })
      expect(chartProps['Labor productivity']).toMatchObject({
        frequency: 'quarterly',
        includeZero: true,
      })
    })
  })

  it('renders the wages-versus-inflation relationship after payroll', async () => {
    const user = userEvent.setup()
    render(<DashboardPage />)
    const employment = screen.getByRole('region', { name: 'Employment and income' })
    await within(employment).findByRole('article', {
      name: 'Are workers’ wages keeping up with prices?',
    })
    const articles = within(employment).getAllByRole('article')
    expect(articles.map((article) => within(article).getByRole('heading', { level: 3 }).textContent))
      .toEqual([
        'How difficult is it for people who want work to find it?',
        'What share of prime-age adults are employed?',
        'Are employers adding jobs?',
        'Are workers’ wages keeping up with prices?',
      ])
    const comparison = articles[3]!
    expect(within(comparison).getByLabelText('Latest real wage growth'))
      .toHaveTextContent('−0.6%')
    expect(within(comparison).getByText(/nominal wages grew 3.6%/))
      .toHaveTextContent('consumer prices rose 4.2%')
    expect(within(comparison).getByText(/producing negative real wage growth/))
      .toBeVisible()
    await waitFor(() => {
      const call = chartPropsSpy.mock.calls
        .map((item) => item[0] as {
          kind?: string
          nominalObservations?: EconomicObservation[]
          inflationObservations?: EconomicObservation[]
        })
        .find((props) => props.kind === 'comparison')
      expect(call?.nominalObservations).toHaveLength(241)
      expect(call?.inflationObservations).toHaveLength(241)
    })
    await user.click(within(comparison).getByText('Recent observations'))
    const table = within(comparison).getByRole('table', {
      name: 'Twelve most recent wages-versus-inflation observations',
    })
    expect(within(table).getAllByRole('row')).toHaveLength(13)
    for (const heading of [
      'Observation month', 'Nominal wage growth',
      'Headline CPI inflation', 'Real wage growth',
    ]) {
      expect(within(table).getByRole('columnheader', { name: heading })).toBeVisible()
    }
    expect(within(employment).queryByRole('article', {
      name: 'How quickly are average hourly earnings rising?',
    })).not.toBeInTheDocument()
    expect(within(employment).queryByRole('article', { name: /productivity/i }))
      .not.toBeInTheDocument()
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
        'Payroll growth': true,
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

  it('sends complete series history to the chart for Maximum only', async () => {
    const user = userEvent.setup()
    render(<DashboardPage />)
    const gdpCard = await screen.findByRole('article', {
      name: 'Is the U.S. economy growing?',
    })
    const payrollCard = await screen.findByRole('article', {
      name: 'Are employers adding jobs?',
    })

    await user.click(within(gdpCard).getByRole('button', { name: 'Maximum' }))

    await waitFor(() => {
      const gdpCall = chartPropsSpy.mock.calls
        .map((call) => call[0] as {
          seriesName: string
          observations: EconomicObservation[]
        })
        .filter((props) => props.seriesName === 'Real GDP growth')
        .at(-1)
      expect(gdpCall?.observations).toHaveLength(313)
      expect(gdpCall?.observations[0]?.date).toBe('1948-01-01')
    })
    expect(
      within(payrollCard).getByRole('button', { name: '20 years' }),
    ).toHaveAttribute('aria-pressed', 'true')
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
      within(screen.getByRole('region', { name: 'Prices' })).getAllByRole('alert'),
    ).toHaveLength(2)
    expect(await screen.findByRole('article', {
      name: 'Is inflation currently accelerating or slowing?',
    })).toBeVisible()
  })

  it('isolates a headline-versus-core failure from other cards and sections', async () => {
    const originalGetBySlug =
      localEconomicSeriesRepository.getBySlug.bind(localEconomicSeriesRepository)
    vi.spyOn(localEconomicSeriesRepository, 'getBySlug').mockImplementation(
      async (slug) => {
        if (slug === 'core-cpi-inflation') throw new Error('Invalid core CPI fixture')
        return originalGetBySlug(slug)
      },
    )
    vi.spyOn(console, 'error').mockImplementation(() => undefined)

    render(<DashboardPage />)

    expect(await screen.findByText(
      'The headline versus core CPI data could not be loaded.',
    )).toBeVisible()
    expect(await screen.findByRole('article', {
      name: 'How quickly are consumer prices rising?',
    })).toBeVisible()
    expect(await screen.findByRole('article', {
      name: 'Is inflation currently accelerating or slowing?',
    })).toBeVisible()
    expect(await screen.findByRole('article', {
      name: 'How difficult is it for people who want work to find it?',
    })).toBeVisible()
  })

  it('isolates an inflation-momentum failure from the stable comparison', async () => {
    const originalGetBySlug =
      localEconomicSeriesRepository.getBySlug.bind(localEconomicSeriesRepository)
    vi.spyOn(localEconomicSeriesRepository, 'getBySlug').mockImplementation(
      async (slug) => {
        if (slug === 'core-cpi-three-month-annualized') {
          throw new Error('Invalid momentum fixture')
        }
        return originalGetBySlug(slug)
      },
    )
    vi.spyOn(console, 'error').mockImplementation(() => undefined)

    render(<DashboardPage />)

    expect(await screen.findByText(
      'The recent inflation momentum data could not be loaded.',
    )).toBeVisible()
    expect(await screen.findByRole('article', {
      name: 'How quickly are consumer prices rising?',
    })).toBeVisible()
    expect(await screen.findByRole('article', {
      name: 'Is inflation broad and persistent?',
    })).toBeVisible()
    expect(await screen.findByRole('article', {
      name: 'Is the U.S. economy growing?',
    })).toBeVisible()
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
        localEconomicSeriesRepository.getBySlug.bind(
          localEconomicSeriesRepository,
        )
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

  it.each(['payroll-growth', 'monthly-payroll-change'])(
    'shows a payroll error without blocking other cards when %s fails',
    async (failedSlug) => {
      const originalGetBySlug =
        localEconomicSeriesRepository.getBySlug.bind(localEconomicSeriesRepository)
      vi.spyOn(localEconomicSeriesRepository, 'getBySlug').mockImplementation(
        async (slug) => {
          if (slug === failedSlug) throw new Error('Invalid payroll fixture')
          return originalGetBySlug(slug)
        },
      )
      vi.spyOn(console, 'error').mockImplementation(() => undefined)

      render(<DashboardPage />)

      expect(
        await screen.findByText('The payroll growth data could not be loaded.'),
      ).toBeVisible()
      expect(await screen.findByRole('article', {
        name: 'How difficult is it for people who want work to find it?',
      })).toBeVisible()
      expect(await screen.findByRole('article', {
        name: 'What share of prime-age adults are employed?',
      })).toBeVisible()
      expect(await screen.findByRole('article', {
        name: 'Is the U.S. economy growing?',
      })).toBeVisible()
      expect(await screen.findByRole('article', {
        name: 'How quickly are consumer prices rising?',
      })).toBeVisible()
    },
  )

  it.each(['real-wage-growth', 'nominal-wage-growth'])(
    'isolates the wage comparison when %s fails',
    async (failedSlug) => {
      const originalGetBySlug =
        localEconomicSeriesRepository.getBySlug.bind(localEconomicSeriesRepository)
      vi.spyOn(localEconomicSeriesRepository, 'getBySlug').mockImplementation(
        async (slug) => {
          if (slug === failedSlug) throw new Error('Invalid wage fixture')
          return originalGetBySlug(slug)
        },
      )
      vi.spyOn(console, 'error').mockImplementation(() => undefined)
      render(<DashboardPage />)

      expect(await screen.findByText(
        'The wages versus inflation data could not be loaded.',
      )).toBeVisible()
      for (const question of [
        'Is the U.S. economy growing?',
        'How quickly are consumer prices rising?',
        'How difficult is it for people who want work to find it?',
        'What share of prime-age adults are employed?',
        'Are employers adding jobs?',
      ]) {
        expect(await screen.findByRole('article', { name: question })).toBeVisible()
      }
    },
  )

  it.each([
    [
      'real-gdp-per-capita-growth',
      'Is the economy producing more per hour worked?',
      'The real GDP per capita data could not be loaded.',
    ],
    [
      'labor-productivity-growth',
      'Is economic output growing faster than the population?',
      'The labor productivity data could not be loaded.',
    ],
  ])(
    'isolates the new Growth card when %s fails',
    async (failedSlug, survivingQuestion, failureMessage) => {
      const originalGetBySlug =
        localEconomicSeriesRepository.getBySlug.bind(localEconomicSeriesRepository)
      vi.spyOn(localEconomicSeriesRepository, 'getBySlug').mockImplementation(
        async (slug) => {
          if (slug === failedSlug) throw new Error('Invalid Growth fixture')
          return originalGetBySlug(slug)
        },
      )
      vi.spyOn(console, 'error').mockImplementation(() => undefined)

      render(<DashboardPage />)

      expect(await screen.findByText(failureMessage)).toBeVisible()
      for (const question of [
        'Is the U.S. economy growing?',
        survivingQuestion,
        'How quickly are consumer prices rising?',
        'How difficult is it for people who want work to find it?',
      ]) {
        expect(await screen.findByRole('article', { name: question })).toBeVisible()
      }
    },
  )
})
