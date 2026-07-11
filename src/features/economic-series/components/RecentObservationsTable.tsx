import type { EconomicObservation } from '../models/economicSeries'
import {
  formatObservationPeriod,
  formatPercentage,
} from '../utils/economicSeries'
import type { EconomicFrequency } from '../models/economicSeries'

interface RecentObservationsTableProps {
  observations: readonly EconomicObservation[]
  frequency: EconomicFrequency
  caption: string
  valueColumnLabel: string
}

export function RecentObservationsTable({
  observations,
  frequency,
  caption,
  valueColumnLabel,
}: RecentObservationsTableProps) {
  return (
    <div className="table-scroll">
      <table className="observations-table">
        <caption>{caption}</caption>
        <thead>
          <tr>
            <th scope="col">Observation period</th>
            <th scope="col">{valueColumnLabel}</th>
          </tr>
        </thead>
        <tbody>
          {observations.map((observation) => (
            <tr key={observation.date}>
              <th scope="row">
                {formatObservationPeriod(observation.date, frequency)}
              </th>
              <td>{formatPercentage(observation.value)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
