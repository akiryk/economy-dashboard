import { cleanup, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type {
  EconomicFrequency,
  EconomicObservation,
} from '../features/economic-series/models/economicSeries'
import type { CompactHistoricalMetricDefinition } from '../features/economic-series/utils/compactHistoricalMetrics'
import type { HistoricalBandResult } from '../features/economic-series/utils/historicalBandContext'
import type { InflationDriversSupportingTrendsModel } from '../features/economic-series/utils/inflationCategoryTrends'
import type { RealWageGrowthModel } from '../features/economic-series/utils/realWageGrowth'
import joltsLayoffsData from '../features/economic-series/data/jolts-layoffs-and-discharges-rate.json'
import { validateEconomicSeries } from '../features/economic-series/models/validateEconomicSeries'
import { localEconomicSeriesRepository } from '../features/economic-series/repositories/localEconomicSeriesRepository'
import { formatObservationPeriod } from '../features/economic-series/utils/economicSeries'
import {
  deriveYieldCurveObservations,
  formatYieldCurveAnswer,
  formatYieldCurveSpread,
} from '../features/economic-series/utils/yieldCurveData'
import { DashboardPage } from './DashboardPage'

const joltsLayoffsSeries = validateEconomicSeries(joltsLayoffsData)
const latestJoltsLayoffsPeriod = formatObservationPeriod(
  joltsLayoffsSeries.observations.at(-1)?.date ?? '',
  'monthly',
)

const chartPropsSpy = vi.hoisted(() => vi.fn())
const compactChartPropsSpy = vi.hoisted(() => vi.fn())
const categoryTrendPropsSpy = vi.hoisted(() => vi.fn())
const realWageChartPropsSpy = vi.hoisted(() => vi.fn())

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
    movingAverageObservations?: readonly EconomicObservation[]
    weeklyClaimsObservations?: readonly EconomicObservation[]
  }) => {
    chartPropsSpy(props)
    return <div data-testid={`chart-${props.seriesName ?? props.variant}`} />
  },
}))

vi.mock('../features/economic-series/charts/CompactHistoricalMetricChart', () => ({
  CompactHistoricalMetricChart: ({
    model,
    definition,
  }: {
    model: HistoricalBandResult
    definition: CompactHistoricalMetricDefinition
  }) => {
    compactChartPropsSpy({ model, definition })
    return <figure
      data-testid="production-compact-chart"
      data-status={model.status}
      data-series-label={definition.seriesLabel}
      data-show-zero={definition.showZeroLine}
      data-interactive={definition.interactiveDetails}
    />
  },
}))

vi.mock('../features/economic-series/charts/InflationCategoryTrendCharts', () => ({
  InflationCategoryTrendCharts: ({
    model,
  }: {
    model: InflationDriversSupportingTrendsModel
  }) => {
    categoryTrendPropsSpy(model)
    return (
      <div data-testid="inflation-category-trends">
        {model.trends.map((trend) => (
          <div key={trend.contributionCategoryId}>
            <span>{trend.label}</span>
            <span>{trend.currentInflationRate.toFixed(1)}%</span>
          </div>
        ))}
      </div>
    )
  },
}))

vi.mock('../features/economic-series/charts/RealWageGrowthChart', () => ({
  RealWageGrowthChart: ({
    model,
    accessibleSummary,
    variant,
  }: {
    model: RealWageGrowthModel
    accessibleSummary: string
    variant?: 'compact' | 'expanded'
  }) => {
    realWageChartPropsSpy({ model, variant: variant ?? 'compact' })
    return (
      <figure
        data-testid="real-wage-growth-chart"
        data-zero-baseline="true"
        data-variant={variant ?? 'compact'}
        aria-label={accessibleSummary}
      />
    )
  },
}))

vi.mock('../features/economic-series/charts/JobGrowthBreakevenChart', () => ({
  JobGrowthBreakevenChart: () => (
    <figure
      data-testid="job-growth-breakeven-chart"
      data-zero-line="true"
      data-latest-marker="true"
      data-interactive="true"
    />
  ),
}))

vi.mock('../features/economic-series/charts/JoltsLayoffsChart', () => ({
  default: ({ model }: { model: HistoricalBandResult }) => (
    <figure
      data-testid="jolts-layoffs-chart"
      data-status={model.status}
      data-zero-line="false"
      data-interactive="true"
    />
  ),
}))

afterEach(() => {
  cleanup()
  chartPropsSpy.mockClear()
  compactChartPropsSpy.mockClear()
  categoryTrendPropsSpy.mockClear()
  realWageChartPropsSpy.mockClear()
  vi.restoreAllMocks()
})

describe('DashboardPage economic series', () => {
  it('loads each compact Growth series once for both compact and expanded views', async () => {
    const getBySlug = vi.spyOn(localEconomicSeriesRepository, 'getBySlug')

    render(<DashboardPage />)

    await screen.findByRole('article', {
      name: 'Is economic output growing faster than the population?',
    })
    await waitFor(() => {
      for (const slug of [
        'real-gdp-growth',
        'real-gdp-per-capita-growth',
        'labor-productivity-growth',
      ]) {
        expect(
          getBySlug.mock.calls.filter(([requestedSlug]) => requestedSlug === slug),
        ).toHaveLength(1)
      }
    })
  })

  it('does not reload claims data when the dashboard rerenders', async () => {
    const getBySlug = vi.spyOn(localEconomicSeriesRepository, 'getBySlug')
    const { rerender } = render(<DashboardPage />)

    await waitFor(() => {
      expect(
        getBySlug.mock.calls.filter(
          ([slug]) => slug === 'jolts-layoffs-and-discharges-rate',
        ),
      ).toHaveLength(1)
    })
    rerender(<DashboardPage />)

    await waitFor(() => {
      expect(
        getBySlug.mock.calls.filter(
          ([slug]) => slug === 'jolts-layoffs-and-discharges-rate',
        ),
      ).toHaveLength(1)
    })
  })

  it('provides a collapsed navigation whose links target each full card', async () => {
    const user = userEvent.setup()
    render(<DashboardPage />)

    const navigation = screen.getByRole('region', {
      name: 'Explore all indicators',
    })
    const disclosure = within(navigation).getByText('Explore all indicators')

    expect(within(navigation).getByText('25 cards in 9 categories')).toBeVisible()
    expect(disclosure.closest('details')).not.toHaveAttribute('open')

    await user.click(disclosure)

    const links = within(navigation).getAllByRole('link')
    expect(links).toHaveLength(25)
    expect(links.map((link) => link.textContent)).toEqual([
      'Is the U.S. economy growing?',
      'Is economic output growing faster than the population?',
      'Is the economy producing more per hour worked?',
      'How quickly are consumer prices rising?',
      'What is driving inflation?',
      'Has inflation picked up in recent months?',
      'Are workers’ wages keeping up with prices?',
      'Is unemployment high or low?',
      'What share of prime-age adults are employed?',
      'Are employers adding jobs?',
      'Is job growth keeping up with the labor force?',
      'Are layoffs beginning to rise?',
      'Are households saving less of their income?',
      'How much of a median household’s income would it take to own a typical home?',
      'How much new housing is being started?',
      'Are U.S. manufacturers producing more goods?',
      'Are businesses investing more in productive assets?',
      'How large are corporate profits relative to the economy?',
      'Is the yield curve inverted?',
      'Are credit conditions tighter or looser than usual?',
      'Are banks making it harder to borrow?',
      'How large is the federal budget deficit or surplus relative to the economy?',
      'How large is federal debt held by the public relative to the economy?',
      'How large is the U.S. trade balance relative to the economy?',
      'What share of imported goods is collected as customs duties?',
    ])

    const gdpCard = await screen.findByRole('article', {
      name: 'Is the U.S. economy growing?',
    })
    expect(links[0]).toHaveAttribute('href', '#real-gdp-growth-card')
    expect(gdpCard).toHaveAttribute('id', 'real-gdp-growth-card')
    expect(gdpCard.querySelector('h3')).not.toHaveAttribute(
      'id',
      'real-gdp-growth-card',
    )
  })

  it('renders independent GDP and CPI cards with frequency-aware content', async () => {
    const user = userEvent.setup()
    render(<DashboardPage />)

    const gdpCard = await screen.findByRole('article', {
      name: 'Is the U.S. economy growing?',
    })
    const cpiCard = await screen.findByRole('article', {
      name: 'How quickly are consumer prices rising?',
    })

    expect(within(gdpCard).getByTestId('production-compact-chart')).toHaveAttribute(
      'data-status',
      'ready',
    )
    expect(
      within(cpiCard).getByTestId('production-compact-chart'),
    ).toHaveAttribute('data-series-label', 'CPI inflation')

    await user.click(within(gdpCard).getByRole('button', { name: /More/ }))
    await user.click(within(cpiCard).getByRole('button', { name: /More/ }))
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

  it('renders compact CPI interpretation and expands to distinct core and PCE comparisons', async () => {
    const user = userEvent.setup()
    const getBySlug = vi.spyOn(localEconomicSeriesRepository, 'getBySlug')
    render(<DashboardPage />)

    const card = await screen.findByRole('article', {
      name: 'How quickly are consumer prices rising?',
    })
    expect(within(card).getByText(
      'Consumer Price Index: Percent Change from Year Ago',
    )).toBeVisible()
    const callout = within(card).getByLabelText(
      /CPI inflation was 3.5% in June 2026/,
    )
    expect(callout).toHaveTextContent('Consumer prices are rising somewhat quickly.')
    expect(callout).toHaveTextContent(
      'CPI inflation is 1.5 percentage points above the 2% policy reference.',
    )
    expect(within(card).getByTestId('production-compact-chart')).toHaveAttribute(
      'data-series-label',
      'CPI inflation',
    )
    expect(within(card).getByRole('button', { name: /More/ })).toHaveAttribute(
      'aria-expanded',
      'false',
    )
    expect(within(card).queryByRole('group', {
      name: 'CPI inflation displayed time range',
    })).not.toBeInTheDocument()

    await waitFor(() => {
      expect(
        getBySlug.mock.calls.some(
          ([requested]) => requested === 'headline-pce-inflation',
        ),
      ).toBe(true)
    })
    const loadsBeforeExpansion = new Map(
      [
        'headline-cpi-inflation',
        'headline-pce-inflation',
        'core-cpi-inflation',
      ].map((slug) => [
        slug,
        getBySlug.mock.calls.filter(([requested]) => requested === slug).length,
      ]),
    )

    await user.click(within(card).getByRole('button', { name: /More/ }))
    for (const [slug, loadCount] of loadsBeforeExpansion) {
      expect(
        getBySlug.mock.calls.filter(([requested]) => requested === slug),
      ).toHaveLength(loadCount)
    }
    expect(within(card).getByRole('heading', {
      level: 4,
      name: 'What is the underlying inflation trend?',
    })).toBeVisible()
    expect(within(card).getByText(/Core CPI was 2.6% in June 2026/))
      .toHaveTextContent('The headline-core gap was +0.9 percentage points.')
    expect(within(card).getByText(/Food and energy are currently adding/))
      .toBeVisible()
    expect(within(card).getByRole('link', {
      name: 'What is driving inflation?',
    })).toHaveAttribute('href', '#inflation-drivers-card')
    expect(within(card).getByRole('heading', {
      level: 4,
      name: 'How does CPI compare with the Fed’s preferred inflation measure?',
    })).toBeVisible()
    expect(within(card).getByText(/PCE covers a broader range/)).toBeVisible()
    expect(within(card).getByText(/PCE inflation was .+ in .+/))
      .toHaveTextContent(/PCE inflation is .+ percentage points? (above|below) the Federal Reserve’s 2% target/)
    expect(within(card).getByRole('link', {
      name: /PCEPI.*Bureau of Economic Analysis via FRED/,
    })).toHaveAttribute('href', 'https://fred.stlouisfed.org/series/PCEPI')

    await waitFor(() => {
      const comparison = chartPropsSpy.mock.calls
        .map((call) => call[0] as {
          variant?: string
          headlineObservations?: EconomicObservation[]
          coreObservations?: EconomicObservation[]
        })
        .find(({ variant }) => variant === 'cpi-pce')
      expect(comparison?.headlineObservations?.length).toBeGreaterThan(0)
      expect(comparison?.coreObservations?.length).toBeGreaterThan(0)
    })
    await waitFor(() => {
      const comparison = chartPropsSpy.mock.calls
        .map((call) => call[0] as {
          variant?: string
          headlineObservations?: EconomicObservation[]
          coreObservations?: EconomicObservation[]
        })
        .find(({ variant }) => variant === 'year-over-year')
      expect(comparison?.headlineObservations?.at(-1)?.date)
        .toBe(comparison?.coreObservations?.at(-1)?.date)
    })

    await user.click(within(card).getByRole('button', { name: /Less/ }))
    expect(within(card).queryByText(/PCE covers a broader range/))
      .not.toBeInTheDocument()
  })

  it('organizes all indicators into visible semantic sections', async () => {
    render(<DashboardPage />)

    const growth = screen.getByRole('region', { name: 'Growth' })
    const prices = screen.getByRole('region', { name: 'Prices' })
    const employment = screen.getByRole('region', {
      name: 'Employment and income',
    })
    const households = screen.getByRole('region', { name: 'Households' })
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
      'What is driving inflation?',
      'Has inflation picked up in recent months?',
      'Are workers’ wages keeping up with prices?',
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
      'Is unemployment high or low?',
      'What share of prime-age adults are employed?',
      'Are employers adding jobs?',
      'Is job growth keeping up with the labor force?',
      'Are layoffs beginning to rise?',
    ])
    expect(screen.getAllByRole('article')).toHaveLength(25)
    expect(within(households).getAllByRole('article').map((card) => card.getAttribute('aria-labelledby'))).toEqual([
      'personal-saving-rate-question',
    ])
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
      await screen.findByText(/Latest observations range from .+ to .+/),
    ).toBeVisible()
  })

  it('renders inflation drivers and the remaining aligned momentum comparison', async () => {
    const user = userEvent.setup()
    render(<DashboardPage />)

    const drivers = await screen.findByRole('article', {
      name: 'What is driving inflation?',
    })
    const momentum = await screen.findByRole('article', {
      name: 'Has inflation picked up in recent months?',
    })

    expect(within(drivers).getByText('Category contributions to overall CPI inflation'))
      .toBeVisible()
    expect(within(drivers).getByText('Inflation is broad across several categories.'))
      .toBeVisible()
    expect(within(drivers).queryByText('3.5%', {
      selector: '.series-current__value',
    })).not.toBeInTheDocument()
    expect(within(drivers).getByText(
      /Percentage points added to or subtracted from the latest 3.5% CPI increase/,
    )).toBeVisible()
    expect(within(drivers).getAllByText('Energy')).toHaveLength(2)
    expect(within(drivers).getByText('+1.1 pp')).toBeVisible()
    expect(within(drivers).getByText('Everything else')).toBeVisible()
    expect(within(drivers).getByText(
      'Contribution to inflation over the past 12 months',
    )).toBeVisible()
    await user.click(within(drivers).getByRole('button', {
      name: 'Explain overall CPI inflation',
    }))
    expect(within(drivers).getByRole('dialog', {
      name: 'Overall CPI inflation explanation',
    })).toHaveTextContent(
      'Overall, or “headline,” CPI inflation includes all consumer-price categories, including food and energy.',
    )
    expect(within(drivers).getByRole('dialog', {
      name: 'Overall CPI inflation explanation',
    })).toHaveTextContent('core CPI, which excludes food and energy')
    await user.keyboard('{Escape}')
    expect(within(drivers).getByText('Inflation rate over five years')).toBeVisible()
    expect(within(drivers).getByText(
      'Shown for current contributors with a directly comparable CPI series.',
    )).toBeVisible()
    expect(within(momentum).getByText(
      'No — inflation has been slowing in recent months.',
    )).toBeVisible()
    expect(within(momentum).getByText('20% slower')).toBeVisible()
    expect(within(momentum).getByText(
      'Recent annualized pace compared with the past-year inflation rate',
    )).toBeVisible()
    expect(within(momentum).getByText(
      '+2.8% versus +3.5%, a difference of 0.7 percentage points.',
    )).toBeVisible()
    expect(within(momentum).getByText('Past 12 months')).toBeVisible()
    expect(within(momentum).getByText('Latest 3 months, annualized')).toBeVisible()
    expect(within(momentum).getByText('+3.5%')).toBeVisible()
    expect(within(momentum).getByText('+2.8%')).toBeVisible()
    expect(within(momentum).getByText(
      '0.7 percentage points slower',
    )).toBeVisible()
    expect(momentum.querySelector(
      '.recent-inflation-momentum__slope-plot[data-direction="down"]',
    )).toBeInTheDocument()
    expect(momentum.querySelector(
      '.recent-inflation-momentum__reference',
    )).toBeInTheDocument()
    expect(momentum.querySelector(
      '.recent-inflation-momentum__track',
    )).not.toBeInTheDocument()
    expect(momentum.querySelector('svg area')).not.toBeInTheDocument()
    expect(within(momentum).getByText(
      /The graphic compares two measurement windows rather than consecutive observations/,
    )).toHaveTextContent('the recent-minus-past-year difference was −0.7 percentage points')
    expect(within(momentum).getByText(
      /The graphic compares two measurement windows rather than consecutive observations/,
    )).toHaveTextContent('it is not a forecast')
    await user.click(within(momentum).getByRole('button', {
      name: 'Explain recent inflation momentum',
    }))
    expect(within(momentum).getByRole('dialog')).toHaveTextContent(
      'does not predict what inflation will be next year',
    )
    expect(within(momentum).getByRole('dialog')).toHaveTextContent(
      'Both compact values use overall, or headline, CPI',
    )
    expect(within(momentum).getByRole('dialog')).toHaveTextContent(
      'past-year rate is at least 0.5% in absolute value',
    )
    expect(momentum).not.toHaveTextContent(
      /inflation fell 20%|CPI declined 20%|prices fell 20%/i,
    )
    await user.keyboard('{Escape}')
    expect(within(drivers).queryByRole('group', {
      name: /displayed time range/,
    })).not.toBeInTheDocument()
    expect(within(momentum).queryByRole('group', {
      name: 'Recent Inflation Momentum displayed time range',
    })).not.toBeInTheDocument()

    await user.click(within(drivers).getByRole('button', {
      name: 'Explain inflation contributions',
    }))
    expect(within(drivers).getByRole('dialog', {
      name: 'Inflation contribution explanation',
    })).toHaveTextContent('Each mini-chart uses its own vertical scale')
    expect(within(drivers).getByRole('dialog', {
      name: 'Inflation contribution explanation',
    })).toHaveTextContent(
      'expanded displayed range is no more than twice the natural padded range',
    )
    expect(within(drivers).getByRole('dialog', {
      name: 'Inflation contribution explanation',
    })).toHaveTextContent('left and right arrow keys')
    await user.keyboard('{Escape}')
    expect(within(drivers).queryByRole('dialog')).not.toBeInTheDocument()
    expect(within(drivers).getByRole('button', {
      name: 'Explain inflation contributions',
    })).toHaveFocus()

    await waitFor(() => expect(categoryTrendPropsSpy).toHaveBeenCalled())
    const trendModel = categoryTrendPropsSpy.mock.calls.at(-1)?.[0] as
      InflationDriversSupportingTrendsModel
    expect(trendModel.trends.map(({ contributionCategoryId }) =>
      contributionCategoryId)).toEqual([
      'shelter', 'energy', 'food',
    ])
    expect(trendModel.unsupportedCategoryIds).toEqual(['other-services'])
    expect(trendModel).toMatchObject({
      windowStart: '2021-06-01',
      windowEnd: '2026-06-01',
    })
    expect(trendModel.trends.every(({ domain }) => domain.min < domain.max))
      .toBe(true)
    expect(new Set(trendModel.trends.map(({ displayRangeLabel }) =>
      displayRangeLabel)).size).toBe(3)
    expect(trendModel.trends.every(({ domain, displayRangeLabel }) =>
      domain.includesZero && displayRangeLabel.startsWith(
        domain.min === 0 ? '0%' : '−',
      ))).toBe(true)
    expect(trendModel.trends.every(({ observations }) =>
      observations.some(({ date, value }) =>
        date === '2025-10-01' && value === null))).toBe(true)
    const accessibleSummary = within(drivers).getByText(
      /Headline CPI contribution period: June 2026/,
    )
    expect(accessibleSummary).toHaveClass('visually-hidden')
    expect(accessibleSummary).toHaveTextContent(
      'Trend coverage runs from June 2021 through June 2026',
    )
    expect(accessibleSummary).toHaveTextContent(
      'Selected categories omitted because no directly comparable CPI series exists: Other services',
    )
    expect(accessibleSummary).toHaveTextContent(
      'Left-side values are percentage-point contributions; right-side values are year-over-year percent changes',
    )
    expect(accessibleSummary).toHaveTextContent(
      'Each rate chart uses its own labeled vertical scale',
    )

    await user.click(within(drivers).getByRole('button', { name: /More/ }))
    await user.click(within(momentum).getByRole('button', { name: /More/ }))
    expect(within(momentum).getByRole('group', {
      name: 'Recent Inflation Momentum displayed time range',
    })).toBeVisible()
    expect(within(momentum).getByText(
      '12-month headline and core CPI',
    )).toBeVisible()
    expect(within(momentum).getByText(
      'Three-month annualized headline and core CPI',
    )).toBeVisible()
    await user.click(within(momentum).getByRole('button', {
      name: '5 years',
    }))
    expect(within(momentum).getByRole('button', {
      name: '5 years',
    })).toHaveAttribute('aria-pressed', 'true')
    await user.click(within(momentum).getByText('Recent three-month observations'))
    const driverTable = within(drivers).getByRole('table', {
      name: 'CPI category contributions in June 2026 and June 2025',
    })
    const momentumTable = within(momentum).getByRole('table', {
      name: 'Twelve most recent aligned inflation momentum observations',
    })
    expect(within(driverTable).getAllByRole('row')).toHaveLength(6)
    expect(within(momentumTable).getAllByRole('row')).toHaveLength(13)
    expect(within(driverTable).getAllByRole('row')[1])
      .toHaveTextContent('Shelter+1.2 pp+1.4 ppdown 0.2 percentage points')
    await user.click(within(drivers).getByRole('button', { name: /Less/ }))
    expect(within(drivers).queryByRole('table', {
      name: 'CPI category contributions in June 2026 and June 2025',
    })).not.toBeInTheDocument()
    expect(within(drivers).getByTestId('inflation-category-trends'))
      .toBeVisible()
    await user.click(within(momentum).getByRole('button', { name: /Less/ }))
    expect(within(momentum).queryByText(
      '12-month headline and core CPI',
    )).not.toBeInTheDocument()
    expect(within(momentum).getByText('Past 12 months')).toBeVisible()
    await user.click(within(momentum).getByRole('button', { name: /More/ }))
    expect(within(momentum).getByRole('button', {
      name: '5 years',
    })).toHaveAttribute('aria-pressed', 'true')

    await waitFor(() => {
      const comparisonCalls = chartPropsSpy.mock.calls
        .map((call) => call[0] as {
          kind?: string
          variant?: string
          headlineObservations?: EconomicObservation[]
          coreObservations?: EconomicObservation[]
        })
        .filter((props) => props.kind === 'inflation-comparison')
      expect([...new Set(comparisonCalls.map((props) => props.variant))])
        .toEqual(['year-over-year', 'momentum'])
      expect(comparisonCalls.every((props) =>
        props.headlineObservations?.length === props.coreObservations?.length,
      )).toBe(true)
    })
    expect(screen.queryByRole('article', { name: /PCE/i })).not.toBeInTheDocument()
  }, 10_000)

  it('renders payroll momentum with signed values and a paired recent table', async () => {
    const user = userEvent.setup()
    render(<DashboardPage />)

    const payroll = await screen.findByRole('article', {
      name: 'Are employers adding jobs?',
    })
    const current = within(payroll).getByLabelText(
      /The latest three-month average was \+111K in June 2026/,
    )
    expect(current).toHaveTextContent('+111K')
    expect(current).toHaveTextContent('Latest three-month average')
    expect(current).toHaveTextContent(
      'Yes. Employers are adding jobs at a typical pace by historical standards.',
    )
    expect(current).toHaveAccessibleName(
      /middle 50% ranges from \+66K to \+218K.*middle 80% ranges from −136K to \+287K/,
    )
    expect(within(current).getByLabelText('a gain of 111,333 jobs')).toBeVisible()
    expect(within(payroll).getByTestId('production-compact-chart'))
      .toHaveAttribute('data-show-zero', 'true')
    expect(within(payroll).getByTestId('production-compact-chart'))
      .toHaveAttribute('data-interactive', 'true')
    expect(within(payroll).queryByRole('button', { name: '5 years' }))
      .not.toBeInTheDocument()

    await user.click(within(payroll).getByRole('button', { name: /More/ }))
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
    await user.click(within(payroll).getByRole('button', { name: /Less/ }))
    expect(within(payroll).queryByRole('table', {
      name: 'Twelve most recent monthly payroll changes and three-month averages',
    })).not.toBeInTheDocument()
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
    ).toHaveTextContent(/%/)
    expect(
      within(perCapita).getByLabelText('Latest real GDP per capita growth'),
    ).toHaveTextContent(/\d{4} Q[1-4]/)
    expect(within(perCapita).getByTestId('production-compact-chart')).toHaveAttribute(
      'data-series-label',
      'Real GDP per capita growth',
    )
    expect(within(perCapita).getByRole('button', { name: /More/ })).toHaveAttribute(
      'aria-expanded',
      'false',
    )
    const productivityCallout = within(productivity).getByLabelText(
      /Productivity was 2.8% higher than a year ago in 2026 Q1/,
    )
    expect(productivityCallout).toHaveTextContent('2.8%')
    expect(productivityCallout).toHaveTextContent(
      'Yes, productivity is higher than a year ago.',
    )
    expect(productivityCallout).toHaveTextContent(
      '2026 Q1 · Percent change from year ago',
    )
    expect(productivityCallout).toHaveTextContent(
      'The pace of productivity growth has accelerated by 0.8 percentage points from a year earlier.',
    )
    expect(productivityCallout).toHaveAccessibleName(
      'Productivity was 2.8% higher than a year ago in 2026 Q1. Yes, the economy is producing more per hour worked. The pace of productivity growth has accelerated by 0.8 percentage points from a year earlier.',
    )
    expect(within(productivity).getByText(
      'Real labor productivity: percent change from year ago',
    )).toBeVisible()
    expect(within(productivity).getByTestId('production-compact-chart')).toHaveAttribute(
      'data-series-label',
      'Productivity growth',
    )
    expect(within(productivity).getByRole('button', { name: /More/ })).toHaveAttribute(
      'aria-expanded',
      'false',
    )
    expect(within(productivity).queryByRole('group', {
      name: 'Productivity momentum displayed time range',
    })).not.toBeInTheDocument()

    await user.click(within(perCapita).getByRole('button', { name: /More/ }))
    await user.click(within(productivity).getByRole('button', { name: /More/ }))

    for (const [card, label] of [
      [perCapita, 'Real GDP per capita'],
      [productivity, 'Productivity momentum'],
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
      name: 'Eight most recent productivity growth momentum observations',
    })
    expect(within(perCapitaTable).getAllByRole('row')).toHaveLength(9)
    expect(within(productivityTable).getAllByRole('row')).toHaveLength(9)
    expect(within(perCapitaTable).getAllByRole('row')[1]).toHaveTextContent(
      /\d{4} Q[1-4].+%/,
    )
    expect(within(productivityTable).getAllByRole('row')[1]).toHaveTextContent(
      '2026 Q1+2.8%+0.8% pp',
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
      expect(chartProps['Productivity momentum']).toMatchObject({
        frequency: 'quarterly',
        includeZero: true,
      })
    })
  })

  it('renders a collapsed real-wage card last in Prices with research evidence under More', async () => {
    const user = userEvent.setup()
    render(<DashboardPage />)
    const prices = screen.getByRole('region', { name: 'Prices' })
    const employment = screen.getByRole('region', { name: 'Employment and income' })
    const comparison = await within(prices).findByRole('article', {
      name: 'Are workers’ wages keeping up with prices?',
    })
    const articles = within(prices).getAllByRole('article')
    expect(articles.map((article) => within(article).getByRole('heading', { level: 3 }).textContent))
      .toEqual([
        'How quickly are consumer prices rising?',
        'What is driving inflation?',
        'Has inflation picked up in recent months?',
        'Are workers’ wages keeping up with prices?',
      ])
    const latestReading = within(comparison)
      .getByLabelText('Latest real wage growth')
    expect(latestReading).toHaveTextContent('0%')
    expect([...latestReading.children].map(({ textContent }) => textContent))
      .toEqual([
        '0%',
        'Year-over-year wage growth after adjusting for inflation',
        'June 2026',
        'About even — wages are roughly keeping pace with prices.',
        'The latest reading is within its typical range of the past 25 years.',
      ])
    expect(within(comparison).getByText(
      'About even — wages are roughly keeping pace with prices.',
    )).toBeVisible()
    expect(within(comparison).queryByText(
      /Positive values mean wages rose faster than consumer prices/,
    )).not.toBeInTheDocument()
    expect(within(comparison).getByTestId('real-wage-growth-chart'))
      .toHaveAttribute('data-zero-baseline', 'true')
    expect(realWageChartPropsSpy.mock.calls.at(-1)?.[0]).toMatchObject({
      variant: 'compact',
      model: {
        status: 'available',
        answerTier: 'about-even',
        historicalBands: {
          status: 'ready',
          comparisonStart: '2001-06-01',
          comparisonEnd: '2026-06-01',
          recentObservationCount: 61,
        },
      },
    })
    expect(realWageChartPropsSpy.mock.calls.at(-1)?.[0].model.recentObservations)
      .toHaveLength(61)
    expect(within(comparison).getByRole('figure')).toHaveAccessibleName(
      /Zero means wage growth and consumer-price inflation were equal/,
    )
    expect(within(comparison).getByRole('figure')).toHaveAccessibleName(
      /middle 50% ranges from.*middle 80% ranges from/,
    )
    expect(within(comparison).queryByRole('group', {
      name: 'Wages versus inflation displayed time range',
    })).not.toBeInTheDocument()
    expect(within(employment).queryByRole('article', {
      name: 'Are workers’ wages keeping up with prices?',
    })).not.toBeInTheDocument()
    expect(chartPropsSpy.mock.calls.some(
      ([props]) => (props as { kind?: string }).kind === 'comparison',
    )).toBe(false)

    await user.click(within(comparison).getByRole('button', { name: /More/ }))
    expect(within(comparison).getAllByText(
      /Positive values mean wages rose faster than consumer prices/,
    )[0]).toHaveTextContent(
      'Negative values mean prices rose faster than wages.',
    )
    const expandedChart = within(comparison).getAllByTestId(
      'real-wage-growth-chart',
    ).find((chart) => chart.dataset.variant === 'expanded')!
    expect(expandedChart).toHaveAttribute('data-variant', 'expanded')
    expect(expandedChart).toHaveAccessibleName(
      /Wages rose at least as fast as prices in 74% of 240 valid months shown/,
    )
    expect(within(comparison).getByText(
      /In the visible period, real wage growth ranged from/,
    )).toHaveTextContent(/The latest reading is 0% in June 2026/)
    const components = within(comparison).getByText(
      'How wage growth and inflation compare',
    ).closest('details')!
    expect(components).not.toHaveAttribute('open')
    expect(
      expandedChart.compareDocumentPosition(components) &
      Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy()
    const tellsYou = within(comparison).getByRole('heading', {
      name: 'What this tells you',
    })
    expect(
      components.compareDocumentPosition(tellsYou) &
      Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy()
    await user.click(within(components).getByText(
      'How wage growth and inflation compare',
    ))
    expect(within(components).getByText(/nominal wages grew 3.4%/))
      .toHaveTextContent('consumer prices rose 3.5%')
    expect(within(components).getByText(/approximately the same rate/))
      .toHaveTextContent('real wage growth of about 0%')
    expect(within(comparison).queryByText(
      /producing negative real wage growth of 0%/,
    )).not.toBeInTheDocument()
    await waitFor(() => {
      const call = [...chartPropsSpy.mock.calls]
        .reverse()
        .map((item) => item[0] as {
          kind?: string
          nominalObservations?: EconomicObservation[]
          inflationObservations?: EconomicObservation[]
        })
        .find((props) => props.kind === 'comparison')
      expect(call?.nominalObservations).toHaveLength(241)
      expect(call?.inflationObservations).toHaveLength(241)
    })
    expect(within(comparison).getByRole('group', {
      name: 'Wages versus inflation displayed time range',
    })).toBeVisible()
    await user.click(within(comparison).getByRole('button', { name: '5 years' }))
    expect(realWageChartPropsSpy.mock.calls.at(-1)?.[0]).toMatchObject({
      variant: 'expanded',
    })
    expect(realWageChartPropsSpy.mock.calls.at(-1)?.[0].model.recentObservations)
      .toHaveLength(61)
    await user.click(within(comparison).getByRole('button', { name: /Less/ }))
    expect(within(comparison).queryByRole('group', {
      name: 'Wages versus inflation displayed time range',
    })).not.toBeInTheDocument()
    await user.click(within(comparison).getByRole('button', { name: /More/ }))
    expect(within(comparison).getByRole('button', { name: '5 years' }))
      .toHaveAttribute('aria-pressed', 'true')
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

  it('leads with JOLTS and preserves official weekly claims under More', async () => {
    const user = userEvent.setup()
    render(<DashboardPage />)
    const card = await screen.findByRole('article', {
      name: 'Are layoffs beginning to rise?',
    })

    expect(within(card).getByText('1.1%')).toBeVisible()
    expect(within(card).getByText(latestJoltsLayoffsPeriod)).toBeVisible()
    expect(within(card).getByText(
      'No — layoffs are not beginning to rise.',
    )).toBeVisible()
    expect(within(card).getByTestId('jolts-layoffs-chart'))
      .toHaveAttribute('data-zero-line', 'false')
    expect(within(card).queryByRole('group', {
      name: 'Initial unemployment claims displayed time range',
    })).not.toBeInTheDocument()

    await user.click(within(card).getByRole('button', { name: /More/ }))
    expect(within(card).getByText(
      'Layoffs and discharges rate — monthly JOLTS measure',
    )).toBeVisible()
    expect(within(card).getByText(
      'Initial unemployment claims — weekly early-warning measure',
    )).toBeVisible()
    expect(within(card).getByText(/Latest official four-week average:/))
      .toHaveTextContent(/[\d,]+ claims/)
    expect(within(card).getByText(/Latest weekly claims:/))
      .toHaveTextContent(/[\d,]+/)
    expect(within(card).getByRole('group', {
      name: 'Initial unemployment claims displayed time range',
    })).toBeVisible()

    const claimsRange = within(card).getByRole('group', {
      name: 'Initial unemployment claims displayed time range',
    })
    await user.click(within(claimsRange).getByRole('button', { name: 'Maximum' }))
    expect(within(card).getByText(/Visible period: Week of Jan 28, 1967–Week of .+/))
      .toBeVisible()
    await waitFor(() => {
      const call = [...chartPropsSpy.mock.calls]
        .reverse()
        .map((item) => item[0] as {
          kind?: string
          movingAverageObservations?: EconomicObservation[]
          weeklyClaimsObservations?: EconomicObservation[]
        })
        .find((props) => props.kind === 'claims-comparison')
      expect(call?.movingAverageObservations?.length).toBeGreaterThan(3000)
      expect(call?.weeklyClaimsObservations?.length)
        .toBe(call?.movingAverageObservations?.length)
    })

    await user.click(within(card).getByText('Recent claims observations'))
    const table = within(card).getByRole('table', {
      name: 'Twelve most recent aligned initial-claims observations',
    })
    expect(within(table).getAllByRole('row')).toHaveLength(13)
    await user.click(within(card).getByText('Series details'))
    expect(within(card).getByText('JTSLDR, IC4WSA, and ICSA')).toBeVisible()
    expect(within(card).getByText(/no further normalization or interpolation/i))
      .toBeVisible()
  })

  it('renders labor levels with monthly context and accessible tables', async () => {
    const user = userEvent.setup()
    render(<DashboardPage />)

    const unemployment = await screen.findByRole('article', {
      name: 'Is unemployment high or low?',
    })
    const primeAge = await screen.findByRole('article', {
      name: 'What share of prime-age adults are employed?',
    })
    const cpiCard = await screen.findByRole('article', {
      name: 'How quickly are consumer prices rising?',
    })

    const unemploymentCallout = within(unemployment).getByLabelText(
      /The unemployment rate was 4.2% in June 2026/,
    )
    expect(unemploymentCallout)
      .toHaveTextContent('4.2%')
    expect(unemploymentCallout).toHaveTextContent(
      'Share of the labor force without a job and actively looking for work',
    )
    expect(unemploymentCallout).toHaveTextContent(
      'Unemployment is low compared with the past 25 years.',
    )
    expect(unemploymentCallout).toHaveTextContent(
      'Unemployment is little changed from a year ago.',
    )
    expect(unemploymentCallout).toHaveAccessibleName(
      /middle 50% ranges from 4.3% to 6.4%.*middle 80% ranges from 3.7% to 9.0%/,
    )
    expect(within(unemployment).getByTestId('production-compact-chart'))
      .toHaveAttribute('data-show-zero', 'false')
    const primeAgeCallout = within(primeAge).getByLabelText(
      /The prime-age employment ratio was 80.2% in June 2026/,
    )
    expect(primeAgeCallout)
      .toHaveTextContent('80.2%')
    expect(primeAgeCallout).toHaveTextContent(
      'Share of adults ages 25–54 who are employed',
    )
    expect(primeAgeCallout).toHaveTextContent(
      'Prime-age employment is high compared with the past 25 years.',
    )
    expect(primeAgeCallout).toHaveAccessibleName(
      /line runs from June 2021 through June 2026/,
    )
    expect(primeAgeCallout).toHaveAccessibleName(
      /middle 50% ranges from 76.7% to 79.8%.*middle 80% ranges from 75.3% to 80.6%/,
    )
    expect(within(primeAge).getByTestId('production-compact-chart'))
      .toHaveAttribute('data-show-zero', 'false')
    expect(within(primeAge).getByTestId('production-compact-chart'))
      .toHaveAttribute('data-interactive', 'true')
    expect(within(unemployment).getByText(/June 2026/)).toBeVisible()
    expect(within(primeAge).getByText(/June 2026/)).toBeVisible()
    expect(within(primeAge).queryByRole('button', { name: '5 years' }))
      .not.toBeInTheDocument()
    expect(within(unemployment).queryByRole('button', { name: '5 years' }))
      .not.toBeInTheDocument()
    await user.click(within(unemployment).getByRole('button', { name: /More/ }))
    await user.click(within(primeAge).getByRole('button', { name: /More/ }))
    await user.click(within(cpiCard).getByRole('button', { name: /More/ }))
    const payroll = await screen.findByRole('article', {
      name: 'Are employers adding jobs?',
    })
    await user.click(within(payroll).getByRole('button', { name: /More/ }))
    await waitFor(() => {
      const zeroPolicies = Object.fromEntries(
        chartPropsSpy.mock.calls.map((call) => {
          const props = call[0] as { seriesName: string; includeZero: boolean }
          return [props.seriesName, props.includeZero]
        }),
      )
      expect(zeroPolicies).toMatchObject({
        'CPI inflation': true,
        Unemployment: false,
        'Prime-age employment': false,
        'Payroll growth': true,
      })
      expect(zeroPolicies).not.toHaveProperty('Real GDP growth')
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
    const user = userEvent.setup()
    render(<DashboardPage />)
    const gdpCard = await screen.findByRole('article', {
      name: 'Is the U.S. economy growing?',
    })
    const cpiCard = await screen.findByRole('article', {
      name: 'How quickly are consumer prices rising?',
    })

    expect(within(gdpCard).getByLabelText('Latest real GDP growth')).toBeVisible()
    expect(within(cpiCard).getByLabelText(/CPI inflation was 3.5%/)).toBeVisible()
    expect(within(gdpCard).queryByText('Productivity')).not.toBeInTheDocument()
    await user.click(within(gdpCard).getByRole('button', { name: /More/ }))
    await user.click(within(cpiCard).getByRole('button', { name: /More/ }))
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
    await user.click(within(gdpCard).getByRole('button', { name: /More/ }))
    await user.click(within(cpiCard).getByRole('button', { name: /More/ }))

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
      expect(cpiCall?.observations[0]?.date).toBe('2021-06-01')
    })
  })

  it('sends complete series history to the chart for Maximum only', async () => {
    const user = userEvent.setup()
    render(<DashboardPage />)
    const gdpCard = await screen.findByRole('article', {
      name: 'Is the U.S. economy growing?',
    })
    await user.click(within(gdpCard).getByRole('button', { name: /More/ }))
    const payrollCard = await screen.findByRole('article', {
      name: 'Are employers adding jobs?',
    })
    await user.click(within(payrollCard).getByRole('button', { name: /More/ }))

    await user.click(within(gdpCard).getByRole('button', { name: 'Maximum' }))

    await waitFor(() => {
      const gdpCall = chartPropsSpy.mock.calls
        .map((call) => call[0] as {
          seriesName: string
          observations: EconomicObservation[]
        })
        .filter((props) => props.seriesName === 'Real GDP growth')
        .at(-1)
      expect(gdpCall?.observations?.length).toBeGreaterThan(300)
      expect(gdpCall?.observations[0]?.date).toBe('1948-01-01')
    })
    expect(
      within(payrollCard).getByRole('button', { name: '20 years' }),
    ).toHaveAttribute('aria-pressed', 'true')
  })

  it('renders a direction-first compact personal saving rate card and preserves More', async () => {
    const user = userEvent.setup()
    render(<DashboardPage />)
    const card = await screen.findByRole('article', {
      name: 'Are households saving less of their income?',
    })

    const current = within(card).getByLabelText(/The personal saving rate was/)
    expect(current).toHaveTextContent('2.7%')
    expect(current).toHaveTextContent('Share of disposable personal income saved')
    expect(current).toHaveTextContent('June 2026')
    expect(current).toHaveTextContent(
      'Yes — households are saving a smaller share of their income than a year ago.',
    )
    expect(current).toHaveTextContent(
      'The saving rate is low by historical standards.',
    )
    expect(current).toHaveTextContent(
      'Down 1.9 percentage points from a year earlier',
    )
    expect(within(card).getByTestId('production-compact-chart'))
      .toHaveAttribute('data-show-zero', 'false')
    expect(within(card).queryByRole('button', { name: '5 years' }))
      .not.toBeInTheDocument()

    const compactProps = compactChartPropsSpy.mock.calls
      .map((call) => call[0] as {
        definition: CompactHistoricalMetricDefinition
        model: HistoricalBandResult
      })
      .find(({ definition }) => definition.seriesLabel === 'Personal saving rate')
    expect(compactProps?.definition).toMatchObject({
      showZeroLine: false,
      showLatestMarker: true,
      interactiveDetails: true,
      pointComparison: { months: 12 },
      historicalBands: {
        recentObservationCount: 61,
        comparisonWindow: { kind: 'trailing-years', years: 25 },
      },
    })
    expect(compactProps?.model).toMatchObject({
      status: 'ready', recentObservationCount: 61,
    })

    await user.click(within(card).getByRole('button', { name: /More/ }))
    expect(within(card).getByRole('button', { name: '20 years' })).toBeVisible()
    expect(within(card).getByText(/A positive saving rate means households still saved/))
      .toHaveTextContent(/not necessarily that they drew down accumulated assets/)
    await user.click(within(card).getByRole('button', { name: /Less/ }))
    expect(within(card).queryByRole('button', { name: '20 years' }))
      .not.toBeInTheDocument()
  })

  it('renders compact affordability and preserves both Housing research views', async () => {
    const user = userEvent.setup()
    render(<DashboardPage />)

    const housing = screen.getByRole('region', { name: 'Housing' })
    const cards = await within(housing).findAllByRole('article')
    expect(cards.map((card) => card.getAttribute('aria-labelledby'))).toEqual([
      'home-ownership-cost-share-question',
      'housing-starts-question',
    ])
    expect(within(cards[0]!).getAllByText('42.0%')).not.toHaveLength(0)
    expect(cards[0]!.querySelector('.series-current__period')).toHaveTextContent('March 2026')
    expect(within(cards[0]!).getAllByText('Estimated share of median household income needed to own the median-priced home')).toHaveLength(2)
    expect(within(cards[0]!).getByText(/not affordable for a median-income household under this model/)).toBeVisible()
    expect(within(cards[0]!).getByText(/well above the 30% affordability threshold/)).toBeVisible()
    expect(within(cards[0]!).getByText(/required income share is high|very high/)).toBeVisible()
    expect(within(cards[0]!).getByRole('button', { name: /More/ })).toHaveAttribute('aria-expanded', 'false')
    expect(within(cards[1]!).getAllByText('1.35 million')).not.toHaveLength(0)
    expect(within(cards[1]!).getByText(/June 2026 · Thousands of units/)).toBeVisible()
    expect(within(cards[1]!).getByText('Three-month average annualized pace')).toBeVisible()
    expect(within(cards[1]!).getByText(/Builders are starting housing at an annualized pace/)).toBeVisible()
    expect(within(cards[1]!).getByText(/Relative to the U.S. population/)).toBeVisible()

    const startsCompactCall = compactChartPropsSpy.mock.calls
      .map((call) => call[0] as {
        definition: CompactHistoricalMetricDefinition
        model: HistoricalBandResult
      })
      .find(({ definition }) => definition.seriesLabel === 'Housing starts per 1,000 residents')
    expect(startsCompactCall?.definition).toMatchObject({
      showZeroLine: false,
      showLatestMarker: true,
      interactiveDetails: true,
      historicalBands: {
        recentObservationCount: 61,
        comparisonWindow: { kind: 'trailing-years', years: 25 },
      },
    })
    expect(startsCompactCall?.model).toMatchObject({
      status: 'ready',
      recentObservationCount: 61,
    })

    const compactCall = compactChartPropsSpy.mock.calls
      .map((call) => call[0] as { definition: { seriesLabel: string; showZeroLine: boolean } })
      .find(({ definition }) => definition.seriesLabel === 'Modeled ownership-cost share')
    expect(compactCall?.definition.showZeroLine).toBe(false)

    await user.click(within(cards[0]!).getByRole('button', { name: /More/ }))
    expect(within(cards[0]!).getByText(/30-year fixed-rate mortgage with a 10% down payment/)).toBeVisible()
    await user.click(within(cards[0]!).getByRole('button', { name: 'Maximum' }))
    expect(within(cards[1]!).queryByRole('button', { name: 'Maximum' }))
      .not.toBeInTheDocument()
    await user.click(within(cards[1]!).getByRole('button', { name: /More/ }))
    expect(within(cards[1]!).getByText('Housing starts per 1,000 residents')).toBeVisible()
    expect(within(cards[1]!).getByText(/annualized pace is not the literal number/)).toBeVisible()
    expect(within(cards[1]!).getByRole('heading', { name: 'Where is housing being started?' })).toBeVisible()
    expect(within(cards[1]!).getByRole('heading', { name: 'What is moving through the construction pipeline?' })).toBeVisible()
    expect(within(cards[1]!).getByRole('table', { name: /Latest shared regional housing-start comparison/ })).toHaveTextContent('Northeast')
    expect(within(cards[1]!).getByRole('table', { name: /Pipeline by housing-unit category/ })).toHaveTextContent('Under construction')
    expect(within(cards[1]!).getByText(/Values are housing units, not structures/)).toBeVisible()
    expect(within(cards[1]!).getByRole('heading', { name: 'What kind of housing is being built?' })).toBeVisible()
    expect(within(cards[1]!).getByRole('heading', { name: 'Sales prices of new single-family homes sold' })).toBeVisible()
    expect(within(cards[1]!).getByRole('group', { name: /Annual nominal sales-price distribution/ })).toBeVisible()
    expect(within(cards[1]!).getByRole('button', { name: '2025, Under $300,000: 18 percent' })).toBeVisible()
    expect(within(cards[1]!).getByText(/not an affordable-versus-luxury classification/)).toBeVisible()
    await user.click(within(cards[1]!).getByRole('button', { name: 'Maximum' }))
    await waitFor(() => {
      const calls = chartPropsSpy.mock.calls.map((call) => call[0] as {
        seriesName: string
        observations: EconomicObservation[]
        includeZero: boolean
      })
      expect([...calls].reverse().find((call) => call.seriesName === 'Home-ownership affordability'))
        .toMatchObject({ includeZero: false, observations: expect.arrayContaining([
          expect.objectContaining({ date: '2005-01-01' }),
        ]) })
      expect([...calls].reverse().find((call) => call.seriesName === 'Housing starts'))
        .toMatchObject({ includeZero: false, observations: expect.arrayContaining([
          expect.objectContaining({ date: '1959-01-01' }),
        ]) })
    })
  })

  it.each([
    ['home-ownership-cost-share', 'The home-ownership affordability data could not be loaded.', 'How much new housing is being started?'],
    ['housing-starts', 'The housing starts data could not be loaded.', 'How much of a median household’s income would it take to own a typical home?'],
  ])('isolates a %s failure from the other Housing card', async (failedSlug, message, survivor) => {
    const originalGetBySlug = localEconomicSeriesRepository.getBySlug.bind(localEconomicSeriesRepository)
    vi.spyOn(localEconomicSeriesRepository, 'getBySlug').mockImplementation(async (slug) => {
      if (slug === failedSlug) throw new Error('Invalid Story 15 fixture')
      return originalGetBySlug(slug)
    })
    vi.spyOn(console, 'error').mockImplementation(() => undefined)

    render(<DashboardPage />)

    expect(await screen.findByText(message)).toBeVisible()
    expect(await screen.findByRole('article', { name: survivor })).toBeVisible()
    expect(await screen.findByRole('region', { name: 'Growth' })).toBeVisible()
  })

  it('renders the Business and manufacturing cards after Housing', async () => {
    const user = userEvent.setup()
    render(<DashboardPage />)

    const housing = screen.getByRole('region', { name: 'Housing' })
    const manufacturing = screen.getByRole('region', { name: 'Business and manufacturing' })
    expect(housing.compareDocumentPosition(manufacturing) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    const card = await within(manufacturing).findByRole('article', { name: 'Are U.S. manufacturers producing more goods?' })
    expect(within(manufacturing).getAllByRole('article')).toHaveLength(3)
    expect(within(card).getByText('+1.3%')).toBeVisible()
    expect(within(card).getByText(/Yes — U.S. manufacturers are producing more/)).toBeVisible()
    expect(within(card).getByText(/current growth rate is typical/)).toBeVisible()
    expect(within(card).getByTestId('production-compact-chart')).toHaveAttribute('data-show-zero', 'true')
    expect(within(card).queryByText(/Both lines begin at 100/)).not.toBeInTheDocument()
    const compactCall = compactChartPropsSpy.mock.calls
      .map((call) => call[0] as {
        definition: CompactHistoricalMetricDefinition
        model: HistoricalBandResult
      })
      .find(({ definition }) => definition.seriesLabel === 'Three-month-average manufacturing production growth')
    expect(compactCall?.definition).toMatchObject({
      showZeroLine: true,
      showLatestMarker: true,
      interactiveDetails: true,
      zeroLineMeaning: 'Zero = inflation-adjusted manufacturing production matched its year-earlier level',
      historicalBands: {
        recentObservationCount: 61,
        comparisonWindow: { kind: 'trailing-years', years: 25 },
      },
    })
    expect(compactCall?.model).toMatchObject({ status: 'ready', recentObservationCount: 61 })

    await user.click(within(card).getByRole('button', { name: /More/ }))
    expect(within(card).getByText(/reflects the volume of production/)).toBeVisible()
    expect(within(card).getByText(/Manufacturing output versus employment \(Secondary indicators\)/)).toBeVisible()
    await user.click(within(card).getByRole('button', { name: 'Maximum' }))
    await waitFor(() => {
      const props = chartPropsSpy.mock.calls.map((call) => call[0] as {
        seriesName?: string
        observations?: EconomicObservation[]
        includeZero?: boolean
      }).reverse().find((candidate) => candidate.seriesName === 'Three-month-average manufacturing production growth')
      expect(props?.includeZero).toBe(true)
      expect(props?.observations).toEqual(expect.arrayContaining([
        expect.objectContaining({ date: '1973-03-01' }),
      ]))
    })

    await user.click(within(card).getByText('Recent observations'))
    expect(within(card).getByRole('table', { name: /Twelve most recent manufacturing-output index observations/ })).toBeVisible()
  })

  it('isolates a manufacturing-output failure from every existing section', async () => {
    const originalGetBySlug = localEconomicSeriesRepository.getBySlug.bind(localEconomicSeriesRepository)
    vi.spyOn(localEconomicSeriesRepository, 'getBySlug').mockImplementation(async (slug) => {
      if (slug === 'manufacturing-output') throw new Error('Invalid manufacturing fixture')
      return originalGetBySlug(slug)
    })
    vi.spyOn(console, 'error').mockImplementation(() => undefined)
    render(<DashboardPage />)

    expect(await screen.findByText('The manufacturing production growth data could not be loaded.')).toBeVisible()
    expect(await screen.findByRole('article', { name: 'How much new housing is being started?' })).toBeVisible()
    expect(await screen.findByRole('article', { name: 'Is the U.S. economy growing?' })).toBeVisible()
  })

  it('renders business investment with its full available history', async () => {
    const user = userEvent.setup()
    render(<DashboardPage />)

    const business = screen.getByRole('region', { name: 'Business and manufacturing' })
    const investment = await within(business).findByRole('article', {
      name: 'Are businesses investing more in productive assets?',
    })

    expect(within(investment).getByText('Change in inflation-adjusted business investment from a year ago').previousElementSibling)
      .toHaveTextContent(/%/)
    expect(within(investment).getAllByText(/\d{4} Q[1-4]/)).not.toHaveLength(0)
    await user.click(within(investment).getByRole('button', { name: /More/ }))
    expect(within(investment).getByText(/does not show net investment after depreciation/)).toBeVisible()
    await user.click(within(investment).getByRole('button', { name: 'Maximum' }))
    await waitFor(() => {
      const calls = chartPropsSpy.mock.calls.map((call) => call[0] as {
        seriesName: string
        observations: EconomicObservation[]
        frequency: EconomicFrequency
        includeZero: boolean
      })
      expect([...calls].reverse().find((call) => call.seriesName === 'Real business investment growth'))
        .toMatchObject({
          frequency: 'quarterly',
          includeZero: true,
          observations: expect.arrayContaining([
            expect.objectContaining({ date: '2008-01-01' }),
          ]),
        })
    })

    await user.click(within(investment).getByText('Recent observations'))
    expect(within(investment).getByRole('table', {
      name: 'Eight most recent real business investment growth observations',
    })).toBeVisible()
  })

  it('isolates an investment failure from the other business cards', async () => {
    const originalGetBySlug = localEconomicSeriesRepository.getBySlug.bind(localEconomicSeriesRepository)
    vi.spyOn(localEconomicSeriesRepository, 'getBySlug').mockImplementation(async (slug) => {
      if (slug === 'real-business-investment-growth') throw new Error('Invalid Story 17 fixture')
      return originalGetBySlug(slug)
    })
    vi.spyOn(console, 'error').mockImplementation(() => undefined)

    render(<DashboardPage />)

    expect(await screen.findByText('The real business investment growth data could not be loaded.')).toBeVisible()
    expect(await screen.findByRole('article', { name: 'How large are corporate profits relative to the economy?' })).toBeVisible()
    expect(await screen.findByRole('article', {
      name: 'Are U.S. manufacturers producing more goods?',
    })).toBeVisible()
  })

  it('renders the corporate profit share as a scale-adjusted ratio', async () => {
    const user = userEvent.setup()
    render(<DashboardPage />)
    const card = await screen.findByRole('article', {
      name: 'How large are corporate profits relative to the economy?',
    })

    expect(within(card).getByLabelText(/economy-wide national-accounts ratio/))
      .toHaveTextContent('11.4%')
    expect(within(card).getAllByText('Adjusted after-tax corporate profits as a share of GDP')).toHaveLength(2)
    expect(within(card).getByText('About $11.37 in adjusted after-tax corporate profit for every $100 of GDP.')).toBeVisible()
    await user.click(within(card).getByRole('button', { name: /More/ }))
    expect(within(card).getByText(/does not show individual-company margins/)).toBeVisible()
    expect(within(card).getByText(/not state that the raw dollar level of profits/)).toBeVisible()
    expect(within(card).getByRole('link', { name: /CPATAX/ })).toHaveAttribute(
      'href',
      'https://fred.stlouisfed.org/series/CPATAX',
    )
    expect(within(card).getByRole('link', { name: /GDP/ })).toHaveAttribute(
      'href',
      'https://fred.stlouisfed.org/series/GDP',
    )

    await user.click(within(card).getByRole('button', { name: 'Maximum' }))
    expect(within(card).getByText('Visible period: 1947 Q1–2026 Q1')).toBeVisible()
    await waitFor(() => {
      const props = [...chartPropsSpy.mock.calls].reverse()
        .map((call) => call[0] as {
          seriesName?: string
          observations?: EconomicObservation[]
          includeZero?: boolean
        })
        .find((candidate) => candidate.seriesName === 'After-tax corporate profit share')
      expect(props?.observations?.length).toBeGreaterThan(300)
      expect(props?.includeZero).toBe(false)
    })
    await user.click(within(card).getByText('Recent observations'))
    expect(within(card).getByRole('table', {
      name: 'Eight most recent corporate profit-share observations',
    })).toBeVisible()
    await user.click(within(card).getByText('Series details'))
    expect(within(card).getByText('CPATAX / GDP')).toBeVisible()
    expect(within(card).getByText(/CPATAX divided by GDP/)).toBeVisible()
    expect(within(card).getByText(/CPATAX: 1947 Q1 to \d{4} Q[1-4]; GDP: 1947 Q1 to \d{4} Q[1-4]/)).toBeVisible()
  })

  it('isolates a corporate profit-share card load failure', async () => {
    const original = localEconomicSeriesRepository.getBySlug.bind(localEconomicSeriesRepository)
    vi.spyOn(localEconomicSeriesRepository, 'getBySlug').mockImplementation(async (slug) => {
      if (slug === 'corporate-profit-share') throw new Error('Invalid profit-share fixture')
      return original(slug)
    })
    vi.spyOn(console, 'error').mockImplementation(() => undefined)
    render(<DashboardPage />)

    expect(await screen.findByText('The corporate profit share data could not be loaded.')).toBeVisible()
    expect(await screen.findByRole('article', {
      name: 'Are businesses investing more in productive assets?',
    })).toBeVisible()
    expect(screen.queryByRole('article', { name: /spare industrial capacity/ })).not.toBeInTheDocument()
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
    ).toHaveLength(4)
    expect(await screen.findByText(
      'The recent inflation momentum data could not be loaded.',
    )).toBeVisible()
  })

  it('isolates an inflation-momentum failure from the stable drivers card', async () => {
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
      name: 'What is driving inflation?',
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
      within(screen.getByRole('region', { name: 'Growth' })).getByText(
        'The real GDP data could not be loaded.',
      ),
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
      'Is unemployment high or low?',
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
        name: 'Is unemployment high or low?',
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
        'Is unemployment high or low?',
        'What share of prime-age adults are employed?',
        'Are employers adding jobs?',
      ]) {
        expect(await screen.findByRole('article', { name: question })).toBeVisible()
      }
    },
  )

  it('renders the three Financial conditions cards after Business and manufacturing', async () => {
    const user = userEvent.setup()
    const [tenYear, threeMonth] = await Promise.all([
      localEconomicSeriesRepository.getBySlug('ten-year-treasury-yield'),
      localEconomicSeriesRepository.getBySlug('three-month-treasury-bill-rate'),
    ])
    const yieldCurve = deriveYieldCurveObservations(
      tenYear!.observations,
      threeMonth!.observations,
    )
    const latestYieldCurve = yieldCurve.at(-1)!
    render(<DashboardPage />)
    const business = screen.getByRole('region', { name: 'Business and manufacturing' })
    const financial = screen.getByRole('region', { name: 'Financial conditions' })
    expect(business.compareDocumentPosition(financial) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    const rates = await within(financial).findByRole('article', { name: 'Is the yield curve inverted?' })
    const credit = await within(financial).findByRole('article', { name: 'Are credit conditions tighter or looser than usual?' })
    const lending = await within(financial).findByRole('article', { name: 'Are banks making it harder to borrow?' })
    expect(within(financial).getAllByRole('article')).toHaveLength(3)
    expect(within(rates).getByText(
      formatYieldCurveSpread(latestYieldCurve.value),
    )).toBeVisible()
    expect(within(rates).getByText(
      formatYieldCurveAnswer(latestYieldCurve.value),
    )).toBeVisible()
    expect(within(rates).getByText(/does not rule out recession/)).toBeVisible()
    expect(within(credit).getByLabelText('Latest broad credit-conditions index')).toHaveTextContent(/-?\d+\.\d+/)
    expect(within(credit).getByText('Looser than average')).toBeVisible()
    expect(within(credit).getByText(/not a percentage/)).toBeVisible()
    expect(within(credit).getAllByText(/Week of .+ 2026/)).not.toHaveLength(0)
    expect(within(lending).getByLabelText('Latest bank lending standards')).toHaveTextContent('8.1% net tightening')
    expect(within(lending).getAllByText('2026 Q2')).not.toHaveLength(0)
    expect(within(lending).getByText(/not a denial rate/)).toBeVisible()
    expect(within(lending).getByText(/loan demand/i)).toBeVisible()
    await user.click(within(rates).getByRole('button', { name: /More/ }))
    await user.click(within(rates).getByRole('button', { name: 'Maximum' }))
    await user.click(within(credit).getByRole('button', { name: 'Maximum' }))
    await user.click(within(lending).getByRole('button', { name: 'Maximum' }))
    expect(within(rates).getByText(
      `Visible period: ${formatObservationPeriod(yieldCurve[0]!.date, 'monthly')}–${formatObservationPeriod(latestYieldCurve.date, 'monthly')}`,
    )).toBeVisible()
    expect(within(credit).getByText(/Visible period: Week of Jan 8, 1971–Week of .+/)).toBeVisible()
    expect(within(lending).getByText('Visible period: 1990 Q2–2026 Q2')).toBeVisible()
    await user.click(within(credit).getByRole('button', { name: 'Zoom in' }))
    expect(within(credit).getByRole('button', { name: 'Reset zoom' })).toBeVisible()
    await user.click(within(lending).getByText('Recent observations'))
    expect(within(lending).getByRole('table', { name: 'Eight most recent bank lending-standards observations' })).toBeVisible()
    await user.click(within(lending).getByText('Series details'))
    expect(within(lending).getByText('DRTSCILM')).toBeVisible()
    expect(within(lending).getByText('Not seasonally adjusted')).toBeVisible()
  })

  it('renders annual budget balance and quarterly debt held by the public after Financial conditions', async () => {
    const user = userEvent.setup()
    render(<DashboardPage />)
    const financial = screen.getByRole('region', { name: 'Financial conditions' })
    const government = screen.getByRole('region', { name: 'Government finances' })
    expect(financial.compareDocumentPosition(government) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    const budget = await within(government).findByRole('article', { name: 'How large is the federal budget deficit or surplus relative to the economy?' })
    const debt = await within(government).findByRole('article', { name: 'How large is federal debt held by the public relative to the economy?' })
    expect(within(government).getAllByRole('article')).toHaveLength(2)
    expect(within(budget).getByLabelText('Latest federal budget balance')).toHaveTextContent('−5.8%')
    expect(within(budget).getAllByText('Deficit')[0]).toBeVisible()
    expect(within(budget).getAllByText('2025')).not.toHaveLength(0)
    expect(within(budget).getByText(/annual flow/)).toBeVisible()
    expect(within(debt).getByLabelText('Latest federal debt held by the public')).toHaveTextContent('98.7%')
    expect(within(debt).getAllByText('2026 Q1')).not.toHaveLength(0)
    expect(within(debt).getByText(/not total public debt/)).toBeVisible()
    expect(within(debt).getByText(/can fall while nominal debt rises/)).toBeVisible()
    await user.click(within(budget).getByRole('button', { name: 'Maximum' }))
    await user.click(within(debt).getByRole('button', { name: 'Maximum' }))
    expect(within(budget).getByText('Visible period: 1929–2025')).toBeVisible()
    expect(within(debt).getByText('Visible period: 1970 Q1–2026 Q1')).toBeVisible()
    await user.click(within(budget).getByRole('button', { name: 'Zoom in' }))
    expect(within(budget).getByRole('button', { name: 'Reset zoom' })).toBeVisible()
  })

  it('isolates a bank lending-standards card load failure', async () => {
    const original = localEconomicSeriesRepository.getBySlug.bind(localEconomicSeriesRepository)
    vi.spyOn(localEconomicSeriesRepository, 'getBySlug').mockImplementation(async (slug) => {
      if (slug === 'bank-lending-standards') throw new Error('Invalid SLOOS fixture')
      return original(slug)
    })
    vi.spyOn(console, 'error').mockImplementation(() => undefined)

    render(<DashboardPage />)

    expect(await screen.findByText('The bank lending standards data could not be loaded.')).toBeVisible()
    expect(await screen.findByRole('article', {
      name: 'Are credit conditions tighter or looser than usual?',
    })).toBeVisible()
    expect(await screen.findByRole('article', {
      name: 'Is the yield curve inverted?',
    })).toBeVisible()
  })

  it.each([
    ['federal-budget-balance', 'The federal budget balance data could not be loaded.', 'How large is federal debt held by the public relative to the economy?'],
    ['federal-debt-held-by-public', 'The federal debt held by the public data could not be loaded.', 'How large is the federal budget deficit or surplus relative to the economy?'],
  ])('isolates a %s failure within Government finances', async (failedSlug, message, survivor) => {
    const original = localEconomicSeriesRepository.getBySlug.bind(localEconomicSeriesRepository)
    vi.spyOn(localEconomicSeriesRepository, 'getBySlug').mockImplementation(async (slug) => {
      if (slug === failedSlug) throw new Error('Invalid Story 19 fixture')
      return original(slug)
    })
    vi.spyOn(console, 'error').mockImplementation(() => undefined)
    render(<DashboardPage />)
    expect(await screen.findByText(message)).toBeVisible()
    expect(await screen.findByRole('article', { name: survivor })).toBeVisible()
    expect(await screen.findByRole('article', { name: 'Is the yield curve inverted?' })).toBeVisible()
  })

  it('renders trade flows and effective tariff burden after Government finances', async () => {
    const user = userEvent.setup()
    render(<DashboardPage />)
    const government = screen.getByRole('region', { name: 'Government finances' })
    const trade = screen.getByRole('region', { name: 'Trade and tariffs' })
    expect(government.compareDocumentPosition(trade) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    const balance = await within(trade).findByRole('article', { name: 'How large is the U.S. trade balance relative to the economy?' })
    const tariff = await within(trade).findByRole('article', { name: 'What share of imported goods is collected as customs duties?' })
    expect(within(trade).getAllByRole('article')).toHaveLength(2)
    expect(within(balance).getByLabelText('Latest net exports share of GDP')).toHaveTextContent(/−\d+\.\d%/)
    expect(within(balance).getByText('Trade deficit')).toBeVisible()
    expect(within(tariff).getByLabelText('Latest effective tariff burden')).toHaveTextContent(/\d+\.\d%/)
    expect(within(tariff).getByText(/not a statutory tariff schedule/)).toBeVisible()
    expect(within(tariff).getByText(/identify who bears the economic cost/)).toBeVisible()
    await user.click(within(balance).getByText('Recent observations'))
    expect(within(balance).getByRole('table', { name: 'Eight most recent trade-balance observations' })).toHaveTextContent('Deficit')
    await user.click(within(balance).getByRole('button', { name: 'Maximum' }))
    await user.click(within(tariff).getByRole('button', { name: 'Maximum' }))
    expect(within(balance).getByText(/Visible period: 1947 Q1–\d{4} Q[1-4]/)).toBeVisible()
    expect(within(tariff).getByText(/Visible period: 1959 Q1–\d{4} Q[1-4]/)).toBeVisible()
    await user.click(within(balance).getByRole('button', { name: 'Zoom in' }))
    expect(within(balance).getByRole('button', { name: 'Reset zoom' })).toBeVisible()
  })

  it.each([
    ['trade-balance-share-of-gdp', 'The trade balance data could not be loaded.', 'What share of imported goods is collected as customs duties?'],
    ['effective-tariff-burden', 'The effective tariff burden data could not be loaded.', 'How large is the U.S. trade balance relative to the economy?'],
  ])('isolates a %s failure within Trade and tariffs', async (failedSlug, message, survivor) => {
    const original = localEconomicSeriesRepository.getBySlug.bind(localEconomicSeriesRepository)
    vi.spyOn(localEconomicSeriesRepository, 'getBySlug').mockImplementation(async (slug) => {
      if (slug === failedSlug) throw new Error('Invalid Story 20 fixture')
      return original(slug)
    })
    vi.spyOn(console, 'error').mockImplementation(() => undefined)
    render(<DashboardPage />)
    expect(await screen.findByText(message)).toBeVisible()
    expect(await screen.findByRole('article', { name: survivor })).toBeVisible()
    expect(await screen.findByRole('article', { name: 'How large is federal debt held by the public relative to the economy?' })).toBeVisible()
  })

  it.each([
    ['effective-federal-funds-rate', 'The yield curve data could not be loaded.', 'Are credit conditions tighter or looser than usual?'],
    ['ten-year-treasury-yield', 'The yield curve data could not be loaded.', 'Are credit conditions tighter or looser than usual?'],
    ['three-month-treasury-bill-rate', 'The yield curve data could not be loaded.', 'Are credit conditions tighter or looser than usual?'],
    ['broad-credit-conditions', 'The broad credit conditions data could not be loaded.', 'Is the yield curve inverted?'],
  ])('isolates a %s failure within Financial conditions', async (failedSlug, message, survivor) => {
    const original = localEconomicSeriesRepository.getBySlug.bind(localEconomicSeriesRepository)
    vi.spyOn(localEconomicSeriesRepository, 'getBySlug').mockImplementation(async (slug) => {
      if (slug === failedSlug) throw new Error('Invalid Story 18 fixture')
      return original(slug)
    })
    vi.spyOn(console, 'error').mockImplementation(() => undefined)
    render(<DashboardPage />)
    expect(await screen.findByText(message)).toBeVisible()
    expect(await screen.findByRole('article', { name: survivor })).toBeVisible()
    expect(await screen.findByRole('article', { name: 'Is the U.S. economy growing?' })).toBeVisible()
  })

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
        'Is unemployment high or low?',
      ]) {
        expect(await screen.findByRole('article', { name: question })).toBeVisible()
      }
    },
  )
})
