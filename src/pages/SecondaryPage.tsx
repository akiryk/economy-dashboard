import { EconomicSection } from '../components/layout/EconomicSection'
import { EconomicSeriesCard } from '../features/economic-series/components/EconomicSeriesCard'

export function SecondaryPage() {
  return (
    <div className="page">
      <section className="page-intro" aria-labelledby="secondary-heading">
        <h1 id="secondary-heading">Secondary indicators</h1>
        <p>
          This page holds data cards that are not currently part of the main
          dashboard but may still be useful for future review.
        </p>
      </section>

      <EconomicSection
        id="secondary-growth"
        title="Growth"
        description="Additional growth measures retained for future evaluation."
      >
        <EconomicSeriesCard
          slug="labor-productivity-level"
          label="labor productivity level"
          variant="productivity-level"
        />
      </EconomicSection>
    </div>
  )
}
