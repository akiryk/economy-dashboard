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
} from './statusFormatters'
import { useDashboardSeries } from './useDashboardSeries'
import { createPayrollTileModel } from './payrollTileModel'
import {
  getClaimsBackContent,
  getGdpBackContent,
  getPayrollBackContent,
  getSahmBackContent,
  getUnemploymentBackContent,
} from './cardBackContent'

const gdpSlugs = ['real-gdp-growth'] as const
const unemploymentSlugs = ['unemployment-rate'] as const
const payrollSlugs = ['dashboard-payroll-change'] as const
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
    model = createGdpTileModel(growth)
  } catch {
    return <TileMessage label="GDP growth" />
  }
  const first = model.sparkline.find(({ value }) => value !== null)
  const period = formatDashboardPeriod(model.headline.date, 'quarterly')
  return <EconomicStatusTile
      label="GDP growth"
      freshnessKeys={gdpSlugs}
      seriesLabel="real GDP growth"
      hero={formatDashboardPercent(model.headline.value)}
      state={model.state}
      stateLabel={model.stateLabel}
      secondary=""
      observations={model.sparkline}
      sparklineSummary={`Year-over-year real GDP growth over five years${first ? `, from ${formatDashboardPercent(first.value!)} to ${formatDashboardPercent(model.headline.value)}` : ''}. Above zero means real output is larger than one year earlier; below zero means it is smaller. Missing quarters remain gaps.`}
      theme={theme}
      asOf={period}
      historical={model.historical}
      historicalValueFormatter={formatDashboardPercent}
      dateFormatter={formatHistoryYear}
      reference={{ value: 0, label: 'No year-over-year change' }}
      backContent={getGdpBackContent(
        model.headline.value,
        model.headline.date,
        model.stateLabel,
      )}
  />
}

export function UnemploymentStatusTile({ theme }: GrowthLaborTileProps) {
  const data = useDashboardSeries(unemploymentSlugs)
  if (data.status === 'loading') return <TileMessage label="Unemployment" loading />
  const unemployment = data.series.get(unemploymentSlugs[0])
  if (!unemployment) return <TileMessage label="Unemployment" />
  let model
  try {
    model = createUnemploymentTileModel(unemployment, null)
  } catch {
    return <TileMessage label="Unemployment" />
  }
  return <EconomicStatusTile
      label="Unemployment"
      freshnessKeys={unemploymentSlugs}
      seriesLabel="unemployment rate"
      hero={formatDashboardPercent(model.headline.value)}
      state={model.state}
      stateLabel={model.stateLabel}
      secondary=""
      observations={model.sparkline}
      sparklineSummary={`Unemployment rate over five years, ending at ${formatDashboardPercent(model.headline.value)} in ${formatDashboardPeriod(model.headline.date, 'monthly')}. Missing months remain gaps.`}
      theme={theme}
      asOf={formatDashboardPeriod(model.headline.date, 'monthly')}
      historical={model.historical}
      historicalValueFormatter={formatDashboardPercent}
      dateFormatter={formatHistoryYear}
      backContent={getUnemploymentBackContent(
        model.headline.value,
        formatDashboardPeriod(model.headline.date, 'monthly'),
        { percentile: model.historical.percentile, stateLabel: model.stateLabel },
      )}
  />
}

export function PayrollStatusTile({ theme }: GrowthLaborTileProps) {
  const data = useDashboardSeries(payrollSlugs)
  if (data.status === 'loading') return <TileMessage label="Payroll growth" loading />
  const payroll = data.series.get(payrollSlugs[0])
  if (!payroll) return <TileMessage label="Payroll growth" />
  let model
  try {
    model = createPayrollTileModel(payroll)
  } catch {
    return <TileMessage label="Payroll growth" />
  }
  const hero = `${formatCompactThousands(model.headline.value)}/mo`
  const latest = formatCompactThousands(model.latestMonth.value)
  const direction = model.headline.value < 0 ? 'shrunk' : model.headline.value === 0 ? 'was flat' : 'grew'
  const latestDirection = model.latestMonth.value < 0 ? 'lost' : 'added'
  const averageJobs = Math.round(Math.abs(model.headline.value) * 1_000)
    .toLocaleString('en-US')
  const latestJobs = Math.round(Math.abs(model.latestMonth.value) * 1_000)
    .toLocaleString('en-US')
  return <EconomicStatusTile
    label="Payroll growth"
    freshnessKeys={payrollSlugs}
    seriesLabel="three-month payroll-growth pace"
    hero={hero}
    state={model.state}
    stateLabel={model.stateLabel}
    secondary={`Latest ${latest}`}
    observations={model.sparkline}
    sparklineSummary={`Payroll employment ${direction} by an average of ${averageJobs} jobs per month over the latest three consecutive months, ending ${formatDashboardPeriod(model.headline.date, 'monthly')}. The latest single month ${latestDirection} ${latestJobs} jobs. The chart shows the derived three-month average over five years, preserves gaps, and includes a zero reference line.`}
    theme={theme}
    asOf={formatDashboardPeriod(model.headline.date, 'monthly')}
    historical={model.historical}
    historicalValueFormatter={(value) => `${formatCompactThousands(value)}/mo`}
    dateFormatter={formatHistoryYear}
    reference={{ value: 0, label: 'No payroll change' }}
    backContent={getPayrollBackContent(
      model.headline.value,
      model.latestMonth.value,
      model.stateLabel,
    )}
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
      freshnessKeys={claimsSlugs}
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
      backContent={getClaimsBackContent(
        model.headline.value,
        model.secondary?.value ?? null,
        { percentile: model.historical.percentile, stateLabel: model.stateLabel },
      )}
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
      freshnessKeys={sahmSlugs}
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
      backContent={getSahmBackContent(model.headline.value)}
  />
}

export function GrowthLaborTiles({ theme }: GrowthLaborTileProps) {
  return <>
    <GdpStatusTile theme={theme} />
    <UnemploymentStatusTile theme={theme} />
    <PayrollStatusTile theme={theme} />
    <InitialClaimsStatusTile theme={theme} />
  </>
}
