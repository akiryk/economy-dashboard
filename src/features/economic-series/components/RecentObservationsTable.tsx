import type { EconomicObservation } from '../models/economicSeries'
import {
  formatPercentage,
  formatQuarterlyObservationDate,
} from '../utils/economicSeries'

interface RecentObservationsTableProps {
  observations: readonly EconomicObservation[]
}

export function RecentObservationsTable({
  observations,
}: RecentObservationsTableProps) {
  return (
    <div className="table-scroll">
      <table className="observations-table">
        <caption>Eight most recent GDP growth observations</caption>
        <thead>
          <tr>
            <th scope="col">Observation period</th>
            <th scope="col">Year-over-year growth</th>
          </tr>
        </thead>
        <tbody>
          {observations.map((observation) => (
            <tr key={observation.date}>
              <th scope="row">
                {formatQuarterlyObservationDate(observation.date)}
              </th>
              <td>{formatPercentage(observation.value)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
