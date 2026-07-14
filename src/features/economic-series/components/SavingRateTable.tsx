import type { EconomicObservation } from '../models/economicSeries'
import {
  formatObservationPeriod,
  formatPercentage,
  formatSignedPercentage,
} from '../utils/economicSeries'
import { savingRateChanges } from '../utils/savingRateData'

export function SavingRateTable({ observations }: { observations: readonly EconomicObservation[] }) {
  const recent = savingRateChanges(observations)
    .filter((item) => item.value !== null)
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 12)
  return <div className="table-scroll"><table className="observations-table">
    <caption>Twelve most recent personal saving rate observations</caption>
    <thead><tr><th scope="col">Observation month</th><th scope="col">Personal saving rate</th><th scope="col">Change from 12 months earlier</th></tr></thead>
    <tbody>{recent.map((item) => <tr key={item.date}>
      <th scope="row">{formatObservationPeriod(item.date, 'monthly')}</th>
      <td>{formatPercentage(item.value)}</td>
      <td aria-label={`${formatSignedPercentage(item.change)} percentage points`}>{formatSignedPercentage(item.change)} pp</td>
    </tr>)}</tbody>
  </table></div>
}
