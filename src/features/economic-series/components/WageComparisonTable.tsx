import { formatObservationPeriod, formatPercentage, formatSignedPercentage } from '../utils/economicSeries'
import type { WageComparisonObservation } from '../utils/comparisonData'

interface WageComparisonTableProps {
  observations: readonly WageComparisonObservation[]
}

export function WageComparisonTable({ observations }: WageComparisonTableProps) {
  const recent = [...observations]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 12)
  return (
    <div className="table-scroll">
      <table className="observations-table">
        <caption>Twelve most recent wages-versus-inflation observations</caption>
        <thead>
          <tr>
            <th scope="col">Observation month</th>
            <th scope="col">Nominal wage growth</th>
            <th scope="col">Headline CPI inflation</th>
            <th scope="col">Real wage growth</th>
          </tr>
        </thead>
        <tbody>
          {recent.map((item) => (
            <tr key={item.date}>
              <th scope="row">{formatObservationPeriod(item.date, 'monthly')}</th>
              <td>{formatPercentage(item.nominalWageGrowth)}</td>
              <td>{formatPercentage(item.cpiInflation)}</td>
              <td>{formatSignedPercentage(item.realWageGrowth)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
