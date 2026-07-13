import type { EconomicObservation } from '../models/economicSeries'
import {
  formatEconomicValue,
  formatObservationPeriod,
  type EconomicValueFormat,
} from '../utils/economicSeries'
import type { EconomicFrequency } from '../models/economicSeries'

interface RecentObservationsTableProps {
  observations: readonly EconomicObservation[]
  frequency: EconomicFrequency
  caption: string
  valueColumnLabel: string
  valueFormat?: EconomicValueFormat
}

export function RecentObservationsTable({
  observations,
  frequency,
  caption,
  valueColumnLabel,
  valueFormat = 'percentage',
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
              <td>{formatEconomicValue(observation.value, valueFormat)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
