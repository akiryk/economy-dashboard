import { useEffect, useMemo, useRef, useState } from 'react'
import * as echarts from 'echarts/core'
import { LineChart } from 'echarts/charts'
import { GridComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import type { EconomicObservation } from '../economic-series/models/economicSeries'
import type { DashboardThresholdState } from './cpiTileModel'
import { createCpiSparklineOptions } from './cpiSparklineOptions'

echarts.use([GridComponent, LineChart, CanvasRenderer])

interface CpiSparklineProps {
  observations: readonly EconomicObservation[]
  state: DashboardThresholdState
  summary: string
  theme: 'light' | 'dark'
}

export function CpiSparkline({ observations, state, summary, theme }: CpiSparklineProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [failed, setFailed] = useState(false)
  const options = useMemo(
    () => createCpiSparklineOptions(observations, state, theme),
    [observations, state, theme],
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
      console.error('Failed to initialize the CPI sparkline', error)
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
