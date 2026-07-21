import { useEffect, useMemo, useRef, useState } from 'react'
import * as echarts from 'echarts/core'
import { LineChart } from 'echarts/charts'
import { AriaComponent, GridComponent, MarkAreaComponent, MarkLineComponent, MarkPointComponent, TooltipComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import type { CompactGdpHistoricalContextResult } from '../utils/gdpCompactHistoricalContext'
import { createGdpCompactAccessibleSummary, createGdpCompactHistoricalChartOptions } from './gdpCompactHistoricalChartOptions'

echarts.use([AriaComponent, GridComponent, LineChart, MarkAreaComponent, MarkLineComponent, MarkPointComponent, TooltipComponent, CanvasRenderer])

interface GdpCompactHistoricalChartProps {
  context: CompactGdpHistoricalContextResult
}

export function GdpCompactHistoricalChart({ context }: GdpCompactHistoricalChartProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [chartError, setChartError] = useState(false)
  const options = useMemo(
    () => context.status === 'ready' ? createGdpCompactHistoricalChartOptions(context) : null,
    [context],
  )
  const summary = context.status === 'ready' ? createGdpCompactAccessibleSummary(context) : null

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
  return <figure className="gdp-compact-chart">
    <div ref={containerRef} className="gdp-compact-chart__canvas" role="img" aria-label={summary ?? undefined} />
    <figcaption className="gdp-compact-chart__summary">{summary}</figcaption>
  </figure>
}
