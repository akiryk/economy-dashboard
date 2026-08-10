import { useEffect, useMemo, useRef, useState } from 'react'
import * as echarts from 'echarts/core'
import { LineChart } from 'echarts/charts'
import { GridComponent, MarkLineComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import type { EconomicObservation } from '../economic-series/models/economicSeries'
import type { DashboardThresholdState } from './cpiTileModel'
import {
  createDashboardSparklineOptions,
  type DashboardSparklineReference,
} from './dashboardSparklineOptions'

echarts.use([GridComponent, LineChart, MarkLineComponent, CanvasRenderer])

interface DashboardSparklineProps {
  observations: readonly EconomicObservation[]
  state: DashboardThresholdState
  summary: string
  theme: 'light' | 'dark'
  reference?: DashboardSparklineReference
}

export function DashboardSparkline({
  observations,
  state,
  summary,
  theme,
  reference,
}: DashboardSparklineProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [failed, setFailed] = useState(false)
  const options = useMemo(
    () => createDashboardSparklineOptions(observations, state, theme, reference),
    [observations, reference, state, theme],
  )

  useEffect(() => {
    const container = containerRef.current
    if (!container) return
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
      console.error('Failed to initialize a dashboard sparkline', error)
      queueMicrotask(() => setFailed(true))
    }
  }, [options])

  return (
    <figure className="status-sparkline">
      <figcaption className="visually-hidden">{summary}</figcaption>
      {failed
        ? <p className="status-sparkline__unavailable">Recent trend unavailable</p>
        : <div ref={containerRef} className="status-sparkline__chart" aria-hidden="true" />}
    </figure>
  )
}
