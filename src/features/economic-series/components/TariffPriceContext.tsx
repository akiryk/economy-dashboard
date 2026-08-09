import { Suspense, lazy } from 'react'
import type { EconomicSeries } from '../models/economicSeries'
import { tariffResearch } from '../data/tariffResearch'

const EconomicTimeSeriesChart = lazy(() => import('../charts/EconomicTimeSeriesChart'))

interface TariffPriceContextProps {
  tariff: EconomicSeries
  coreGoods: EconomicSeries
  startDate: string
  endDate: string
  onZoomChange: (start: number, end: number) => void
}

export function TariffPriceContext({ tariff, coreGoods, startDate, endDate, onZoomChange }: TariffPriceContextProps) {
  const tariffObservations = tariff.observations.filter(({ date }) => date >= startDate && date <= endDate)
  const priceObservations = coreGoods.observations.filter(({ date }) => date >= startDate && date <= endDate)
  const fallback = <p className="chart-state" role="status">Loading tariff-price chart…</p>

  return <section className="series-detail-section" aria-labelledby="tariff-price-context-heading">
    <h3 id="tariff-price-context-heading">Tariffs and core-goods prices</h3>
    <p>These aligned charts share a date range but use separate vertical scales. They show descriptive co-movement only; visual alignment does not prove that tariffs caused any particular price change.</p>
    <h4>Realized tariff burden</h4>
    <Suspense fallback={fallback}><EconomicTimeSeriesChart kind="single" observations={tariffObservations} seriesName="Realized tariff burden" frequency="quarterly" units={tariff.units} transformation={tariff.transformation} includeZero={false} valueFormat="percentage" zoomStartDate={startDate} zoomEndDate={endDate} onZoomChange={onZoomChange} /></Suspense>
    <h4>Core-goods PCE inflation</h4>
    <Suspense fallback={fallback}><EconomicTimeSeriesChart kind="single" observations={priceObservations} seriesName="Core-goods PCE inflation" frequency="monthly" units={coreGoods.units} transformation={coreGoods.transformation} includeZero={true} valueFormat="percentage" zoomStartDate={startDate} zoomEndDate={endDate} onZoomChange={onZoomChange} /></Suspense>
    <aside className="series-callout" aria-label={tariffResearch.title}>
      <h4>{tariffResearch.title}</h4>
      <p>A Federal Reserve staff analysis estimated that tariff changes had raised core-goods PCE prices by {tariffResearch.coreGoodsEffect} cumulatively and core PCE prices by {tariffResearch.corePceEffect}, covering {tariffResearch.policyCoverage}. This is a model-based causal estimate, not a conclusion drawn from the two charts above.</p>
      <p><a href={tariffResearch.sourceUrl} target="_blank" rel="noreferrer">{tariffResearch.sourceTitle}</a> ({tariffResearch.publicationDate}). The estimate does not cover later policy or price developments.</p>
    </aside>
  </section>
}
