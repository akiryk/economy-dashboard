import type { RateComparisonObservation } from '../utils/rateComparisonData'
import { formatObservationPeriod, formatPercentage, formatSignedPercentagePoints } from '../utils/economicSeries'

export function RateComparisonTable({ observations }: { observations: readonly RateComparisonObservation[] }) {
  return <div className="table-scroll"><table className="observations-table">
    <caption>Twelve most recent aligned interest-rate observations</caption>
    <thead><tr><th scope="col">Month</th><th scope="col">Effective federal funds rate</th><th scope="col">10-year Treasury yield</th><th scope="col">10-year minus federal funds, percentage points</th></tr></thead>
    <tbody>{[...observations].reverse().slice(0, 12).map((item) => <tr key={item.date}>
      <th scope="row">{formatObservationPeriod(item.date, 'monthly')}</th>
      <td>{formatPercentage(item.federalFundsRate)}</td><td>{formatPercentage(item.treasuryYield)}</td><td>{formatSignedPercentagePoints(item.difference)} pp</td>
    </tr>)}</tbody>
  </table></div>
}
