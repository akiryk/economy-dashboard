import { EconomicStatusTile } from './EconomicStatusTile'
import { DashboardTile } from './DashboardTile'
import { latestValidObservation, selectMonthlyLookback } from './cpiTileModel'
import { formatDashboardPeriod, formatHistoryYear } from './statusFormatters'
import { useDashboardSeries } from './useDashboardSeries'

const realWageSlugs = ['real-wage-growth'] as const

function formatSignedPercent(value: number): string {
  const sign = value > 0 ? '+' : value < 0 ? '−' : ''
  return `${sign}${Math.abs(value).toFixed(1)}%`
}

export function RealWageStatusTile({ theme }: { theme: 'light' | 'dark' }) {
  const data = useDashboardSeries(realWageSlugs)
  if (data.status === 'loading') {
    return <DashboardTile label="Real wage growth" state="normal">
      <p className="status-tile__message" role="status">Loading current data…</p>
    </DashboardTile>
  }
  const series = data.series.get(realWageSlugs[0])
  const headline = series ? latestValidObservation(series.observations) : null
  if (!series || !headline) {
    return <DashboardTile label="Real wage growth" state="normal">
      <p className="status-tile__message" role="alert">Data temporarily unavailable.</p>
    </DashboardTile>
  }
  const nearZero = Math.abs(headline.value) < 0.1
  const state = nearZero
    ? 'normal'
    : headline.value > 0
      ? 'notable-good'
      : 'notable-bad'
  const stateLabel = nearZero
    ? 'Wages are roughly keeping pace with inflation'
    : headline.value > 0
      ? 'Wages are gaining purchasing power'
      : 'Wages are slightly trailing inflation'
  const sparkline = selectMonthlyLookback(
    series.observations,
    headline.date,
    5,
  )
  const period = formatDashboardPeriod(headline.date, 'monthly')
  return <EconomicStatusTile
    label="Real wage growth"
    freshnessKeys={realWageSlugs}
    seriesLabel="real wage growth for all private employees"
    hero={formatSignedPercent(headline.value)}
    state={state}
    stateLabel={stateLabel}
    secondary=""
    observations={sparkline}
    sparklineSummary={`Year-over-year real wage growth for all private employees over five years, ending at ${formatSignedPercent(headline.value)} in ${period}. Zero means wage growth matched inflation; missing months remain gaps.`}
    theme={theme}
    asOf={period}
    dateFormatter={formatHistoryYear}
    reference={{ value: 0, label: 'Wage growth matched inflation' }}
    reservedRangeDescription="No historical percentile is shown because zero is the meaningful purchasing-power reference."
    backContent={{
      whatItShows: `Average hourly earnings for all private employees changed ${formatSignedPercent(headline.value)} after adjusting for CPI-U over the year ending ${period}.`,
      howToReadIt: `${stateLabel}. This is an aggregate average and does not describe every worker.`,
    }}
  />
}
