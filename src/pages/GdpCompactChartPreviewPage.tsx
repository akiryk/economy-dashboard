import { Link } from 'react-router-dom'
import gdpData from '../features/economic-series/data/real-gdp-growth.json'
import { GdpCompactHistoricalChart } from '../features/economic-series/charts/GdpCompactHistoricalChart'
import { validateEconomicSeries } from '../features/economic-series/models/validateEconomicSeries'
import { deriveCompactGdpHistoricalContext } from '../features/economic-series/utils/gdpCompactHistoricalContext'

const series = validateEconomicSeries(gdpData)
const context = deriveCompactGdpHistoricalContext(series.observations)

export function GdpCompactChartPreviewPage() {
  return <div className="page page--narrow">
    <section className="page-intro" aria-labelledby="gdp-compact-preview-heading">
      <h1 id="gdp-compact-preview-heading">Real GDP compact-chart preview</h1>
      <p>Isolated review fixture. This chart is not integrated into the production GDP card.</p>
      <p><Link to="/">Return to the dashboard</Link></p>
    </section>
    <section className="gdp-compact-preview" aria-labelledby="gdp-compact-fixture-heading">
      <h2 id="gdp-compact-fixture-heading">Recent growth and historical bands</h2>
      <GdpCompactHistoricalChart context={context} />
    </section>
  </div>
}
