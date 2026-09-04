import { metricCountryReadings, peerCountries, type InternationalMetric } from '../models/internationalComparison'

interface InternationalComparisonCardProps {
  metric: InternationalMetric
}

const countryNames = new Map(peerCountries.map(({ code, name }) => [code, name]))

function formatPeriod(period: string): string {
  if (period.includes('-Q')) {
    const [year, quarter] = period.split('-')
    return `${quarter} ${year}`
  }
  const [year, month] = period.split('-').map(Number)
  return new Intl.DateTimeFormat('en-US', { month: 'short', year: 'numeric', timeZone: 'UTC' })
    .format(new Date(Date.UTC(year!, month! - 1, 1)))
}

function ordinal(value: number): string {
  const mod100 = value % 100
  const suffix = mod100 >= 11 && mod100 <= 13
    ? 'th'
    : value % 10 === 1
      ? 'st'
      : value % 10 === 2
        ? 'nd'
        : value % 10 === 3
          ? 'rd'
          : 'th'
  return `${value}${suffix}`
}

export function InternationalComparisonCard({ metric }: InternationalComparisonCardProps) {
  const readings = metricCountryReadings(metric)
  const available = readings
    .filter((reading) => reading.status === 'available')
    .sort((a, b) => metric.direction === 'lower-favorable'
      ? a.observation.value - b.observation.value
      : b.observation.value - a.observation.value)
  const unavailable = readings.filter((reading) => reading.status !== 'available')
  const values = available.map(({ observation }) => observation.value)
  const minimum = Math.min(...values)
  const maximum = Math.max(...values)
  const spread = maximum - minimum
  const unitedStatesRank = available.findIndex(({ countryCode }) => countryCode === 'USA') + 1

  return (
    <article className="comparison-card" aria-labelledby={`${metric.id}-heading`}>
      <header className="comparison-card__header">
        <p className="comparison-card__eyebrow">{metric.title}</p>
        <h2 id={`${metric.id}-heading`}>{metric.question}</h2>
        {unitedStatesRank > 0 && (
          <p className="comparison-card__summary">
            United States ranks {ordinal(unitedStatesRank)} of {available.length}{' '}
            {metric.direction === 'neutral' ? 'by reported value' : 'on this measure'}.
          </p>
        )}
        <p className="comparison-card__interpretation">
          {metric.direction === 'higher-favorable'
            ? 'Higher values are generally favorable for this measure.'
            : metric.direction === 'lower-favorable'
              ? 'Lower values are generally favorable for this measure.'
              : 'Numeric order is descriptive; higher or lower is not inherently better.'}
        </p>
      </header>
      <ol className="comparison-card__list">
        {available.map((reading) => {
          const width = spread === 0 ? 100 : 12 + ((reading.observation.value - minimum) / spread) * 88
          const isUnitedStates = reading.countryCode === 'USA'
          return (
            <li
              className={isUnitedStates ? 'comparison-card__row comparison-card__row--us' : 'comparison-card__row'}
              key={reading.countryCode}
            >
              <div className="comparison-card__labels">
                <span className="comparison-card__country">
                  {countryNames.get(reading.countryCode)}
                  {isUnitedStates && <strong className="comparison-card__us-label">U.S. focus</strong>}
                </span>
                <span className="comparison-card__reading">
                  <strong>{reading.observation.value.toFixed(1)}%</strong>
                  <span>{formatPeriod(reading.observation.period)}</span>
                </span>
              </div>
              <div className="comparison-card__track" aria-hidden="true">
                <span style={{ width: `${width}%` }} />
              </div>
            </li>
          )
        })}
        {unavailable.map((reading) => (
          <li className="comparison-card__row comparison-card__row--unavailable" key={reading.countryCode}>
            <div className="comparison-card__labels">
              <span className="comparison-card__country">{countryNames.get(reading.countryCode)}</span>
              <span className="comparison-card__reading">
                <strong>N/A</strong>
                <span>{reading.status === 'stale' ? `Stale: ${formatPeriod(reading.observation.period)}` : 'No observation'}</span>
              </span>
            </div>
          </li>
        ))}
      </ol>

      <details className="comparison-card__methodology">
        <summary>Source and methodology</summary>
        <p>{metric.source.methodology}</p>
        <p>
          Latest acceptable observation per country. Actual periods are shown;
          unavailable and stale values are excluded from rank.
        </p>
        <a href={metric.source.url}>OECD Data Explorer source</a>
      </details>
    </article>
  )
}
