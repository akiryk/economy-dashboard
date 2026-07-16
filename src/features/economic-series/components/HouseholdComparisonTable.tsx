import type { HouseholdComparisonObservation } from '../utils/householdComparisonData'
import {
  formatObservationPeriod,
  formatSignedPercentage,
  formatSignedPercentagePoints,
} from '../utils/economicSeries'

export function HouseholdComparisonTable({
  observations,
}: {
  observations: readonly HouseholdComparisonObservation[]
}) {
  const recent = [...observations]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 8)
  return (
    <div className="table-scroll">
      <table className="observations-table">
        <caption>Eight most recent aligned quarterly real per-capita income and spending observations</caption>
        <thead><tr>
          <th scope="col">Quarter</th>
          <th scope="col">Real disposable income per person, year-over-year</th>
          <th scope="col">Real consumer spending per person, year-over-year</th>
          <th scope="col">Spending minus income growth</th>
        </tr></thead>
        <tbody>{recent.map((item) => <tr key={item.date}>
          <th scope="row">{formatObservationPeriod(item.date, 'quarterly')}</th>
          <td>{formatSignedPercentage(item.incomeGrowth)}</td>
          <td>{formatSignedPercentage(item.spendingGrowth)}</td>
          <td aria-label={`${formatSignedPercentagePoints(item.gap)} percentage points`}>
            {formatSignedPercentagePoints(item.gap)} pp
          </td>
        </tr>)}</tbody>
      </table>
    </div>
  )
}
