import { lazy, Suspense } from 'react'
import type { EconomicSeries } from '../models/economicSeries'
import contributionData from '../data/inflation-contributions.json'
import {
  formatObservationPeriod,
  formatPercentage,
  formatSignedPercentagePoints,
} from '../utils/economicSeries'
import {
  buildInflationContributionCategories,
  contributionResidual,
  deriveCompactInflationDriversModel,
  formatContributionChange,
  type InflationContributionObservation,
} from '../utils/inflationContributions'
import {
  createInflationCategoryTrendAccessibleSummary,
  deriveInflationDriversSupportingTrends,
} from '../utils/inflationCategoryTrends'
import { CompactChartHelp } from './CompactChartHelp'
import { CompactMetricCardLayout } from './CompactMetricCardLayout'

const InflationCategoryTrendCharts = lazy(() =>
  import('../charts/InflationCategoryTrendCharts').then((module) => ({
    default: module.InflationCategoryTrendCharts,
  })),
)

interface InflationDriversSummaryProps {
  headline: EconomicSeries
  supportingSeries: readonly EconomicSeries[]
}

const observations =
  contributionData.observations as InflationContributionObservation[]
const current = observations.at(-1)!
const prior = observations.find(({ date }) => date === '2025-06-01') ?? null
export function InflationDriversSummary({
  headline,
  supportingSeries,
}: InflationDriversSummaryProps) {
  const categories = buildInflationContributionCategories(current, prior)
  const model = deriveCompactInflationDriversModel({
    headlineInflation: current.headline,
    headlinePeriod: current.date,
    categories,
  })
  const summary = model?.summary ??
    'Inflation contribution data are unavailable.'
  const residual = contributionResidual(current.headline, categories)
  const trendModel = deriveInflationDriversSupportingTrends({
    selectedContributions: model?.displayedContributions ?? [],
    supportingSeries,
  })
  const trendSummary = createInflationCategoryTrendAccessibleSummary({
    headlinePeriod: current.date,
    selectedContributions: model?.displayedContributions ?? [],
    model: trendModel,
  })
  const maxMagnitude = Math.max(
    0.01,
    ...(model?.displayedContributions ?? [])
      .map(({ contribution }) => Math.abs(contribution)),
  )

  const bars = (
    <figure
      className="inflation-contributions"
      aria-labelledby="inflation-contributions-summary"
    >
      <div className="inflation-contributions__comparison">
        <section className="inflation-contributions__section">
          <h4>Current contribution</h4>
          <div className="inflation-contributions__plot" aria-hidden="true">
            {model?.displayedContributions.map((category) => {
              const width = `${Math.abs(category.contribution) / maxMagnitude * 50}%`
              return (
                <div className="inflation-contributions__row" key={category.id}>
                  <span className="inflation-contributions__label">{category.label}</span>
                  <span className="inflation-contributions__track">
                    <span className="inflation-contributions__zero" />
                    <span
                      className={`inflation-contributions__bar inflation-contributions__bar--${category.contribution < 0 ? 'negative' : 'positive'}`}
                      style={{
                        width,
                        [category.contribution < 0 ? 'right' : 'left']: '50%',
                      }}
                    />
                  </span>
                  <span className="inflation-contributions__value">
                    {formatSignedPercentagePoints(category.contribution)} pp
                  </span>
                </div>
              )
            })}
          </div>
          <p className="inflation-contributions__caption">
            Percentage points added to or subtracted from the latest{' '}
            {formatPercentage(current.headline)} CPI increase
          </p>
        </section>
        <section className="inflation-contributions__section">
          <h4>Inflation rate over five years</h4>
          <p className="inflation-category-trends__note">
            Shown for current contributors with a directly comparable CPI series.
          </p>
          <Suspense
            fallback={(
              <p className="inflation-category-trends__unavailable" role="status">
                Loading category inflation trends…
              </p>
            )}
          >
            <InflationCategoryTrendCharts model={trendModel} />
          </Suspense>
        </section>
      </div>
      <CompactChartHelp
        buttonLabel="Explain inflation contributions"
        dialogLabel="Inflation contribution explanation"
        heading="How to read this chart"
      >
        <p>
          Each bar shows how many percentage points a category contributed to
          the current 12-month headline CPI inflation rate. Positive values add
          to headline inflation; negative values reduce it. These are not the
          categories’ own inflation rates.
        </p>
        <p>
          The four categories with the largest absolute current contributions
          are shown separately. Everything else is the net sum of all other
          categories. The complete contribution set should approximately add
          up to headline CPI, subject to published rounding.
        </p>
        <p>
          The left side uses percentage points to answer how much each
          dynamically selected category contributed to headline CPI. The right
          side uses percent changes to show five years of that category’s own
          year-over-year inflation rate. Contribution depends on both price
          movement and CPI weight, so a high category rate need not make an
          equally large headline contribution.
        </p>
        <p>
          Right-side mappings use exact category IDs and directly comparable
          CPI series; they are not inferred from labels. Unsupported selected
          categories are omitted and are not replaced merely to fill space.
          Omission does not mean the category had no inflation. All displayed
          rate lines share one scale including zero.
        </p>
      </CompactChartHelp>
      <figcaption className="visually-hidden" id="inflation-contributions-summary">
        {formatPercentage(current.headline)} headline CPI inflation in{' '}
        {formatObservationPeriod(current.date, 'monthly')}. {summary}{' '}
        {model?.displayedContributions.map((category) =>
          `${category.label} contributed ${formatSignedPercentagePoints(category.contribution)} percentage points.`,
        ).join(' ')} The complete contribution set{' '}
        {model?.reconciliationStatus === 'reconciled'
          ? `reconciles to headline CPI within 0.05 percentage point; the difference is ${formatSignedPercentagePoints(model.reconciliationDifference)} percentage points.`
          : 'does not reconcile to headline CPI within 0.05 percentage point.'}{' '}
        {trendSummary}
      </figcaption>
    </figure>
  )

  return (
    <CompactMetricCardLayout
      cardId="inflation-drivers"
      eyebrow="Inflation drivers"
      question="What is driving inflation?"
      measureLabel="Category contributions to headline CPI inflation"
      collapsible
      latestValue={(
        <div className="inflation-contributions__intro">
          <p className="inflation-contributions__answer">{summary}</p>
          <p>
            Positive contributions add to headline inflation; negative
            contributions subtract from it.
          </p>
          <p className="series-current__period">
            {formatObservationPeriod(current.date, 'monthly')} · Contributions
            to year-over-year headline CPI
          </p>
        </div>
      )}
      compactVisual={bars}
      expandedContent={(
        <>
          <section className="inflation-contributions__expanded">
            <h4>Current contributions and change from a year ago</h4>
            <p>
              BLS calls these values effects: each is the percentage-point
              amount a category added to or subtracted from the all-items CPI
              change. The five mutually exclusive groups sum to{' '}
              {formatSignedPercentagePoints(current.headline - residual)}{' '}
              percentage points, a {residual < 0 ? '−' : '+'}
              {Math.abs(residual).toFixed(3)}-point published rounding residual
              versus headline CPI.
            </p>
            <div className="table-scroll">
              <table>
                <caption>
                  CPI category contributions in June 2026 and June 2025
                </caption>
                <thead>
                  <tr>
                    <th scope="col">Category</th>
                    <th scope="col">June 2026 contribution</th>
                    <th scope="col">June 2025 contribution</th>
                    <th scope="col">One-year change</th>
                  </tr>
                </thead>
                <tbody>
                  {categories.map((category) => (
                    <tr key={category.id}>
                      <th scope="row">{category.label}</th>
                      <td>{formatSignedPercentagePoints(category.contribution)} pp</td>
                      <td>{formatSignedPercentagePoints(category.yearAgoContribution)} pp</td>
                      <td>{formatContributionChange(category.change)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
          <div className="series-explanations">
            <section>
              <h4>What this tells you</h4>
              <p>
                Contributions combine each category’s price movement with its
                weight in the CPI basket, making them more useful than category
                inflation rates for identifying what is moving headline CPI.
              </p>
            </section>
            <section>
              <h4>Method and limitations</h4>
              <p>
                Values are the unadjusted 12-month effects published in BLS
                Table 7. Other services is services less energy services minus
                shelter. BLS calculates effects from unrounded indexes and
                weights; published effects are rounded to three decimals and
                can be revised with CPI source data. No missing value is
                interpolated or carried forward.
              </p>
            </section>
          </div>
          <footer className="series-supporting">
            <p className="series-source">
              Source:{' '}
              <a href={contributionData.sourceUrl} target="_blank" rel="noreferrer">
                {contributionData.sourceName}
              </a>
            </p>
            <p>
              Headline orientation series:{' '}
              <a href={headline.sourceUrl} target="_blank" rel="noreferrer">
                {headline.providerSeriesId} via FRED
              </a>
            </p>
          </footer>
        </>
      )}
    />
  )
}
