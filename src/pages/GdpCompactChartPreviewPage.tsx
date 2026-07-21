import { Link } from 'react-router-dom'
import gdpData from '../features/economic-series/data/real-gdp-growth.json'
import { CompactHistoricalMetricChart } from '../features/economic-series/charts/CompactHistoricalMetricChart'
import { validateEconomicSeries } from '../features/economic-series/models/validateEconomicSeries'
import { realGdpCompactDefinition } from '../features/economic-series/utils/compactHistoricalMetrics'
import { deriveHistoricalBandContext } from '../features/economic-series/utils/historicalBandContext'

const series = validateEconomicSeries(gdpData)
const model = deriveHistoricalBandContext(
  series.observations,
  realGdpCompactDefinition.historicalBands,
)

export function GdpCompactChartPreviewPage() {
  return <div className="page page--narrow">
    <section className="page-intro" aria-labelledby="gdp-compact-preview-heading">
      <h1 id="gdp-compact-preview-heading">Real GDP compact-chart preview</h1>
      <p>Isolated review fixture for the shared compact historical-band chart.</p>
      <p><Link to="/">Return to the dashboard</Link></p>
    </section>
    <section className="gdp-compact-preview" aria-labelledby="gdp-compact-fixture-heading">
      <h2 id="gdp-compact-fixture-heading">Recent growth and historical bands</h2>
      <CompactHistoricalMetricChart
        model={model}
        definition={realGdpCompactDefinition}
      />
    </section>
  </div>
}
