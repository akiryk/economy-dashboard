import type { NormalizedProductivityObservation } from '../utils/productivityData'
import {
  formatObservationPeriod,
  formatSignedPercentage,
} from '../utils/economicSeries'

export function ProductivityLevelTable({
  observations,
}: {
  observations: readonly NormalizedProductivityObservation[]
}) {
  const recent = observations
    .filter((item) => item.value !== null)
    .slice(-8)
    .reverse()
  return <div className="table-scroll"><table className="observations-table">
    <caption>Eight most recent normalized productivity-level observations</caption>
    <thead><tr><th scope="col">Observation quarter</th><th scope="col">Normalized productivity index</th><th scope="col">Change from selected-range start</th></tr></thead>
    <tbody>{recent.map((item) => <tr key={item.date}>
      <th scope="row">{formatObservationPeriod(item.date, 'quarterly')}</th>
      <td>{item.value?.toFixed(1)}</td>
      <td>{formatSignedPercentage(item.changeFromBaseline)}</td>
    </tr>)}</tbody>
  </table></div>
}
