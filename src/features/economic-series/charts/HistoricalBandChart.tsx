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
import { CompactChartHelp } from '../components/CompactChartHelp'

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
  const [chartError, setChartError] = useState(false)
  const id = useId()
  const summaryId = `${id}-summary`
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
      className="historical-band-chart"
      aria-labelledby={summaryId}
    >
      <div
        ref={containerRef}
        className="historical-band-chart__canvas"
        aria-hidden="true"
      />
      <p className="historical-band-chart__title">{caption}</p>
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
