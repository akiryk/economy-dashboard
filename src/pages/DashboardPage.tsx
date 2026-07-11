import { EconomicSeriesCard } from '../features/economic-series/components/EconomicSeriesCard'

export function DashboardPage() {
  return (
    <div className="page">
      <section className="page-intro" aria-labelledby="dashboard-heading">
        <h1 id="dashboard-heading">U.S. Economy Dashboard</h1>
        <p>
          Economic indicators update at different frequencies and often tell
          different parts of the story. This dashboard will present several
          complementary measures rather than reducing the economy to a single
          score.
        </p>
      </section>

      <EconomicSeriesCard slug="real-gdp-growth" label="real GDP" />
      <EconomicSeriesCard
        slug="headline-cpi-inflation"
        label="headline CPI inflation"
      />
    </div>
  )
}
