import { lazy, Suspense, useMemo, useState } from 'react'
import type {
  AvailableJobGrowthBreakevenObservation,
  JobGrowthBreakevenDataset,
} from '../models/jobGrowthBreakeven'
import {
  createJobGrowthBreakevenAccessibleSummary,
  deriveJobGrowthBreakevenContext,
  formatBreakevenRate,
  formatSignedPp,
  jobGrowthBreakevenNeutralThreshold,
} from '../utils/jobGrowthBreakevenContext'
import {
  formatObservationPeriod,
  formatSignedPercentagePoints,
  formatSignedThousands,
} from '../utils/economicSeries'
import { CompactMetricCardLayout } from './CompactMetricCardLayout'
import { TimeRangeControl } from './TimeRangeControl'
import type { TimeRange } from '../utils/chartData'
import './jobGrowthBreakeven.css'

const JobGrowthBreakevenChart = lazy(() =>
  import('../charts/JobGrowthBreakevenChart').then((module) => ({
    default: module.JobGrowthBreakevenChart,
  })),
)

interface JobGrowthBreakevenSummaryProps {
  dataset: JobGrowthBreakevenDataset
}

const rangeObservationCounts: Record<TimeRange, number> = {
  '5y': 21,
  '10y': 41,
  '20y': 81,
  max: Number.MAX_SAFE_INTEGER,
}

function Components({
  observation,
  heading,
}: {
  observation: AvailableJobGrowthBreakevenObservation
  heading?: string
}) {
  return (
    <section className="job-growth-breakeven__components">
      {heading && <h4>{heading}</h4>}
      <dl>
        <div>
          <dt>Percentage-point gap</dt>
          <dd>{formatSignedPp(observation.gapPercentagePoints)}</dd>
        </div>
        <div>
          <dt>Actual payroll growth</dt>
          <dd>
            {formatBreakevenRate(observation.actualAnnualizedPayrollGrowthRate)} annualized
          </dd>
        </div>
        <div>
          <dt>Estimated breakeven growth</dt>
          <dd>
            {formatBreakevenRate(observation.estimatedAnnualizedBreakevenGrowthRate)} annualized
          </dd>
        </div>
        <div>
          <dt>Actual average monthly job growth</dt>
          <dd>{formatSignedThousands(observation.actualAverageMonthlyJobGrowth)} per month</dd>
        </div>
        <div>
          <dt>Estimated breakeven job growth</dt>
          <dd>{formatSignedThousands(observation.estimatedBreakevenMonthlyJobGrowth)} per month</dd>
        </div>
        <div>
          <dt>Difference in jobs</dt>
          <dd>{formatSignedThousands(observation.monthlyJobGrowthDifference)} per month</dd>
        </div>
      </dl>
    </section>
  )
}

function RecentTable({
  observations,
}: {
  observations: readonly AvailableJobGrowthBreakevenObservation[]
}) {
  return (
    <details>
      <summary>Recent observations</summary>
      <div className="table-scroll">
        <table>
          <caption>
            Twelve most recent payroll-growth-versus-estimated-breakeven comparisons
          </caption>
          <thead>
            <tr>
              <th scope="col">Period</th>
              <th scope="col">Gap</th>
              <th scope="col">Actual rate</th>
              <th scope="col">Estimated rate</th>
              <th scope="col">Actual jobs/month</th>
              <th scope="col">Estimated jobs/month</th>
              <th scope="col">Difference/month</th>
            </tr>
          </thead>
          <tbody>
            {observations.map((item) => (
              <tr key={item.date}>
                <th scope="row">
                  {formatObservationPeriod(item.date, 'quarterly')}
                </th>
                <td>{formatSignedPp(item.gapPercentagePoints)}</td>
                <td>{formatBreakevenRate(item.actualAnnualizedPayrollGrowthRate)}</td>
                <td>{formatBreakevenRate(item.estimatedAnnualizedBreakevenGrowthRate)}</td>
                <td>{formatSignedThousands(item.actualAverageMonthlyJobGrowth)}</td>
                <td>{formatSignedThousands(item.estimatedBreakevenMonthlyJobGrowth)}</td>
                <td>{formatSignedThousands(item.monthlyJobGrowthDifference)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </details>
  )
}

export function JobGrowthBreakevenSummary({
  dataset,
}: JobGrowthBreakevenSummaryProps) {
  const [selectedRange, setSelectedRange] = useState<TimeRange>('20y')
  const context = useMemo(
    () => deriveJobGrowthBreakevenContext(dataset),
    [dataset],
  )
  const available = useMemo(
    () => dataset.observations.filter(
      (item): item is AvailableJobGrowthBreakevenObservation =>
        item.status === 'available',
    ),
    [dataset.observations],
  )
  const latest = context.latest
  if (!latest) {
    return (
      <p className="status-message status-message--error" role="alert">
        The job-growth-versus-breakeven comparison is unavailable.
      </p>
    )
  }
  const summary = createJobGrowthBreakevenAccessibleSummary(context)

  return (
    <CompactMetricCardLayout
      cardId="job-growth-breakeven"
      eyebrow="Labor market"
      question="Is job growth keeping up with the labor force?"
      measureLabel="Actual payroll growth compared with estimated breakeven growth"
      latestValue={
        <div className="series-current job-growth-breakeven__current" aria-label={summary}>
          <p className="series-current__value">
            {formatSignedPp(latest.gapPercentagePoints)}
          </p>
          <p className="series-current__label">{context.heroLabel}</p>
          <p className="series-current__period">
            {formatObservationPeriod(latest.date, 'monthly')} · Latest three-month annualized rate
          </p>
          <p className="series-current__answer">{context.answer}</p>
          <div className="job-growth-breakeven__derivation">
            <p>
              Actual payroll growth:{' '}
              <strong>{formatBreakevenRate(latest.actualAnnualizedPayrollGrowthRate)} annualized</strong>
            </p>
            <p>
              Estimated breakeven growth:{' '}
              <strong>{formatBreakevenRate(latest.estimatedAnnualizedBreakevenGrowthRate)} annualized</strong>
            </p>
            <p>
              Difference:{' '}
              <strong>{formatSignedPercentagePoints(latest.gapPercentagePoints)} percentage points</strong>
            </p>
          </div>
        </div>
      }
      compactVisual={
        <div className="job-growth-breakeven__chart">
          <Suspense fallback={
            <p className="chart-state chart-state--compact" role="status">
              Loading job-growth comparison chart…
            </p>
          }>
            <JobGrowthBreakevenChart dataset={dataset} visuallyHideSummary />
          </Suspense>
        </div>
      }
      expandedContent={
        <>
          <Components observation={latest} heading="Latest underlying comparison" />
          <section className="job-growth-breakeven__expanded-chart">
            <h4>Payroll growth relative to the estimated breakeven pace</h4>
            <TimeRangeControl
              selectedRange={selectedRange}
              onRangeChange={setSelectedRange}
              contextLabel="Job growth relative to estimated breakeven"
            />
            <Suspense fallback={
              <p className="chart-state chart-state--compact" role="status">
                Loading expanded job-growth comparison chart…
              </p>
            }>
              <JobGrowthBreakevenChart
                dataset={dataset}
                recentObservationCount={rangeObservationCounts[selectedRange]}
              />
            </Suspense>
          </section>
          <div className="series-explanations">
            <section>
              <h4>What this tells you</h4>
              <p>
                The gap compares the annualized growth rate of payroll
                employment over the latest three months with an estimated rate
                consistent with absorbing potential labor-force growth while
                keeping unemployment approximately stable.
              </p>
            </section>
            <section>
              <h4>What this leaves out</h4>
              <p>
                The baseline is estimated and model-dependent. Matching it is
                not a complete assessment of job quality, wages, hours,
                participation, or worker well-being. One period above or below
                breakeven does not establish a lasting unemployment trend.
                Payroll and breakeven estimates may both be revised.
              </p>
            </section>
            <section>
              <h4>Methodology and limitations</h4>
              <p>
                Actual growth uses four consecutive PAYEMS levels to calculate
                three valid monthly changes and annualizes the exact
                three-month level ratio. The Federal Reserve estimate is
                applied to the same starting payroll level and annualized with
                the same compounding formula. Comparisons align only at
                quarter-ending months; missing periods remain unavailable.
                Differences strictly inside ±
                {(jobGrowthBreakevenNeutralThreshold).toFixed(2)} percentage
                point are classified as about even, matching half of the
                displayed 0.1-point precision.
              </p>
            </section>
            <section>
              <h4>Sources and series details</h4>
              <p>
                Estimated breakeven growth: Federal Reserve Board,{' '}
                <a href={dataset.sources[0].sourceUrl}>
                  Labor force growth, breakeven employment, and potential GDP growth
                </a>. Actual payroll employment: BLS Current Employment
                Statistics via <a href={dataset.sources[1].sourceUrl}>FRED PAYEMS</a>.
                The latest breakeven input is a source projection rather than
                an observed threshold. Data snapshot retrieved {dataset.retrievedAt}.
              </p>
            </section>
          </div>
          <RecentTable observations={available.slice(-12).reverse()} />
          <section className="related-indicators">
            <h4>Consider alongside</h4>
            <ul>
              <li><a href="#payroll-growth-card">Payroll growth</a></li>
              <li><a href="#unemployment-rate-card">Unemployment</a></li>
              <li><a href="#initial-unemployment-claims-card">Initial unemployment claims</a></li>
              <li><a href="#prime-age-employment-ratio-card">Prime-age employment</a></li>
            </ul>
          </section>
        </>
      }
    />
  )
}
