import { useId, useState, type KeyboardEvent, type MouseEvent } from 'react'
import type { EconomicObservation } from '../economic-series/models/economicSeries'
import { DashboardSparkline } from './DashboardSparkline'
import { HistoricalRangeStrip } from './HistoricalRangeStrip'
import type {
  DashboardThresholdState,
  HistoricalPercentile,
} from './cpiTileModel'
import type { DashboardSparklineReference } from './dashboardSparklineOptions'
import type { DashboardCardBackContent } from './cardBackContent'

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
  backContent: DashboardCardBackContent
  sparklineWindow?: string
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
  backContent,
  sparklineWindow,
}: EconomicStatusTileProps) {
  const [flipped, setFlipped] = useState(false)
  const labelId = useId()

  const toggleFromCard = (event: MouseEvent<HTMLElement>) => {
    if ((event.target as HTMLElement).closest('button, a, input, select, textarea, .historical-range')) return
    setFlipped((current) => !current)
  }

  const toggleFromKeyboard = (event: KeyboardEvent<HTMLElement>) => {
    if (event.target !== event.currentTarget) return
    if (event.key !== 'Enter' && event.key !== ' ') return
    event.preventDefault()
    setFlipped((current) => !current)
  }

  return (
    <article
      className="status-tile status-tile--flippable"
      data-state={state}
      data-flipped={flipped ? 'true' : 'false'}
      aria-labelledby={labelId}
      aria-description={flipped ? 'Showing contextual details. Activate to show the status front.' : 'Showing current status. Activate to show contextual details.'}
      tabIndex={0}
      onClick={toggleFromCard}
      onKeyDown={toggleFromKeyboard}
    >
      <h2 className="visually-hidden" id={labelId}>{label}</h2>
      <div className="status-tile__flip-inner">
        <div className="status-tile__face status-tile__face--front" aria-hidden={flipped} inert={flipped}>
          <h3 className="status-tile__label" aria-hidden="true">{label}</h3>
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
                sparklineWindow={sparklineWindow}
              />
            : <div className="historical-range historical-range--reserved">
                {reservedRangeDescription && (
                  <span className="visually-hidden">{reservedRangeDescription}</span>
                )}
              </div>}
          <p className="status-tile__meta">As of {asOf}</p>
        </div>
        <div className="status-tile__face status-tile__face--back" aria-hidden={!flipped} inert={!flipped}>
          <h3 className="status-tile__label" aria-hidden="true">{label}</h3>
          <div className="status-tile__back-section">
            <p className="status-tile__back-heading">What it shows</p>
            <p>{backContent.whatItShows}</p>
          </div>
          <div className="status-tile__back-section">
            <p className="status-tile__back-heading">How to read it</p>
            <p>{backContent.howToReadIt}</p>
          </div>
        </div>
      </div>
    </article>
  )
}
