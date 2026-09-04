import { InternationalComparisonCard } from '../features/international-comparison/components/InternationalComparisonCard'
import { internationalComparisonRepository } from '../features/international-comparison/repositories/internationalComparisonRepository'
import { FreshnessScope } from '../features/data-freshness/FreshnessContext'
import { FreshnessNotice } from '../features/data-freshness/FreshnessNotice'
import '../styles/comparePage.css'

export function ComparePage() {
  return (
    <div className="page compare-page">
      <section className="page-intro" aria-labelledby="compare-heading">
        <h1 id="compare-heading">Compare economies</h1>
        <p>
          See how the United States compares with other wealthy economies
          across measures used in this dashboard.
        </p>
        <FreshnessScope datasetKeys={['international-comparisons']}>
          <FreshnessNotice />
        </FreshnessScope>
      </section>
      <section className="compare-page__grid" aria-label="International economic comparisons">
        <InternationalComparisonCard
          metric={internationalComparisonRepository.getMetric('prime-age-employment')}
        />
        <InternationalComparisonCard
          metric={internationalComparisonRepository.getMetric('unemployment')}
        />
        <InternationalComparisonCard
          metric={internationalComparisonRepository.getMetric('headline-inflation')}
        />
        <InternationalComparisonCard
          metric={internationalComparisonRepository.getMetric('real-gdp-growth')}
        />
        <InternationalComparisonCard
          metric={internationalComparisonRepository.getMetric('ten-year-government-yield')}
        />
      </section>
    </div>
  )
}
