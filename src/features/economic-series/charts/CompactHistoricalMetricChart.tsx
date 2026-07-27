import type { CompactHistoricalMetricDefinition } from '../utils/compactHistoricalMetrics'
import {
  createCompactHistoricalAccessibleSummary,
  describeCompactHistoricalPosition,
} from '../utils/compactHistoricalMetrics'
import { formatObservationPeriod, formatPercentage } from '../utils/economicSeries'
import type { HistoricalBandResult } from '../utils/historicalBandContext'
import { HistoricalBandChart } from './HistoricalBandChart'

interface CompactHistoricalMetricChartProps {
  model: HistoricalBandResult
  definition: CompactHistoricalMetricDefinition
  visuallyHideSummary?: boolean
}

export function CompactHistoricalMetricChart({
  model,
  definition,
  visuallyHideSummary = false,
}: CompactHistoricalMetricChartProps) {
  const ready = model.status === 'ready' ? model : null
  const accessibleSummary = ready
    ? createCompactHistoricalAccessibleSummary(ready, definition)
    : null
  const latestPositionDescription = ready
    ? describeCompactHistoricalPosition(ready, definition)
    : null
  const firstRecent = ready?.recentObservations[0]
  const caption = ready && firstRecent
    ? `${definition.seriesLabel} · ${formatObservationPeriod(firstRecent.date, definition.frequency)}–${formatObservationPeriod(ready.latestObservation.date, definition.frequency)}`
    : definition.seriesLabel

  return (
    <HistoricalBandChart
      model={model}
      seriesLabel={definition.seriesLabel}
      frequency={definition.frequency}
      valueFormatter={formatPercentage}
      accessibleSummary={accessibleSummary}
      latestPositionDescription={latestPositionDescription}
      helpText={definition.helpText}
      caption={caption}
      showZeroLine={definition.showZeroLine}
      showLatestMarker={definition.showLatestMarker}
      referenceLines={definition.referenceLines}
      visuallyHideSummary={visuallyHideSummary}
      interactiveDetails={definition.interactiveDetails}
    />
  )
}
