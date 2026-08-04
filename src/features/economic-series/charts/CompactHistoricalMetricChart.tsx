import type { CompactHistoricalMetricDefinition } from '../utils/compactHistoricalMetrics'
import type { EconomicObservation } from '../models/economicSeries'
import {
  createCompactHistoricalAccessibleSummary,
  describeCompactHistoricalPosition,
} from '../utils/compactHistoricalMetrics'
import {
  formatObservationPeriod,
  formatAnnualizedHousingUnits,
  formatPercentage,
  formatSignedPercentagePoints,
} from '../utils/economicSeries'
import type { HistoricalBandResult } from '../utils/historicalBandContext'
import { classifyHistoricalBandPosition } from '../utils/historicalBandContext'
import { HistoricalBandChart } from './HistoricalBandChart'
import { formatHomeOwnershipPointDifference } from '../utils/homeOwnershipAffordability'

interface CompactHistoricalMetricChartProps {
  model: HistoricalBandResult
  definition: CompactHistoricalMetricDefinition
  observations?: readonly EconomicObservation[]
  visuallyHideSummary?: boolean
  accessibleSummaryOverride?: string
  pairedObservations?: readonly EconomicObservation[]
}

export function CompactHistoricalMetricChart({
  model,
  definition,
  observations = [],
  visuallyHideSummary = false,
  accessibleSummaryOverride,
  pairedObservations = [],
}: CompactHistoricalMetricChartProps) {
  const ready = model.status === 'ready' ? model : null
  const accessibleSummary = accessibleSummaryOverride ?? (ready
    ? createCompactHistoricalAccessibleSummary(ready, definition)
    : null)
  const latestPositionDescription = ready
    ? describeCompactHistoricalPosition(ready, definition)
    : null
  const firstRecent = ready?.recentObservations[0]
  const valueFormatter = definition.valueFormatter ?? formatPercentage
  const caption = ready && firstRecent
    ? `${definition.seriesLabel} · ${formatObservationPeriod(firstRecent.date, definition.frequency)}–${formatObservationPeriod(ready.latestObservation.date, definition.frequency)}`
    : definition.seriesLabel
  const valuesByDate = new Map(observations.map(({ date, value }) => [date, value]))
  const pairedValuesByDate = new Map(pairedObservations.map(({ date, value }) => [date, value]))
  const pointComparison = definition.pointComparison
    ? (observation: EconomicObservation & { value: number }) => {
        const priorDate = new Date(`${observation.date}T00:00:00Z`)
        priorDate.setUTCMonth(
          priorDate.getUTCMonth() - definition.pointComparison!.months,
        )
        const priorValue = valuesByDate.get(priorDate.toISOString().slice(0, 10))
        return priorValue === null || priorValue === undefined
          ? null
          : observation.value - priorValue
      }
    : null
  const threshold = definition.pointThreshold

  return (
    <HistoricalBandChart
      model={model}
      seriesLabel={definition.seriesLabel}
      frequency={definition.frequency}
      valueFormatter={valueFormatter}
      accessibleSummary={accessibleSummary}
      latestPositionDescription={latestPositionDescription}
      helpText={definition.helpText}
      comparisonLabel={ready && definition.comparisonLabel
        ? definition.comparisonLabel(ready)
        : undefined}
      caption={caption}
      showZeroLine={definition.showZeroLine}
      showLatestMarker={definition.showLatestMarker}
      referenceLines={definition.referenceLines}
      showReferenceLineLabels={definition.showReferenceLineLabels}
      visuallyHideSummary={visuallyHideSummary}
      interactiveDetails={definition.interactiveDetails}
      interactionDetails={pointComparison || threshold || pairedObservations.length > 0
        ? (observation) => {
            const comparison = pointComparison?.(observation) ?? null
            return (
              <>
                <strong>{definition.seriesLabel}</strong>
                <span>{formatObservationPeriod(observation.date, definition.frequency)}</span>
                <span>{valueFormatter(observation.value)}</span>
                {definition.pointComparison && <span>
                  {definition.pointComparison.label}: {comparison === null
                    ? 'unavailable'
                    : `${formatSignedPercentagePoints(comparison)} percentage points`}
                </span>}
                {threshold && <>
                  <span>{threshold.label}: {formatPercentage(threshold.value)}</span>
                  <span>{threshold.differenceLabel}: {definition.seriesLabel === 'Modeled ownership-cost share'
                    ? formatHomeOwnershipPointDifference(observation.value)
                    : formatSignedPercentagePoints(observation.value - threshold.value)}</span>
                </>}
                {pairedObservations.length > 0 && <>
                  <span>Three-month-average annualized starts: {formatAnnualizedHousingUnits(pairedValuesByDate.get(observation.date) ?? null)}</span>
                  <span>Historical position: {(() => {
                    if (!ready) return 'unavailable'
                    const position = classifyHistoricalBandPosition(observation.value, ready)
                    return position === 'unavailable'
                      ? 'unavailable'
                      : definition.positionDescriptions[position]
                  })()}</span>
                </>}
              </>
            )
          }
        : undefined}
    />
  )
}
