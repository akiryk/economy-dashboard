import { useEffect, useId, useMemo, useRef, useState } from 'react'
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
import type { HistoricalBandHelpText } from '../utils/compactHistoricalMetrics'
import type { HistoricalBandResult } from '../utils/historicalBandContext'
import { createHistoricalBandChartOptions } from './historicalBandChartOptions'

echarts.use([
  GridComponent,
  LineChart,
  MarkAreaComponent,
  MarkLineComponent,
  MarkPointComponent,
  TooltipComponent,
  CanvasRenderer,
])

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
  referenceLines?: readonly { value: number; label: string }[]
  visuallyHideSummary?: boolean
}

type HelpState = 'closed' | 'hover' | 'pinned'

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
  referenceLines = [],
  visuallyHideSummary = false,
}: HistoricalBandChartProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const helpButtonRef = useRef<HTMLButtonElement>(null)
  const figureRef = useRef<HTMLElement>(null)
  const [chartError, setChartError] = useState(false)
  const [helpState, setHelpState] = useState<HelpState>('closed')
  const id = useId()
  const summaryId = `${id}-summary`
  const helpId = `${id}-help`
  const helpOpen = helpState !== 'closed'
  const options = useMemo(
    () => model.status === 'ready' && latestPositionDescription
      ? createHistoricalBandChartOptions({
          model, seriesLabel, frequency, valueFormatter,
          latestPositionDescription, showZeroLine, showLatestMarker,
          referenceLines,
        })
      : null,
    [
      frequency, latestPositionDescription, model, seriesLabel,
      referenceLines, showLatestMarker, showZeroLine, valueFormatter,
    ],
  )

  useEffect(() => {
    if (!helpOpen) return
    const dismissOnOutsidePointer = (event: PointerEvent) => {
      if (!figureRef.current?.contains(event.target as Node)) {
        setHelpState('closed')
      }
    }
    const dismissOnEscape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      setHelpState('closed')
      helpButtonRef.current?.focus()
    }
    document.addEventListener('pointerdown', dismissOnOutsidePointer)
    document.addEventListener('keydown', dismissOnEscape)
    return () => {
      document.removeEventListener('pointerdown', dismissOnOutsidePointer)
      document.removeEventListener('keydown', dismissOnEscape)
    }
  }, [helpOpen])

  useEffect(() => {
    const container = containerRef.current
    if (!container || !options) return
    try {
      const chart = echarts.init(container)
      chart.setOption(options, { notMerge: true })
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
  }, [options, seriesLabel])

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

  return (
    <figure
      ref={figureRef}
      className="historical-band-chart"
      aria-labelledby={summaryId}
    >
      <div
        ref={containerRef}
        className="historical-band-chart__canvas"
        aria-hidden="true"
      />
      <p className="historical-band-chart__title">{caption}</p>
      <div
        className="historical-band-chart__help"
        onMouseEnter={() => setHelpState((current) =>
          current === 'closed' ? 'hover' : current)}
        onMouseLeave={() => setHelpState((current) =>
          current === 'hover' ? 'closed' : current)}
      >
        <button
          ref={helpButtonRef}
          className="historical-band-chart__help-button"
          type="button"
          aria-label="Explain the historical bands"
          aria-expanded={helpOpen}
          aria-controls={helpId}
          onClick={() => setHelpState((current) =>
            current === 'pinned' ? 'closed' : 'pinned')}
        >
          ?
        </button>
        {helpOpen && (
          <div
            className="historical-band-chart__help-popover"
            id={helpId}
            role="dialog"
            aria-label="Historical band explanation"
          >
            <p><strong>{helpText.heading}</strong></p>
            <p>{helpText.description}</p>
          </div>
        )}
      </div>
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
