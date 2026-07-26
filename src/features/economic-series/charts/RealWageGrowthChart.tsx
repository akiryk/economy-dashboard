import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { LineChart } from 'echarts/charts'
import {
  GridComponent,
  MarkAreaComponent,
  MarkLineComponent,
  MarkPointComponent,
  TooltipComponent,
} from 'echarts/components'
import * as echarts from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import type { RealWageGrowthModel } from '../utils/realWageGrowth'
import { CompactChartHelp } from '../components/CompactChartHelp'
import { formatObservationPeriod } from '../utils/economicSeries'
import {
  adjacentFiniteObservationIndex,
  nearestFiniteObservationIndex,
} from '../utils/inflationCategoryTrendInteraction'
import {
  createRealWageGrowthChartOptions,
  formatRealWageGrowthTooltip,
} from './realWageGrowthChartOptions'
import './realWageGrowthChart.css'

echarts.use([
  CanvasRenderer,
  GridComponent,
  LineChart,
  MarkAreaComponent,
  MarkLineComponent,
  MarkPointComponent,
  TooltipComponent,
])

export function RealWageGrowthChart({
  model,
  accessibleSummary,
  variant = 'compact',
}: {
  model: RealWageGrowthModel
  accessibleSummary: string
  variant?: 'compact' | 'expanded'
}) {
  const chartRef = useRef<HTMLDivElement>(null)
  const chartInstanceRef = useRef<ReturnType<typeof echarts.init> | null>(null)
  const interactionRef = useRef<HTMLDivElement>(null)
  const [chartError, setChartError] = useState(false)
  const [activeIndex, setActiveIndex] = useState<number | null>(null)
  const [pinned, setPinned] = useState(false)
  const tooltipId = useId()
  const summaryId = useId()
  const activeObservation = activeIndex === null
    ? null
    : model.recentObservations[activeIndex] ?? null
  const options = useMemo(
    () => model.domain
      ? createRealWageGrowthChartOptions({
          observations: model.recentObservations,
          domain: model.domain,
          historicalBands: variant === 'compact' ? model.historicalBands : null,
          activeObservation,
        })
      : null,
    [
      activeObservation,
      model.domain,
      model.historicalBands,
      model.recentObservations,
      variant,
    ],
  )

  useEffect(() => {
    const container = chartRef.current
    if (!container) return
    try {
      const chart = echarts.init(container)
      chartInstanceRef.current = chart
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
        chartInstanceRef.current = null
      }
    } catch (error: unknown) {
      console.error('Failed to initialize the compact real wage growth chart', error)
      queueMicrotask(() => setChartError(true))
    }
  }, [model.status])

  useEffect(() => {
    if (options) {
      chartInstanceRef.current?.setOption(options, { notMerge: true })
    }
  }, [options])

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

  if (model.status === 'unavailable' || !model.domain) {
    return (
      <p className="chart-state chart-state--compact" role="status">
        The latest same-month wage and consumer-price observations are unavailable.
      </p>
    )
  }

  const indexFromPointer = (clientX: number): number | null => {
    const bounds = interactionRef.current?.getBoundingClientRect()
    if (!bounds || bounds.width === 0) return null
    return nearestFiniteObservationIndex(
      model.recentObservations,
      (clientX - bounds.left) / bounds.width,
    )
  }
  const activePosition = activeIndex === null ||
    model.recentObservations.length < 2
    ? 100
    : activeIndex / (model.recentObservations.length - 1) * 100

  return (
    <figure
      className={`real-wage-growth-chart real-wage-growth-chart--${variant}`}
      aria-labelledby={summaryId}
    >
      <div
        ref={interactionRef}
        className="real-wage-growth-chart__interaction"
        tabIndex={0}
        aria-label="Real wage growth chart. Use left and right arrow keys for exact monthly values."
        aria-describedby={activeObservation ? tooltipId : undefined}
        onFocus={() => {
          if (activeIndex === null) {
            setActiveIndex(
              nearestFiniteObservationIndex(model.recentObservations, 1),
            )
          }
        }}
        onBlur={() => {
          if (!pinned) setActiveIndex(null)
        }}
        onKeyDown={(event) => {
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
        }}
        onPointerMove={(event) => {
          if (!pinned && event.pointerType !== 'touch') {
            setActiveIndex(indexFromPointer(event.clientX))
          }
        }}
        onPointerLeave={(event) => {
          if (!pinned && event.pointerType !== 'touch') setActiveIndex(null)
        }}
        onPointerDown={(event) => {
          if (event.pointerType !== 'touch') return
          const index = indexFromPointer(event.clientX)
          if (pinned && index === activeIndex) {
            setPinned(false)
            setActiveIndex(null)
          } else {
            setActiveIndex(index)
            setPinned(true)
          }
        }}
      >
        {chartError
          ? <span className="chart-state">Chart unavailable</span>
          : <div ref={chartRef} className="real-wage-growth-chart__canvas" aria-hidden="true" />}
        {activeObservation?.value !== null && activeObservation && (
          <div
            className="real-wage-growth-chart__tooltip"
            id={tooltipId}
            role="status"
            style={{
              left: `clamp(5rem, ${activePosition}%, calc(100% - 5rem))`,
            }}
          >
            {formatRealWageGrowthTooltip(activeObservation)
              .split('\n')
              .map((line) => <span key={line}>{line}</span>)}
          </div>
        )}
      </div>
      {model.visiblePeriod && (
        <div
          className="real-wage-growth-chart__periods"
          aria-label="Visible real wage growth period"
        >
          <span>{formatObservationPeriod(model.visiblePeriod[0], 'monthly')}</span>
          <span>{formatObservationPeriod(model.visiblePeriod[1], 'monthly')}</span>
        </div>
      )}
      <div className="real-wage-growth-chart__footer">
        <p className="real-wage-growth-chart__zero-label">
          Zero = wage growth matched inflation
        </p>
        {variant === 'compact' && model.historicalBands?.status === 'ready' && (
          <CompactChartHelp
            buttonLabel="Explain real wage growth historical bands"
            dialogLabel="Real wage growth historical context"
          >
            <p>
              The line is year-over-year real wage growth. Zero means wage
              growth matched consumer-price inflation.
            </p>
            <p>
              The darker band contains the middle 50% of monthly readings over
              the trailing 25 years; the lighter band contains the middle 80%.
              Null observations are excluded. The dot marks the latest reading.
            </p>
            <p>
              These ranges describe historical frequency, not a target. A
              reading near zero can still be historically typical or atypical.
            </p>
          </CompactChartHelp>
        )}
      </div>
      <figcaption className="visually-hidden" id={summaryId}>
        {accessibleSummary}
      </figcaption>
    </figure>
  )
}
