import type { InflationComparisonObservation } from '../utils/inflationComparisonData'
import {
  formatObservationPeriod,
  formatPercentage,
  formatSignedPercentage,
} from '../utils/economicSeries'

interface InflationComparisonTableProps {
  observations: readonly InflationComparisonObservation[]
  variant: 'momentum' | 'year-over-year'
}

export function InflationComparisonTable({
  observations,
  variant,
}: InflationComparisonTableProps) {
  const recent = [...observations]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 12)
  const momentum = variant === 'momentum'
  return (
    <div className="table-scroll">
      <table className="observations-table">
        <caption>
          Twelve most recent aligned {momentum ? 'inflation momentum' : 'headline and core CPI'} observations
        </caption>
        <thead>
          <tr>
            <th scope="col">Observation month</th>
            <th scope="col">
              Headline CPI{momentum ? ', 3-month annualized' : ' inflation'}
            </th>
            <th scope="col">
              Core CPI{momentum ? ', 3-month annualized' : ' inflation'}
            </th>
            {!momentum && <th scope="col">Core minus headline</th>}
          </tr>
        </thead>
        <tbody>
          {recent.map((item) => (
            <tr key={item.date}>
              <th scope="row">{formatObservationPeriod(item.date, 'monthly')}</th>
              <td>{formatPercentage(item.headline)}</td>
              <td>{formatPercentage(item.core)}</td>
              {!momentum && (
                <td aria-label={`${formatSignedPercentage(item.difference)} percentage points`}>
                  {formatSignedPercentage(item.difference)} pp
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
