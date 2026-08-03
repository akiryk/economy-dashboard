import { memo, useEffect, useMemo, useRef, useState } from 'react'
import * as echarts from 'echarts/core'
import { LineChart } from 'echarts/charts'
import {
  AriaComponent,
  DataZoomComponent,
  GridComponent,
  LegendComponent,
  MarkLineComponent,
  TooltipComponent,
} from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import type {
  EconomicFrequency,
  EconomicObservation,
} from '../models/economicSeries'
import { adaptObservationsToChartData } from './chartAdapters'
import {
  createEconomicComparisonChartOptions,
  createEconomicTimeSeriesChartOptions,
  createInflationComparisonChartOptions,
  createManufacturingComparisonChartOptions,
} from './economicTimeSeriesChartOptions'
import type { EconomicValueFormat } from '../utils/economicSeries'

echarts.use([
  AriaComponent,
  DataZoomComponent,
  GridComponent,
  LegendComponent,
  LineChart,
  MarkLineComponent,
  TooltipComponent,
  CanvasRenderer,
])

interface SharedZoomProps {
  zoomStartDate: string
  zoomEndDate: string
  onZoomChange: (start: number, end: number) => void
}

interface SingleSeriesChartProps extends SharedZoomProps {
  kind: 'single'
  observations: readonly EconomicObservation[]
  seriesName: string
  frequency: EconomicFrequency
  units: string
  transformation: string
  includeZero: boolean
  valueFormat: EconomicValueFormat
}

interface ComparisonChartProps extends SharedZoomProps {
  kind: 'comparison'
  nominalObservations: readonly EconomicObservation[]
  inflationObservations: readonly EconomicObservation[]
  realObservations: readonly EconomicObservation[]
  frequency: EconomicFrequency
}

interface InflationComparisonChartProps extends SharedZoomProps {
  kind: 'inflation-comparison'
  headlineObservations: readonly EconomicObservation[]
  coreObservations: readonly EconomicObservation[]
  frequency: EconomicFrequency
  variant: 'cpi-pce' | 'momentum' | 'year-over-year'
}

interface HouseholdComparisonChartProps extends SharedZoomProps {
  kind: 'household-comparison'
  incomeObservations: readonly EconomicObservation[]
  spendingObservations: readonly EconomicObservation[]
  frequency: EconomicFrequency
}

interface RateComparisonChartProps extends SharedZoomProps {
  kind: 'rate-comparison'
  federalFundsObservations: readonly EconomicObservation[]
  treasuryObservations: readonly EconomicObservation[]
  frequency: EconomicFrequency
}

interface ClaimsComparisonChartProps extends SharedZoomProps {
  kind: 'claims-comparison'
  movingAverageObservations: readonly EconomicObservation[]
  weeklyClaimsObservations: readonly EconomicObservation[]
  frequency: EconomicFrequency
}

interface ManufacturingComparisonChartProps extends SharedZoomProps {
  kind: 'manufacturing-comparison'
  outputObservations: readonly EconomicObservation[]
  employmentObservations: readonly EconomicObservation[]
  frequency: EconomicFrequency
}

export type EconomicTimeSeriesChartProps =
  | SingleSeriesChartProps
  | ComparisonChartProps
  | InflationComparisonChartProps
  | HouseholdComparisonChartProps
  | RateComparisonChartProps
  | ClaimsComparisonChartProps
  | ManufacturingComparisonChartProps

function EconomicTimeSeriesChart(
  props: EconomicTimeSeriesChartProps,
) {
  const { onZoomChange } = props
  const containerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<echarts.ECharts | null>(null)
  const [initializationError, setInitializationError] = useState(false)
  const chartData = useMemo(() => {
    if (props.kind === 'single') {
      return {
        kind: 'single' as const,
        data: adaptObservationsToChartData(props.observations),
      }
    }
    if (props.kind === 'comparison') return {
      kind: 'comparison' as const,
      nominal: adaptObservationsToChartData(props.nominalObservations),
      inflation: adaptObservationsToChartData(props.inflationObservations),
      real: adaptObservationsToChartData(props.realObservations),
    }
    if (props.kind === 'inflation-comparison') return {
      kind: 'inflation-comparison' as const,
      headline: adaptObservationsToChartData(props.headlineObservations),
      core: adaptObservationsToChartData(props.coreObservations),
    }
    if (props.kind === 'manufacturing-comparison') return {
      kind: 'manufacturing-comparison' as const,
      output: adaptObservationsToChartData(props.outputObservations),
      employment: adaptObservationsToChartData(props.employmentObservations),
    }
    if (props.kind === 'rate-comparison') return {
      kind: 'rate-comparison' as const,
      federalFunds: adaptObservationsToChartData(props.federalFundsObservations),
      treasury: adaptObservationsToChartData(props.treasuryObservations),
    }
    if (props.kind === 'claims-comparison') return {
      kind: 'claims-comparison' as const,
      movingAverage: adaptObservationsToChartData(
        props.movingAverageObservations,
      ),
      weeklyClaims: adaptObservationsToChartData(
        props.weeklyClaimsObservations,
      ),
    }
    return {
      kind: 'household-comparison' as const,
      income: adaptObservationsToChartData(props.incomeObservations),
      spending: adaptObservationsToChartData(props.spendingObservations),
    }
  }, [props])

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    try {
      const chart = echarts.init(container)
      chartRef.current = chart
      const handleZoom = (event: unknown) => {
        const payload = event as { start?: number; end?: number; batch?: Array<{ start?: number; end?: number }> }
        const zoom = payload.batch?.[0] ?? payload
        if (typeof zoom.start === 'number' && typeof zoom.end === 'number') {
          onZoomChange(zoom.start, zoom.end)
        }
      }
      chart.on('datazoom', handleZoom)

      const resize = () => chart.resize()
      const resizeObserver =
        typeof ResizeObserver === 'undefined'
          ? null
          : new ResizeObserver(resize)

      if (resizeObserver) resizeObserver.observe(container)
      else window.addEventListener('resize', resize)

      return () => {
        resizeObserver?.disconnect()
        if (!resizeObserver) window.removeEventListener('resize', resize)
        chart.off('datazoom', handleZoom)
        chart.dispose()
        chartRef.current = null
      }
    } catch (error: unknown) {
      console.error('Failed to initialize the economic time-series chart', error)
      queueMicrotask(() => setInitializationError(true))
    }
  }, [onZoomChange])

  useEffect(() => {
    const chart = chartRef.current
    if (!chart) return

    try {
      const options =
        props.kind === 'single' && chartData.kind === 'single'
          ? createEconomicTimeSeriesChartOptions({
              data: chartData.data,
              seriesName: props.seriesName,
              frequency: props.frequency,
              units: props.units,
              transformation: props.transformation,
              includeZero: props.includeZero,
              valueFormat: props.valueFormat,
              zoom: { startValue: props.zoomStartDate, endValue: props.zoomEndDate },
            })
          : props.kind === 'comparison' && chartData.kind === 'comparison'
            ? createEconomicComparisonChartOptions({
                nominalData: chartData.nominal,
                inflationData: chartData.inflation,
                realData: chartData.real,
                frequency: props.frequency,
                zoom: { startValue: props.zoomStartDate, endValue: props.zoomEndDate },
              })
            : props.kind === 'inflation-comparison' &&
                chartData.kind === 'inflation-comparison'
              ? createInflationComparisonChartOptions({
                  headlineData: chartData.headline,
                  coreData: chartData.core,
                  frequency: props.frequency,
                  variant: props.variant,
                  zoom: { startValue: props.zoomStartDate, endValue: props.zoomEndDate },
                })
              : props.kind === 'household-comparison' &&
                  chartData.kind === 'household-comparison'
                ? createInflationComparisonChartOptions({
                    headlineData: chartData.income,
                    coreData: chartData.spending,
                    frequency: props.frequency,
                    variant: 'household',
                    zoom: { startValue: props.zoomStartDate, endValue: props.zoomEndDate },
                  })
                : props.kind === 'manufacturing-comparison' &&
                    chartData.kind === 'manufacturing-comparison'
                  ? createManufacturingComparisonChartOptions({
                      outputData: chartData.output,
                      employmentData: chartData.employment,
                      frequency: props.frequency,
                      zoom: { startValue: props.zoomStartDate, endValue: props.zoomEndDate },
                    })
                  : props.kind === 'rate-comparison' && chartData.kind === 'rate-comparison'
                    ? createInflationComparisonChartOptions({
                        headlineData: chartData.federalFunds,
                        coreData: chartData.treasury,
                        frequency: props.frequency,
                        variant: 'rates',
                        zoom: { startValue: props.zoomStartDate, endValue: props.zoomEndDate },
                      })
                    : props.kind === 'claims-comparison' &&
                        chartData.kind === 'claims-comparison'
                      ? createInflationComparisonChartOptions({
                          headlineData: chartData.movingAverage,
                          coreData: chartData.weeklyClaims,
                          frequency: props.frequency,
                          variant: 'claims',
                          zoom: {
                            startValue: props.zoomStartDate,
                            endValue: props.zoomEndDate,
                          },
                        })
            : null
      if (options) chart.setOption(options, { notMerge: true })
    } catch (error: unknown) {
      console.error('Failed to update the economic time-series chart', error)
      queueMicrotask(() => setInitializationError(true))
    }
  }, [chartData, props])

  if (initializationError) {
    return (
      <p className="chart-state" role="alert">
        The chart could not be displayed. The observations remain available in
        the table below.
      </p>
    )
  }

  return (
    <div
      ref={containerRef}
      className="economic-chart"
      aria-label={
        props.kind === 'single'
          ? `${props.seriesName} ${props.frequency} time-series chart`
          : props.kind === 'comparison'
            ? 'Nominal wage growth and headline CPI inflation comparison chart'
            : props.kind === 'household-comparison'
              ? 'Quarterly real disposable income per person growth and real consumer spending per person growth comparison chart'
              : props.kind === 'manufacturing-comparison'
                ? 'Manufacturing output and employment normalized comparison chart'
              : props.kind === 'rate-comparison'
                ? 'Effective federal funds rate and 10-year Treasury yield comparison chart'
              : props.kind === 'claims-comparison'
                ? 'Official four-week average and weekly initial unemployment claims comparison chart'
              : props.variant === 'cpi-pce'
              ? 'CPI consumer-facing inflation and PCE Federal Reserve preferred inflation measure comparison chart with 2% Fed target for PCE'
              : props.variant === 'momentum'
              ? 'Headline and core CPI three-month annualized inflation comparison chart'
              : 'Headline and core CPI year-over-year inflation comparison chart'
      }
    />
  )
}

export default memo(EconomicTimeSeriesChart)
