import { useEffect, useId, useMemo, useRef, useState } from 'react'
import * as echarts from 'echarts/core'
import { LineChart } from 'echarts/charts'
import { AriaComponent, GridComponent, MarkAreaComponent, MarkLineComponent, MarkPointComponent, TooltipComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import type { CompactGdpHistoricalContextResult } from '../utils/gdpCompactHistoricalContext'
import { formatObservationPeriod } from '../utils/economicSeries'
import { createGdpCompactAccessibleSummary, createGdpCompactHistoricalChartOptions } from './gdpCompactHistoricalChartOptions'

echarts.use([AriaComponent, GridComponent, LineChart, MarkAreaComponent, MarkLineComponent, MarkPointComponent, TooltipComponent, CanvasRenderer])

interface GdpCompactHistoricalChartProps {
  context: CompactGdpHistoricalContextResult
  visuallyHideSummary?: boolean
}

export function GdpCompactHistoricalChart({
  context,
  visuallyHideSummary = false,
}: GdpCompactHistoricalChartProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const helpButtonRef = useRef<HTMLButtonElement>(null)
  const figureRef = useRef<HTMLElement>(null)
  const [chartError, setChartError] = useState(false)
  const [helpOpen, setHelpOpen] = useState(false)
  const options = useMemo(
    () => context.status === 'ready' ? createGdpCompactHistoricalChartOptions(context) : null,
    [context],
  )
  const summary = context.status === 'ready' ? createGdpCompactAccessibleSummary(context) : null
  const id = useId()
  const summaryId = `${id}-summary`
  const helpId = `${id}-help`

  useEffect(() => {
    if (!helpOpen) return
    const dismissOnOutsidePointer = (event: PointerEvent) => {
      if (!figureRef.current?.contains(event.target as Node)) setHelpOpen(false)
    }
    const dismissOnEscape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      setHelpOpen(false)
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
      const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(resize)
      if (observer) observer.observe(container)
      else window.addEventListener('resize', resize)
      return () => {
        observer?.disconnect()
        if (!observer) window.removeEventListener('resize', resize)
        chart.dispose()
      }
    } catch (error: unknown) {
      console.error('Failed to initialize the compact GDP historical chart', error)
      queueMicrotask(() => setChartError(true))
    }
  }, [options])

  if (context.status !== 'ready') {
    return <p className="chart-state chart-state--compact" role="status">Historical GDP context is unavailable.</p>
  }
  if (chartError) {
    return <p className="chart-state chart-state--compact" role="alert">The compact GDP chart could not be displayed.</p>
  }
  return <figure ref={figureRef} className="gdp-compact-chart" aria-labelledby={summaryId}>
    <div ref={containerRef} className="gdp-compact-chart__canvas" aria-hidden="true" />
    <p className="gdp-compact-chart__title">
      Real GDP growth <span aria-hidden="true">·</span>{' '}
      {formatObservationPeriod(context.recentObservations[0].date, 'quarterly')}
      –{formatObservationPeriod(context.latestObservation.date, 'quarterly')}
    </p>
    <div className="gdp-compact-chart__help">
      <button
        ref={helpButtonRef}
        className="gdp-compact-chart__help-button"
        type="button"
        aria-label="Explain the historical bands"
        aria-expanded={helpOpen}
        aria-controls={helpId}
        onClick={() => setHelpOpen((open) => !open)}
      >
        ?
      </button>
      {helpOpen && (
        <div
          className="gdp-compact-chart__help-popover"
          id={helpId}
          role="dialog"
          aria-label="Historical band explanation"
        >
          <p>
            Comparison period: {formatObservationPeriod(context.comparisonStart, 'quarterly')}{' '}
            through {formatObservationPeriod(context.comparisonEnd, 'quarterly')}.
          </p>
          <p><strong>Dark band:</strong> middle 50% of historical readings.</p>
          <p><strong>Light bands:</strong> extend the range to the middle 80%.</p>
          <p>Readings outside the bands are in the highest or lowest 10% of history.</p>
        </div>
      )}
    </div>
    <figcaption
      className={visuallyHideSummary ? 'visually-hidden' : 'gdp-compact-chart__summary'}
      id={summaryId}
    >
      {summary}
    </figcaption>
  </figure>
}
