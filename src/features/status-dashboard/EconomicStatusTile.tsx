import type { EconomicObservation } from '../economic-series/models/economicSeries'
import { DashboardSparkline } from './DashboardSparkline'
import { DashboardTile } from './DashboardTile'
import { HistoricalRangeStrip } from './HistoricalRangeStrip'
import type {
  DashboardThresholdState,
  HistoricalPercentile,
} from './cpiTileModel'
import type { DashboardSparklineReference } from './dashboardSparklineOptions'

interface EconomicStatusTileProps {
  label: string
  seriesLabel: string
  hero: string
  state: DashboardThresholdState
  stateLabel: string
  secondary: string
  observations: readonly EconomicObservation[]
  sparklineSummary: string
  theme: 'light' | 'dark'
  asOf: string
  historical?: HistoricalPercentile
  historicalValueFormatter?: (value: number) => string
  dateFormatter: (date: string) => string
  reference?: DashboardSparklineReference
  reservedRangeDescription?: string
}

export function EconomicStatusTile({
  label,
  seriesLabel,
  hero,
  state,
  stateLabel,
  secondary,
  observations,
  sparklineSummary,
  theme,
  asOf,
  historical,
  historicalValueFormatter,
  dateFormatter,
  reference,
  reservedRangeDescription,
}: EconomicStatusTileProps) {
  return (
    <DashboardTile label={label} state={state}>
      <div className="status-tile__hero-row">
        <p className="status-tile__hero">{hero}</p>
        <p className="status-tile__state">{stateLabel}</p>
      </div>
      <p className="status-tile__secondary">{secondary}</p>
      <DashboardSparkline
        observations={observations}
        state={state}
        summary={sparklineSummary}
        theme={theme}
        reference={reference}
      />
      {historical && historicalValueFormatter
        ? <HistoricalRangeStrip
            seriesLabel={seriesLabel}
            historical={historical}
            state={state}
            valueFormatter={historicalValueFormatter}
            dateFormatter={dateFormatter}
          />
        : <div className="historical-range historical-range--reserved">
            {reservedRangeDescription && (
              <span className="visually-hidden">{reservedRangeDescription}</span>
            )}
          </div>}
      <p className="status-tile__meta">As of {asOf}</p>
    </DashboardTile>
  )
}
