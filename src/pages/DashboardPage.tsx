import { useCallback, useMemo, useState } from 'react'
import { EconomicSection } from '../components/layout/EconomicSection'
import { DashboardNavigation } from '../components/layout/DashboardNavigation'
import { EconomicSeriesCard } from '../features/economic-series/components/EconomicSeriesCard'
import { JobGrowthBreakevenCard } from '../features/economic-series/components/JobGrowthBreakevenCard'
import type { EconomicSeries } from '../features/economic-series/models/economicSeries'
import {
  findLatestNonNullObservation,
  formatObservationPeriod,
} from '../features/economic-series/utils/economicSeries'

const payrollSupportingSlugs = ['monthly-payroll-change'] as const
const weeklyClaimsSupportingSlugs = ['initial-unemployment-claims'] as const
const claimsComparisonSupportingSlugs = [
  'initial-unemployment-claims-four-week-average',
  ...weeklyClaimsSupportingSlugs,
] as const
const wageComparisonSupportingSlugs = [
  'nominal-wage-growth',
  'headline-cpi-inflation',
] as const
const cpiSupportingSlugs = [
  'headline-pce-inflation',
  'core-cpi-inflation',
] as const
const inflationDriverSupportingSlugs = [
  'shelter-cpi-inflation',
  'energy-cpi-inflation',
  'food-cpi-inflation',
] as const
const headlineMomentumSupportingSlugs = [
  'headline-cpi-inflation',
  'core-cpi-inflation',
  'core-cpi-three-month-annualized',
] as const
const yieldCurveSupportingSlugs = [
  'three-month-treasury-bill-rate',
  'effective-federal-funds-rate',
] as const
const housingStartsSupportingSlugs = ['us-population-monthly'] as const

export function DashboardPage() {
  const [loadedSeries, setLoadedSeries] = useState<
    Readonly<Record<string, EconomicSeries>>
  >({})

  const handleSeriesLoaded = useCallback(
    (slug: string, series: EconomicSeries | null) => {
      setLoadedSeries((current) => {
        if (series) {
          return current[slug] === series
            ? current
            : { ...current, [slug]: series }
        }
        if (!(slug in current)) return current
        const next = { ...current }
        delete next[slug]
        return next
      })
    },
    [],
  )

  const updateContext = useMemo(() => {
    const periods = Object.values(loadedSeries)
      .map((series) => {
        const latest = findLatestNonNullObservation(series.observations)
        return latest
          ? {
              date: latest.date,
              label: formatObservationPeriod(latest.date, series.frequency),
            }
          : null
      })
      .filter((period): period is { date: string; label: string } => period !== null)
      .sort((a, b) => a.date.localeCompare(b.date))

    if (periods.length === 0) return null
    if (periods.length === 1) {
      return `Latest available observation: ${periods[0]!.label}`
    }
    return `Latest observations range from ${periods[0]!.label} to ${periods.at(-1)!.label}`
  }, [loadedSeries])

  return (
    <div className="page">
      <section className="page-intro" aria-labelledby="dashboard-heading">
        <h1 id="dashboard-heading">U.S. Economy Dashboard</h1>
        <p>
          Complementary indicators show different parts of the economy and
          update at different frequencies. No single measure provides a complete
          verdict; historical context and relationships among indicators matter.
        </p>
        {updateContext && <p className="page-update">{updateContext}</p>}
        <p className="page-preview-link">
          <a href="/briefing">Preview the Labor at-a-glance briefing</a>
        </p>
      </section>

      <DashboardNavigation />

      <EconomicSection
        id="growth"
        title="Growth"
        description="Growth measures how much the economy is producing, but not how evenly those gains are distributed or whether output per person is increasing."
      >
        <EconomicSeriesCard
          collapsible
          slug="real-gdp-growth"
          label="real GDP"
          onSeriesLoaded={handleSeriesLoaded}
        />
        <EconomicSeriesCard
          collapsible
          slug="real-gdp-per-capita-growth"
          label="real GDP per capita"
          onSeriesLoaded={handleSeriesLoaded}
        />
        <EconomicSeriesCard
          collapsible
          slug="labor-productivity-growth"
          label="labor productivity"
          onSeriesLoaded={handleSeriesLoaded}
        />
      </EconomicSection>

      <EconomicSection
        id="prices"
        title="Prices"
        description="Price measures describe how quickly the cost of goods and services is changing. Lower inflation generally means prices are rising more slowly, not necessarily becoming cheaper."
      >
        <EconomicSeriesCard
          collapsible
          slug="headline-cpi-inflation"
          supportingSlugs={cpiSupportingSlugs}
          label="headline CPI inflation"
          onSeriesLoaded={handleSeriesLoaded}
        />
        <EconomicSeriesCard
          slug="headline-cpi-inflation"
          supportingSlugs={inflationDriverSupportingSlugs}
          label="inflation drivers"
          variant="inflation-drivers"
          onSeriesLoaded={handleSeriesLoaded}
        />
        <EconomicSeriesCard
          slug="headline-cpi-three-month-annualized"
          supportingSlugs={headlineMomentumSupportingSlugs}
          label="recent inflation momentum"
          variant="inflation-momentum"
          onSeriesLoaded={handleSeriesLoaded}
        />
        <EconomicSeriesCard
          slug="real-wage-growth"
          supportingSlugs={wageComparisonSupportingSlugs}
          label="wages versus inflation"
          variant="wages-comparison"
          onSeriesLoaded={handleSeriesLoaded}
        />
      </EconomicSection>

      <EconomicSection
        id="employment-and-income"
        title="Employment and income"
        description="Labor-market indicators show how readily people can find work and how broadly employment is distributed. No single measure fully captures labor-market strength."
      >
        <EconomicSeriesCard
          collapsible
          slug="unemployment-rate"
          label="unemployment rate"
          onSeriesLoaded={handleSeriesLoaded}
        />
        <EconomicSeriesCard
          collapsible
          slug="prime-age-employment-ratio"
          label="prime-age employment-to-population ratio"
          onSeriesLoaded={handleSeriesLoaded}
        />
        <EconomicSeriesCard
          collapsible
          slug="payroll-growth"
          supportingSlugs={payrollSupportingSlugs}
          label="payroll growth"
          onSeriesLoaded={handleSeriesLoaded}
        />
        <JobGrowthBreakevenCard />
        <EconomicSeriesCard
          slug="jolts-layoffs-and-discharges-rate"
          supportingSlugs={claimsComparisonSupportingSlugs}
          label="layoffs and initial unemployment claims"
          variant="claims-comparison"
          onSeriesLoaded={handleSeriesLoaded}
        />
      </EconomicSection>

      <EconomicSection
        id="households"
        title="Households"
        description="Household indicators show aggregate saving behavior, but do not describe every household’s experience."
      >
        <EconomicSeriesCard
          collapsible
          slug="personal-saving-rate"
          label="personal saving rate"
          onSeriesLoaded={handleSeriesLoaded}
        />
      </EconomicSection>

      <EconomicSection
        id="housing"
        title="Housing"
        description="Housing conditions reflect both what households can afford and how quickly new supply is entering construction. These measures can move differently because prices, financing costs, income, and building activity respond on different timelines."
      >
        <EconomicSeriesCard
          collapsible
          slug="home-ownership-cost-share"
          label="home-ownership affordability"
          onSeriesLoaded={handleSeriesLoaded}
        />
        <EconomicSeriesCard
          collapsible
          slug="housing-starts"
          supportingSlugs={housingStartsSupportingSlugs}
          label="housing starts"
          onSeriesLoaded={handleSeriesLoaded}
        />
      </EconomicSection>

      <EconomicSection
        id="business-and-manufacturing"
        title="Business and manufacturing"
        description="Business and manufacturing indicators show how production, employment, capital spending, and industrial operating intensity are changing. These measures can diverge because they describe different parts and time horizons of business activity."
      >
        <EconomicSeriesCard
          collapsible
          slug="manufacturing-output"
          label="manufacturing production growth"
          onSeriesLoaded={handleSeriesLoaded}
        />
        <EconomicSeriesCard
          collapsible
          slug="real-business-investment-growth"
          supportingSlugs={['real-business-investment-level']}
          label="real business investment growth"
          onSeriesLoaded={handleSeriesLoaded}
        />
        <EconomicSeriesCard
          collapsible
          slug="corporate-profit-share"
          label="corporate profit share"
          onSeriesLoaded={handleSeriesLoaded}
        />
      </EconomicSection>

      <EconomicSection
        id="financial-conditions"
        title="Financial conditions"
        description="Interest rates and credit conditions affect borrowing costs and access to finance. Short- and long-term rates can move differently, while broader credit conditions can tighten or loosen for reasons not captured by Treasury yields alone."
      >
        <EconomicSeriesCard
          collapsible
          slug="ten-year-treasury-yield"
          supportingSlugs={yieldCurveSupportingSlugs}
          label="yield curve"
          variant="rate-comparison"
          onSeriesLoaded={handleSeriesLoaded}
        />
      </EconomicSection>

      <EconomicSection
        id="government-finances"
        title="Government finances"
        description="Federal budget balances show whether the government borrowed or saved during a year, while debt held by the public shows the accumulated federal obligations financed outside government accounts. Both are shown relative to GDP so they can be compared across periods of different economic size."
      >
        <EconomicSeriesCard collapsible slug="federal-budget-balance" label="federal budget balance" onSeriesLoaded={handleSeriesLoaded} />
        <EconomicSeriesCard collapsible slug="federal-debt-held-by-public" label="federal debt held by the public" onSeriesLoaded={handleSeriesLoaded} />
      </EconomicSection>

      <EconomicSection id="trade-and-tariffs" title="Trade and tariffs" description="Trade flows show exports and imports relative to the economy, while the effective tariff burden compares customs-duty receipts with imported goods. Neither measure is an overall judgment on trade policy.">
        <EconomicSeriesCard collapsible slug="trade-balance-share-of-gdp" supportingSlugs={['trade-goods-exports', 'trade-goods-imports', 'trade-services-exports', 'trade-services-imports']} label="trade balance" onSeriesLoaded={handleSeriesLoaded} />
        <EconomicSeriesCard collapsible slug="effective-tariff-burden" supportingSlugs={['core-goods-pce-inflation']} label="effective tariff burden" onSeriesLoaded={handleSeriesLoaded} />
      </EconomicSection>
    </div>
  )
}
