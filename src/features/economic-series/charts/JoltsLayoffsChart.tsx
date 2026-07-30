import type { HistoricalBandResult } from '../utils/historicalBandContext'
import {
  classifyJoltsLevel,
  joltsLevelStatement,
} from '../utils/joltsLayoffsContext'
import {
  formatObservationPeriod,
  formatPercentage,
} from '../utils/economicSeries'
import { HistoricalBandChart } from './HistoricalBandChart'

export function JoltsLayoffsChart({
  model,
}: {
  model: HistoricalBandResult
}) {
  const ready = model.status === 'ready' ? model : null
  const first = ready?.recentObservations.find(({ value }) => value !== null)
  const latestPosition = classifyJoltsLevel(model)
  const summary = ready
    ? `The JOLTS layoffs and discharges rate was ${formatPercentage(
      ready.latestObservation.value,
    )} in ${formatObservationPeriod(
      ready.latestObservation.date,
      'monthly',
    )}. The line covers ${formatObservationPeriod(
      first?.date ?? ready.latestObservation.date,
      'monthly',
    )} through ${formatObservationPeriod(
      ready.latestObservation.date,
      'monthly',
    )}. The trailing 25-year middle 50% ranges from ${formatPercentage(
      ready.innerLower,
    )} to ${formatPercentage(
      ready.innerUpper,
    )}; the middle 80% ranges from ${formatPercentage(
      ready.outerLower,
    )} to ${formatPercentage(
      ready.outerUpper,
    )}. ${joltsLevelStatement(latestPosition)} No zero line is shown.`
    : null
  const caption = ready
    ? `JOLTS layoffs rate · ${formatObservationPeriod(
      first?.date ?? ready.latestObservation.date,
      'monthly',
    )}–${formatObservationPeriod(ready.latestObservation.date, 'monthly')}`
    : 'JOLTS layoffs rate'

  return (
    <HistoricalBandChart
      model={model}
      seriesLabel="JOLTS layoffs and discharges rate"
      frequency="monthly"
      valueFormatter={formatPercentage}
      accessibleSummary={summary}
      latestPositionDescription={joltsLevelStatement(latestPosition)}
      helpText={{
        heading: 'JOLTS layoffs and historical context',
        description:
          'JOLTS layoffs and discharges are employer-initiated separations. The rate compares separations during the month with employment. Direction compares the latest three-month average with the preceding three-month average. The dark band is the middle 50% and the lighter band the middle 80% of valid monthly rates over the trailing 25 years. The bands describe historical frequency, not a target or forecast. JOLTS is monthly and reported with a lag; initial claims are timelier weekly evidence but do not capture every layoff.',
      }}
      caption={caption}
      showZeroLine={false}
      showLatestMarker
      visuallyHideSummary
      interactiveDetails
    />
  )
}

export default JoltsLayoffsChart
