import type { EconomicObservation } from '../models/economicSeries'
import {
  formatObservationPeriod,
  formatSignedThousands,
  sortObservationsChronologically,
} from '../utils/economicSeries'

interface PayrollObservationsTableProps {
  averages: readonly EconomicObservation[]
  monthlyChanges: readonly EconomicObservation[]
  caption: string
  count: number
}

export function PayrollObservationsTable({
  averages,
  monthlyChanges,
  caption,
  count,
}: PayrollObservationsTableProps) {
  const changesByDate = new Map(
    monthlyChanges.map((observation) => [observation.date, observation.value]),
  )
  const recentAverages = sortObservationsChronologically(averages)
    .reverse()
    .slice(0, count)

  return (
    <div className="table-scroll">
      <table className="observations-table">
        <caption>{caption}</caption>
        <thead>
          <tr>
            <th scope="col">Observation month</th>
            <th scope="col">Monthly payroll change</th>
            <th scope="col">Three-month average</th>
          </tr>
        </thead>
        <tbody>
          {recentAverages.map((average) => (
            <tr key={average.date}>
              <th scope="row">
                {formatObservationPeriod(average.date, 'monthly')}
              </th>
              <td>{formatSignedThousands(changesByDate.get(average.date) ?? null)}</td>
              <td>{formatSignedThousands(average.value)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
