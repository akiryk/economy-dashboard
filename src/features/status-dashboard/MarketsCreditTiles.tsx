import { DashboardTile } from './DashboardTile'
import { EconomicStatusTile } from './EconomicStatusTile'
import {
  createHighYieldSpreadTileModel,
  createMortgageRateTileModel,
  createSp500TileModel,
} from './marketsCreditTileModels'
import {
  getHighYieldSpreadBackContent,
  getMortgageRateBackContent,
  getSp500BackContent,
} from './cardBackContent'
import { formatDashboardPeriod, formatHistoryYear } from './statusFormatters'
import { useDashboardSeries } from './useDashboardSeries'
import { deriveMortgageRateComparison } from '../economic-series/utils/mortgageRateContext'

const mortgageRateSlugs = ['dashboard-mortgage-rate-30-year'] as const
const sp500Slugs = ['dashboard-sp500'] as const
const highYieldSlugs = ['dashboard-high-yield-credit-spread'] as const

interface MarketsCreditTileProps { theme: 'light' | 'dark' }

function TileMessage({ label, className, loading = false }: {
  label: string
  className?: string
  loading?: boolean
}) {
  return <DashboardTile label={label} state="normal" className={className}>
    <p className="status-tile__message" role={loading ? 'status' : 'alert'}>
      {loading ? 'Loading current data…' : 'Data temporarily unavailable.'}
    </p>
  </DashboardTile>
}

function rate(value: number): string { return `${value.toFixed(2)}%` }
function signedPercent(value: number): string {
  const sign = value > 0 ? '+' : value < 0 ? '−' : ''
  return `${sign}${Math.abs(value).toFixed(1)}%`
}

export function MortgageRateStatusTile({ theme }: MarketsCreditTileProps) {
  const data = useDashboardSeries(mortgageRateSlugs)
  if (data.status === 'loading') return <TileMessage label="30-year mortgage rate" className="status-tile--markets status-tile--markets-start" loading />
  const mortgage = data.series.get(mortgageRateSlugs[0])
  if (!mortgage) return <TileMessage label="30-year mortgage rate" className="status-tile--markets status-tile--markets-start" />
  let model
  try { model = createMortgageRateTileModel(mortgage) } catch { return <TileMessage label="30-year mortgage rate" className="status-tile--markets status-tile--markets-start" /> }
  const mortgageDate = formatDashboardPeriod(model.headline.date, 'weekly')
  const mortgageComparison = deriveMortgageRateComparison(mortgage.observations)
  const mortgageDirection = mortgageComparison?.direction === 'little-changed'
    ? 'little changed from a year ago'
    : mortgageComparison?.oneYearDifference === null || mortgageComparison?.oneYearDifference === undefined
      ? 'year-over-year change unavailable'
      : `${mortgageComparison.oneYearDifference > 0 ? 'up' : 'down'} ${Math.abs(mortgageComparison.oneYearDifference).toFixed(1)} pp from a year ago`
  return <EconomicStatusTile
    className="status-tile--markets status-tile--markets-start"
    label="30-year mortgage rate" seriesLabel="Freddie Mac 30-year fixed mortgage rate"
    freshnessKeys={mortgageRateSlugs}
    hero={rate(model.headline.value)} state="normal"
    stateLabel="Current average"
    secondary={mortgageDirection}
    observations={model.sparkline} theme={theme} asOf={mortgageDate}
    sparklineSummary={`Freddie Mac's 30-year fixed mortgage rate over five years, ending at ${rate(model.headline.value)} on ${mortgageDate}. Missing weeks remain gaps.`}
    historical={model.historical} historicalValueFormatter={rate}
    dateFormatter={formatHistoryYear} sparklineWindow="5 years"
    backContent={getMortgageRateBackContent(model.headline.value, mortgageDate, mortgageDirection)}
  />
}

export function Sp500StatusTile({ theme }: MarketsCreditTileProps) {
  const data = useDashboardSeries(sp500Slugs)
  if (data.status === 'loading') return <TileMessage label="S&P 500" className="status-tile--markets status-tile--wide" loading />
  const series = data.series.get(sp500Slugs[0])
  if (!series) return <TileMessage label="S&P 500" className="status-tile--markets status-tile--wide" />
  let model
  try { model = createSp500TileModel(series) } catch { return <TileMessage label="S&P 500" className="status-tile--markets status-tile--wide" /> }
  const date = formatDashboardPeriod(model.headline.date, 'daily')
  return <EconomicStatusTile
    className="status-tile--markets status-tile--wide" label="S&P 500" seriesLabel="S&P 500 index level"
    freshnessKeys={sp500Slugs}
    hero={model.headline.value.toLocaleString('en-US', { maximumFractionDigits: 2 })} state={model.state} stateLabel={model.stateLabel === 'At high' ? 'At record high' : model.stateLabel.replace('high', 'record high')}
    secondary={`Prior close · YTD ${model.yearToDateChange === null ? 'unavailable' : signedPercent(model.yearToDateChange)}`}
    observations={model.sparkline} theme={theme} asOf={date}
    sparklineSummary={`S&P 500 closing index level over one year, ending at the latest available close of ${model.headline.value.toLocaleString('en-US', { maximumFractionDigits: 2 })} on ${date}. This is not an intraday quote; missing market days remain gaps.`}
    dateFormatter={formatHistoryYear}
    reservedRangeDescription="No historical percentile is shown because an index level trends over time and its percentile would be misleading."
    backContent={getSp500BackContent(model.drawdown, model.headline.value, model.yearToDateChange, model.stateLabel)}
  />
}

export function HighYieldSpreadStatusTile({ theme }: MarketsCreditTileProps) {
  const data = useDashboardSeries(highYieldSlugs)
  if (data.status === 'loading') return <TileMessage label="High-yield spread" loading />
  const series = data.series.get(highYieldSlugs[0])
  if (!series) return <TileMessage label="High-yield spread" />
  let model
  try { model = createHighYieldSpreadTileModel(series) } catch { return <TileMessage label="High-yield spread" /> }
  const date = formatDashboardPeriod(model.headline.date, 'daily')
  return <EconomicStatusTile
    className="status-tile--markets" label="High-yield spread" seriesLabel="high-yield option-adjusted spread"
    freshnessKeys={highYieldSlugs}
    hero={`${Math.round(model.basisPoints)} bps`} state={model.state} stateLabel={model.stateLabel}
    secondary="" observations={model.sparkline} theme={theme} asOf={date}
    sparklineSummary={`High-yield option-adjusted credit spread over one year, ending at ${Math.round(model.basisPoints)} basis points on ${date}. Wider spreads mean investors demand more compensation for credit risk; missing days remain gaps.`}
    historical={model.historical} historicalValueFormatter={(value) => `${Math.round(value * 100)} bps`}
    dateFormatter={formatHistoryYear} sparklineWindow="1 year"
    backContent={getHighYieldSpreadBackContent(model.basisPoints, model.stateLabel, model.historical.percentile)}
  />
}

export function MarketsCreditTiles({ theme }: MarketsCreditTileProps) {
  return <>
    <MortgageRateStatusTile theme={theme} />
    <Sp500StatusTile theme={theme} />
    <HighYieldSpreadStatusTile theme={theme} />
  </>
}
