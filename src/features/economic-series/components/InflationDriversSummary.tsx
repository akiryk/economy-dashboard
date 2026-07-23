import contributionData from '../data/inflation-contributions.json'
import type { EconomicSeries } from '../models/economicSeries'
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
import { CompactChartHelp } from './CompactChartHelp'
import { CompactMetricCardLayout } from './CompactMetricCardLayout'

interface InflationDriversSummaryProps {
  headline: EconomicSeries
}

const observations =
  contributionData.observations as InflationContributionObservation[]
const current = observations.at(-1)!
const prior = observations.find(({ date }) => date === '2025-06-01') ?? null

export function InflationDriversSummary({
  headline,
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
      </CompactChartHelp>
      <figcaption className="visually-hidden" id="inflation-contributions-summary">
        {formatPercentage(current.headline)} headline CPI inflation in{' '}
        {formatObservationPeriod(current.date, 'monthly')}. {summary}{' '}
        {model?.displayedContributions.map((category) =>
          `${category.label} contributed ${formatSignedPercentagePoints(category.contribution)} percentage points.`,
        ).join(' ')} The complete contribution set{' '}
        {model?.reconciliationStatus === 'reconciled'
          ? `reconciles to headline CPI within 0.05 percentage point; the difference is ${formatSignedPercentagePoints(model.reconciliationDifference)} percentage points.`
          : 'does not reconcile to headline CPI within 0.05 percentage point.'}
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
