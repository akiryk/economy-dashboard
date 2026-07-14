import type { HouseholdComparisonObservation } from '../utils/householdComparisonData'
import {
  formatObservationPeriod,
  formatSignedPercentage,
} from '../utils/economicSeries'

export function HouseholdComparisonTable({
  observations,
}: {
  observations: readonly HouseholdComparisonObservation[]
}) {
  const recent = [...observations]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 12)
  return (
    <div className="table-scroll">
      <table className="observations-table">
        <caption>Twelve most recent aligned real income and spending observations</caption>
        <thead><tr>
          <th scope="col">Observation month</th>
          <th scope="col">Real disposable income per capita growth</th>
          <th scope="col">Real consumer spending growth</th>
          <th scope="col">Spending minus income growth</th>
        </tr></thead>
        <tbody>{recent.map((item) => <tr key={item.date}>
          <th scope="row">{formatObservationPeriod(item.date, 'monthly')}</th>
          <td>{formatSignedPercentage(item.incomeGrowth)}</td>
          <td>{formatSignedPercentage(item.spendingGrowth)}</td>
          <td aria-label={`${formatSignedPercentage(item.gap)} percentage points`}>
            {formatSignedPercentage(item.gap)} pp
          </td>
        </tr>)}</tbody>
      </table>
    </div>
  )
}
