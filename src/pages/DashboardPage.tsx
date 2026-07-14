import { useCallback, useMemo, useState } from 'react'
import { EconomicSection } from '../components/layout/EconomicSection'
import { DashboardNavigation } from '../components/layout/DashboardNavigation'
import { EconomicSeriesCard } from '../features/economic-series/components/EconomicSeriesCard'
import type { EconomicSeries } from '../features/economic-series/models/economicSeries'
import {
  findLatestNonNullObservation,
  formatObservationPeriod,
} from '../features/economic-series/utils/economicSeries'

const payrollSupportingSlugs = ['monthly-payroll-change'] as const
const wageComparisonSupportingSlugs = [
  'nominal-wage-growth',
  'headline-cpi-inflation',
] as const
const headlineInflationSupportingSlugs = ['headline-cpi-inflation'] as const
const headlineMomentumSupportingSlugs = [
  'headline-cpi-three-month-annualized',
] as const
const householdSpendingSupportingSlugs = [
  'real-consumer-spending-growth',
] as const

export function DashboardPage() {
  const [loadedSeries, setLoadedSeries] = useState<
    Readonly<Record<string, EconomicSeries>>
  >({})

  const handleSeriesLoaded = useCallback(
    (slug: string, series: EconomicSeries | null) => {
      setLoadedSeries((current) => {
        if (series) return { ...current, [slug]: series }
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
      </section>

      <DashboardNavigation />

      <EconomicSection
        id="growth"
        title="Growth"
        description="Growth measures how much the economy is producing, but not how evenly those gains are distributed or whether output per person is increasing."
      >
        <EconomicSeriesCard
          slug="real-gdp-growth"
          label="real GDP"
          onSeriesLoaded={handleSeriesLoaded}
        />
        <EconomicSeriesCard
          slug="real-gdp-per-capita-growth"
          label="real GDP per capita"
          onSeriesLoaded={handleSeriesLoaded}
        />
        <EconomicSeriesCard
          slug="labor-productivity-level"
          label="labor productivity level"
          variant="productivity-level"
          onSeriesLoaded={handleSeriesLoaded}
        />
        <EconomicSeriesCard
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
          slug="headline-cpi-inflation"
          label="headline CPI inflation"
          onSeriesLoaded={handleSeriesLoaded}
        />
        <EconomicSeriesCard
          slug="core-cpi-inflation"
          supportingSlugs={headlineInflationSupportingSlugs}
          label="headline versus core CPI"
          variant="headline-core-comparison"
          onSeriesLoaded={handleSeriesLoaded}
        />
        <EconomicSeriesCard
          slug="core-cpi-three-month-annualized"
          supportingSlugs={headlineMomentumSupportingSlugs}
          label="recent inflation momentum"
          variant="inflation-momentum"
          onSeriesLoaded={handleSeriesLoaded}
        />
      </EconomicSection>

      <EconomicSection
        id="employment-and-income"
        title="Employment and income"
        description="Labor-market indicators show how readily people can find work and how broadly employment is distributed. No single measure fully captures labor-market strength."
      >
        <EconomicSeriesCard
          slug="unemployment-rate"
          label="unemployment rate"
          onSeriesLoaded={handleSeriesLoaded}
        />
        <EconomicSeriesCard
          slug="prime-age-employment-ratio"
          label="prime-age employment-to-population ratio"
          onSeriesLoaded={handleSeriesLoaded}
        />
        <EconomicSeriesCard
          slug="payroll-growth"
          supportingSlugs={payrollSupportingSlugs}
          label="payroll growth"
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
        id="households"
        title="Households"
        description="Household indicators show how inflation-adjusted income, spending, and saving are changing in aggregate, but do not describe every household’s experience."
      >
        <EconomicSeriesCard
          slug="real-disposable-income-per-capita-growth"
          supportingSlugs={householdSpendingSupportingSlugs}
          label="real income versus spending"
          variant="household-comparison"
          onSeriesLoaded={handleSeriesLoaded}
        />
        <EconomicSeriesCard
          slug="personal-saving-rate"
          label="personal saving rate"
          onSeriesLoaded={handleSeriesLoaded}
        />
      </EconomicSection>
    </div>
  )
}
