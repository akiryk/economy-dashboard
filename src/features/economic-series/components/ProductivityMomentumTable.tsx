import type { EconomicObservation } from '../models/economicSeries'
import {
  formatObservationPeriod,
  formatSignedPercentage,
} from '../utils/economicSeries'
import { calculateProductivityMomentum } from '../utils/productivityData'

export function ProductivityMomentumTable({
  observations,
}: {
  observations: readonly EconomicObservation[]
}) {
  const recent = calculateProductivityMomentum(observations)
    .filter((item) => item.value !== null)
    .slice(-8)
    .reverse()
  return <div className="table-scroll"><table className="observations-table">
    <caption>Eight most recent productivity growth momentum observations</caption>
    <thead><tr><th scope="col">Observation quarter</th><th scope="col">Productivity growth from a year earlier</th><th scope="col">Change in growth pace from a year earlier</th></tr></thead>
    <tbody>{recent.map((item) => <tr key={item.date}>
      <th scope="row">{formatObservationPeriod(item.date, 'quarterly')}</th>
      <td>{formatSignedPercentage(item.value)}</td>
      <td aria-label={`${formatSignedPercentage(item.momentumChange)} percentage points`}>{formatSignedPercentage(item.momentumChange)} pp</td>
    </tr>)}</tbody>
  </table></div>
}
