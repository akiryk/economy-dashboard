import type { NormalizedManufacturingObservation } from '../utils/manufacturingComparisonData'
import { formatObservationPeriod } from '../utils/economicSeries'

export function ManufacturingComparisonTable({ observations }: { observations: readonly NormalizedManufacturingObservation[] }) {
  const recent = [...observations].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 12)
  return <div className="table-scroll"><table className="observations-table">
    <caption>Twelve most recent aligned manufacturing observations; normalized indexes use the selected-range baseline</caption>
    <thead><tr><th scope="col">Month</th><th scope="col">Output, source index</th><th scope="col">Employment, thousands</th><th scope="col">Output, selected-range index</th><th scope="col">Employment, selected-range index</th></tr></thead>
    <tbody>{recent.map((item) => <tr key={item.date}>
      <th scope="row">{formatObservationPeriod(item.date, 'monthly')}</th>
      <td>{item.output?.toFixed(1) ?? 'Not available'}</td>
      <td>{item.employment?.toLocaleString('en-US', { maximumFractionDigits: 1 }) ?? 'Not available'}</td>
      <td>{item.normalizedOutput?.toFixed(1) ?? 'Not available'}</td>
      <td>{item.normalizedEmployment?.toFixed(1) ?? 'Not available'}</td>
    </tr>)}</tbody>
  </table></div>
}
