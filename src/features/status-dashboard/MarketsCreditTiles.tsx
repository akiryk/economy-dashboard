import { DashboardTile } from './DashboardTile'
import { EconomicStatusTile } from './EconomicStatusTile'
import {
  createHighYieldSpreadTileModel,
  createLongRatesTileModel,
  createSp500TileModel,
} from './marketsCreditTileModels'
import {
  getHighYieldSpreadBackContent,
  getLongRatesBackContent,
  getSp500BackContent,
} from './cardBackContent'
import { formatDashboardPeriod, formatHistoryYear } from './statusFormatters'
import { useDashboardSeries } from './useDashboardSeries'
import { deriveMortgageRateComparison } from '../economic-series/utils/mortgageRateContext'

const longRateSlugs = [
  'dashboard-ten-year-treasury-yield',
  'dashboard-mortgage-rate-30-year',
] as const
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

export function LongRatesStatusTile({ theme }: MarketsCreditTileProps) {
  const data = useDashboardSeries(longRateSlugs)
  if (data.status === 'loading') return <TileMessage label="Long rates" className="status-tile--markets status-tile--markets-start" loading />
  const treasury = data.series.get(longRateSlugs[0])
  const mortgage = data.series.get(longRateSlugs[1])
  if (!treasury || !mortgage) return <TileMessage label="Long rates" className="status-tile--markets status-tile--markets-start" />
  let model
  try { model = createLongRatesTileModel(treasury, mortgage) } catch { return <TileMessage label="Long rates" className="status-tile--markets status-tile--markets-start" /> }
  const treasuryDate = formatDashboardPeriod(model.headline.date, 'daily')
  const mortgageDate = formatDashboardPeriod(model.mortgage.date, 'weekly')
  const mortgageComparison = deriveMortgageRateComparison(mortgage.observations)
  const mortgageDirection = mortgageComparison?.direction === 'little-changed'
    ? 'little changed from a year ago'
    : mortgageComparison?.oneYearDifference === null || mortgageComparison?.oneYearDifference === undefined
      ? 'year-over-year change unavailable'
      : `${mortgageComparison.oneYearDifference > 0 ? 'up' : 'down'} ${Math.abs(mortgageComparison.oneYearDifference).toFixed(1)} pp from a year ago`
  return <EconomicStatusTile
    className="status-tile--markets status-tile--markets-start"
    label="Long rates" seriesLabel="10-year Treasury yield"
    hero={rate(model.headline.value)} state="normal"
    stateLabel={`Mortgage spread ${model.spreadState}`}
    secondary={`30-year mortgage rate ${model.mortgage.value.toFixed(1)}% · ${mortgageDirection} · ${Math.round(model.mortgageSpreadBasisPoints) >= 0 ? '+' : '−'}${Math.abs(Math.round(model.mortgageSpreadBasisPoints))} bps`}
    observations={model.sparkline} theme={theme} asOf={treasuryDate}
    sparklineSummary={`10-year Treasury yield over one year, ending at ${rate(model.headline.value)} on ${treasuryDate}. The mortgage observation is separately dated ${mortgageDate}. Missing days remain gaps.`}
    historical={model.historical} historicalValueFormatter={rate}
    dateFormatter={formatHistoryYear} sparklineWindow="1 year"
    backContent={getLongRatesBackContent(model.headline.value, treasuryDate, model.mortgage.value, mortgageDate, model.mortgageSpreadBasisPoints, model.spreadState)}
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
    className="status-tile--markets status-tile--wide" label="S&P 500" seriesLabel="S&P 500 drawdown"
    hero={signedPercent(model.drawdown)} state={model.state} stateLabel={model.stateLabel}
    secondary={`${model.headline.value.toLocaleString('en-US', { maximumFractionDigits: 2 })} · YTD ${model.yearToDateChange === null ? 'unavailable' : signedPercent(model.yearToDateChange)}`}
    observations={model.sparkline} theme={theme} asOf={date}
    sparklineSummary={`S&P 500 drawdown from each date's available-history high over one year, ending at ${signedPercent(model.drawdown)} on ${date}. Zero marks an available-history high; missing days remain gaps.`}
    dateFormatter={formatHistoryYear} reference={{ value: 0, label: 'Available-history high' }}
    reservedRangeDescription="No historical percentile is shown because drawdown is bounded at zero and repeated highs make its distribution misleading."
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
    <LongRatesStatusTile theme={theme} />
    <Sp500StatusTile theme={theme} />
    <HighYieldSpreadStatusTile theme={theme} />
  </>
}
