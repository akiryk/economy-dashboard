import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import * as echarts from 'echarts/core'
import { LineChart } from 'echarts/charts'
import {
  GridComponent,
  MarkAreaComponent,
  MarkLineComponent,
  MarkPointComponent,
  TooltipComponent,
} from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import type { EconomicFrequency } from '../models/economicSeries'
import type { EconomicObservation } from '../models/economicSeries'
import type { HistoricalBandHelpText } from '../utils/compactHistoricalMetrics'
import type { HistoricalBandResult } from '../utils/historicalBandContext'
import {
  calculateHistoricalBandYDomain,
  createHistoricalBandChartOptions,
} from './historicalBandChartOptions'
import { CompactChartHelp } from '../components/CompactChartHelp'
import {
  adjacentFiniteObservationIndex,
  nearestFiniteObservationIndex,
} from '../utils/inflationCategoryTrendInteraction'
import { formatObservationPeriod } from '../utils/economicSeries'
import './historicalBandChartInteraction.css'

echarts.use([
  GridComponent,
  LineChart,
  MarkAreaComponent,
  MarkLineComponent,
  MarkPointComponent,
  TooltipComponent,
  CanvasRenderer,
])

const noReferenceLines: readonly { value: number; label: string }[] = []

interface HistoricalBandChartProps {
  model: HistoricalBandResult
  seriesLabel: string
  frequency: EconomicFrequency
  valueFormatter: (value: number | null) => string
  accessibleSummary: string | null
  latestPositionDescription: string | null
  helpText: HistoricalBandHelpText
  caption: string
  showZeroLine?: boolean
  showLatestMarker?: boolean
  showAllObservationMarkers?: boolean
  referenceLines?: readonly { value: number; label: string }[]
  showReferenceLineLabels?: boolean
  visuallyHideSummary?: boolean
  interactiveDetails?: boolean
  interactionDetails?: (observation: EconomicObservation & {
    value: number
  }) => ReactNode
  zeroLineLabel?: string
  comparisonLabel?: string
  interactiveCursor?: 'crosshair' | 'pointer'
  unifiedFooterLabels?: boolean
}

export function HistoricalBandChart({
  model,
  seriesLabel,
  frequency,
  valueFormatter,
  accessibleSummary,
  latestPositionDescription,
  helpText,
  caption,
  showZeroLine = false,
  showLatestMarker = true,
  showAllObservationMarkers = false,
  referenceLines = noReferenceLines,
  showReferenceLineLabels = false,
  visuallyHideSummary = false,
  interactiveDetails = false,
  interactionDetails,
  zeroLineLabel,
  comparisonLabel,
  interactiveCursor = 'crosshair',
  unifiedFooterLabels = false,
}: HistoricalBandChartProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const interactionRef = useRef<HTMLDivElement>(null)
  const [chartError, setChartError] = useState(false)
  const [activeIndex, setActiveIndex] = useState<number | null>(null)
  const [pinned, setPinned] = useState(false)
  const id = useId()
  const summaryId = `${id}-summary`
  const options = useMemo(
    () => model.status === 'ready' && latestPositionDescription
      ? createHistoricalBandChartOptions({
          model, seriesLabel, frequency, valueFormatter,
          latestPositionDescription, showZeroLine, showLatestMarker,
          showAllObservationMarkers, cursor: interactiveCursor,
          referenceLines,
          showTooltip: !interactiveDetails,
        })
      : null,
    [
      frequency, latestPositionDescription, model, seriesLabel,
      interactiveDetails, interactiveCursor, referenceLines,
      showAllObservationMarkers, showLatestMarker, showZeroLine,
      valueFormatter,
    ],
  )

  useEffect(() => {
    const container = containerRef.current
    if (!container || !options) return
    try {
      const chart = echarts.init(container)
      chart.setOption(options, { notMerge: true })
      chart.getZr?.().setCursorStyle(interactiveCursor)
      const resize = () => chart.resize()
      const observer = typeof ResizeObserver === 'undefined'
        ? null
        : new ResizeObserver(resize)
      if (observer) observer.observe(container)
      else window.addEventListener('resize', resize)
      return () => {
        observer?.disconnect()
        if (!observer) window.removeEventListener('resize', resize)
        chart.dispose()
      }
    } catch (error: unknown) {
      console.error(`Failed to initialize the compact ${seriesLabel} chart`, error)
      queueMicrotask(() => setChartError(true))
    }
  }, [interactiveCursor, options, seriesLabel])

  useEffect(() => {
    if (!pinned) return
    const dismiss = (event: PointerEvent) => {
      if (!interactionRef.current?.contains(event.target as Node)) {
        setPinned(false)
        setActiveIndex(null)
      }
    }
    document.addEventListener('pointerdown', dismiss)
    return () => document.removeEventListener('pointerdown', dismiss)
  }, [pinned])

  if (model.status !== 'ready' || !accessibleSummary || !latestPositionDescription) {
    return (
      <p className="chart-state chart-state--compact" role="status">
        Historical context is unavailable.
      </p>
    )
  }
  if (chartError) {
    return (
      <p className="chart-state chart-state--compact" role="alert">
        The compact chart could not be displayed.
      </p>
    )
  }
  const activeObservation = activeIndex === null
    ? null
    : model.recentObservations[activeIndex] ?? null
  const activePosition = activeIndex === null ||
    model.recentObservations.length < 2
    ? 100
    : activeIndex / (model.recentObservations.length - 1) * 100
  const verticalDomain = model.status === 'ready'
    ? calculateHistoricalBandYDomain(
        model,
        showZeroLine,
        referenceLines.map(({ value }) => value),
      )
    : null
  const activeVerticalPosition = activeObservation?.value !== null &&
    activeObservation && verticalDomain
    ? (verticalDomain.max - activeObservation.value) /
      (verticalDomain.max - verticalDomain.min) * 100
    : 50
  const placeTooltipBelow = activeVerticalPosition < 35
  const indexFromPointer = (clientX: number): number | null => {
    const bounds = interactionRef.current?.getBoundingClientRect()
    if (!bounds || bounds.width === 0) return null
    return nearestFiniteObservationIndex(
      model.recentObservations,
      (clientX - bounds.left) / bounds.width,
    )
  }

  return (
    <figure
      className={`historical-band-chart${unifiedFooterLabels ? ' historical-band-chart--unified-footer' : ''}`}
      aria-labelledby={summaryId}
    >
      <div
        ref={interactiveDetails ? interactionRef : undefined}
        className={interactiveDetails
          ? `historical-band-chart__interaction historical-band-chart__interaction--${interactiveCursor}`
          : undefined}
        tabIndex={interactiveDetails ? 0 : undefined}
        aria-label={interactiveDetails
          ? `${seriesLabel} chart. Use left and right arrow keys for exact ${frequency === 'quarterly' ? 'quarterly' : frequency === 'monthly' ? 'monthly' : 'period'} values.`
          : undefined}
        onFocus={interactiveDetails ? () => {
          if (activeIndex === null) {
            setActiveIndex(nearestFiniteObservationIndex(
              model.recentObservations,
              1,
            ))
          }
        } : undefined}
        onBlur={interactiveDetails ? () => {
          if (!pinned) setActiveIndex(null)
        } : undefined}
        onKeyDown={interactiveDetails ? (event) => {
          if (event.key === 'Escape') {
            setPinned(false)
            setActiveIndex(null)
            interactionRef.current?.focus()
            return
          }
          if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return
          event.preventDefault()
          setActiveIndex((current) => adjacentFiniteObservationIndex(
            model.recentObservations,
            current,
            event.key === 'ArrowLeft' ? -1 : 1,
          ))
        } : undefined}
        onPointerMove={interactiveDetails ? (event) => {
          if (!pinned && event.pointerType !== 'touch') {
            setActiveIndex(indexFromPointer(event.clientX))
          }
        } : undefined}
        onPointerLeave={interactiveDetails ? (event) => {
          if (!pinned && event.pointerType !== 'touch') setActiveIndex(null)
        } : undefined}
        onPointerDown={interactiveDetails ? (event) => {
          if (event.pointerType !== 'touch') return
          const index = indexFromPointer(event.clientX)
          if (pinned && index === activeIndex) {
            setPinned(false)
            setActiveIndex(null)
          } else {
            setActiveIndex(index)
            setPinned(true)
          }
        } : undefined}
      >
        <div
          ref={containerRef}
          className="historical-band-chart__canvas"
          aria-hidden="true"
        />
        {interactiveDetails &&
          activeObservation?.value !== null &&
          activeObservation && (
            <div
              className={`historical-band-chart__interaction-tooltip${
                placeTooltipBelow
                  ? ' historical-band-chart__interaction-tooltip--below'
                  : ''
              }`}
              role="status"
              style={{
                left: `clamp(5rem, ${activePosition}%, calc(100% - 5rem))`,
                top: `${activeVerticalPosition}%`,
              }}
            >
              {interactionDetails
                ? interactionDetails({
                    ...activeObservation,
                    value: activeObservation.value,
                  })
                : (
                  <>
                    <strong>{seriesLabel}</strong>
                    <span>
                      {formatObservationPeriod(activeObservation.date, frequency)}
                    </span>
                    <span>{valueFormatter(activeObservation.value)}</span>
                  </>
                )}
            </div>
          )}
      </div>
      {unifiedFooterLabels ? (
        <div className="historical-band-chart__footer-lines">
          {comparisonLabel && <p>{comparisonLabel}</p>}
          <p>{caption}</p>
        </div>
      ) : <p className="historical-band-chart__title">{caption}</p>}
      {showReferenceLineLabels && referenceLines.map(({ value, label }) => (
        <p className="historical-band-chart__zero-label" key={`${value}-${label}`}>
          {label}
        </p>
      ))}
      {!unifiedFooterLabels && comparisonLabel && (
        <p className="historical-band-chart__zero-label">{comparisonLabel}</p>
      )}
      {zeroLineLabel && (
        <p className="historical-band-chart__zero-label">{zeroLineLabel}</p>
      )}
      <CompactChartHelp
        buttonLabel="Explain the historical bands"
        dialogLabel="Historical band explanation"
        heading={helpText.heading}
      >
        <p>{helpText.description}</p>
      </CompactChartHelp>
      <figcaption
        className={visuallyHideSummary
          ? 'visually-hidden'
          : 'historical-band-chart__summary'}
        id={summaryId}
      >
        {accessibleSummary}
      </figcaption>
    </figure>
  )
}
