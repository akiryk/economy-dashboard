import type { ClaimsObservation } from '../utils/claimsData'
import { formatClaims } from '../utils/claimsData'
import { formatObservationPeriod } from '../utils/economicSeries'

export function ClaimsComparisonTable({
  observations,
}: {
  observations: readonly ClaimsObservation[]
}) {
  return (
    <div className="table-scroll">
      <table className="observations-table">
        <caption>Twelve most recent aligned initial-claims observations</caption>
        <thead>
          <tr>
            <th scope="col">Week ending</th>
            <th scope="col">Four-week average</th>
            <th scope="col">Weekly initial claims</th>
          </tr>
        </thead>
        <tbody>
          {[...observations].reverse().slice(0, 12).map((observation) => (
            <tr key={observation.date}>
              <th scope="row">
                {formatObservationPeriod(observation.date, 'weekly').replace(
                  'Week of ',
                  '',
                )}
              </th>
              <td>{formatClaims(observation.movingAverage)}</td>
              <td>{formatClaims(observation.weeklyClaims)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
