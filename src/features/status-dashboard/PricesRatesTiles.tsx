import { EconomicStatusTile } from './EconomicStatusTile'
import { DashboardTile } from './DashboardTile'
import {
  createExpectedInflationTileModel,
  createFedFundsTileModel,
  createYieldCurveTileModel,
  formatBasisPoints,
} from './pricesRatesTileModels'
import {
  getExpectedInflationBackContent,
  getFedFundsBackContent,
  getYieldCurveBackContent,
} from './cardBackContent'
import { formatDashboardPeriod, formatHistoryYear } from './statusFormatters'
import { useDashboardSeries } from './useDashboardSeries'

const expectedSlugs = ['dashboard-expected-inflation-10-year'] as const
const fedFundsSlugs = [
  'dashboard-effective-federal-funds-rate',
  'dashboard-fed-target-upper-bound',
] as const
const yieldCurveSlugs = [
  'dashboard-yield-spread-10y-2y',
  'dashboard-yield-spread-10y-3m',
] as const

interface PricesRatesTileProps { theme: 'light' | 'dark' }

function TileMessage({ label, loading = false }: { label: string; loading?: boolean }) {
  return <DashboardTile label={label} state="normal">
    <p className="status-tile__message" role={loading ? 'status' : 'alert'}>
      {loading ? 'Loading current data…' : 'Data temporarily unavailable.'}
    </p>
  </DashboardTile>
}

function formatRate(value: number): string {
  return `${value.toFixed(2)}%`
}

export function ExpectedInflationStatusTile({ theme }: PricesRatesTileProps) {
  const data = useDashboardSeries(expectedSlugs)
  if (data.status === 'loading') return <TileMessage label="Expected inflation" loading />
  const series = data.series.get(expectedSlugs[0])
  if (!series) return <TileMessage label="Expected inflation" />
  let model
  try { model = createExpectedInflationTileModel(series) } catch { return <TileMessage label="Expected inflation" /> }
  return <EconomicStatusTile
    label="Expected inflation" seriesLabel="10-year breakeven inflation"
    hero={`${model.headline.value.toFixed(1)}%`} state={model.state} stateLabel={model.stateLabel}
    secondary="" observations={model.sparkline}
    sparklineSummary={`Market-implied 10-year average inflation expectation over one year, ending at ${model.headline.value.toFixed(1)}% on ${formatDashboardPeriod(model.headline.date, 'daily')}. It is not a guaranteed forecast; missing days remain gaps.`}
    theme={theme} asOf={formatDashboardPeriod(model.headline.date, 'daily')}
    historical={model.historical} historicalValueFormatter={(value) => `${value.toFixed(1)}%`}
    dateFormatter={formatHistoryYear}
    sparklineWindow="1 year"
    backContent={getExpectedInflationBackContent(model.headline.value, model.stateLabel)}
  />
}

export function FedFundsStatusTile({ theme }: PricesRatesTileProps) {
  const data = useDashboardSeries(fedFundsSlugs)
  if (data.status === 'loading') return <TileMessage label="Fed funds" loading />
  const effective = data.series.get(fedFundsSlugs[0])
  if (!effective) return <TileMessage label="Fed funds" />
  let model
  try { model = createFedFundsTileModel(effective, data.series.get(fedFundsSlugs[1]) ?? null) } catch { return <TileMessage label="Fed funds" /> }
  return <EconomicStatusTile
    label="Fed funds" seriesLabel="effective federal funds rate"
    hero={formatRate(model.headline.value)} state="normal" stateLabel={model.stateLabel}
    secondary={model.secondary ? `Target upper ${formatRate(model.secondary.value)}` : 'Target upper unavailable'}
    observations={model.sparkline}
    sparklineSummary={`Effective federal funds rate over one year, ending at ${formatRate(model.headline.value)} on ${formatDashboardPeriod(model.headline.date, 'daily')}. The policy-rate level has no good or bad color state; missing days remain gaps.`}
    theme={theme} asOf={formatDashboardPeriod(model.headline.date, 'daily')}
    historical={model.historical} historicalValueFormatter={formatRate}
    dateFormatter={formatHistoryYear}
    sparklineWindow="1 year"
    backContent={getFedFundsBackContent(model.headline.value, model.secondary?.value ?? null, model.stateLabel)}
  />
}

export function YieldCurveStatusTile({ theme }: PricesRatesTileProps) {
  const data = useDashboardSeries(yieldCurveSlugs)
  if (data.status === 'loading') return <TileMessage label="Yield curve" loading />
  const twoYear = data.series.get(yieldCurveSlugs[0])
  if (!twoYear) return <TileMessage label="Yield curve" />
  let model
  try { model = createYieldCurveTileModel(twoYear, data.series.get(yieldCurveSlugs[1]) ?? null) } catch { return <TileMessage label="Yield curve" /> }
  return <EconomicStatusTile
    label="Yield curve" seriesLabel="10-year minus 2-year Treasury spread"
    hero={formatBasisPoints(model.headline.value)} state={model.state} stateLabel={model.stateLabel}
    secondary={model.secondary ? `10y−3m ${formatBasisPoints(model.secondary.value)}` : '10y−3m unavailable'}
    observations={model.sparkline}
    sparklineSummary={`The 10-year minus 2-year Treasury spread over one year, ending ${model.stateLabel === 'Inverted' ? 'inverted at' : 'with a positive slope of'} ${formatBasisPoints(model.headline.value)} on ${formatDashboardPeriod(model.headline.date, 'daily')}. The dashed line marks zero; missing days remain gaps.`}
    theme={theme} asOf={formatDashboardPeriod(model.headline.date, 'daily')}
    historical={model.historical} historicalValueFormatter={formatBasisPoints}
    dateFormatter={formatHistoryYear} reference={{ value: 0, label: 'No yield spread' }}
    sparklineWindow="1 year"
    backContent={getYieldCurveBackContent(model.headline.value, model.secondary?.value ?? null)}
  />
}

export function PricesRatesTiles({ theme }: PricesRatesTileProps) {
  return <>
    <ExpectedInflationStatusTile theme={theme} />
    <FedFundsStatusTile theme={theme} />
    <YieldCurveStatusTile theme={theme} />
  </>
}
