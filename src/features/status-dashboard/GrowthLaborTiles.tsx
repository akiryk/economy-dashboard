import { EconomicStatusTile } from './EconomicStatusTile'
import { DashboardTile } from './DashboardTile'
import {
  createGdpTileModel,
  createInitialClaimsTileModel,
  createSahmTileModel,
  createUnemploymentTileModel,
} from './growthLaborTileModels'
import {
  formatClaims,
  formatCompactThousands,
  formatDashboardPercent,
  formatDashboardPeriod,
  formatHistoryYear,
  formatNominalGdp,
} from './statusFormatters'
import { useDashboardSeries } from './useDashboardSeries'

const gdpSlugs = ['dashboard-real-gdp-growth', 'dashboard-nominal-gdp'] as const
const unemploymentSlugs = ['unemployment-rate', 'dashboard-payroll-change'] as const
const claimsSlugs = [
  'initial-unemployment-claims-four-week-average',
  'initial-unemployment-claims',
] as const
const sahmSlugs = ['dashboard-sahm-rule-gap'] as const

interface GrowthLaborTileProps {
  theme: 'light' | 'dark'
}

function TileMessage({ label, loading = false }: { label: string; loading?: boolean }) {
  return (
    <DashboardTile label={label} state="normal">
      <p className="status-tile__message" role={loading ? 'status' : 'alert'}>
        {loading ? 'Loading current data…' : 'Data temporarily unavailable.'}
      </p>
    </DashboardTile>
  )
}

export function GdpStatusTile({ theme }: GrowthLaborTileProps) {
  const data = useDashboardSeries(gdpSlugs)
  if (data.status === 'loading') return <TileMessage label="GDP growth" loading />
  const growth = data.series.get(gdpSlugs[0])
  if (!growth) return <TileMessage label="GDP growth" />
  let model
  try {
    model = createGdpTileModel(growth, data.series.get(gdpSlugs[1]) ?? null)
  } catch {
    return <TileMessage label="GDP growth" />
  }
  const first = model.sparkline.find(({ value }) => value !== null)
  return <EconomicStatusTile
      label="GDP growth"
      seriesLabel="real GDP growth"
      hero={formatDashboardPercent(model.headline.value)}
      state={model.state}
      stateLabel={model.stateLabel}
      secondary={model.secondary ? `GDP ${formatNominalGdp(model.secondary.value)}` : 'GDP unavailable'}
      observations={model.sparkline}
      sparklineSummary={`Real GDP annualized quarterly growth over ten years${first ? `, from ${formatDashboardPercent(first.value!)} to ${formatDashboardPercent(model.headline.value)}` : ''}. Missing quarters remain gaps.`}
      theme={theme}
      asOf={formatDashboardPeriod(model.headline.date, 'quarterly')}
      historical={model.historical}
      historicalValueFormatter={formatDashboardPercent}
      dateFormatter={formatHistoryYear}
  />
}

export function UnemploymentStatusTile({ theme }: GrowthLaborTileProps) {
  const data = useDashboardSeries(unemploymentSlugs)
  if (data.status === 'loading') return <TileMessage label="Unemployment" loading />
  const unemployment = data.series.get(unemploymentSlugs[0])
  if (!unemployment) return <TileMessage label="Unemployment" />
  let model
  try {
    model = createUnemploymentTileModel(unemployment, data.series.get(unemploymentSlugs[1]) ?? null)
  } catch {
    return <TileMessage label="Unemployment" />
  }
  return <EconomicStatusTile
      label="Unemployment"
      seriesLabel="unemployment rate"
      hero={formatDashboardPercent(model.headline.value)}
      state={model.state}
      stateLabel={model.stateLabel}
      secondary={model.secondary ? `${formatCompactThousands(model.secondary.value)} jobs` : 'Payroll change unavailable'}
      observations={model.sparkline}
      sparklineSummary={`Unemployment rate over five years, ending at ${formatDashboardPercent(model.headline.value)} in ${formatDashboardPeriod(model.headline.date, 'monthly')}. Missing months remain gaps.`}
      theme={theme}
      asOf={formatDashboardPeriod(model.headline.date, 'monthly')}
      historical={model.historical}
      historicalValueFormatter={formatDashboardPercent}
      dateFormatter={formatHistoryYear}
  />
}

export function InitialClaimsStatusTile({ theme }: GrowthLaborTileProps) {
  const data = useDashboardSeries(claimsSlugs)
  if (data.status === 'loading') return <TileMessage label="Initial claims" loading />
  const average = data.series.get(claimsSlugs[0])
  if (!average) return <TileMessage label="Initial claims" />
  let model
  try {
    model = createInitialClaimsTileModel(average, data.series.get(claimsSlugs[1]) ?? null)
  } catch {
    return <TileMessage label="Initial claims" />
  }
  return <EconomicStatusTile
      label="Initial claims"
      seriesLabel="initial claims four-week average"
      hero={formatClaims(model.headline.value)}
      state={model.state}
      stateLabel={model.stateLabel}
      secondary={model.secondary ? `Latest ${formatClaims(model.secondary.value)}` : 'Latest unavailable'}
      observations={model.sparkline}
      sparklineSummary={`Provider-published four-week average of initial unemployment claims over two years, ending at ${formatClaims(model.headline.value)} in the week of ${formatDashboardPeriod(model.headline.date, 'weekly')}. Missing weeks remain gaps.`}
      theme={theme}
      asOf={formatDashboardPeriod(model.headline.date, 'weekly')}
      historical={model.historical}
      historicalValueFormatter={formatClaims}
      dateFormatter={formatHistoryYear}
  />
}

export function SahmStatusTile({ theme }: GrowthLaborTileProps) {
  const data = useDashboardSeries(sahmSlugs)
  if (data.status === 'loading') return <TileMessage label="Sahm Rule" loading />
  const sahm = data.series.get(sahmSlugs[0])
  if (!sahm) return <TileMessage label="Sahm Rule" />
  let model
  try {
    model = createSahmTileModel(sahm)
  } catch {
    return <TileMessage label="Sahm Rule" />
  }
  return <EconomicStatusTile
      label="Sahm Rule"
      seriesLabel="Sahm Rule gap"
      hero={model.headline.value.toFixed(2)}
      state={model.state}
      stateLabel={model.stateLabel}
      secondary="Trigger 0.50"
      observations={model.sparkline}
      sparklineSummary={`Real-time Sahm Rule recession indicator over five years, ending at ${model.headline.value.toFixed(2)} in ${formatDashboardPeriod(model.headline.date, 'monthly')}. The dashed reference is the canonical 0.50 trigger; the indicator is not a recession forecast.`}
      theme={theme}
      asOf={formatDashboardPeriod(model.headline.date, 'monthly')}
      dateFormatter={formatHistoryYear}
      reference={{ value: 0.5, label: 'Sahm Rule trigger' }}
      reservedRangeDescription="No historical percentile is shown because the Sahm Rule distribution is not informative for this comparison. It is a recession indicator, not a forecast, and 0.50 is its trigger."
  />
}

export function GrowthLaborTiles({ theme }: GrowthLaborTileProps) {
  return <>
    <GdpStatusTile theme={theme} />
    <UnemploymentStatusTile theme={theme} />
    <InitialClaimsStatusTile theme={theme} />
    <SahmStatusTile theme={theme} />
  </>
}
