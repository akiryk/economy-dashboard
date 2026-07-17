import type { EconomicObservation } from '../models/economicSeries'
import { formatObservationPeriod, formatSignedPercentage } from '../utils/economicSeries'

function balanceType(value: number | null): string {
  if (value === null) return 'Unavailable'
  return value < 0 ? 'Deficit' : value > 0 ? 'Surplus' : 'Balanced'
}

export function BudgetBalanceTable({ observations }: { observations: readonly EconomicObservation[] }) {
  return <div className="table-scroll"><table className="observations-table">
    <caption>Ten most recent federal budget-balance observations</caption>
    <thead><tr><th scope="col">Year</th><th scope="col">Federal budget balance, percent of GDP</th><th scope="col">Balance type</th></tr></thead>
    <tbody>{observations.map((item) => <tr key={item.date}><th scope="row">{formatObservationPeriod(item.date, 'annual')}</th><td>{formatSignedPercentage(item.value)}</td><td>{balanceType(item.value)}</td></tr>)}</tbody>
  </table></div>
}
